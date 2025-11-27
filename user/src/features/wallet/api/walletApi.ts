/**
 * Wallet API Slice
 * Handles wallet-related endpoints
 */

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

export interface WalletBalances {
  investmentWallet: number;
  earningWallet: number;
  total: number;
}

export interface WalletBalanceResponse {
  status: 'success' | 'error';
  data?: {
    balances: WalletBalances;
  };
  message?: string;
}

export interface DepositRequest {
  amount: number;
  transactionHash?: string;
}

export interface WithdrawRequest {
  amount: number;
  address: string;
}

export interface WalletHistoryResponse {
  status: 'success' | 'error';
  data?: {
    transactions: any[];
  };
  results?: number;
  total?: number;
  message?: string;
}

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBalance: builder.query<WalletBalanceResponse, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.WALLET.BALANCE,
        method: 'GET',
      }),
      providesTags: ['Wallet'],
    }),
    deposit: builder.mutation<{ status: string; data?: any; message?: string }, DepositRequest>({
      query: (body) => ({
        url: API_CONFIG.ENDPOINTS.WALLET.DEPOSIT,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wallet', 'Transaction'],
    }),
    withdraw: builder.mutation<{ status: string; data?: any; message?: string }, WithdrawRequest>({
      query: (body) => ({
        url: API_CONFIG.ENDPOINTS.WALLET.WITHDRAW,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wallet', 'Transaction'],
    }),
    getHistory: builder.query<WalletHistoryResponse, { limit?: number; skip?: number }>({
      query: (params = {}) => ({
        url: API_CONFIG.ENDPOINTS.WALLET.HISTORY,
        method: 'GET',
        params,
      }),
      providesTags: ['Wallet'],
    }),
  }),
});

export const {
  useGetBalanceQuery,
  useDepositMutation,
  useWithdrawMutation,
  useGetHistoryQuery,
} = walletApi;




