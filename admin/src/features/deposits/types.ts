export type DepositStatus = 'pending' | 'confirmed' | 'completed' | 'failed' | 'cancelled';

export interface DepositUser {
  _id?: string;
  name?: string;
  email?: string;
  telegramUsername?: string;
  referralCode?: string;
}

export interface Deposit {
  _id: string;
  user: DepositUser | string;
  amount: number;
  currency: string;
  network: string;
  status: DepositStatus;
  transactionHash?: string;
  walletAddress: string;
  fromAddress?: string;
  description?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositListResponse {
  status: string;
  total: number;
  results: number;
  data: {
    deposits: Deposit[];
  };
}

export interface PendingCountResponse {
  status: string;
  data: {
    count: number;
  };
}

export interface UpdateDepositStatusDto {
  status: DepositStatus;
  adminNote?: string;
}


