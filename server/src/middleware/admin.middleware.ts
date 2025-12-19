import { Request, Response, NextFunction } from 'express';
import { adminService } from '../features/admin/services/admin.service';
import { logSuspiciousActivity } from './security.middleware';

export interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: 'admin';
  };
}

/**
 * Middleware to authenticate admin with enhanced security
 */
export const authenticateAdmin = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      logSuspiciousActivity(req, 'Admin authentication attempt without token');
      res.status(401).json({
        status: 'error',
        message: 'No token provided. Please login first.',
      });
      return;
    }

    // Validate token format (basic check)
    if (token.length < 10 || token.length > 2000) {
      logSuspiciousActivity(req, 'Invalid admin token format', { tokenLength: token.length });
      res.status(401).json({
        status: 'error',
        message: 'Invalid token format',
      });
      return;
    }

    // Verify token
    let decoded: {
      id: string;
      email: string;
      role: 'admin';
    };
    
    try {
      decoded = adminService.verifyToken(token) as {
        id: string;
        email: string;
        role: 'admin';
      };
    } catch (error: any) {
      logSuspiciousActivity(req, 'Admin token verification failed', { error: error.message });
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Validate decoded token structure
    if (!decoded.id || !decoded.email || decoded.role !== 'admin') {
      logSuspiciousActivity(req, 'Invalid admin token payload structure');
      res.status(401).json({
        status: 'error',
        message: 'Invalid token structure',
      });
      return;
    }

    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(decoded.id)) {
      logSuspiciousActivity(req, 'Invalid admin ID format in token', { id: decoded.id });
      res.status(401).json({
        status: 'error',
        message: 'Invalid token data',
      });
      return;
    }

    // Get admin from database
    const admin = await adminService.getAdminById(decoded.id);

    if (!admin) {
      logSuspiciousActivity(req, 'Admin not found for valid token', { adminId: decoded.id });
      res.status(401).json({
        status: 'error',
        message: 'Admin not found',
      });
      return;
    }

    // Verify email matches
    if (admin.email !== decoded.email) {
      logSuspiciousActivity(req, 'Admin token email mismatch', {
        tokenEmail: decoded.email,
        adminEmail: admin.email,
      });
      res.status(401).json({
        status: 'error',
        message: 'Token validation failed',
      });
      return;
    }

    if (!admin.isActive) {
      logSuspiciousActivity(req, 'Inactive admin attempted access', { adminId: decoded.id });
      res.status(403).json({
        status: 'error',
        message: 'Admin account is inactive',
      });
      return;
    }

    // Attach admin to request
    req.admin = {
      id: String(admin._id),
      email: admin.email,
      role: 'admin',
    };

    next();
  } catch (error: any) {
    logSuspiciousActivity(req, 'Admin authentication error', { error: error.message });
    res.status(401).json({
      status: 'error',
      message: error.message || 'Invalid or expired token',
    });
  }
};


