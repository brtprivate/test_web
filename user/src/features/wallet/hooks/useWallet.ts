/**
 * useWallet Hook
 * Custom hook for wallet operations
 */

import { useGetBalanceQuery, useDepositMutation, useWithdrawMutation } from '../api/walletApi';

export const useWallet = () => {
  const { data, isLoading, error, refetch } = useGetBalanceQuery();
  const [deposit, { isLoading: isDepositing, error: depositError }] = useDepositMutation();
  const [withdraw, { isLoading: isWithdrawing, error: withdrawError }] = useWithdrawMutation();

  const balance = data?.data?.balances;

  return {
    balance,
    isLoading,
    isDepositing,
    isWithdrawing,
    error,
    depositError,
    withdrawError,
    refetch,
    deposit,
    withdraw,
  };
};




