import { API_CONFIG } from '@/config/api.config';
import { baseApi } from '@/lib/api/baseApi';
import type { Investment, InvestmentListResponse } from '@/features/investments/types';

interface InvestmentQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'completed' | 'cancelled';
  sortField?: 'createdAt' | 'amount' | 'startDate' | 'status';
  sortDirection?: 'asc' | 'desc';
  minAmount?: number;
  maxAmount?: number;
  bonus?: 'all' | 'bonus' | 'no-bonus';
}

export const investmentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllInvestments: build.query<InvestmentListResponse, InvestmentQueryParams | void>({
      query: (params) => ({
        url: API_CONFIG.ENDPOINTS.INVESTMENTS.ALL,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Investments'],
    }),
    getInvestmentById: build.query<{ data: { investment: Investment } }, string>({
      query: (id) => ({
        url: API_CONFIG.ENDPOINTS.INVESTMENTS.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (_result, _err, id) => [{ type: 'Investments', id }],
    }),
  }),
});

export const { useGetAllInvestmentsQuery, useGetInvestmentByIdQuery } = investmentsApi;

