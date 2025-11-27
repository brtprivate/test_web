import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { AdminSignupDto, AdminLoginDto } from '../types/admin.types';
import { AdminAuthRequest } from '../../../middleware/admin.middleware';

export class AdminController {
  async signup(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Any admin can create other admins
      const adminData: AdminSignupDto = req.body;
      const admin = await adminService.signup(adminData);

      res.status(201).json({
        status: 'success',
        data: {
          admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData: AdminLoginDto = req.body;

      if (!loginData.email || !loginData.password) {
        res.status(400).json({
          status: 'error',
          message: 'Email and password are required',
        });
        return;
      }

      const admin = await adminService.login(loginData);

      if (!admin) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password',
        });
        return;
      }

      // Generate token
      const token = adminService.generateToken(admin);

      res.status(200).json({
        status: 'success',
        data: {
          admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive,
            lastLogin: admin.lastLogin,
          },
          token,
        },
      });
    } catch (error: any) {
      if (error.message.includes('inactive')) {
        res.status(403).json({
          status: 'error',
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

  async getMyProfile(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.admin?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Admin not authenticated',
        });
        return;
      }

      const admin = await adminService.getAdminById(adminId);

      if (!admin) {
        res.status(404).json({
          status: 'error',
          message: 'Admin not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: {
          admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive,
            lastLogin: admin.lastLogin,
            createdAt: admin.createdAt,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAllAdmins(_req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const admins = await adminService.getAllAdmins();

      res.status(200).json({
        status: 'success',
        results: admins.length,
        data: { admins },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const admin = await adminService.updateAdmin(id, updateData);

      if (!admin) {
        res.status(404).json({
          status: 'error',
          message: 'Admin not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { admin },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async changePassword(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.admin?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Admin not authenticated',
        });
        return;
      }

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        res.status(400).json({
          status: 'error',
          message: 'Old password and new password are required',
        });
        return;
      }

      await adminService.changePassword(adminId, oldPassword, newPassword);

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      if (error.message.includes('Invalid old password')) {
        res.status(400).json({
          status: 'error',
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }
}

export const adminController = new AdminController();

