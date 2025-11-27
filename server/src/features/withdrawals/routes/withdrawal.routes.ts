import { Router, type IRouter } from 'express';
import { withdrawalController } from '../controllers/withdrawal.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authenticateAdmin } from '../../../middleware/admin.middleware';

const router: IRouter = Router();

// User routes (require authentication)
router.post('/', authenticate, withdrawalController.createWithdrawal.bind(withdrawalController));
router.get('/', authenticate, withdrawalController.getUserWithdrawals.bind(withdrawalController));
router.get('/:id', authenticate, withdrawalController.getWithdrawalById.bind(withdrawalController));

// Admin routes (require admin authentication)
router.get('/admin/all', authenticateAdmin, withdrawalController.getAllWithdrawals.bind(withdrawalController));
router.get('/admin/pending-count', authenticateAdmin, withdrawalController.getPendingWithdrawalsCount.bind(withdrawalController));
router.patch('/admin/:id/status', authenticateAdmin, withdrawalController.updateWithdrawalStatus.bind(withdrawalController));

export default router;



