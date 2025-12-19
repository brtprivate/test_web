import { Request, Response, NextFunction } from 'express';
import { telegramService } from '../../../services/telegram.service';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    message?: {
      chat: {
        id: number;
      };
    };
    data?: string;
  };
}

export class TelegramWebhookController {
  /**
   * Webhook endpoint to receive Telegram updates
   * Extracts user details from Telegram messages
   */
  async handleWebhook(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const update: TelegramUpdate = req.body;

      // Extract user details from message
      let userDetails: {
        chatId: number | null;
        userId: number | null;
        firstName: string | null;
        lastName: string | null;
        username: string | null;
        isBot: boolean | null;
        messageText: string | null;
        messageId: number | null;
        chatType: string | null;
      } = {
        chatId: null,
        userId: null,
        firstName: null,
        lastName: null,
        username: null,
        isBot: null,
        messageText: null,
        messageId: null,
        chatType: null,
      };

      // Handle regular message
      if (update.message) {
        const message = update.message;
        const from = message.from;
        const chat = message.chat;

        userDetails = {
          chatId: chat.id,
          userId: from?.id || null,
          firstName: from?.first_name || chat.first_name || null,
          lastName: from?.last_name || chat.last_name || null,
          username: from?.username || chat.username || null,
          isBot: from?.is_bot || false,
          messageText: message.text || null,
          messageId: message.message_id,
          chatType: chat.type,
        };
      }
      // Handle callback query (button clicks)
      else if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const from = callbackQuery.from;
        const chat = callbackQuery.message?.chat;

        userDetails = {
          chatId: chat?.id || null,
          userId: from.id,
          firstName: from.first_name,
          lastName: from.last_name || null,
          username: from.username || null,
          isBot: from.is_bot,
          messageText: callbackQuery.data || null,
          messageId: null,
          chatType: (chat as any)?.type || null,
        };
      }

      // Log received update
      console.log('📥 Telegram Webhook Received:');
      console.log('   Update ID:', update.update_id);
      console.log('   User Details:', userDetails);

      // Process update through bot handlers if bot is initialized
      // This handles messages, callback queries, and other update types
      if (telegramService.getBot() && (update.message || update.callback_query)) {
        try {
          const bot = telegramService.getBot();
          if (bot) {
            // Process update through bot handlers (handles all update types)
            bot.processUpdate(update as any);
          }
        } catch (error: any) {
          console.warn('Could not process update through bot handlers:', error.message);
        }
      }

      // Always respond with 200 OK to Telegram (Telegram requires quick response)
      res.status(200).json({
        status: 'success',
        message: 'Webhook received',
        data: {
          updateId: update.update_id,
          userDetails: userDetails,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('❌ Error processing Telegram webhook:', error);
      // Still return 200 to Telegram to avoid retries
      res.status(200).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  /**
   * Get webhook info (for testing)
   */
  async getWebhookInfo(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        status: 'success',
        message: 'Telegram webhook endpoint is active',
        endpoint: '/api/telegram/webhook',
        method: 'POST',
        description: 'This endpoint receives Telegram updates and extracts user details',
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Set webhook URL in Telegram
   */
  async setWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = req.body;
      const bot = telegramService.getBot();
      
      if (!bot) {
        res.status(400).json({
          status: 'error',
          message: 'Telegram bot is not initialized',
        });
        return;
      }

      if (!url) {
        res.status(400).json({
          status: 'error',
          message: 'Webhook URL is required',
        });
        return;
      }

      // Set webhook using Telegram Bot API
      await bot.setWebHook(url);
      
      res.status(200).json({
        status: 'success',
        message: 'Webhook URL set successfully',
        data: {
          url,
          info: await bot.getWebHookInfo(),
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get current webhook info from Telegram
   */
  async getTelegramWebhookInfo(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bot = telegramService.getBot();
      
      if (!bot) {
        res.status(400).json({
          status: 'error',
          message: 'Telegram bot is not initialized',
        });
        return;
      }

      const webhookInfo = await bot.getWebHookInfo();
      
      res.status(200).json({
        status: 'success',
        data: {
          webhookInfo,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Delete webhook from Telegram
   */
  async deleteWebhook(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bot = telegramService.getBot();
      
      if (!bot) {
        res.status(400).json({
          status: 'error',
          message: 'Telegram bot is not initialized',
        });
        return;
      }

      await bot.deleteWebHook();
      
      res.status(200).json({
        status: 'success',
        message: 'Webhook deleted successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const telegramWebhookController = new TelegramWebhookController();

