import { Router, type IRouter } from 'express';
import { settingController } from '../controllers/setting.controller';
import { authenticateAdmin } from '../../../middleware/admin.middleware';

const router: IRouter = Router();

// All settings routes require admin authentication (all admins have full access)
router.use(authenticateAdmin);

// Setting routes
router.post('/', settingController.createSetting.bind(settingController));
router.get('/', settingController.getAllSettings.bind(settingController));
router.get('/category/:category', settingController.getSettingsByCategory.bind(settingController));
router.get('/initialize', settingController.initializeSettings.bind(settingController));
router.get('/:key', settingController.getSetting.bind(settingController));
router.patch('/:key', settingController.updateSetting.bind(settingController));

export default router;

