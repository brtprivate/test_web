export type IncomeType = 'daily_roi' | 'referral' | 'team_income' | 'bonus' | 'compounding';
export type IncomeStatus = 'pending' | 'completed' | 'failed';

export interface Income {
  _id: string;
  user: {
    _id: string;
    name?: string;
    email?: string;
    telegramUsername?: string;
    telegramChatId?: number;
  };
  incomeType: IncomeType;
  amount: number;
  earningWalletBefore: number;
  earningWalletAfter: number;
  description: string;
  referenceId?: string;
  investmentId?: string;
  investment?: {
    _id: string;
    amount: number;
    status: string;
    plan?: {
      _id: string;
      name: string;
      dailyROI: number;
      termDays: number;
    } | null;
  } | null;
  referredUser?: {
    _id: string;
    name?: string;
    email?: string;
    telegramUsername?: string;
    telegramChatId?: number;
    totalInvested?: number;
  } | null;
  level?: number;
  status: IncomeStatus;
  incomeDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeListResponse {
  status: string;
  total: number;
  results: number;
  data: {
    incomes: Income[];
  };
  meta: {
    page: number;
    totalPages: number;
    limit: number;
    sortField: string;
    sortDirection: 'asc' | 'desc';
    totals: {
      totalAmount: number;
      incomeTypeStats: Array<{
        _id: string;
        count: number;
        totalAmount: number;
      }>;
      levelStats: Array<{
        _id: number;
        count: number;
        totalAmount: number;
      }>;
    };
  };
}

export interface IncomeQueryParams {
  search?: string;
  incomeType?: IncomeType | 'all';
  level?: number;
  status?: IncomeStatus | 'all';
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortField?: 'incomeDate' | 'createdAt' | 'amount' | 'level' | 'incomeType';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}

