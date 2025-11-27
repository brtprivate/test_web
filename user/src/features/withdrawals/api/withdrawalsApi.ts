/**
 * Withdrawals API Slice
 * Handles withdrawal-related endpoints
 */

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

export interface Withdrawal {
  _id: string;
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
  status: 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';
  transactionHash?: string;
  approvedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  approvedBy?: string;
  rejectedBy?: string;
  adminNote?: string;
  userNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWithdrawalRequest {
  amount: number;
  walletAddress: string;
  currency?: string;
  network?: string;
  userNote?: string;
}

export interface WithdrawalsListResponse {
  status: 'success' | 'error';
  data?: {
    withdrawals: Withdrawal[];
  };
  results?: number;
  total?: number;
  message?: string;
}

export interface WithdrawalResponse {
  status: 'success' | 'error';
  data?: {
    withdrawal: Withdrawal;
  };
  message?: string;
}

export const withdrawalsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWithdrawals: builder.query<WithdrawalsListResponse, { status?: string; limit?: number; skip?: number }>({
      query: (params = {}) => ({
        url: API_CONFIG.ENDPOINTS.WITHDRAWALS.LIST,
        method: 'GET',
        params,
      }),
      providesTags: ['Withdrawals'],
    }),
    getWithdrawalById: builder.query<WithdrawalResponse, string>({
      query: (id) => ({
        url: API_CONFIG.ENDPOINTS.WITHDRAWALS.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (_result, _err, id) => [{ type: 'Withdrawals', id }],
    }),
    createWithdrawal: builder.mutation<WithdrawalResponse, CreateWithdrawalRequest>({
      query: (body) => ({
        url: API_CONFIG.ENDPOINTS.WITHDRAWALS.CREATE,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Withdrawals', 'Wallet'],
    }),
  }),
});

export const {
  useGetWithdrawalsQuery,
  useGetWithdrawalByIdQuery,
  useCreateWithdrawalMutation,
} = withdrawalsApi;

