/**
 * Transactions API Slice
 * Handles transaction endpoints
 */

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'income' | 'referral';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionsResponse {
  status: 'success' | 'error';
  data?: {
    transactions: Transaction[];
  };
  results?: number;
  total?: number;
  message?: string;
}

export interface TransactionResponse {
  status: 'success' | 'error';
  data?: {
    transaction: Transaction;
  };
  message?: string;
}

export const transactionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyTransactions: builder.query<
      TransactionsResponse,
      { type?: string; limit?: number; skip?: number }
    >({
      query: (params = {}) => ({
        url: API_CONFIG.ENDPOINTS.TRANSACTIONS.MY_TRANSACTIONS,
        method: 'GET',
        params,
      }),
      providesTags: ['Transaction'],
    }),
    getTransactionById: builder.query<TransactionResponse, string>({
      query: (id) => ({
        url: API_CONFIG.ENDPOINTS.TRANSACTIONS.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Transaction', id }],
    }),
  }),
});

export const { useGetMyTransactionsQuery, useGetTransactionByIdQuery } = transactionsApi;








