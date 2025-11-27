export interface WalletAdjustment {
  _id: string;
  user: {
    _id: string;
    name?: string;
    email?: string;
    telegramUsername?: string;
  };
  walletType: 'investment' | 'earning';
  action: 'add' | 'deduct';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  admin: {
    _id: string;
    username?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WalletAdjustmentListResponse {
  status: string;
  data: {
    adjustments: WalletAdjustment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WalletAdjustmentStats {
  totalAdjustments: number;
  totalAdded: number;
  totalDeducted: number;
  totalInvestmentAdded: number;
  totalInvestmentDeducted: number;
  totalEarningAdded: number;
  totalEarningDeducted: number;
}

export interface WalletAdjustmentStatsResponse {
  status: string;
  data: {
    stats: WalletAdjustmentStats;
  };
}

export interface CreateWalletAdjustmentDto {
  userId: string;
  walletType: 'investment' | 'earning';
  action: 'add' | 'deduct';
  amount: number;
  description: string;
}

export interface WalletAdjustmentQueryParams {
  userId?: string;
  walletType?: 'investment' | 'earning';
  action?: 'add' | 'deduct';
  adminId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}



