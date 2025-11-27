import { Router, type IRouter } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authenticateAdmin } from '../../../middleware/admin.middleware';

const router: IRouter = Router();

// User routes (require authentication)
router.post('/generate-wallet', authenticate, paymentController.generateNewWallet.bind(paymentController));
router.post('/save-wallet', authenticate, paymentController.saveWallet.bind(paymentController));
router.post('/monitor', authenticate, paymentController.startMonitoring.bind(paymentController));
router.post('/withdraw', authenticate, paymentController.requestWithdrawal.bind(paymentController));

// Admin routes (require admin authentication)
router.post('/process-withdrawal', authenticateAdmin, paymentController.processWithdrawal.bind(paymentController));

export default router;

