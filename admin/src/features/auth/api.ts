import { API_CONFIG } from '@/config/api.config';
import { baseApi } from '@/lib/api/baseApi';
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminProfileResponse,
  AdminLoginData,
} from '@/features/auth/types';

interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

interface UpdateAdminProfileDto {
  adminId: string;
  payload: {
    username?: string;
    email?: string;
    role?: AdminLoginData['admin']['role'];
    isActive?: boolean;
  };
}

interface UpdateAdminProfileResponse {
  status: 'success';
  data: {
    admin: AdminProfileResponse['data']['admin'] & { _id?: string };
  };
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    adminLogin: build.mutation<AdminLoginData, AdminLoginRequest>({
      query: (credentials) => ({
        url: API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: AdminLoginResponse) => response.data as AdminLoginData,
      invalidatesTags: ['Auth'],
    }),
    getAdminProfile: build.query<AdminProfileResponse['data'], void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.AUTH.PROFILE,
        method: 'GET',
      }),
      providesTags: ['Auth'],
    }),
    changeAdminPassword: build.mutation<{ status: string; message: string }, ChangePasswordDto>({
      query: (body) => ({
        url: API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    updateAdminProfile: build.mutation<UpdateAdminProfileResponse, UpdateAdminProfileDto>({
      query: ({ adminId, payload }) => ({
        url: `${API_CONFIG.ENDPOINTS.AUTH.ADMINS}/${adminId}`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const {
  useAdminLoginMutation,
  useGetAdminProfileQuery,
  useChangeAdminPasswordMutation,
  useUpdateAdminProfileMutation,
} = authApi;


