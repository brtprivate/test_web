import { API_CONFIG } from '@/config/api.config';
import { baseApi } from '@/lib/api/baseApi';
import type { DashboardResponse, DashboardStats } from '@/features/dashboard/types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboardStats: build.query<DashboardStats, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.DASHBOARD.STATS,
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
      transformResponse: (response: DashboardResponse) => response.data,
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;




