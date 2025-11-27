import { Router, type IRouter } from 'express';
import { authController } from '../controllers/auth.controller';

const router: IRouter = Router();

// Auth routes with logging middleware
router.post('/signup', (req, res, next) => {
  console.log('📝 [AUTH ROUTE] POST /signup hit');
  authController.signup(req, res, next);
});

router.post('/login', (req, res, next) => {
  console.log('🔐 [AUTH ROUTE] POST /login hit');
  authController.login(req, res, next);
});

router.get('/verify', (req, res, next) => {
  console.log('✅ [AUTH ROUTE] GET /verify hit');
  authController.verifyToken(req, res, next);
});

export default router;

