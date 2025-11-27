import { API_CONFIG } from '@/config/api.config';
import { baseApi } from '@/lib/api/baseApi';
import type {
  WithdrawalListResponse,
  PendingCountResponse,
  UpdateWithdrawalStatusDto,
} from '@/features/withdrawals/types';

interface WithdrawalQueryParams {
  status?: string;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  page?: number;
  skip?: number; // For backward compatibility
}

type WithdrawalListData = WithdrawalListResponse['data'] &
  Pick<WithdrawalListResponse, 'total' | 'results' | 'meta'>;

export const withdrawalApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getWithdrawals: build.query<WithdrawalListData, WithdrawalQueryParams | void>({
      query: (params) => ({
        url: API_CONFIG.ENDPOINTS.WITHDRAWALS.ALL,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Withdrawals'],
      transformResponse: (response: WithdrawalListResponse): WithdrawalListData => {
        const fallbackMeta =
          response.meta ??
          (response.page
            ? {
                page: response.page,
                limit: response.limit ?? response.data.withdrawals.length,
                totalPages:
                  response.totalPages ??
                  Math.max(
                    1,
                    Math.ceil(
                      response.total /
                        Math.max(response.limit ?? response.data.withdrawals.length, 1)
                    )
                  ),
                total: response.total,
              }
            : undefined);

        return {
          ...response.data,
          total: response.total,
          results: response.results,
          meta: fallbackMeta,
        };
      },
    }),
    getPendingWithdrawalsCount: build.query<PendingCountResponse['data'], void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.WITHDRAWALS.PENDING_COUNT,
        method: 'GET',
      }),
      providesTags: ['Withdrawals'],
      transformResponse: (response: PendingCountResponse) => response.data,
    }),
    updateWithdrawalStatus: build.mutation<
      { status: string; data: WithdrawalListResponse['data']['withdrawals'][number] },
      { id: string; body: UpdateWithdrawalStatusDto }
    >({
      query: ({ id, body }) => ({
        url: API_CONFIG.ENDPOINTS.WITHDRAWALS.UPDATE_STATUS(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Withdrawals', 'Dashboard'],
    }),
  }),
});

export const {
  useGetWithdrawalsQuery,
  useGetPendingWithdrawalsCountQuery,
  useUpdateWithdrawalStatusMutation,
} = withdrawalApi;

