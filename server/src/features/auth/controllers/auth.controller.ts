import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { SignupDto, LoginDto } from '../types/auth.types';

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('📝 [SIGNUP] Request received');
      console.log('📝 [SIGNUP] Request body:', JSON.stringify(req.body, null, 2));

      const signupData: SignupDto = req.body;

      // Validate telegramChatId
      if (!signupData.telegramChatId) {
        console.log('❌ [SIGNUP] Validation failed: Telegram Chat ID is missing');
        res.status(400).json({
          status: 'error',
          message: 'Telegram Chat ID is required',
        });
        return;
      }

      console.log('📝 [SIGNUP] Verifying telegram chat ID format');
      // Verify telegram chat ID format
      const isValid = await authService.verifyTelegramChatId(signupData.telegramChatId);
      if (!isValid) {
        console.log('❌ [SIGNUP] Invalid Telegram Chat ID format');
        res.status(400).json({
          status: 'error',
          message: 'Invalid Telegram Chat ID',
        });
        return;
      }

      console.log('📝 [SIGNUP] Creating user');
      // Create user
      const user = await authService.signup(signupData);
      console.log('✅ [SIGNUP] User created:', user._id);

      console.log('📝 [SIGNUP] Generating token');
      // Generate token
      const token = authService.generateToken(user);
      console.log('✅ [SIGNUP] Token generated');

      console.log('✅ [SIGNUP] Sending success response');
      res.status(201).json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            name: user.name,
            telegramChatId: user.telegramChatId,
            telegramUsername: user.telegramUsername,
            isActive: user.isActive,
          },
          token,
        },
      });
    } catch (error: any) {
      console.error('❌ [SIGNUP] Error occurred:', {
        message: error.message,
        stack: error.stack,
      });
      
      if (error.message.includes('already exists')) {
        console.log('❌ [SIGNUP] User already exists');
        res.status(409).json({
          status: 'error',
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('🔐 [LOGIN] Request received');
      console.log('🔐 [LOGIN] Request body:', JSON.stringify(req.body, null, 2));
      console.log('🔐 [LOGIN] Request headers:', {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'present' : 'missing',
      });

      const loginData: LoginDto = req.body;
      console.log('🔐 [LOGIN] Parsed login data:', {
        telegramChatId: loginData.telegramChatId,
        type: typeof loginData.telegramChatId,
      });

      // Validate telegramChatId
      if (!loginData.telegramChatId) {
        console.log('❌ [LOGIN] Validation failed: Telegram Chat ID is missing');
        res.status(400).json({
          status: 'error',
          message: 'Telegram Chat ID is required',
        });
        return;
      }

      console.log('🔐 [LOGIN] Calling authService.login with:', loginData);
      // Find user
      let user;
      try {
        user = await authService.login(loginData);
      } catch (error: any) {
        // Handle inactive user error
        if (error.message && error.message.includes('inactive')) {
          console.log('❌ [LOGIN] User account is inactive');
          res.status(403).json({
            status: 'error',
            message: 'Your account has been disabled. Please contact support.',
          });
          return;
        }
        // Re-throw other errors
        throw error;
      }

      console.log('🔐 [LOGIN] User lookup result:', user ? {
        id: user._id,
        telegramChatId: user.telegramChatId,
        isActive: user.isActive,
      } : 'null');

      if (!user) {
        console.log('❌ [LOGIN] User not found for telegramChatId:', loginData.telegramChatId);
        res.status(401).json({
          status: 'error',
          message: 'Invalid Telegram Chat ID. Please sign up first.',
        });
        return;
      }

      console.log('🔐 [LOGIN] Generating token for user:', user._id);
      // Generate token
      const token = authService.generateToken(user);
      console.log('✅ [LOGIN] Token generated successfully');

      console.log('✅ [LOGIN] Sending success response');
      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            name: user.name,
            telegramChatId: user.telegramChatId,
            telegramUsername: user.telegramUsername,
            isActive: user.isActive,
          },
          token,
        },
      });
    } catch (error: any) {
      console.error('❌ [LOGIN] Error occurred:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      if (error.message.includes('inactive')) {
        console.log('❌ [LOGIN] User account is inactive');
        res.status(403).json({
          status: 'error',
          message: error.message,
        });
        return;
      }
      console.error('❌ [LOGIN] Unhandled error, passing to error handler');
      next(error);
    }
  }

  async verifyToken(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          status: 'error',
          message: 'No token provided',
        });
        return;
      }

      const decoded = authService.verifyToken(token);

      res.status(200).json({
        status: 'success',
        data: {
          valid: true,
          decoded,
        },
      });
    } catch (error: any) {
      res.status(401).json({
        status: 'error',
        message: error.message,
      });
    }
  }
}

export const authController = new AuthController();

