import { Router, type IRouter } from 'express';
import { walletController } from '../controllers/wallet.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { generalRateLimiter } from '../../../middleware/security.middleware';
import { commonValidations, handleValidationErrors } from '../../../middleware/validation.middleware';

const router: IRouter = Router();

// Wallet routes (all require authentication with rate limiting)
router.get('/balances', generalRateLimiter, authenticate, walletController.getBalances.bind(walletController));
router.post('/transfer-to-investment', generalRateLimiter, authenticate, commonValidations.positiveNumber('amount'), handleValidationErrors, walletController.transferToInvestment.bind(walletController));
router.post('/withdraw', generalRateLimiter, authenticate, commonValidations.positiveNumber('amount'), handleValidationErrors, walletController.withdraw.bind(walletController));
router.post('/monitor', generalRateLimiter, authenticate, walletController.monitorWallet.bind(walletController));

export default router;

