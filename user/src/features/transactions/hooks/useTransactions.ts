/**
 * useTransactions Hook
 * Custom hook for transaction operations
 */

import { useGetMyTransactionsQuery } from '../api/transactionsApi';

export const useTransactions = (params?: {
  type?: string;
  limit?: number;
  skip?: number;
}) => {
  const { data, isLoading, error, refetch } = useGetMyTransactionsQuery(params || {});
  const transactions = data?.data?.transactions || [];
  const total = data?.total || 0;

  return {
    transactions,
    total,
    isLoading,
    error,
    refetch,
  };
};








