/**
 * useSettings Hook
 * Custom hook for settings operations
 */

import { useGetAllSettingsQuery, useGetSettingByKeyQuery } from '../api/settingsApi';

export const useSettings = () => {
  const { data, isLoading, error } = useGetAllSettingsQuery();
  const settings = data?.data?.settings || [];

  return {
    settings,
    isLoading,
    error,
  };
};

export const useSetting = (key: string) => {
  const { data, isLoading, error } = useGetSettingByKeyQuery(key);
  const setting = data?.data?.setting;

  return {
    setting,
    isLoading,
    error,
  };
};








