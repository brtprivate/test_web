import dotenv from 'dotenv';
import crypto from 'crypto';
import { connectDatabase } from '../config/database';
import { Admin } from '../features/admin/models/admin.model';
import { User } from '../features/users/models/user.model';
import { Setting } from '../features/settings/models/setting.model';
import { InvestmentPlan } from '../features/investment-plans/models/investment-plan.model';
import { walletGeneratorService } from '../services/wallet-generator.service';
import { incomeTransactionService } from '../features/income/services/income-transaction.service';
import { settingService } from '../features/settings/services/setting.service';

// Load environment variables
dotenv.config();

/**
 * Seed Database Script
 * This script seeds the database with:
 * - 1 Admin user
 * - 1 Normal user with wallet
 * - Default settings (welcome bonus, referral bonus, ROI settings)
 * - Default investment plans (ROI plans)
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database\n');

    // 1. Seed Admin User
    console.log('📝 Seeding Admin User...');
    await seedAdmin();
    console.log('✅ Admin user seeded\n');

    // 2. Seed Settings (before user, so welcome bonus setting is available)
    console.log('📝 Seeding Settings...');
    await seedSettings();
    console.log('✅ Settings seeded\n');

    // 3. Seed Normal User
    console.log('📝 Seeding Normal User...');
    await seedUser();
    console.log('✅ Normal user seeded\n');

    // 4. Seed Investment Plans (ROI Plans)
    console.log('📝 Seeding Investment Plans (ROI)...');
    await seedInvestmentPlans();
    console.log('✅ Investment plans seeded\n');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Seeded Data Summary:');
    console.log('   - 1 Admin user (admin@aiearnbot.com / Admin123!)');
    console.log('   - 1 Normal user (telegramChatId: 123456789)');
    console.log('   - Default settings (welcome bonus, referral bonus, ROI)');
    console.log('   - 4 Investment plans (Starter, Basic, Premium, VIP)');
    console.log('\n⚠️  Please change admin password after first login!');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

/**
 * Seed Admin User
 */
async function seedAdmin() {
  const existingAdmin = await Admin.findOne({ email: 'admin@aiearnbot.com' });
  
  if (existingAdmin) {
    console.log('   ⚠️  Admin already exists, skipping...');
    return;
  }

  const admin = new Admin({
    username: 'admin',
    email: 'admin@aiearnbot.com',
    password: 'Admin123!', // Will be hashed automatically
    role: 'admin',
    isActive: true,
  });

  await admin.save();
  console.log('   ✅ Admin created:');
  console.log('      Email: admin@aiearnbot.com');
  console.log('      Password: Admin123!');
}

/**
 * Seed Normal User with Wallet
 */
async function seedUser() {
  const existingUser = await User.findOne({ telegramChatId: 123456789 });
  
  if (existingUser) {
    console.log('   ⚠️  User already exists, skipping...');
    return existingUser;
  }

  // Generate wallet for user
  const wallet = walletGeneratorService.generateWallet();
  console.log('   ✅ Generated wallet:', wallet.address);

  // Get welcome bonus from settings (or use default)
  const welcomeBonusSetting = await Setting.findOne({ key: 'welcome_bonus_amount' });
  const welcomeBonusAmount = welcomeBonusSetting 
    ? (welcomeBonusSetting.value as number) 
    : 0.5;

  // Generate unique referral code with prefix
  let prefix = 'AI';
  try {
    prefix = await settingService.getReferralCodePrefix();
  } catch (error) {
    // Use default prefix if setting not found
    console.log('   ⚠️  Using default prefix: AI');
  }

  let referralCode: string = '';
  let isUnique = false;
  
  while (!isUnique) {
    const randomCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    referralCode = `${prefix}${randomCode}`;
    const existingUser = await User.findOne({ referralCode });
    if (!existingUser) {
      isUnique = true;
    }
  }

  const user = new User({
    name: 'Test User',
    telegramChatId: 123456789,
    telegramUsername: 'testuser',
    telegramFirstName: 'Test',
    telegramLastName: 'User',
    isActive: true,
    referralCode: referralCode, // Manually set referral code
    walletAddress: wallet.address,
    privateKey: wallet.privateKey,
    earningWallet: welcomeBonusAmount,
    freeBonusReceived: true,
  });

  const savedUser = await user.save();
  const userId = String(savedUser._id);

  // Create income transaction for welcome bonus
  try {
    await incomeTransactionService.createIncomeTransaction({
      user: userId,
      incomeType: 'bonus',
      amount: welcomeBonusAmount,
      description: `Welcome bonus - $${welcomeBonusAmount}`,
      incomeDate: new Date(),
    });
    console.log('   ✅ Welcome bonus transaction created');
  } catch (error: any) {
    console.log('   ⚠️  Could not create welcome bonus transaction:', error.message);
  }

  console.log('   ✅ User created:');
  console.log('      Name: Test User');
  console.log('      Telegram Chat ID: 123456789');
  console.log('      Wallet Address: ' + wallet.address);
  console.log('      Welcome Bonus: $' + welcomeBonusAmount);
  console.log('      Referral Code: ' + savedUser.referralCode);

  return savedUser;
}

/**
 * Seed Settings (Welcome Bonus, Referral Bonus, ROI Settings)
 */
async function seedSettings() {
  const defaultSettings = [
    // Welcome Bonus Settings
    {
      key: 'welcome_bonus_amount',
      value: 0.5,
      type: 'number' as const,
      description: 'Welcome bonus amount for new users (in USDT)',
      category: 'bonus' as const,
      isActive: true,
    },
    {
      key: 'auto_invest_welcome_bonus',
      value: true,
      type: 'boolean' as const,
      description: 'Automatically invest welcome bonus',
      category: 'bonus' as const,
      isActive: true,
    },
    
    // Referral Bonus Settings
    {
      key: 'referral_code_prefix',
      value: 'AI',
      type: 'string' as const,
      description: 'Prefix for referral codes (e.g., AI12345678)',
      category: 'referral' as const,
      isActive: true,
    },
    {
      key: 'referral_bonus_tiers',
      value: [
        { minAmount: 50, maxAmount: 1000, type: 'fixed', value: 15 },
        { minAmount: 1001, type: 'percentage', value: 5 },
      ],
      type: 'array' as const,
      description: 'Tiered referral bonus configuration',
      category: 'referral' as const,
      isActive: true,
    },
    
    // Team Level Income Settings (Referral System)
    {
      key: 'team_level_income_percentage',
      value: 2,
      type: 'number' as const,
      description: 'Percentage of investment shared per level (1-9)',
      category: 'referral' as const,
      isActive: true,
    },
    {
      key: 'team_level_max_levels',
      value: 10,
      type: 'number' as const,
      description: 'Maximum team levels for income distribution',
      category: 'referral' as const,
      isActive: true,
    },
    
    // Investment Settings
    {
      key: 'min_investment_amount',
      value: 0,
      type: 'number' as const,
      description: 'Minimum investment amount (in USDT)',
      category: 'investment' as const,
      isActive: true,
    },
    {
      key: 'max_investment_amount',
      value: 10000,
      type: 'number' as const,
      description: 'Maximum investment amount (in USDT)',
      category: 'investment' as const,
      isActive: true,
    },

    // ROI Settings (Daily ROI)
    {
      key: 'daily_roi_enabled',
      value: true,
      type: 'boolean' as const,
      description: 'Enable daily ROI calculation',
      category: 'investment' as const,
      isActive: true,
    },
    {
      key: 'roi_compounding_enabled',
      value: true,
      type: 'boolean' as const,
      description: 'Enable ROI compounding (reinvest daily ROI)',
      category: 'investment' as const,
      isActive: true,
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const settingData of defaultSettings) {
    const existing = await Setting.findOne({ key: settingData.key });
    
    if (!existing) {
      await Setting.create(settingData);
      createdCount++;
      console.log(`   ✅ Created setting: ${settingData.key} = ${settingData.value}`);
    } else {
      skippedCount++;
      console.log(`   ⚠️  Setting already exists: ${settingData.key}`);
    }
  }

  console.log(`   📊 Settings: ${createdCount} created, ${skippedCount} skipped`);
}

/**
 * Seed Investment Plans (ROI Plans)
 */
async function seedInvestmentPlans() {
  const defaultPlans = [
    {
      name: 'Weekly Power Trade',
      minAmount: 50,
      maxAmount: 100,
      dailyROI: 0,
      lumpSumROI: 40,
      compoundingEnabled: false,
      isActive: true,
      description: '40% return in 72 hours. Opens once per week.',
      planType: 'weekly',
      durationDays: 3,
      payoutType: 'lump_sum',
      payoutDelayHours: 72,
      visibility: {
        dayOfWeek: 6,
        startHourUtc: 0,
        durationHours: 24,
      },
      displayOrder: 0,
    },
    {
      name: 'Bot Slab One',
      minAmount: 1,
      maxAmount: 499,
      dailyROI: 7,
      compoundingEnabled: false,
      isActive: true,
      description: '$1 - $499 | Daily ROI 7% for 20 days',
      planType: 'bot',
      durationDays: 20,
      payoutType: 'daily',
      displayOrder: 10,
    },
    {
      name: 'Bot Slab Two',
      minAmount: 500,
      maxAmount: 4999,
      dailyROI: 8,
      compoundingEnabled: false,
      isActive: true,
      description: '$500 - $4,999 | Daily ROI 8% for 20 days',
      planType: 'bot',
      durationDays: 20,
      payoutType: 'daily',
      displayOrder: 20,
    },
    {
      name: 'Bot Slab Elite',
      minAmount: 5000,
      dailyROI: 9,
      compoundingEnabled: false,
      isActive: true,
      description: '$5,000+ | Daily ROI 9% for 20 days',
      planType: 'bot',
      durationDays: 20,
      payoutType: 'daily',
      displayOrder: 30,
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const planData of defaultPlans) {
    const existing = await InvestmentPlan.findOne({
      name: planData.name,
    });
    
    if (!existing) {
      await InvestmentPlan.create(planData);
      createdCount++;
      const roiLabel =
        planData.payoutType === 'lump_sum'
          ? `${planData.lumpSumROI}% lump sum`
          : `${planData.dailyROI}% daily ROI`;
      console.log(`   ✅ Created plan: ${planData.name} (${roiLabel})`);
    } else {
      skippedCount++;
      console.log(`   ⚠️  Plan already exists: ${planData.name}`);
    }
  }

  console.log(`   📊 Plans: ${createdCount} created, ${skippedCount} skipped`);
}

// Run seed script
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };

