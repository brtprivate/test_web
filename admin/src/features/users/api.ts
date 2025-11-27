import { API_CONFIG } from '@/config/api.config';
import { baseApi } from '@/lib/api/baseApi';
import type { AdminUser, AdminUserListResponse } from '@/features/users/types';

interface UserQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'suspended';
  bonus?: 'all' | 'bonus' | 'no-bonus';
  capital?: 'all' | 'starters' | 'scaling' | 'whales';
  sortField?: 'createdAt' | 'name' | 'totalInvested' | 'totalEarned';
  sortDirection?: 'asc' | 'desc';
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<AdminUserListResponse, UserQueryParams | void>({
      query: (params) => ({
        url: API_CONFIG.ENDPOINTS.MANAGEMENT.USERS,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Users'],
    }),
    getUserById: build.query<{ data: { user: AdminUser } }, string>({
      query: (id) => ({
        url: API_CONFIG.ENDPOINTS.MANAGEMENT.USER_BY_ID(id),
        method: 'GET',
      }),
      providesTags: (_result, _err, id) => [{ type: 'Users', id }],
    }),
    updateUser: build.mutation<{ data: { user: AdminUser } }, { id: string; body: Partial<AdminUser> }>({
      query: ({ id, body }) => ({
        url: API_CONFIG.ENDPOINTS.MANAGEMENT.USER_BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Users', id }, 'Users', 'Dashboard'],
    }),
    generateUserLoginToken: build.mutation<
      { data: { token: string; user: { id: string; name: string; telegramChatId: number } } },
      string
    >({
      query: (id) => ({
        url: API_CONFIG.ENDPOINTS.MANAGEMENT.USER_LOGIN_TOKEN(id),
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useGenerateUserLoginTokenMutation,
} = usersApi;


