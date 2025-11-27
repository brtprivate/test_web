export interface AdminUserReferrer {
  _id: string;
  name: string;
  referralCode: string;
  telegramUsername?: string;
  telegramChatId?: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email?: string;
  telegramChatId?: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  referralCode: string;
  referredBy?: AdminUserReferrer | string | null;
  investmentWallet: number;
  earningWallet: number;
  totalEarned: number;
  totalInvested: number;
  walletAddress?: string;
  isActive: boolean;
  freeBonusReceived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersMeta {
  page: number;
  totalPages: number;
  limit: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  totals: {
    _id?: null | string;
    totalInvested: number;
    totalEarned: number;
    active: number;
    whales: number;
    bonusClaimed: number;
  };
}

export interface AdminUserListResponse {
  status: string;
  total: number;
  results: number;
  meta?: AdminUsersMeta;
  data: {
    users: AdminUser[];
  };
}


