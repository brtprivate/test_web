/**
 * Deposits API Slice
 * Handles deposit-related endpoints
 */

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

export interface Deposit {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  network: string;
  transactionHash?: string;
  walletAddress: string;
  fromAddress?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'failed' | 'cancelled';
  confirmedAt?: string;
  completedAt?: string;
  confirmationCount?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDepositRequest {
  amount: number;
  currency?: string;
  network?: string;
  transactionHash?: string;
  walletAddress?: string;
  fromAddress?: string;
  description?: string;
}

export interface DepositsResponse {
  status: 'success' | 'error';
  data?: {
    deposits: Deposit[];
  };
  results?: number;
  total?: number;
  message?: string;
}

export interface DepositResponse {
  status: 'success' | 'error';
  data?: {
    deposit: Deposit;
  };
  message?: string;
}

export const depositsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyDeposits: builder.query<
      DepositsResponse,
      { status?: string; limit?: number; skip?: number }
    >({
      query: (params = {}) => ({
        url: API_CONFIG.ENDPOINTS.DEPOSITS.LIST,
        method: 'GET',
        params,
      }),
      providesTags: ['Deposit'],
    }),
    createDeposit: builder.mutation<DepositResponse, CreateDepositRequest>({
      query: (body) => ({
        url: API_CONFIG.ENDPOINTS.DEPOSITS.CREATE,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Deposit', 'Wallet', 'Transaction'],
    }),
    getDepositById: builder.query<DepositResponse, string>({
      query: (id) => ({
        url: API_CONFIG.ENDPOINTS.DEPOSITS.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Deposit', id }],
    }),
  }),
});

export const {
  useGetMyDepositsQuery,
  useCreateDepositMutation,
  useGetDepositByIdQuery,
} = depositsApi;








