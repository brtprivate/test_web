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
        email: 'admin@aicrypto.expert',
        password: 'Admin123!', // Should be changed on first login
      };

      try {
        await adminService.signup(defaultAdmin);
        console.log('✅ Admin created');
        console.log('⚠️  Default credentials:');
        console.log('   Email: admin@aicrypto.expert');
        console.log('   Password: Admin123!');
        console.log('   Please change password after first login!');
      } catch (error: any) {
        console.error('❌ Failed to create admin:', error.message);
      }
    } else {
      // Check if admin with correct email exists, if not create/update it
      const correctEmailAdmin = await adminService.getAdminByEmail('admin@aicrypto.expert');
      if (!correctEmailAdmin) {
        // Check if there's an admin with old email
        const oldEmailAdmin = await adminService.getAdminByEmail('admin@aicryptobot.com');
        if (oldEmailAdmin) {
          // Update email to correct one
          try {
            await adminService.updateAdmin(String(oldEmailAdmin._id), { email: 'admin@aicrypto.expert' });
            console.log('✅ Updated admin email to admin@aicrypto.expert');
          } catch (error: any) {
            console.error('❌ Failed to update admin email:', error.message);
          }
        } else {
          // Create new admin with correct email
          const defaultAdmin = {
            username: 'admin',
            email: 'admin@aicrypto.expert',
            password: 'Admin123!',
          };
          try {
            await adminService.signup(defaultAdmin);
            console.log('✅ Admin created with email: admin@aicrypto.expert');
            console.log('⚠️  Default credentials:');
            console.log('   Email: admin@aicrypto.expert');
            console.log('   Password: Admin123!');
            console.log('   Please change password after first login!');
          } catch (error: any) {
            console.error('❌ Failed to create admin:', error.message);
          }
        }
      }
      console.log('✅ Admin accounts already exist');
    }
  }
}

export const adminInitService = new AdminInitService();

