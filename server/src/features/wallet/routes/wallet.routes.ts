import { Router, type IRouter } from 'express';
import { walletController } from '../controllers/wallet.controller';
import { authenticate } from '../../../middleware/auth.middleware';

const router: IRouter = Router();

// Wallet routes
router.get('/balances', authenticate, walletController.getBalances.bind(walletController));
router.post('/transfer-to-investment', authenticate, walletController.transferToInvestment.bind(walletController));
router.post('/withdraw', authenticate, walletController.withdraw.bind(walletController));
router.post('/monitor', authenticate, walletController.monitorWallet.bind(walletController));

export default router;

