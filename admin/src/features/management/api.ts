"use client";

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

type ReferralPayoutShape =
  | number
  | string
  | {
      total?: number;
      direct?: number;
      team?: number;
      referral?: number;
      amount?: number;
    };

interface TriggerDailyRewardsResponse {
  status: 'success' | 'error';
  data?: {
    processedInvestments?: number;
    durationMs?: number;
    message?: string;
    summary?: {
      processedInvestments?: number;
      durationMs?: number;
      referralAmount?: ReferralPayoutShape;
      referralPayout?: ReferralPayoutShape;
      stats?: {
        processedInvestments?: number;
        referralAmount?: ReferralPayoutShape;
      };
    };
    metrics?: {
      investments?: number;
      referralAmount?: ReferralPayoutShape;
      referralPayout?: ReferralPayoutShape;
      durationMs?: number;
    };
    stats?: {
      processedInvestments?: number;
      referralAmount?: ReferralPayoutShape;
      referralPayout?: ReferralPayoutShape;
    };
    referralAmount?: ReferralPayoutShape;
    referralPayout?: ReferralPayoutShape;
  };
  message?: string;
}

export const managementApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    triggerDailyRewards: build.mutation<TriggerDailyRewardsResponse, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.CRON.TRIGGER_DAILY_REWARDS,
        method: 'POST',
      }),
    }),
    triggerDailyRewardsForce: build.mutation<TriggerDailyRewardsResponse, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.CRON.TRIGGER_DAILY_REWARDS_FORCE,
        method: 'POST',
      }),
    }),
  }),
});

export const { useTriggerDailyRewardsMutation, useTriggerDailyRewardsForceMutation } = managementApi;


