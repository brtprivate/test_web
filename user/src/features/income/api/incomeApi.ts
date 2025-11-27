/**
 * Income API Slice
 * Handles income-related endpoints
 */

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

export interface IncomeSummary {
  totalIncome: number;
  dailyROI: number;
  levelROI: number;
  referralIncome: number;
  todayIncome: number;
}

export interface IncomeSummaryResponse {
  status: 'success' | 'error';
  data?: {
    summary: IncomeSummary;
  };
  message?: string;
}

export interface IncomeTransaction {
  _id: string;
  user: string;
  incomeType: 'daily_roi' | 'referral' | 'team_income' | 'bonus' | 'compounding';
  amount: number;
  earningWalletBefore: number;
  earningWalletAfter: number;
  description: string;
  referenceId?: string;
  investmentId?: string;
  level?: number;
  status: 'pending' | 'completed' | 'failed';
  incomeDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeHistoryResponse {
  status: 'success' | 'error';
  data?: {
    transactions: IncomeTransaction[];
  };
  results?: number;
  total?: number;
  message?: string;
}

export const incomeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncomeSummary: builder.query<IncomeSummaryResponse, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.INCOME.SUMMARY,
        method: 'GET',
      }),
      providesTags: ['Income'],
    }),
    getIncomeHistory: builder.query<IncomeHistoryResponse, { limit?: number; skip?: number; incomeType?: string }>({
      query: (params = {}) => ({
        url: API_CONFIG.ENDPOINTS.INCOME.HISTORY,
        method: 'GET',
        params,
      }),
      providesTags: ['Income'],
    }),
  }),
});

export const { useGetIncomeSummaryQuery, useGetIncomeHistoryQuery } = incomeApi;




