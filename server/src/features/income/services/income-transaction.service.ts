import { IIncomeTransaction, IncomeTransaction } from '../models/income-transaction.model';
import { User } from '../../users/models/user.model';
import { CreateIncomeTransactionDto, IncomeSummary } from '../types/income-transaction.types';
import { walletService } from '../../wallet/services/wallet.service';

export class IncomeTransactionService {
  /**
   * Create income transaction and update user's earning wallet
   */
  async createIncomeTransaction(data: CreateIncomeTransactionDto): Promise<IIncomeTransaction> {
    const user = await User.findById(data.user);
    if (!user) {
      throw new Error('User not found');
    }

    const earningWalletBefore = user.earningWallet;

    // Add to earning wallet
    await walletService.addToEarningWallet(
      data.user,
      data.amount,
      this.mapIncomeTypeToTransactionType(data.incomeType),
      data.description,
      data.referenceId
    );

    // Get updated wallet balance
    const updatedUser = await User.findById(data.user);
    if (!updatedUser) {
      throw new Error('User not found after wallet update');
    }

    const earningWalletAfter = updatedUser.earningWallet;

    // Create income transaction record
    const incomeTransaction = new IncomeTransaction({
      user: data.user,
      incomeType: data.incomeType,
      amount: data.amount,
      earningWalletBefore,
      earningWalletAfter,
      description: data.description,
      referenceId: data.referenceId,
      investmentId: data.investmentId,
      level: data.level,
      incomeDate: data.incomeDate || new Date(),
      status: 'completed',
    });

    return await incomeTransaction.save();
  }

  /**
   * Get user's income transactions
   */
  async getUserIncomeTransactions(
    userId: string,
    incomeType?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ transactions: IIncomeTransaction[]; total: number }> {
    const query: any = { user: userId };

    if (incomeType) {
      query.incomeType = incomeType;
    }

    if (startDate || endDate) {
      query.incomeDate = {};
      if (startDate) query.incomeDate.$gte = startDate;
      if (endDate) query.incomeDate.$lte = endDate;
    }

    const transactions = await IncomeTransaction.find(query)
      .populate('investmentId')
      .sort({ incomeDate: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await IncomeTransaction.countDocuments(query);

    return { transactions, total };
  }

  /**
   * Get income summary for user
   * Only includes dailyROI from active investments
   */
  async getIncomeSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<IncomeSummary> {
    const { Investment } = await import('../../investments/models/investment.model');
    
    const query: any = { user: userId, status: 'completed' };

    if (startDate || endDate) {
      query.incomeDate = {};
      if (startDate) query.incomeDate.$gte = startDate;
      if (endDate) query.incomeDate.$lte = endDate;
    }

    const transactions = await IncomeTransaction.find(query);

    // Get all active investment IDs for this user
    const activeInvestments = await Investment.find({
      user: userId,
      status: 'active',
    }).select('_id');

    const activeInvestmentIds = activeInvestments.map(inv => String(inv._id));

    const summary: IncomeSummary = {
      totalIncome: 0,
      dailyROI: 0,
      referralIncome: 0,
      teamIncome: 0,
      bonusIncome: 0,
      compoundingIncome: 0,
      weeklyTradeIncome: 0,
      transactionCount: transactions.length,
    };

    transactions.forEach((transaction) => {
      summary.totalIncome += transaction.amount;

      switch (transaction.incomeType) {
        case 'daily_roi':
          // Only count dailyROI from active investments
          if (transaction.investmentId && activeInvestmentIds.includes(String(transaction.investmentId))) {
            summary.dailyROI += transaction.amount;
          }
          break;
        case 'referral':
          summary.referralIncome += transaction.amount;
          break;
        case 'team_income':
          summary.teamIncome += transaction.amount;
          break;
        case 'bonus':
          summary.bonusIncome += transaction.amount;
          break;
        case 'compounding':
          summary.compoundingIncome += transaction.amount;
          break;
        case 'weekly_trade':
          summary.weeklyTradeIncome += transaction.amount;
          break;
      }
    });

    // Recalculate totalIncome excluding dailyROI from inactive investments
    summary.totalIncome =
      summary.dailyROI +
      summary.referralIncome +
      summary.teamIncome +
      summary.bonusIncome +
      summary.compoundingIncome +
      summary.weeklyTradeIncome;

    return summary;
  }

  /**
   * Get income by investment
   */
  async getIncomeByInvestment(investmentId: string): Promise<IIncomeTransaction[]> {
    return await IncomeTransaction.find({ investmentId })
      .sort({ incomeDate: -1 });
  }

  /**
   * Get daily income for a specific date
   */
  async getDailyIncome(userId: string, date: Date): Promise<IIncomeTransaction[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await IncomeTransaction.find({
      user: userId,
      incomeDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: 'completed',
    }).sort({ createdAt: -1 });
  }

  /**
   * Get total income by type
   */
  async getTotalIncomeByType(
    userId: string,
    incomeType: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const query: any = {
      user: userId,
      incomeType,
      status: 'completed',
    };

    if (startDate || endDate) {
      query.incomeDate = {};
      if (startDate) query.incomeDate.$gte = startDate;
      if (endDate) query.incomeDate.$lte = endDate;
    }

    const result = await IncomeTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Map income type to transaction type
   */
  private mapIncomeTypeToTransactionType(
    incomeType: string
  ): 'income' | 'referral' | 'bonus' | 'team_income' | 'weekly_trade' {
    switch (incomeType) {
      case 'daily_roi':
      case 'compounding':
        return 'income';
      case 'referral':
        return 'referral';
      case 'bonus':
        return 'bonus';
      case 'team_income':
        return 'team_income';
      case 'weekly_trade':
        return 'weekly_trade';
      default:
        return 'income';
    }
  }
}

export const incomeTransactionService = new IncomeTransactionService();






