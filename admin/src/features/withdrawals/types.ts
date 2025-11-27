export type WithdrawalStatus = 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';

export interface Withdrawal {
  _id: string;
  user: {
    _id: string;
    name?: string;
    email?: string;
    telegramUsername?: string;
    telegramChatId?: number;
    referralCode?: string;
  } | string;
  amount: number;
  currency: string;
  network: string;
  walletAddress: string;
  status: WithdrawalStatus;
  transactionHash?: string;
  approvedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  approvedBy?: {
    _id: string;
    name?: string;
    email?: string;
  } | string;
  rejectedBy?: {
    _id: string;
    name?: string;
    email?: string;
  } | string;
  adminNote?: string;
  userNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalListResponse {
  status: string;
  total: number;
  results: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  data: {
    withdrawals: Withdrawal[];
  };
  meta?: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
}

export interface PendingCountResponse {
  status: string;
  data: {
    count: number;
  };
}

export interface UpdateWithdrawalStatusDto {
  status: WithdrawalStatus;
  adminNote?: string;
  transactionHash?: string;
}

