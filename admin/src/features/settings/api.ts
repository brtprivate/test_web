import { API_CONFIG } from '@/config/api.config';
import { baseApi } from '@/lib/api/baseApi';
import type { Setting, SettingsResponse } from '@/features/settings/types';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<Setting[], void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.SETTINGS.ROOT,
        method: 'GET',
      }),
      providesTags: ['Settings'],
      transformResponse: (response: SettingsResponse) => response.data.settings,
    }),
    updateSetting: build.mutation<Setting, { key: string; value: Setting['value'] }>({
      query: ({ key, value }) => ({
        url: API_CONFIG.ENDPOINTS.SETTINGS.BY_KEY(key),
        method: 'PATCH',
        body: { value },
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingMutation } = settingsApi;




