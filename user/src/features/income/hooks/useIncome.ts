/**
 * useIncome Hook
 * Custom hook for income operations
 */

import { useGetIncomeSummaryQuery, useGetIncomeHistoryQuery } from '../api/incomeApi';

export const useIncome = () => {
  const { data: summaryData, isLoading: isSummaryLoading, error: summaryError } =
    useGetIncomeSummaryQuery();
  const summary = summaryData?.data?.summary;

  return {
    summary,
    isSummaryLoading,
    summaryError,
  };
};

export const useIncomeHistory = (params?: { limit?: number; skip?: number; incomeType?: string }) => {
  const { data, isLoading, error } = useGetIncomeHistoryQuery(params || {});
  const history = data?.data?.transactions || [];
  const total = data?.total || 0;

  return {
    history,
    total,
    isLoading,
    error,
  };
};




