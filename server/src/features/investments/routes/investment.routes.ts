import { Router, type IRouter } from 'express';
import { investmentController } from '../controllers/investment.controller';
import { authenticate } from '../../../middleware/auth.middleware';

const router: IRouter = Router();

// Investment routes (all require authentication)
router.post('/', authenticate, investmentController.createInvestment.bind(investmentController));
router.get('/my', authenticate, investmentController.getMyInvestments.bind(investmentController));
router.get('/:id', investmentController.getInvestmentById.bind(investmentController));

export default router;








