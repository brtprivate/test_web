import dotenv from 'dotenv';

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
  return value;
};

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || '0.0.0.0',
  
  // Database
  MONGODB_URI: requireEnv('MONGODB_URI'),
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  
  // Telegram Bot
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL || '',
  TELEGRAM_POLLING: process.env.TELEGRAM_POLLING !== 'false',
  
  // App URL
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  API_URL: process.env.API_URL || process.env.APP_URL || 'http://localhost:3000/api',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',
  
  // Security
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  TRUST_PROXY: process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'dev',
  FILE_LOGGING: process.env.FILE_LOGGING === 'true',
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs/app.log',
  
  // Cron Jobs
  CRON_DAILY_ROI_INTERVAL: parseInt(process.env.CRON_DAILY_ROI_INTERVAL || '86400000', 10), // 24 hours
  CRON_ENABLED: process.env.CRON_ENABLED !== 'false',
  INVESTMENT_MAX_ACTIVE_DAYS: parseInt(process.env.INVESTMENT_MAX_ACTIVE_DAYS || '20', 10),
  
  // Payment/Withdrawal
  MIN_WITHDRAWAL_AMOUNT: parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || '10'),
  MAX_WITHDRAWAL_AMOUNT: parseFloat(process.env.MAX_WITHDRAWAL_AMOUNT || '10000'),
  WITHDRAWAL_FEE_PERCENTAGE: parseFloat(process.env.WITHDRAWAL_FEE_PERCENTAGE || '2'),
  USDT_NETWORK: process.env.USDT_NETWORK || 'TRC20',
  
  // Email (Optional)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@aicryptobot.com',
  
  // Redis (Optional)
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  
  // Admin
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@aicryptobot.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin123!',
  
  // Feature Flags
  ENABLE_TELEGRAM_BOT: process.env.ENABLE_TELEGRAM_BOT !== 'false',
  ENABLE_DAILY_ROI: process.env.ENABLE_DAILY_ROI !== 'false',
  ENABLE_AUTO_INVEST_BONUS: process.env.ENABLE_AUTO_INVEST_BONUS !== 'false',
  ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
  ENABLE_SMS_NOTIFICATIONS: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
  
  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  GA_TRACKING_ID: process.env.GA_TRACKING_ID || '',
  
  // Development
  DEBUG: process.env.DEBUG === 'true',
  VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === 'true',

  // Wallet Monitor (BSC/BEP20)
  BSC_RPC_URL: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
  USDT_RECEIVE_WALLET: process.env.USDT_RECEIVE_WALLET || '',
  GAS_WALLET: process.env.GAS_WALLET || '',
  GAS_PRIVATE_KEY: process.env.GAS_PRIVATE_KEY || '',
  ENABLE_WALLET_MONITOR: process.env.ENABLE_WALLET_MONITOR === 'true',
  
  // Own Pay Wallet Configuration
  OWN_PAY_ADDRESS: process.env.OWN_PAY_ADDRESS || '',
  OWN_PAY_GAS_ADDRESS: process.env.OWN_PAY_GAS_ADDRESS || '',
  OWN_PAY_GAS_PRIVATE_KEY: process.env.OWN_PAY_GAS_PRIVATE_KEY || '',

  // Wallet Monitor Thresholds
  WALLET_MONITOR_MIN_USDT: parseFloat(process.env.WALLET_MONITOR_MIN_USDT || '0.00001'),
  WALLET_MONITOR_MIN_BNB: parseFloat(process.env.WALLET_MONITOR_MIN_BNB || '0.001'),
  GAS_TOPUP_AMOUNT_BNB: parseFloat(process.env.GAS_TOPUP_AMOUNT_BNB || '0.0015'),
};

