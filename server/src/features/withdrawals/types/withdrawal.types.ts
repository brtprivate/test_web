export interface CreateWithdrawalDto {
  amount: number;
  currency?: string;
  network?: string;
  walletAddress: string; // Compulsory wallet address
  userNote?: string;
}

export interface UpdateWithdrawalStatusDto {
  status: 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';
  adminNote?: string;
  transactionHash?: string; // When marking as completed
}

export interface WithdrawalResponse {
  id: string;
  user: string | {
    id: string;
    name: string;
    email?: string;
    telegramUsername?: string;
  };
  amount: number;
  currency: string;
  network: string;
  walletAddress: string;
  status: string;
  transactionHash?: string;
  approvedAt?: Date;
  completedAt?: Date;
  rejectedAt?: Date;
  approvedBy?: string;
  rejectedBy?: string;
  adminNote?: string;
  userNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

