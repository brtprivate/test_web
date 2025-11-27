import { Request, Response, NextFunction } from 'express';
import { authService } from '../features/auth/services/auth.service';
import { User } from '../features/users/models/user.model';

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
      res.status(401).json({
        status: 'error',
        message: 'No token provided. Please login first.',
      });
      return;
    }

    // Verify token
    const decoded = authService.verifyToken(token) as { id: string; telegramChatId: number };

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    if (!user.isActive) {
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
    res.status(401).json({
      status: 'error',
      message: error.message || 'Invalid or expired token',
    });
  }
};








