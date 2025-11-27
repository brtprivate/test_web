/**
 * Investments API Slice
 * Handles investment-related endpoints
 */

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

export interface Investment {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  dailyROI?: number;
  totalROI?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvestmentPlan {
  id?: string;
  _id?: string;
  name: string;
  minAmount: number;
  maxAmount?: number;
  dailyROI?: number;
  roiPercentage?: number;
  isActive: boolean;
  description?: string;
  compoundingEnabled?: boolean;
}

export interface InvestmentsResponse {
  status: 'success' | 'error';
  data?: {
    investments: Investment[];
  };
  results?: number;
  total?: number;
  message?: string;
}

export interface InvestmentResponse {
  status: 'success' | 'error';
  data?: {
    investment: Investment;
  };
  message?: string;
}

export interface CreateInvestmentRequest {
  planId: string;
  amount: number;
}

export const investmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyInvestments: builder.query<InvestmentsResponse, { limit?: number; skip?: number }>({
      query: (params = {}) => ({
        url: API_CONFIG.ENDPOINTS.INVESTMENTS.MY_INVESTMENTS,
        method: 'GET',
        params,
      }),
      providesTags: ['Investment'],
    }),
    createInvestment: builder.mutation<InvestmentResponse, CreateInvestmentRequest>({
      query: (body) => ({
        url: API_CONFIG.ENDPOINTS.INVESTMENTS.CREATE,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Investment', 'Wallet', 'Transaction'],
    }),
    getInvestmentById: builder.query<InvestmentResponse, string>({
      query: (id) => ({
        url: API_CONFIG.ENDPOINTS.INVESTMENTS.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Investment', id }],
    }),
  }),
});

export const {
  useGetMyInvestmentsQuery,
  useCreateInvestmentMutation,
  useGetInvestmentByIdQuery,
} = investmentsApi;


