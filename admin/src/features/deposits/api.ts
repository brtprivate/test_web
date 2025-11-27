import { API_CONFIG } from '@/config/api.config';
import { baseApi } from '@/lib/api/baseApi';
import type {
  DepositListResponse,
  PendingCountResponse,
  UpdateDepositStatusDto,
} from '@/features/deposits/types';

interface DepositQueryParams {
  status?: string;
  limit?: number;
  skip?: number;
}

type DepositListData = DepositListResponse['data'] &
  Pick<DepositListResponse, 'total' | 'results'>;

export const depositApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDeposits: build.query<DepositListData, DepositQueryParams | void>({
      query: (params) => ({
        url: API_CONFIG.ENDPOINTS.DEPOSITS.ALL,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Deposits'],
      transformResponse: (response: DepositListResponse) => ({
        ...response.data,
        total: response.total,
        results: response.results,
      }),
    }),
    getPendingDepositsCount: build.query<PendingCountResponse['data'], void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.DEPOSITS.PENDING_COUNT,
        method: 'GET',
      }),
      providesTags: ['Deposits'],
      transformResponse: (response: PendingCountResponse) => response.data,
    }),
    updateDepositStatus: build.mutation<
      { status: string; data: DepositListResponse['data']['deposits'][number] },
      { id: string; body: UpdateDepositStatusDto }
    >({
      query: ({ id, body }) => ({
        url: API_CONFIG.ENDPOINTS.DEPOSITS.UPDATE_STATUS(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Deposits', 'Dashboard'],
    }),
  }),
});

export const {
  useGetDepositsQuery,
  useGetPendingDepositsCountQuery,
  useUpdateDepositStatusMutation,
} = depositApi;


