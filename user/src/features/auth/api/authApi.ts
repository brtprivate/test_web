/**
 * Auth API Slice
 * Handles authentication endpoints (signup, login, verify)
 */

import { baseApi } from '@/lib/api/baseApi';
import { API_CONFIG } from '@/config/api.config';

export interface SignupRequest {
  telegramChatId: number;
  name: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  referralCode?: string;
}

export interface LoginRequest {
  telegramChatId: number;
}

export interface AuthResponse {
  status: 'success' | 'error';
  data?: {
    user: {
      id: string;
      name: string;
      telegramChatId: number;
      telegramUsername?: string;
      isActive: boolean;
    };
    token: string;
  };
  message?: string;
}

export interface VerifyResponse {
  status: 'success' | 'error';
  data?: {
    valid: boolean;
    decoded?: {
      id: string;
      telegramChatId: number;
      iat: number;
      exp: number;
    };
  };
  message?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation<AuthResponse, SignupRequest>({
      query: (body) => ({
        url: API_CONFIG.ENDPOINTS.AUTH.SIGNUP,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
    verifyToken: builder.query<VerifyResponse, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.AUTH.VERIFY,
        method: 'GET',
      }),
      providesTags: ['Auth'],
    }),
  }),
});

export const { useSignupMutation, useLoginMutation, useVerifyTokenQuery } = authApi;








