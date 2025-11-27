export interface Investment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email?: string;
    telegramUsername?: string;
    telegramChatId?: string;
  };
  plan: {
    _id: string;
    name: string;
    dailyROI: number;
    termDays: number;
  };
  amount: number;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  dailyROI?: number;
  totalROI?: number;
  isWelcomeBonusInvestment?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentListResponse {
  status: string;
  results: number;
  total: number;
  data: {
    investments: Investment[];
  };
  meta?: {
    page: number;
    totalPages: number;
    limit: number;
    totals?: {
      active: number;
      completed: number;
      cancelled: number;
      totalAmount: number;
      totalEarnings: number;
      totalEarningWallet: number;
      totalEarned: number;
    };
  };
}

