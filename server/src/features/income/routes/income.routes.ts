import { Router, type IRouter } from 'express';
import { incomeController } from '../controllers/income.controller';
import { authenticate } from '../../../middleware/auth.middleware';

const router: IRouter = Router();

// Income routes
router.get('/my', authenticate, incomeController.getMyIncome.bind(incomeController));

export default router;








