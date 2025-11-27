/**
 * Centralized API configuration for the admin application.
 * Reads the API base URL from environment variables and exposes
 * low-level endpoint segments so features stay consistent.
 */

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      'http://localhost:5000/api'
    );
  }

  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.info('🌐 Admin API Base URL:', getApiBaseUrl());
}

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/admin/login',
      PROFILE: '/admin/profile',
      CHANGE_PASSWORD: '/admin/change-password',
      ADMINS: '/admin',
    },
    DASHBOARD: {
      STATS: '/admin/manage/dashboard',
    },
    MANAGEMENT: {
      USERS: '/admin/manage/users',
      USER_BY_ID: (id: string) => `/admin/manage/users/${id}`,
      USER_LOGIN_TOKEN: (id: string) => `/admin/manage/users/${id}/login-token`,
      PLANS: '/admin/manage/plans',
      SETTINGS: (key?: string) =>
        key ? `/admin/manage/settings/${key}` : '/admin/manage/settings',
    },
    SETTINGS: {
      ROOT: '/settings',
      BY_KEY: (key: string) => `/settings/${key}`,
      BY_CATEGORY: (category: string) => `/settings/category/${category}`,
    },
    CRON: {
      TRIGGER_DAILY_REWARDS: '/admin/manage/cron/daily-rewards',
      TRIGGER_DAILY_REWARDS_FORCE: '/admin/manage/cron/daily-rewards/force',
    },
    INVESTMENT_PLANS: {
      ROOT: '/investment-plans',
      BY_ID: (id: string) => `/investment-plans/${id}`,
    },
    DEPOSITS: {
      ALL: '/deposits/admin/all',
      UPDATE_STATUS: (id: string) => `/deposits/admin/${id}/status`,
      PENDING_COUNT: '/deposits/admin/pending-count',
    },
    WITHDRAWALS: {
      ALL: '/withdrawals/admin/all',
      UPDATE_STATUS: (id: string) => `/withdrawals/admin/${id}/status`,
      PENDING_COUNT: '/withdrawals/admin/pending-count',
    },
    INVESTMENTS: {
      ALL: '/admin/manage/investments',
      BY_ID: (id: string) => `/admin/manage/investments/${id}`,
    },
    INCOMES: {
      ALL: '/admin/manage/incomes',
    },
    PAYMENT: {
      PROCESS_WITHDRAWAL: '/payment/process-withdrawal',
    },
    WALLET_ADJUSTMENTS: {
      ROOT: '/admin/manage/wallet-adjustments',
      BY_ID: (id: string) => `/admin/manage/wallet-adjustments/${id}`,
      STATS: '/admin/manage/wallet-adjustments/stats',
      USER_ADJUSTMENTS: (userId: string) => `/admin/manage/users/${userId}/wallet-adjustments`,
    },
    TELEGRAM: {
      WEBHOOK: '/telegram/webhook',
      WEBHOOK_INFO: '/telegram/webhook-info',
      SET_WEBHOOK: '/telegram/set-webhook',
    },
  },
} as const;

export const buildApiUrl = (path: string): string => `${API_CONFIG.BASE_URL}${path}`;

export type ApiEndpointKey = keyof typeof API_CONFIG.ENDPOINTS;


