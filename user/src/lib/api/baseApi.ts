/**
 * Base API Configuration for RTK Query
 * Provides base configuration for all API endpoints
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '@/config/api.config';
import { getToken as getCookieToken } from '@/lib/utils/cookies';
import { clearAuthToken } from '@/lib/slices/authSlice';
import type { RootState } from '@/lib/store';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Prefer Redux token, fall back to cookies (SSR or legacy flows)
    const state = getState() as RootState | undefined;
    const reduxToken = state?.auth?.token;
    const token = reduxToken || getCookieToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
  credentials: 'include', // Include cookies in requests
});

// Base query with re-authentication on 401 and connection error handling
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle connection errors
  if (result?.error) {
    const error = result.error as any;
    
    // Connection refused or network error
    if (error.status === 'FETCH_ERROR' || error.status === 'PARSING_ERROR') {
      if (typeof window !== 'undefined') {
        const apiUrl = API_CONFIG.BASE_URL;
        console.error('❌ API Connection Error:', {
          url: args?.url || 'unknown',
          baseUrl: apiUrl,
          error: error.error || 'Connection refused',
          message: `Cannot connect to server at ${apiUrl}`,
        });
        console.error('💡 Troubleshooting:');
        console.error('   1. Make sure server is running');
        console.error(`   2. Check if server is accessible at: ${apiUrl.replace('/api', '')}/health`);
        console.error('   3. Verify NEXT_PUBLIC_API_URL in .env.local matches server port');
        console.error('   4. Check server logs for errors');
      }
    }

    // Handle 401 Unauthorized
    if (error.status === 401) {
      // Token expired or invalid - clear token from cookies
      api.dispatch(clearAuthToken());
      if (typeof window !== 'undefined') {
        // Optionally redirect to login page
        // window.location.href = '/login';
      }
    }
  }

  return result;
};

/**
 * Base API slice
 * All feature API slices should extend this
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Auth',
    'InvestmentPlan',
    'Investment',
    'Wallet',
    'Transaction',
    'Income',
    'Referral',
    'Setting',
    'Deposit',
    'Withdrawals',
  ],
  endpoints: () => ({}),
});

