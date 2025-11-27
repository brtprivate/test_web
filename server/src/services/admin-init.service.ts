import { adminService } from '../features/admin/services/admin.service';

export class AdminInitService {
  /**
   * Initialize admin if no admin exists
   * This should be called on server start
   */
  async initializeAdmin(): Promise<void> {
    const adminCount = await adminService.getAllAdmins();
    
    if (adminCount.length === 0) {
      // Create default admin
      const defaultAdmin = {
        username: 'admin',
        email: 'admin@aiearnbot.com',
        password: 'Admin123!', // Should be changed on first login
      };

      try {
        await adminService.signup(defaultAdmin);
        console.log('✅ Admin created');
        console.log('⚠️  Default credentials:');
        console.log('   Email: admin@aiearnbot.com');
        console.log('   Password: Admin123!');
        console.log('   Please change password after first login!');
      } catch (error: any) {
        console.error('❌ Failed to create admin:', error.message);
      }
    } else {
      console.log('✅ Admin accounts already exist');
    }
  }
}

export const adminInitService = new AdminInitService();

