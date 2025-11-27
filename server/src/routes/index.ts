import { Router, type IRouter } from 'express';
import userRoutes from '../features/users/routes/user.routes';
import authRoutes from '../features/auth/routes/auth.routes';
import investmentPlanRoutes from '../features/investment-plans/routes/investment-plan.routes';
import investmentRoutes from '../features/investments/routes/investment.routes';
import walletRoutes from '../features/wallet/routes/wallet.routes';
import transactionRoutes from '../features/transactions/routes/transaction.routes';
import incomeRoutes from '../features/income/routes/income.routes';
import incomeTransactionRoutes from '../features/income/routes/income-transaction.routes';
import referralRoutes from '../features/referrals/routes/referral.routes';
import settingRoutes from '../features/settings/routes/setting.routes';
import adminRoutes from '../features/admin/routes/admin.routes';
import depositRoutes from '../features/deposits/routes/deposit.routes';
import withdrawalRoutes from '../features/withdrawals/routes/withdrawal.routes';
import paymentRoutes from '../features/payment/routes/payment.routes';
import telegramWebhookRoutes from '../features/telegram/routes/telegram-webhook.routes';

const router: IRouter = Router();

// Feature routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/investment-plans', investmentPlanRoutes);
router.use('/investments', investmentRoutes);
router.use('/wallet', walletRoutes);
router.use('/transactions', transactionRoutes);
router.use('/income', incomeRoutes);
router.use('/income', incomeTransactionRoutes);
router.use('/referrals', referralRoutes);
router.use('/settings', settingRoutes);
router.use('/admin', adminRoutes);
router.use('/deposits', depositRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/payment', paymentRoutes);
router.use('/telegram', telegramWebhookRoutes);

export default router;

