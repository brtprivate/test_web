/**
 * Settings API Slice
 * Handles settings endpoints
 */

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

export interface Setting {
  key: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean';
  description?: string;
  isPublic?: boolean;
}

export interface SettingsResponse {
  status: 'success' | 'error';
  data?: {
    settings: Setting[];
  };
  message?: string;
}

export interface SettingResponse {
  status: 'success' | 'error';
  data?: {
    setting: Setting;
  };
  message?: string;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllSettings: builder.query<SettingsResponse, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.SETTINGS.LIST,
        method: 'GET',
      }),
      providesTags: ['Setting'],
    }),
    getSettingByKey: builder.query<SettingResponse, string>({
      query: (key) => ({
        url: API_CONFIG.ENDPOINTS.SETTINGS.BY_KEY(key),
        method: 'GET',
      }),
      providesTags: (result, error, key) => [{ type: 'Setting', id: key }],
    }),
  }),
});

export const { useGetAllSettingsQuery, useGetSettingByKeyQuery } = settingsApi;








