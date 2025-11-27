export interface CreateInvestmentDto {
  planId: string;
  amount: number;
  isWelcomeBonusInvestment?: boolean; // Mark if investment is from welcome bonus (no ROI)
}

export interface InvestmentTopUpEntry {
  amount: number;
  date: Date;
  walletSource: 'earning' | 'investment';
  previousAmount: number;
  newAmount: number;
}

export interface InvestmentResponse {
  id: string;
  user: string;
  plan: any;
  amount: number;
  dailyROI: number;
  currentBalance: number;
  totalEarned: number;
  compoundingEnabled: boolean;
  status: string;
  startDate: Date;
  lastPayoutDate?: Date;
  durationDays: number;
  planType: 'bot' | 'weekly';
  payoutType: 'daily' | 'lump_sum';
  payoutDelayHours?: number;
  lumpSumPercentage?: number;
  topUpHistory?: InvestmentTopUpEntry[];
}

