/**
 * useInvestmentPlans Hook
 * Custom hook for investment plan operations
 */

import { useMemo } from 'react';
import {
  useGetAllPlansQuery,
  useGetPlanByAmountQuery,
  useGetWeeklyPlanStatusQuery,
  InvestmentPlan,
} from '../api/investmentPlansApi';

const normalizePlan = (plan: InvestmentPlan): InvestmentPlan => {
  const normalizedDailyROI = plan.dailyROI ?? plan.roiPercentage ?? 0;

  return {
    ...plan,
    id: plan.id || plan._id,
    dailyROI: normalizedDailyROI,
    roiPercentage: normalizedDailyROI,
  };
};

export const useInvestmentPlans = () => {
  const { data, isLoading, error, refetch } = useGetAllPlansQuery();

  const plans = useMemo(() => {
    if (!data?.data?.plans) {
      return [];
    }
    return data.data.plans.map(normalizePlan);
  }, [data]);

  return {
    plans,
    isLoading,
    error,
    refetch,
  };
};

export const usePlanByAmount = (amount: number) => {
  const { data, isLoading, error } = useGetPlanByAmountQuery({ amount });

  const plan = useMemo(() => {
    if (!data?.data?.plan) {
      return undefined;
    }
    return normalizePlan(data.data.plan);
  }, [data]);

  return {
    plan,
    isLoading,
    error,
  };
};

export const useWeeklyPlanStatus = () => {
  const { data, isLoading, error, refetch } = useGetWeeklyPlanStatusQuery();
  return {
    weeklyPlanStatus: data?.data,
    isLoading,
    error,
    refetch,
  };
};


