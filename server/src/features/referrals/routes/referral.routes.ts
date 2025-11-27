import { Router, type IRouter } from 'express';
import { referralController } from '../controllers/referral.controller';
import { authenticate } from '../../../middleware/auth.middleware';

const router: IRouter = Router();

// Referral routes
router.get('/code', authenticate, referralController.getMyReferralCode.bind(referralController));
router.get('/stats', authenticate, referralController.getReferralStats.bind(referralController));
router.get('/level-wise', authenticate, referralController.getLevelWiseStats.bind(referralController));
router.get('/level-users', authenticate, referralController.getLevelUsers.bind(referralController));
router.get('/my-referrals', authenticate, referralController.getMyReferrals.bind(referralController));
router.get('/team', authenticate, referralController.getTeamStructure.bind(referralController));
router.get('/', authenticate, referralController.getReferrals.bind(referralController));

export default router;






