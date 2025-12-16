import { Router, type IRouter } from 'express';
import { depositController } from '../controllers/deposit.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authenticateAdmin } from '../../../middleware/admin.middleware';
import { adminRateLimiter, generalRateLimiter } from '../../../middleware/security.middleware';
import { validateDeposit, validateMongoIdParam } from '../../../middleware/validation.middleware';

const router: IRouter = Router();

// User routes (require authentication with rate limiting)
router.post('/', generalRateLimiter, authenticate, validateDeposit, depositController.createDeposit.bind(depositController));
router.get('/', generalRateLimiter, authenticate, depositController.getUserDeposits.bind(depositController));
router.get('/:id', generalRateLimiter, authenticate, ...validateMongoIdParam('id'), depositController.getDepositById.bind(depositController));

// Admin routes (require admin authentication with stricter rate limiting)
router.get('/admin/all', adminRateLimiter, authenticateAdmin, depositController.getAllDeposits.bind(depositController));
router.get('/admin/pending-count', adminRateLimiter, authenticateAdmin, depositController.getPendingDepositsCount.bind(depositController));
router.patch('/admin/:id/status', adminRateLimiter, authenticateAdmin, ...validateMongoIdParam('id'), depositController.updateDepositStatus.bind(depositController));

export default router;

