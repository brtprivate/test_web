/**
 * useUser Hook
 * Custom hook for user operations
 */

import { useGetProfileQuery, useUpdateProfileMutation } from '../api/usersApi';

export const useUser = () => {
  const { data, isLoading, error, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating, error: updateError }] = useUpdateProfileMutation();

  const user = data?.data?.user;
  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    isUpdating,
    error,
    updateError,
    refetch,
    updateProfile,
    isAuthenticated,
  };
};








