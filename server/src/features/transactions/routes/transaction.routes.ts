import { Router, type IRouter } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { authenticate } from '../../../middleware/auth.middleware';

const router: IRouter = Router();

// Transaction routes
router.get('/my', authenticate, transactionController.getMyTransactions.bind(transactionController));
router.get('/:id', authenticate, transactionController.getTransactionById.bind(transactionController));

export default router;








