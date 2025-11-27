export interface CreateIncomeTransactionDto {
  user: string;
  incomeType: 'daily_roi' | 'referral' | 'team_income' | 'bonus' | 'compounding' | 'weekly_trade';
  amount: number;
  description: string;
  referenceId?: string;
  investmentId?: string;
  level?: number;
  incomeDate?: Date;
}

export interface IncomeTransactionResponse {
  id: string;
  user: string;
  incomeType: string;
  amount: number;
  earningWalletBefore: number;
  earningWalletAfter: number;
  description: string;
  referenceId?: string;
  investmentId?: string;
  level?: number;
  status: string;
  incomeDate: Date;
  createdAt: Date;
}

export interface IncomeSummary {
  totalIncome: number;
  dailyROI: number;
  referralIncome: number;
  teamIncome: number;
  bonusIncome: number;
  compoundingIncome: number;
  weeklyTradeIncome: number;
  transactionCount: number;
}








