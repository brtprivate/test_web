import { IInvestment, Investment } from '../models/investment.model';
import { InvestmentPlan } from '../../investment-plans/models/investment-plan.model';
import { User } from '../../users/models/user.model';
import { CreateInvestmentDto } from '../types/investment.types';
import { transactionService } from '../../transactions/services/transaction.service';
import { walletService } from '../../wallet/services/wallet.service';
import { referralService } from '../../referrals/services/referral.service';
import { incomeTransactionService } from '../../income/services/income-transaction.service';
import { env } from '../../../config/env';
import { investmentPlanService } from '../../investment-plans/services/investment-plan.service';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HOUR_IN_MS = 60 * 60 * 1000;

export class InvestmentService {
  async createInvestment(userId: string, data: CreateInvestmentDto): Promise<IInvestment> {
    // Get plan
    const plan = await InvestmentPlan.findById(data.planId);
    if (!plan || !plan.isActive) {
      throw new Error('Investment plan not found or inactive');
    }

    // Weekly plan window validation
    if (plan.planType === 'weekly' && !investmentPlanService.isPlanVisible(plan)) {
      throw new Error('Weekly power trade plan is not open right now. Please try again during its visibility window.');
    }

    // Validate amount
    if (data.amount <= 0) {
      throw new Error('Investment amount must be greater than 0');
    }

    const existingInvestment =
      !data.isWelcomeBonusInvestment && plan.planType !== 'weekly'
        ? await Investment.findOne({
            user: userId,
            plan: data.planId,
            status: 'active',
            isWelcomeBonusInvestment: { $ne: true },
          })
        : null;

    if (plan.maxAmount) {
      const baseAmount = existingInvestment?.amount ?? 0;
      const projectedTotal = baseAmount + data.amount;
      if (!existingInvestment && data.amount > plan.maxAmount) {
        throw new Error(`Maximum investment amount is $${plan.maxAmount}`);
      }
      if (existingInvestment && projectedTotal > plan.maxAmount) {
        throw new Error(
          `Adding $${data.amount} exceeds the ${plan.name} plan limit of $${plan.maxAmount}. Current allocation: $${baseAmount}`
        );
      }
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Determine which wallet to use
    // Prefer the dedicated investment wallet when it has enough balance,
    // and fall back to the earning wallet otherwise. This matches the
    // frontend UX where "Investment Wallet" is shown as the primary source.
    let walletSource: 'earning' | 'investment' | null = null;
    if (user.investmentWallet >= data.amount) {
      walletSource = 'investment';
    } else if (user.earningWallet >= data.amount) {
      walletSource = 'earning';
    }

    if (!walletSource) {
      throw new Error('Insufficient balance in earning or investment wallet');
    }

    const qualifiesForTopUp =
      !!existingInvestment && data.amount <= (existingInvestment.amount ?? 0);
    const walletMemo = qualifiesForTopUp
      ? `Investment top-up in ${plan.name} plan`
      : `Investment in ${plan.name} plan`;

    if (walletSource === 'earning') {
      await walletService.deductFromEarningWallet(
        userId,
        data.amount,
        walletMemo
      );
    } else {
      await walletService.deductFromInvestmentWallet(
        userId,
        data.amount,
        walletMemo
      );
    }

    if (qualifiesForTopUp && existingInvestment) {
      const previousAmount = existingInvestment.amount;
      existingInvestment.amount += data.amount;
      existingInvestment.currentBalance += data.amount;
      existingInvestment.topUpHistory = existingInvestment.topUpHistory ?? [];
      existingInvestment.topUpHistory.push({
        amount: data.amount,
        date: new Date(),
        walletSource,
        previousAmount,
        newAmount: existingInvestment.amount,
      });
      await existingInvestment.save();

      await User.findByIdAndUpdate(userId, {
        $inc: { totalInvested: data.amount },
      });

      await transactionService.createTransaction({
        user: userId,
        type: 'investment',
        amount: -data.amount,
        description: `Added funds to existing ${plan.name} investment`,
        referenceId: String(existingInvestment._id),
      });

      if (user.referredBy) {
        await referralService.processReferralBonus(
          user.referredBy.toString(),
          userId,
          data.amount,
          String(existingInvestment._id)
        );
      }

      await referralService.distributeLevelIncomeFromInvestment(
        userId,
        data.amount,
        String(existingInvestment._id)
      );

      return existingInvestment;
    }

    // Create investment
    const investment = new Investment({
      user: userId,
      plan: data.planId,
      amount: data.amount,
      dailyROI: plan.dailyROI ?? 0,
      currentBalance: data.amount, // Start with investment amount for compounding
      compoundingEnabled: plan.compoundingEnabled,
      isWelcomeBonusInvestment: data.isWelcomeBonusInvestment || false, // Mark if from welcome bonus
      status: 'active',
      startDate: new Date(),
      planType: plan.planType,
      durationDays: plan.durationDays ?? env.INVESTMENT_MAX_ACTIVE_DAYS,
      payoutType: plan.payoutType ?? 'daily',
      payoutDelayHours: plan.payoutDelayHours,
      lumpSumPercentage: plan.lumpSumROI,
    });

    const savedInvestment = await investment.save();

    // Update user total invested
    await User.findByIdAndUpdate(userId, {
      $inc: { totalInvested: data.amount },
    });

    // Create transaction record
    await transactionService.createTransaction({
      user: userId,
      type: 'investment',
      amount: -data.amount,
      description: `Investment in ${plan.name} plan`,
      referenceId: String(savedInvestment._id),
    });

    // Check for referral bonus (dynamic tiers)
    if (user.referredBy) {
      await referralService.processReferralBonus(
        user.referredBy.toString(),
        userId,
        data.amount,
        String(savedInvestment._id)
      );
    }

    // Distribute one-time level income up to 10 levels
    await referralService.distributeLevelIncomeFromInvestment(
      userId,
      data.amount,
      String(savedInvestment._id)
    );

    return savedInvestment;
  }

  async getUserInvestments(userId: string, status?: string): Promise<IInvestment[]> {
    const query: any = { user: userId };
    if (status) {
      query.status = status;
    }
    return await Investment.find(query)
      .populate('plan')
      .sort({ createdAt: -1 });
  }

  async getInvestmentById(id: string): Promise<IInvestment | null> {
    return await Investment.findById(id).populate('plan').populate('user');
  }

  async getActiveInvestmentsForPayout(forceAll = false): Promise<IInvestment[]> {
    const baseQuery: Record<string, unknown> = {
      status: 'active',
      isWelcomeBonusInvestment: { $ne: true },
    };

    const dailyQuery: Record<string, unknown> = {
      ...baseQuery,
      payoutType: { $ne: 'lump_sum' },
    };

    if (!forceAll) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      Object.assign(dailyQuery, {
        $or: [
          { lastPayoutDate: { $lt: yesterday } },
          { lastPayoutDate: { $exists: false } },
        ],
      });
    }

    const [dailyInvestments, lumpSumCandidates] = await Promise.all([
      Investment.find(dailyQuery).populate('user').populate('plan'),
      Investment.find({
        ...baseQuery,
        payoutType: 'lump_sum',
        lumpSumPaid: { $ne: true },
      })
        .populate('user')
        .populate('plan'),
    ]);

    const dueLumpSum = forceAll
      ? lumpSumCandidates
      : lumpSumCandidates.filter(inv => this.isLumpSumDue(inv));

    return [...dailyInvestments, ...dueLumpSum];
  }

  async processDailyROI(investmentId: string): Promise<void> {
    const investment = await Investment.findById(investmentId).populate('plan');
    if (!investment || investment.status !== 'active') {
      return;
    }

    if (investment.payoutType === 'lump_sum') {
      await this.processLumpSumInvestment(investment);
      return;
    }

    // Skip ROI for welcome bonus investments
    if (investment.isWelcomeBonusInvestment) {
      console.log(`⏭️ Skipping ROI for welcome bonus investment: ${investmentId}`);
      return;
    }

    const dailyIncome = (investment.currentBalance * investment.dailyROI) / 100;
    
    // Update investment
    investment.totalEarned += dailyIncome;
    
    if (investment.compoundingEnabled) {
      // Add to current balance for compounding
      investment.currentBalance += dailyIncome;
    }
    
    investment.lastPayoutDate = new Date();
    await investment.save();

    // Create income transaction (this will update earning wallet automatically)
    await incomeTransactionService.createIncomeTransaction({
      user: investment.user.toString(),
      incomeType: 'daily_roi',
      amount: dailyIncome,
      description: `Daily ROI from investment (${investment.dailyROI}%)`,
      referenceId: String(investment._id),
      investmentId: String(investment._id),
      incomeDate: new Date(),
    });

    // Update user total earned
    await User.findByIdAndUpdate(investment.user, {
      $inc: { totalEarned: dailyIncome },
    });

    if (this.hasReachedMaxDuration(investment)) {
      await this.completeInvestmentByDuration(investment);
    }
  }

  private hasReachedMaxDuration(investment: IInvestment): boolean {
    const startDate = investment.startDate || investment.createdAt;
    if (!startDate) {
      return false;
    }

    const maxDays = investment.durationDays ?? env.INVESTMENT_MAX_ACTIVE_DAYS;
    const daysActive = Math.floor((Date.now() - startDate.getTime()) / DAY_IN_MS);
    return daysActive >= maxDays;
  }

  private async completeInvestmentByDuration(investment: IInvestment): Promise<void> {
    investment.status = 'completed';
    investment.endDate = new Date();
    await investment.save();

    console.log(
      `⏹️ Investment ${investment._id} auto-completed after ${env.INVESTMENT_MAX_ACTIVE_DAYS} days`
    );
  }

  private isLumpSumDue(investment: IInvestment): boolean {
    if (investment.payoutType !== 'lump_sum' || investment.lumpSumPaid) {
      return false;
    }

    const delayHours = investment.payoutDelayHours ?? 72;
    const startDate = investment.startDate || investment.createdAt;
    if (!startDate) {
      return false;
    }

    const dueDate = new Date(startDate.getTime() + delayHours * HOUR_IN_MS);
    return Date.now() >= dueDate.getTime();
  }

  private async processLumpSumInvestment(investment: IInvestment): Promise<void> {
    if (investment.lumpSumPaid) {
      return;
    }

    if (!this.isLumpSumDue(investment)) {
      return;
    }

    const payoutPercent = investment.lumpSumPercentage ?? investment.dailyROI ?? 0;
    if (payoutPercent <= 0) {
      console.warn(`⚠️ Lump sum investment ${investment._id} has no payout percentage configured.`);
      return;
    }

    const payoutAmount = (investment.amount * payoutPercent) / 100;
    if (payoutAmount <= 0) {
      return;
    }

    investment.totalEarned += payoutAmount;
    investment.currentBalance += payoutAmount;
    investment.lastPayoutDate = new Date();
    investment.lumpSumPaid = true;
    investment.status = 'completed';
    investment.endDate = new Date();
    await investment.save();

    await incomeTransactionService.createIncomeTransaction({
      user: investment.user.toString(),
      incomeType: 'weekly_trade',
      amount: payoutAmount,
      description: `Weekly power trade payout (${payoutPercent}%)`,
      referenceId: String(investment._id),
      investmentId: String(investment._id),
      incomeDate: new Date(),
    });

    await User.findByIdAndUpdate(investment.user, {
      $inc: { totalEarned: payoutAmount },
    });
  }
}

export const investmentService = new InvestmentService();

