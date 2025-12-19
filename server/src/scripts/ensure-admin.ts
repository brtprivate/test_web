import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { adminService } from '../features/admin/services/admin.service';

// Load environment variables
dotenv.config();

/**
 * Ensure Admin Account Exists Script
 * This script ensures an admin account exists with the correct email and password
 * 
 * Usage:
 *   ts-node src/scripts/ensure-admin.ts
 *   or
 *   npm run ensure-admin
 */
async function ensureAdmin() {
  try {
    console.log('🔐 Ensuring admin account exists...\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database\n');

    const email = 'admin@aicrypto.expert';
    const password = 'Admin123!';
    const username = 'admin';

    // Check if admin exists
    console.log(`🔍 Checking for admin with email: ${email}...`);
    let admin = await adminService.getAdminByEmail(email);

    if (!admin) {
      console.log('❌ Admin not found. Creating new admin...\n');
      
      // Check if there's an admin with old email
      const oldEmailAdmin = await adminService.getAdminByEmail('admin@aicryptobot.com');
      if (oldEmailAdmin) {
        console.log('⚠️  Found admin with old email. Updating email...');
        admin = await adminService.updateAdmin(String(oldEmailAdmin._id), { email });
        if (admin) {
          console.log('✅ Updated admin email to admin@aicrypto.expert');
        }
      } else {
        // Create new admin
        try {
          admin = await adminService.signup({
            username,
            email,
            password,
          });
          console.log('✅ Admin created successfully!\n');
        } catch (error: any) {
          if (error.message.includes('already exists')) {
            console.log('⚠️  Admin with this username already exists. Trying to update...');
            // Try to find by username and update email
            const allAdmins = await adminService.getAllAdmins();
            const existingAdmin = allAdmins.find(a => a.username === username);
            if (existingAdmin) {
              admin = await adminService.updateAdmin(String(existingAdmin._id), { email });
              console.log('✅ Updated existing admin email');
            }
          } else {
            throw error;
          }
        }
      }
    } else {
      console.log('✅ Admin already exists\n');
    }

    if (admin) {
      // Reset password to ensure it's correct
      console.log('🔐 Resetting password to ensure it matches...');
      await adminService.resetPassword(String(admin._id), password);
      console.log('✅ Password reset successfully!\n');
      
      console.log('📝 Admin Details:');
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Active: ${admin.isActive}`);
      console.log(`\n✅ Admin account is ready to use!`);
      console.log(`\n⚠️  Please change the password after first login for security.`);
    }

    // Close database connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error ensuring admin account:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
ensureAdmin();

