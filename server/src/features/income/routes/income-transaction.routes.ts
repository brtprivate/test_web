import { Router, type IRouter } from 'express';
import { incomeTransactionController } from '../controllers/income-transaction.controller';
import { authenticate } from '../../../middleware/auth.middleware';

const router: IRouter = Router();

// Income Transaction routes
router.get('/transactions', authenticate, incomeTransactionController.getMyIncomeTransactions.bind(incomeTransactionController));
router.get('/summary', authenticate, incomeTransactionController.getIncomeSummary.bind(incomeTransactionController));
router.get('/daily', authenticate, incomeTransactionController.getDailyIncome.bind(incomeTransactionController));
router.get('/type/:type', authenticate, incomeTransactionController.getIncomeByType.bind(incomeTransactionController));

export default router;








