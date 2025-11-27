import { Router, type IRouter } from 'express';
import { depositController } from '../controllers/deposit.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { authenticateAdmin } from '../../../middleware/admin.middleware';

const router: IRouter = Router();

// User routes (require authentication)
router.post('/', authenticate, depositController.createDeposit.bind(depositController));
router.get('/', authenticate, depositController.getUserDeposits.bind(depositController));
router.get('/:id', authenticate, depositController.getDepositById.bind(depositController));

// Admin routes (require admin authentication)
router.get('/admin/all', authenticateAdmin, depositController.getAllDeposits.bind(depositController));
router.get('/admin/pending-count', authenticateAdmin, depositController.getPendingDepositsCount.bind(depositController));
router.patch('/admin/:id/status', authenticateAdmin, depositController.updateDepositStatus.bind(depositController));

export default router;

