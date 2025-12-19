import jwt from 'jsonwebtoken';
import { Admin, IAdmin } from '../models/admin.model';
import { AdminSignupDto, AdminLoginDto } from '../types/admin.types';
import { env } from '../../../config/env';

export class AdminService {
  async signup(data: AdminSignupDto): Promise<IAdmin> {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email: data.email }, { username: data.username }],
    });

    if (existingAdmin) {
      throw new Error('Admin with this email or username already exists');
    }

    // Create new admin (all admins have same role)
    const admin = new Admin({
      username: data.username,
      email: data.email,
      password: data.password,
      role: 'admin',
      isActive: true,
    });

    return await admin.save();
  }

  async login(data: AdminLoginDto): Promise<IAdmin | null> {
    // Normalize email (lowercase and trim) for case-insensitive matching
    const normalizedEmail = data.email.toLowerCase().trim();
    const admin = await Admin.findOne({ email: normalizedEmail }).select('+password');

    if (!admin) {
      return null;
    }

    // Check password
    try {
      const isPasswordValid = await admin.comparePassword(data.password);
      if (!isPasswordValid) {
        return null;
      }
    } catch (error: any) {
      // If password hash is corrupted, throw a more helpful error
      if (error.message.includes('Invalid password hash') || error.message.includes('Invalid salt revision')) {
        throw new Error('Password hash is corrupted. Please contact an administrator to reset your password.');
      }
      throw error;
    }

    if (!admin.isActive) {
      throw new Error('Admin account is inactive');
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    return admin;
  }

  async getAdminById(id: string): Promise<IAdmin | null> {
    return await Admin.findById(id);
  }

  async getAdminByEmail(email: string): Promise<IAdmin | null> {
    return await Admin.findOne({ email: email.toLowerCase().trim() });
  }

  async getAllAdmins(): Promise<IAdmin[]> {
    return await Admin.find().select('-password').sort({ createdAt: -1 });
  }

  async updateAdmin(id: string, updateData: Partial<IAdmin>): Promise<IAdmin | null> {
    // Don't allow password update through this method
    if (updateData.password) {
      delete updateData.password;
    }

    return await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');
  }

  async deleteAdmin(id: string): Promise<boolean> {
    const result = await Admin.findByIdAndDelete(id);
    return !!result;
  }

  async changePassword(adminId: string, oldPassword: string, newPassword: string): Promise<void> {
    const admin = await Admin.findById(adminId).select('+password');
    if (!admin) {
      throw new Error('Admin not found');
    }

    try {
      const isPasswordValid = await admin.comparePassword(oldPassword);
      if (!isPasswordValid) {
        throw new Error('Invalid old password');
      }
    } catch (error: any) {
      // If password hash is corrupted, allow password reset
      if (error.message.includes('Invalid password hash') || error.message.includes('Invalid salt revision')) {
        // Allow password change even if old password hash is corrupted
        console.warn(`Admin ${adminId} has corrupted password hash. Allowing password reset.`);
      } else {
        throw error;
      }
    }

    admin.password = newPassword;
    await admin.save();
  }

  /**
   * Reset password for an admin (bypasses old password check)
   * Use this method to fix corrupted password hashes
   */
  async resetPassword(adminId: string, newPassword: string): Promise<void> {
    const admin = await Admin.findById(adminId).select('+password');
    if (!admin) {
      throw new Error('Admin not found');
    }

    admin.password = newPassword;
    await admin.save();
  }

  /**
   * Reset password by email (bypasses old password check)
   * Use this method to fix corrupted password hashes
   */
  async resetPasswordByEmail(email: string, newPassword: string): Promise<void> {
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      throw new Error('Admin not found');
    }

    admin.password = newPassword;
    await admin.save();
  }

  generateToken(admin: IAdmin): string {
    const payload = {
      id: String(admin._id),
      email: admin.email,
      role: 'admin',
    };

    return jwt.sign(payload, String(env.JWT_SECRET), {
      expiresIn: String(env.JWT_EXPIRE),
    } as jwt.SignOptions);
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

}

export const adminService = new AdminService();

