import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Admin } from '../features/admin/models/admin.model';

// Load environment variables
dotenv.config();

/**
 * Reset Admin Password Script
 * This script resets the password for an admin user, useful for fixing corrupted password hashes
 * 
 * Usage:
 *   ts-node src/scripts/reset-admin-password.ts <email> <newPassword>
 *   or
 *   npm run reset-admin-password <email> <newPassword>
 */
async function resetAdminPassword() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.error('❌ Error: Missing required arguments');
      console.log('\nUsage:');
      console.log('  ts-node src/scripts/reset-admin-password.ts <email> <newPassword>');
      console.log('\nExample:');
      console.log('  ts-node src/scripts/reset-admin-password.ts admin@example.com newSecurePassword123');
      process.exit(1);
    }

    const [email, newPassword] = args;

    if (!email || !newPassword) {
      console.error('❌ Error: Email and new password are required');
      process.exit(1);
    }

    if (newPassword.length < 6) {
      console.error('❌ Error: Password must be at least 6 characters long');
      process.exit(1);
    }

    console.log('🔐 Starting admin password reset...\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database\n');

    // Find admin by email
    console.log(`🔍 Looking for admin with email: ${email}...`);
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      console.error(`❌ Error: Admin with email "${email}" not found`);
      process.exit(1);
    }

    console.log(`✅ Found admin: ${admin.username} (${admin.email})\n`);

    // Check current password hash format
    if (admin.password) {
      const isValidHash = admin.password.match(/^\$2[abxy]\$\d{2}\$/);
      if (!isValidHash) {
        console.log(`⚠️  Warning: Current password hash appears to be corrupted: ${admin.password.substring(0, 20)}...`);
        console.log('   This script will fix it by resetting the password.\n');
      } else {
        console.log('✅ Current password hash format is valid');
        console.log('   Proceeding with password reset...\n');
      }
    }

    // Reset password (this will trigger the pre-save hook to hash it)
    admin.password = newPassword;
    await admin.save();

    console.log('✅ Password reset successfully!');
    console.log(`\n📝 Admin Details:`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   New password: ${newPassword}`);
    console.log(`\n⚠️  Please save this information securely and change the password after logging in.`);

    // Close database connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error resetting admin password:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
resetAdminPassword();

