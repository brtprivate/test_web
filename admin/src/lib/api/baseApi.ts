import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '@/config/api.config';
import { clearSession } from '@/lib/slices/authSlice';
import { getStoredToken } from '@/lib/utils/token';

type MaybeRootState = {
  adminAuth?: {
    token?: string | null;
  };
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as MaybeRootState | undefined;
    const token = state?.adminAuth?.token || getStoredToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    api.dispatch(clearSession());
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'Dashboard',
    'Users',
    'Plans',
    'Settings',
    'Deposits',
    'Withdrawals',
    'Payments',
    'Teams',
    'Investments',
    'WalletAdjustments',
    'Incomes',
  ],
  endpoints: () => ({}),
});


