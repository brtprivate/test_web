import { investmentService } from '../../investments/services/investment.service';

export class IncomeService {
  /**
   * Process daily ROI for all active investments and team level income
   * Returns count of processed investments
   */
  async processDailyROI(forceAll = false): Promise<number> {
    // Get all active investments that need payout
    const investments = await investmentService.getActiveInvestmentsForPayout(forceAll);
    let processedCount = 0;

    console.log(
      `📊 Found ${investments.length} active investments to process${
        forceAll ? ' (force mode)' : ''
      }`
    );

    for (const investment of investments) {
      try {
        await investmentService.processDailyROI(String(investment._id));
        processedCount++;
      } catch (error: any) {
        console.error(`❌ Error processing investment ${investment._id}:`, error.message);
      }
    }

    console.log(`✅ Processed ${processedCount}/${investments.length} investments`);

    return processedCount;
  }

  async getUserIncome(userId: string, startDate?: Date, endDate?: Date): Promise<{
    dailyROI: number;
    referralIncome: number;
    teamIncome: number;
    weeklyTradeIncome: number;
    totalIncome: number;
  }> {
    // transactionService not used in this method
    const { Transaction } = await import('../../transactions/models/transaction.model');

    const query: any = {
      user: userId,
      type: { $in: ['income', 'referral', 'team_income', 'weekly_trade'] },
      status: 'completed',
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const transactions = await Transaction.find(query);

    const dailyROI = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const referralIncome = transactions
      .filter(t => t.type === 'referral')
      .reduce((sum, t) => sum + t.amount, 0);

    const teamIncome = transactions
      .filter(t => t.type === 'team_income')
      .reduce((sum, t) => sum + t.amount, 0);

    const weeklyTradeIncome = transactions
      .filter(t => t.type === 'weekly_trade')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = dailyROI + referralIncome + teamIncome + weeklyTradeIncome;

    return {
      dailyROI,
      referralIncome,
      teamIncome,
      weeklyTradeIncome,
      totalIncome,
    };
  }
}

export const incomeService = new IncomeService();

