export interface CreateDepositDto {
  amount: number;
  currency?: string;
  network?: string;
  transactionHash?: string;
  walletAddress: string;
  fromAddress?: string;
  description?: string;
}

export interface UpdateDepositStatusDto {
  status: 'pending' | 'confirmed' | 'completed' | 'failed' | 'cancelled';
  adminNote?: string;
  confirmationCount?: number;
}

export interface DepositResponse {
  id: string;
  user: string;
  amount: number;
  currency: string;
  network: string;
  transactionHash?: string;
  walletAddress: string;
  fromAddress?: string;
  status: string;
  confirmedAt?: Date;
  completedAt?: Date;
  confirmationCount?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}








