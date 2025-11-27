import { Router, type IRouter } from 'express';
import { adminManagementController } from '../controllers/admin-management.controller';
import { authenticateAdmin } from '../../../middleware/admin.middleware';
import { walletAdjustmentController } from '../../wallet/controllers/wallet-adjustment.controller';

const router: IRouter = Router();

// All routes require admin authentication (all admins have full access)
router.use(authenticateAdmin);

// Dashboard
router.get('/dashboard', adminManagementController.getDashboardStats.bind(adminManagementController));

// User Management
router.get('/users', adminManagementController.getAllUsers.bind(adminManagementController));
router.get('/users/:id', adminManagementController.getUserById.bind(adminManagementController));
router.patch('/users/:id', adminManagementController.updateUser.bind(adminManagementController));
router.post('/users/:id/login-token', adminManagementController.generateUserLoginToken.bind(adminManagementController));

// Investments
router.get('/investments', adminManagementController.getAllInvestments.bind(adminManagementController));

// Incomes
router.get('/incomes', adminManagementController.getAllIncomes.bind(adminManagementController));
router.post('/cron/daily-rewards', adminManagementController.triggerDailyRewards.bind(adminManagementController));
router.post(
  '/cron/daily-rewards/force',
  adminManagementController.triggerDailyRewardsForce.bind(adminManagementController)
);

// Investment Plans
router.get('/plans', adminManagementController.getAllPlans.bind(adminManagementController));

// Settings Management
router.patch('/settings/:key', adminManagementController.updateSetting.bind(adminManagementController));

// Wallet Adjustments
router.post('/wallet-adjustments', walletAdjustmentController.createAdjustment.bind(walletAdjustmentController));
router.get('/wallet-adjustments', walletAdjustmentController.getAdjustments.bind(walletAdjustmentController));
router.get('/wallet-adjustments/stats', walletAdjustmentController.getAdjustmentStats.bind(walletAdjustmentController));
router.get('/wallet-adjustments/:id', walletAdjustmentController.getAdjustmentById.bind(walletAdjustmentController));
router.get('/users/:userId/wallet-adjustments', walletAdjustmentController.getUserAdjustments.bind(walletAdjustmentController));

export default router;

