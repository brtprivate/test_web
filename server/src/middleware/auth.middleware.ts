import { Request, Response, NextFunction } from 'express';
import { authService } from '../features/auth/services/auth.service';
import { User } from '../features/users/models/user.model';
import { logSuspiciousActivity } from './security.middleware';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      logSuspiciousActivity(req, 'Authentication attempt without token');
      res.status(401).json({
        status: 'error',
        message: 'No token provided. Please login first.',
      });
      return;
    }

    // Validate token format (basic check)
    if (token.length < 10 || token.length > 2000) {
      logSuspiciousActivity(req, 'Invalid token format', { tokenLength: token.length });
      res.status(401).json({
        status: 'error',
        message: 'Invalid token format',
      });
      return;
    }

    // Verify token
    let decoded: { id: string; telegramChatId: number };
    try {
      decoded = authService.verifyToken(token) as { id: string; telegramChatId: number };
    } catch (error: any) {
      logSuspiciousActivity(req, 'Token verification failed', { error: error.message });
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Validate decoded token structure
    if (!decoded.id || !decoded.telegramChatId) {
      logSuspiciousActivity(req, 'Invalid token payload structure');
      res.status(401).json({
        status: 'error',
        message: 'Invalid token structure',
      });
      return;
    }

    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(decoded.id)) {
      logSuspiciousActivity(req, 'Invalid user ID format in token', { id: decoded.id });
      res.status(401).json({
        status: 'error',
        message: 'Invalid token data',
      });
      return;
    }

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logSuspiciousActivity(req, 'User not found for valid token', { userId: decoded.id });
      res.status(401).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Verify telegramChatId matches
    if (user.telegramChatId !== decoded.telegramChatId) {
      logSuspiciousActivity(req, 'Token telegramChatId mismatch', {
        tokenChatId: decoded.telegramChatId,
        userChatId: user.telegramChatId,
      });
      res.status(401).json({
        status: 'error',
        message: 'Token validation failed',
      });
      return;
    }

    if (!user.isActive) {
      logSuspiciousActivity(req, 'Inactive user attempted access', { userId: decoded.id });
      res.status(403).json({
        status: 'error',
        message: 'User account is inactive',
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error: any) {
    logSuspiciousActivity(req, 'Authentication error', { error: error.message });
    res.status(401).json({
      status: 'error',
      message: error.message || 'Invalid or expired token',
    });
  }
};








