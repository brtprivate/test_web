import { Router, type IRouter } from 'express';
import { withdrawalController } from '../controllers/withdrawal.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authenticateAdmin } from '../../../middleware/admin.middleware';
import { adminRateLimiter, generalRateLimiter } from '../../../middleware/security.middleware';
import { validateWithdrawal, validateMongoIdParam } from '../../../middleware/validation.middleware';

const router: IRouter = Router();

// User routes (require authentication with rate limiting)
router.post('/', generalRateLimiter, authenticate, validateWithdrawal, withdrawalController.createWithdrawal.bind(withdrawalController));
router.get('/', generalRateLimiter, authenticate, withdrawalController.getUserWithdrawals.bind(withdrawalController));
router.get('/:id', generalRateLimiter, authenticate, ...validateMongoIdParam('id'), withdrawalController.getWithdrawalById.bind(withdrawalController));

// Admin routes (require admin authentication with stricter rate limiting)
router.get('/admin/all', adminRateLimiter, authenticateAdmin, withdrawalController.getAllWithdrawals.bind(withdrawalController));
router.get('/admin/pending-count', adminRateLimiter, authenticateAdmin, withdrawalController.getPendingWithdrawalsCount.bind(withdrawalController));
router.patch('/admin/:id/status', adminRateLimiter, authenticateAdmin, ...validateMongoIdParam('id'), withdrawalController.updateWithdrawalStatus.bind(withdrawalController));

export default router;



