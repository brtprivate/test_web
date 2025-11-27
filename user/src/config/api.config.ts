/**
 * API Configuration
 * Centralized configuration for API base URL and endpoints
 */

const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if (typeof window !== 'undefined') {
    // Client-side: check for NEXT_PUBLIC_API_URL
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }
  
  // Server-side: use API_URL or default
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
};

// Log API URL in development (client-side only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🌐 API Base URL:', getApiBaseUrl());
}

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    // Auth
    AUTH: {
      SIGNUP: '/auth/signup',
      LOGIN: '/auth/login',
      VERIFY: '/auth/verify',
    },
    // Users
    USERS: {
      PROFILE: '/users/profile',
      UPDATE: '/users/profile',
      BY_ID: (id: string) => `/users/${id}`,
    },
    // Investment Plans
    INVESTMENT_PLANS: {
      LIST: '/investment-plans',
      BY_AMOUNT: '/investment-plans/by-amount',
      WEEKLY_STATUS: '/investment-plans/weekly/status',
      BY_ID: (id: string) => `/investment-plans/${id}`,
    },
    // Investments
    INVESTMENTS: {
      LIST: '/investments',
      CREATE: '/investments',
      BY_ID: (id: string) => `/investments/${id}`,
      MY_INVESTMENTS: '/investments/my',
    },
    // Wallet
    WALLET: {
      BALANCE: '/wallet/balances',
      DEPOSIT: '/wallet/deposit',
      WITHDRAW: '/wallet/withdraw',
      HISTORY: '/wallet/history',
    },
    // Transactions
    TRANSACTIONS: {
      LIST: '/transactions',
      BY_ID: (id: string) => `/transactions/${id}`,
      MY_TRANSACTIONS: '/transactions/my',
    },
    // Income
    INCOME: {
      SUMMARY: '/income/summary',
      HISTORY: '/income/transactions',
      TRANSACTIONS: '/income/transactions',
    },
    // Referrals
    REFERRALS: {
      STATS: '/referrals/stats',
      LIST: '/referrals',
      LEVEL_WISE: '/referrals/level-wise',
      LEVEL_USERS: '/referrals/level-users',
    },
    // Settings
    SETTINGS: {
      LIST: '/settings',
      BY_KEY: (key: string) => `/settings/${key}`,
    },
    // Deposits
    DEPOSITS: {
      LIST: '/deposits',
      CREATE: '/deposits',
      BY_ID: (id: string) => `/deposits/${id}`,
    },
    // Withdrawals
    WITHDRAWALS: {
      LIST: '/withdrawals',
      CREATE: '/withdrawals',
      BY_ID: (id: string) => `/withdrawals/${id}`,
    },
    // Payment
    PAYMENT: {
      VERIFY: '/payment/verify',
    },
  },
} as const;

export default API_CONFIG;

