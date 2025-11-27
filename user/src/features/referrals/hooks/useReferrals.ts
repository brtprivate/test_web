/**
 * useReferrals Hook
 * Custom hook for referral operations
 */

import { useGetReferralStatsQuery, useGetReferralsQuery, useGetLevelWiseStatsQuery } from '../api/referralsApi';

export const useReferrals = () => {
  const { data, isLoading, error } = useGetReferralStatsQuery();
  const stats = data?.data?.stats;

  return {
    stats,
    isLoading,
    error,
  };
};

export const useReferralsList = (params?: { limit?: number; skip?: number }) => {
  const { data, isLoading, error } = useGetReferralsQuery(params || {});
  const referrals = data?.data?.referrals || [];
  const total = data?.total || 0;

  return {
    referrals,
    total,
    isLoading,
    error,
  };
};

export const useLevelWiseStats = (params?: { maxLevels?: number }) => {
  const { data, isLoading, error } = useGetLevelWiseStatsQuery(params || {});
  const levels = data?.data?.levels || [];

  return {
    levels,
    isLoading,
    error,
  };
};






