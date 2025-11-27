/**
 * Users API Slice
 * Handles user-related endpoints
 */

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

export interface User {
  id: string;
  name: string;
  telegramChatId: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  referralCode?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileResponse {
  status: 'success' | 'error';
  data?: {
    user: User;
  };
  message?: string;
}

export interface UpdateUserRequest {
  name?: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<UserProfileResponse, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.USERS.PROFILE,
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<UserProfileResponse, UpdateUserRequest>({
      query: (body) => ({
        url: API_CONFIG.ENDPOINTS.USERS.UPDATE,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useGetProfileQuery, useUpdateProfileMutation } = usersApi;








