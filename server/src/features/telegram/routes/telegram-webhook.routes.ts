import { Router, type IRouter } from 'express';
import { telegramWebhookController } from '../controllers/telegram-webhook.controller';
import { authenticateAdmin } from '../../../middleware/admin.middleware';

const router: IRouter = Router();

// Telegram webhook routes
// Note: Webhook endpoint should not require authentication as Telegram sends updates directly
router.post('/webhook', telegramWebhookController.handleWebhook.bind(telegramWebhookController));
router.get('/webhook', telegramWebhookController.getWebhookInfo.bind(telegramWebhookController));

// Webhook management routes (admin only)
router.post('/set-webhook', authenticateAdmin, telegramWebhookController.setWebhook.bind(telegramWebhookController));
router.get('/webhook-info', authenticateAdmin, telegramWebhookController.getTelegramWebhookInfo.bind(telegramWebhookController));
router.delete('/webhook', authenticateAdmin, telegramWebhookController.deleteWebhook.bind(telegramWebhookController));

export default router;

