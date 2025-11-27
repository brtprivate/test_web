/**
 * useInvestments Hook
 * Custom hook for investment operations
 */

import { useGetMyInvestmentsQuery, useCreateInvestmentMutation } from '../api/investmentsApi';

export const useInvestments = (params?: { limit?: number; skip?: number }) => {
  const { data, isLoading, error, refetch } = useGetMyInvestmentsQuery(params || {});
  const [createInvestment, { isLoading: isCreating, error: createError }] =
    useCreateInvestmentMutation();

  const investments = data?.data?.investments || [];
  const total = data?.total || 0;

  return {
    investments,
    total,
    isLoading,
    isCreating,
    error,
    createError,
    refetch,
    createInvestment,
  };
};








