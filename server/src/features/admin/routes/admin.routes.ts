import { Router, type IRouter } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticateAdmin } from '../../../middleware/admin.middleware';
import adminManagementRoutes from './admin-management.routes';

const router: IRouter = Router();

// Public routes
router.post('/login', adminController.login.bind(adminController));

// Protected routes (require admin authentication - all admins have full access)
router.get('/profile', authenticateAdmin, adminController.getMyProfile.bind(adminController));
router.patch('/change-password', authenticateAdmin, adminController.changePassword.bind(adminController));
router.post('/signup', authenticateAdmin, adminController.signup.bind(adminController));
router.get('/', authenticateAdmin, adminController.getAllAdmins.bind(adminController));
router.patch('/:id', authenticateAdmin, adminController.updateAdmin.bind(adminController));

// Admin Management routes (dashboard, users, plans, settings)
router.use('/manage', adminManagementRoutes);

export default router;

