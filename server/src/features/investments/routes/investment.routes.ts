import { Router, type IRouter } from 'express';
import { investmentController } from '../controllers/investment.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { generalRateLimiter } from '../../../middleware/security.middleware';
import { validateInvestment, validateMongoIdParam } from '../../../middleware/validation.middleware';

const router: IRouter = Router();

// Investment routes (all require authentication with rate limiting)
router.post('/', generalRateLimiter, authenticate, validateInvestment, investmentController.createInvestment.bind(investmentController));
router.get('/my', generalRateLimiter, authenticate, investmentController.getMyInvestments.bind(investmentController));
router.get('/:id', generalRateLimiter, ...validateMongoIdParam('id'), investmentController.getInvestmentById.bind(investmentController));

export default router;








