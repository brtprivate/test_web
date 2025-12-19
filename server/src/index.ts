import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import apiRoutes from './routes';
import { telegramService } from './services/telegram.service';
import { cronService } from './services/cron.service';
import { investmentPlanService } from './features/investment-plans/services/investment-plan.service';
import { settingService } from './features/settings/services/setting.service';
import { adminInitService } from './services/admin-init.service';
import { initializeWalletMonitor } from './services/wallet-monitor.service';
import { env } from './config/env';

// Security middleware imports
import {
  ipBlockingMiddleware,
  userAgentValidationMiddleware,
  pathValidationMiddleware,
  requestSizeLimit,
  generalRateLimiter,
  speedLimiter,
  mongoSanitizeMiddleware,
  securityHeadersMiddleware,
  securityLoggingMiddleware,
} from './middleware/security.middleware';

// Load environment variables
dotenv.config();

const app: express.Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const HOST: string = process.env.HOST || '0.0.0.0';

// ============================================
// SECURITY MIDDLEWARE (Applied in order)
// ============================================

// 0. CORS - Must be FIRST to handle preflight requests
// Allow every domain by default (including credentialed requests)
const allowCredentials = process.env.CORS_CREDENTIALS !== 'false';

const corsOptions: cors.CorsOptions = {
  // Explicitly allow all origins
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    // Allow all origins
    callback(null, true);
  },
  credentials: allowCredentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Handle manual preflight responses for any non-standard routes
app.options('*', cors(corsOptions));

// 1. IP Blocking - Block known malicious IPs
app.use(ipBlockingMiddleware);

// 2. Security Headers - Add security headers to all responses
app.use(securityHeadersMiddleware);

// 3. Request Size Limit - Prevent large payload attacks
app.use(requestSizeLimit('10mb'));

// 4. Path Validation - Block access to suspicious paths
app.use(pathValidationMiddleware);

// 5. User Agent Validation - Block suspicious user agents
app.use(userAgentValidationMiddleware);

// 6. Security Logging - Log all requests for monitoring
app.use(securityLoggingMiddleware);

// 8. Configure helmet with enhanced security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// 9. Request logging
app.use(morgan('dev'));

// 10. Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 11. MongoDB injection protection
app.use(mongoSanitizeMiddleware);

// 12. Speed limiter - Slow down repeated requests
app.use(speedLimiter);

// 13. General rate limiter - Apply to all routes
app.use(generalRateLimiter);

// Health check route
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Initialize admin (if no admin exists)
    try {
      await adminInitService.initializeAdmin();
    } catch (error: any) {
      console.warn('⚠️ Failed to initialize admin:', error.message);
    }

    // Initialize default settings
    try {
      await settingService.initializeDefaultSettings();
      console.log('✅ Default settings initialized');
    } catch (error: any) {
      console.warn('⚠️ Failed to initialize settings:', error.message);
    }

    // Initialize default investment plans
    try {
      await investmentPlanService.initializeDefaultPlans();
      console.log('✅ Default investment plans initialized');
    } catch (error: any) {
      console.warn('⚠️ Failed to initialize investment plans:', error.message);
    }

    // Initialize Telegram Bot (if token is provided and valid)
    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        telegramService.initialize();
        
        // Set webhook URL if configured (webhook mode)
        if (env.TELEGRAM_WEBHOOK_URL && env.TELEGRAM_WEBHOOK_URL.trim() !== '' && !env.TELEGRAM_POLLING) {
          try {
            await telegramService.setWebhook(env.TELEGRAM_WEBHOOK_URL);
            const webhookInfo = await telegramService.getWebhookInfo();
            console.log('📡 Webhook configuration:', webhookInfo);
          } catch (webhookError: any) {
            console.warn('⚠️ Failed to set webhook URL:', webhookError.message);
            console.warn('   Bot will still work if webhook is set manually');
          }
        }
      } catch (error: any) {
        console.warn('⚠️ Telegram Bot initialization failed:', error.message);
        console.warn('   Server will continue without Telegram Bot');
        // Stop polling if it was started but failed
        try {
          telegramService.stopPolling();
        } catch (stopError) {
          // Ignore stop errors
        }
      }
    } else {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN not set. Telegram Bot will not be initialized.');
    }

    // Initialize wallet monitor (if enabled)
    if (env.ENABLE_WALLET_MONITOR && env.OWN_PAY_ADDRESS && env.OWN_PAY_GAS_ADDRESS && env.OWN_PAY_GAS_PRIVATE_KEY) {
      try {
        initializeWalletMonitor(
          env.OWN_PAY_ADDRESS,
          env.OWN_PAY_GAS_ADDRESS,
          env.OWN_PAY_GAS_PRIVATE_KEY
        );
        console.log('✅ Wallet monitor initialized (manual trigger only)');
      } catch (error: any) {
        console.warn('⚠️ Failed to initialize wallet monitor:', error.message);
      }
    } else {
      console.log('⚠️ Wallet monitor not configured (check env variables)');
    }

    // Start daily reward cron job (runs at 12 AM daily)
    // This processes Daily ROI and Level ROI rewards
    cronService.startDailyRewardJob();

    // Optional: Also start the old daily ROI job if needed for testing
    // cronService.startDailyROIJob();
    
    // Start listening
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: ${process.env.API_URL || `http://${HOST}:${PORT}/api`}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

