import { Request, Response, NextFunction } from 'express';
import { adminService } from '../features/admin/services/admin.service';

export interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: 'admin';
  };
}

/**
 * Middleware to authenticate admin
 */
export const authenticateAdmin = async (
  req: AdminAuthRequest,
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
    const decoded = adminService.verifyToken(token) as {
      id: string;
      email: string;
      role: 'admin';
    };

    // Get admin from database
    const admin = await adminService.getAdminById(decoded.id);

    if (!admin) {
      res.status(401).json({
        status: 'error',
        message: 'Admin not found',
      });
      return;
    }

    if (!admin.isActive) {
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
    res.status(401).json({
      status: 'error',
      message: error.message || 'Invalid or expired token',
    });
  }
};


