/**
 * Payment API Slice
 * Handles payment-related endpoints
 */

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

export interface GenerateWalletResponse {
  status: boolean;
  wallet?: {
    address: string;
    privateKey: string;
  };
  message?: string;
  existing?: boolean;
}

export interface StartMonitoringRequest {
  walletAddress: string;
  walletPrivateKey: string;
  amount?: number;
  planId?: string;
}

export interface StartMonitoringResponse {
  status: boolean;
  result?: {
    found: boolean;
    amount?: number;
    txid?: string;
    depositId?: string;
    investmentId?: string;
    investmentCreated?: boolean;
    investmentError?: string;
    message?: string;
  };
  message?: string;
}

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generateWallet: builder.mutation<GenerateWalletResponse, void>({
      query: () => ({
        url: '/payment/generate-wallet',
        method: 'POST',
      }),
    }),
    startMonitoring: builder.mutation<StartMonitoringResponse, StartMonitoringRequest>({
      query: (body) => ({
        url: '/payment/monitor',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wallet', 'Transaction', 'Deposit', 'Investment'],
    }),
  }),
});

export const {
  useGenerateWalletMutation,
  useStartMonitoringMutation,
} = paymentApi;

