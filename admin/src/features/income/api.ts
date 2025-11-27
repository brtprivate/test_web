import { API_CONFIG } from '@/config/api.config';
import { baseApi } from '@/lib/api/baseApi';
import type { IncomeListResponse, IncomeQueryParams } from '@/features/income/types';

export const incomeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getIncomes: build.query<IncomeListResponse, IncomeQueryParams | void>({
      query: (params) => ({
        url: API_CONFIG.ENDPOINTS.INCOMES.ALL,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Incomes'],
    }),
  }),
});

export const { useGetIncomesQuery } = incomeApi;

