import { Router, type IRouter } from 'express';
import { investmentPlanController } from '../controllers/investment-plan.controller';
import { authenticateAdmin } from '../../../middleware/admin.middleware';

const router: IRouter = Router();

// Public routes (for users to view plans)
router.get('/', investmentPlanController.getAllPlans.bind(investmentPlanController));
router.get('/by-amount', investmentPlanController.getPlanByAmount.bind(investmentPlanController));
router.get('/weekly/status', investmentPlanController.getWeeklyPlanStatus.bind(investmentPlanController));
router.get('/:id', investmentPlanController.getPlanById.bind(investmentPlanController));

// Admin routes (all admins have full access)
router.post('/', authenticateAdmin, investmentPlanController.createPlan.bind(investmentPlanController));
router.get('/initialize', authenticateAdmin, investmentPlanController.initializePlans.bind(investmentPlanController));
router.patch('/:id', authenticateAdmin, investmentPlanController.updatePlan.bind(investmentPlanController));
router.delete('/:id', authenticateAdmin, investmentPlanController.deletePlan.bind(investmentPlanController));

export default router;

