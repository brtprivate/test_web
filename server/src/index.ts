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

// Load environment variables
dotenv.config();

const app: express.Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const HOST: string = process.env.HOST || '0.0.0.0';

// Middleware
// CORS - Must be before helmet and other middleware
// Allow every domain by default (including credentialed requests)
const allowCredentials = process.env.CORS_CREDENTIALS !== 'false';

const corsOptions: cors.CorsOptions = {
  // Returning true echoes back the request origin, which works with credentials
  origin: true,
  credentials: allowCredentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Handle manual preflight responses for any non-standard routes
app.options('*', cors(corsOptions));

// Configure helmet to allow cross-origin requests
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

