"use client";

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

interface TriggerDailyRewardsResponse {
  status: 'success' | 'error';
  data?: {
    processedInvestments?: number;
    durationMs?: number;
    message?: string;
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


