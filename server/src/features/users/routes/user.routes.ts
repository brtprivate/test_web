import { Router, type IRouter } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../../../middleware/auth.middleware';

const router: IRouter = Router();

// User routes
router.post('/', userController.createUser.bind(userController));
router.get('/', userController.getAllUsers.bind(userController));

// Profile routes (must come before /:id route to avoid matching "profile" as an ID)
router.get('/profile', authenticate, userController.getProfile.bind(userController));
router.put('/profile', authenticate, userController.updateProfile.bind(userController));

// Routes with ID parameter (must come after specific routes like /profile)
router.get('/:id', userController.getUserById.bind(userController));
router.patch('/:id', userController.updateUser.bind(userController));
router.delete('/:id', userController.deleteUser.bind(userController));

export default router;




