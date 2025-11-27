export interface CreateTransactionDto {
  user: string;
  type: 'investment' | 'income' | 'withdrawal' | 'deposit' | 'referral' | 'bonus' | 'team_income' | 'weekly_trade';
  amount: number;
  description: string;
  referenceId?: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export interface TransactionResponse {
  id: string;
  user: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  status: string;
  createdAt: Date;
}








