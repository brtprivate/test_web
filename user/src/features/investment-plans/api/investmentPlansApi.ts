/**
 * Investment Plans API Slice
 * Handles investment plan endpoints
 */

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

export interface InvestmentPlan {
  id?: string;
  _id?: string;
  name: string;
  minAmount: number;
  maxAmount?: number;
  dailyROI?: number;
  roiPercentage?: number;
  compoundingEnabled?: boolean;
  isActive: boolean;
  description?: string;
  planType?: 'bot' | 'weekly';
  durationDays?: number;
  payoutType?: 'daily' | 'lump_sum';
  payoutDelayHours?: number;
  lumpSumROI?: number;
  visibility?: {
    dayOfWeek: number;
    startHourUtc?: number;
    durationHours?: number;
  };
  displayOrder?: number;
  isVisibleNow?: boolean;
  nextVisibleAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvestmentPlansResponse {
  status: 'success' | 'error';
  results?: number;
  data?: {
    plans: InvestmentPlan[];
  };
  message?: string;
}

export interface InvestmentPlanResponse {
  status: 'success' | 'error';
  data?: {
    plan: InvestmentPlan;
  };
  message?: string;
}

export interface WeeklyPlanStatusPayload {
  timezone: string;
  isVisibleNow: boolean;
  canInvestNow: boolean;
  currentWindowStart?: string | null;
  currentWindowEnd?: string | null;
  nextWindowStart?: string | null;
  nextWindowEnd?: string | null;
  reminderStartsAt?: string | null;
  reminderWindowHours?: number;
  isReminderWindow?: boolean;
  secondsUntilOpen?: number | null;
  secondsUntilClose?: number | null;
  durationHours?: number;
}

export interface WeeklyPlanStatusResponse {
  status: 'success' | 'error';
  data?: {
    plan: InvestmentPlan;
    status: WeeklyPlanStatusPayload;
  };
  message?: string;
}

export const investmentPlansApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPlans: builder.query<InvestmentPlansResponse, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.INVESTMENT_PLANS.LIST,
        method: 'GET',
        params: {
          audience: 'public',
          active: 'true',
        },
      }),
      providesTags: ['InvestmentPlan'],
    }),
    getPlanByAmount: builder.query<InvestmentPlanResponse, { amount: number }>({
      query: (params) => ({
        url: API_CONFIG.ENDPOINTS.INVESTMENT_PLANS.BY_AMOUNT,
        method: 'GET',
        params: {
          ...params,
          audience: 'public',
          planType: 'bot',
        },
      }),
      providesTags: ['InvestmentPlan'],
    }),
    getPlanById: builder.query<InvestmentPlanResponse, string>({
      query: (id) => ({
        url: API_CONFIG.ENDPOINTS.INVESTMENT_PLANS.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'InvestmentPlan', id }],
    }),
    getWeeklyPlanStatus: builder.query<WeeklyPlanStatusResponse, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.INVESTMENT_PLANS.WEEKLY_STATUS,
        method: 'GET',
        params: {
          audience: 'public',
        },
      }),
      providesTags: ['InvestmentPlan'],
    }),
  }),
});

export const {
  useGetAllPlansQuery,
  useGetPlanByAmountQuery,
  useGetPlanByIdQuery,
  useGetWeeklyPlanStatusQuery,
} = investmentPlansApi;


