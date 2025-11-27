/**
 * useDeposits Hook
 * Custom hook for deposit operations
 */

import { useGetMyDepositsQuery, useCreateDepositMutation } from '../api/depositsApi';

export const useDeposits = (params?: {
  status?: string;
  limit?: number;
  skip?: number;
}) => {
  const { data, isLoading, error, refetch } = useGetMyDepositsQuery(params || {});
  const [createDeposit, { isLoading: isCreating, error: createError }] =
    useCreateDepositMutation();

  const deposits = data?.data?.deposits || [];
  const total = data?.total || 0;

  return {
    deposits,
    total,
    isLoading,
    isCreating,
    error,
    createError,
    refetch,
    createDeposit,
  };
};








