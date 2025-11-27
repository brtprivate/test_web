/**
 * Referrals API Slice
 * Handles referral-related endpoints
 */

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings?: number;
  totalEarned?: number;
  teamSize?: number;
  referralCode?: string;
}

export interface ReferralStatsResponse {
  status: 'success' | 'error';
  data?: {
    stats: ReferralStats;
  };
  message?: string;
}

export interface ReferralsResponse {
  status: 'success' | 'error';
  data?: {
    referrals: any[];
  };
  results?: number;
  total?: number;
  message?: string;
}

export interface LevelWiseStat {
  level: number;
  userCount: number;
  purchaseAmount: number;
  reward: number;
  commission: number;
}

export interface LevelWiseStatsResponse {
  status: 'success' | 'error';
  data?: {
    levels: LevelWiseStat[];
  };
  message?: string;
}

export interface LevelUser {
  _id: string;
  name?: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  referralCode?: string;
  totalInvested?: number;
  investmentWallet?: number;
  earningWallet?: number;
  createdAt?: string;
  isActive?: boolean;
}

export interface LevelUsersResponse {
  status: 'success' | 'error';
  results?: number;
  total?: number;
  data?: {
    level: number;
    users: LevelUser[];
  };
  message?: string;
}

export const referralsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReferralStats: builder.query<ReferralStatsResponse, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.REFERRALS.STATS,
        method: 'GET',
      }),
      providesTags: ['Referral'],
    }),
    getReferrals: builder.query<ReferralsResponse, { limit?: number; skip?: number }>({
      query: (params = {}) => ({
        url: API_CONFIG.ENDPOINTS.REFERRALS.LIST,
        method: 'GET',
        params,
      }),
      providesTags: ['Referral'],
    }),
    getLevelWiseStats: builder.query<LevelWiseStatsResponse, { maxLevels?: number }>({
      query: (params = {}) => ({
        url: API_CONFIG.ENDPOINTS.REFERRALS.LEVEL_WISE,
        method: 'GET',
        params,
      }),
      providesTags: ['Referral'],
    }),
    getLevelUsers: builder.query<LevelUsersResponse, { level: number; limit?: number; skip?: number }>({
      query: (params) => ({
        url: API_CONFIG.ENDPOINTS.REFERRALS.LEVEL_USERS,
        method: 'GET',
        params,
      }),
      providesTags: ['Referral'],
    }),
  }),
});

export const {
  useGetReferralStatsQuery,
  useGetReferralsQuery,
  useGetLevelWiseStatsQuery,
  useLazyGetLevelUsersQuery,
} = referralsApi;




