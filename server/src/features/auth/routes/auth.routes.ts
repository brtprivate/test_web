import { Router, type IRouter, Request, Response, NextFunction } from 'express';
import { authController } from '../controllers/auth.controller';
import { authRateLimiter } from '../../../middleware/security.middleware';
import { validateUserLogin, validateUserSignup } from '../../../middleware/validation.middleware';

const router: IRouter = Router();

// Auth routes with strict rate limiting and validation
router.post('/signup', authRateLimiter, validateUserSignup, (req: Request, res: Response, next: NextFunction) => {
  console.log('📝 [AUTH ROUTE] POST /signup hit');
  authController.signup(req, res, next);
});

router.post('/login', authRateLimiter, validateUserLogin, (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 [AUTH ROUTE] POST /login hit');
  authController.login(req, res, next);
});

router.get('/verify', authRateLimiter, (req: Request, res: Response, next: NextFunction) => {
  console.log('✅ [AUTH ROUTE] GET /verify hit');
  authController.verifyToken(req, res, next);
});

export default router;

