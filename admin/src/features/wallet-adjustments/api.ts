import { API_CONFIG } from '@/config/api.config';
import { baseApi } from '@/lib/api/baseApi';
import type {
  WalletAdjustmentListResponse,
  WalletAdjustmentStatsResponse,
  CreateWalletAdjustmentDto,
  WalletAdjustmentQueryParams,
  WalletAdjustment,
} from '@/features/wallet-adjustments/types';

export const walletAdjustmentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getWalletAdjustments: build.query<WalletAdjustmentListResponse['data'], WalletAdjustmentQueryParams | void>({
      query: (params) => ({
        url: API_CONFIG.ENDPOINTS.WALLET_ADJUSTMENTS.ROOT,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['WalletAdjustments'],
      transformResponse: (response: WalletAdjustmentListResponse) => response.data,
    }),
    getWalletAdjustmentById: build.query<{ adjustment: WalletAdjustment }, string>({
      query: (id) => ({
        url: API_CONFIG.ENDPOINTS.WALLET_ADJUSTMENTS.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (_result, _err, id) => [{ type: 'WalletAdjustments', id }],
    }),
    getUserWalletAdjustments: build.query<
      WalletAdjustmentListResponse['data'],
      { userId: string; page?: number; limit?: number }
    >({
      query: ({ userId, page = 1, limit = 50 }) => ({
        url: API_CONFIG.ENDPOINTS.WALLET_ADJUSTMENTS.USER_ADJUSTMENTS(userId),
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: (_result, _err, { userId }) => [{ type: 'WalletAdjustments', id: `user-${userId}` }],
      transformResponse: (response: WalletAdjustmentListResponse) => response.data,
    }),
    getWalletAdjustmentStats: build.query<
      WalletAdjustmentStatsResponse['data']['stats'],
      { startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: API_CONFIG.ENDPOINTS.WALLET_ADJUSTMENTS.STATS,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['WalletAdjustments'],
      transformResponse: (response: WalletAdjustmentStatsResponse) => response.data.stats,
    }),
    createWalletAdjustment: build.mutation<
      { status: string; message: string; data: { adjustment: WalletAdjustment } },
      CreateWalletAdjustmentDto
    >({
      query: (body) => ({
        url: API_CONFIG.ENDPOINTS.WALLET_ADJUSTMENTS.ROOT,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WalletAdjustments', 'Users', 'Dashboard'],
    }),
  }),
});

export const {
  useGetWalletAdjustmentsQuery,
  useGetWalletAdjustmentByIdQuery,
  useGetUserWalletAdjustmentsQuery,
  useGetWalletAdjustmentStatsQuery,
  useCreateWalletAdjustmentMutation,
} = walletAdjustmentApi;

