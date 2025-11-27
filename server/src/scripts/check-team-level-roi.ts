import mongoose from 'mongoose';
import { IncomeTransaction } from '../features/income/models/income-transaction.model';
import { User } from '../features/users/models/user.model';
import { Investment } from '../features/investments/models/investment.model';
import { env } from '../config/env';

/**
 * Script to check Team Level ROI distribution
 * Verifies:
 * 1. Are 10 levels being processed correctly?
 * 2. Is 1% of each investment's daily ROI being distributed correctly?
 * 3. What amounts are actually in the database?
 */
async function checkTeamLevelROI() {
  try {
    // Connect to database
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 TEAM LEVEL ROI ANALYSIS');
    console.log('═══════════════════════════════════════════════════════\n');

    // 1. Check today's daily ROI transactions
    const todayDailyROI = await IncomeTransaction.find({
      incomeType: 'daily_roi',
      incomeDate: { $gte: today, $lt: tomorrow },
      status: 'completed',
    });

    console.log(`📈 Today's Daily ROI Transactions: ${todayDailyROI.length}`);
    const totalDailyROI = todayDailyROI.reduce((sum, t) => sum + t.amount, 0);
    console.log(`💰 Total Daily ROI Amount: $${totalDailyROI.toFixed(2)}\n`);

    // 2. Check today's team income transactions by level
    const todayTeamIncome = await IncomeTransaction.find({
      incomeType: 'team_income',
      incomeDate: { $gte: today, $lt: tomorrow },
      status: 'completed',
    });

    console.log(`👥 Today's Team Income Transactions: ${todayTeamIncome.length}`);

    // Group by level
    const teamIncomeByLevel: { [key: number]: { count: number; total: number } } = {};
    todayTeamIncome.forEach((t) => {
      const level = t.level || 0;
      if (!teamIncomeByLevel[level]) {
        teamIncomeByLevel[level] = { count: 0, total: 0 };
      }
      teamIncomeByLevel[level].count++;
      teamIncomeByLevel[level].total += t.amount;
    });

    console.log('\n📊 Team Income by Level:');
    const levels = Object.keys(teamIncomeByLevel)
      .map(Number)
      .sort((a, b) => a - b);
    
    for (const level of levels) {
      const data = teamIncomeByLevel[level];
      console.log(
        `  Level ${level}: ${data.count} transactions, Total: $${data.total.toFixed(2)}`
      );
    }

    const maxLevelFound = levels.length > 0 ? Math.max(...levels) : 0;
    console.log(`\n⚠️  Maximum Level Found: ${maxLevelFound} (Expected: 10)`);

    // 3. Check if calculation is correct (1% of daily ROI)
    console.log('\n🔍 Verification:');
    console.log(`  Expected 1% of Daily ROI: $${(totalDailyROI * 0.01).toFixed(2)}`);
    
    const totalTeamIncome = todayTeamIncome.reduce((sum, t) => sum + t.amount, 0);
    console.log(`  Actual Team Income Distributed: $${totalTeamIncome.toFixed(2)}`);

    // 4. Sample check: Get a user with investments and check their downline
    const usersWithInvestments = await User.find({
      totalInvested: { $gt: 0 },
    }).limit(5);

    console.log('\n👤 Sample Users with Investments:');
    for (const user of usersWithInvestments) {
      const userInvestments = await Investment.find({
        user: user._id,
        status: 'active',
      });

      if (userInvestments.length === 0) continue;

      const userDailyROI = todayDailyROI.filter(
        (t) => String(t.user) === String(user._id)
      );
      const userDailyROITotal = userDailyROI.reduce((sum, t) => sum + t.amount, 0);

      // Check how much team income this user received
      const userTeamIncome = todayTeamIncome.filter(
        (t) => String(t.user) === String(user._id)
      );
      const userTeamIncomeTotal = userTeamIncome.reduce((sum, t) => sum + t.amount, 0);

      // Check how much team income this user's downline should generate
      const downlineUsers = await User.find({ referredBy: user._id });
      let expectedTeamIncome = 0;
      for (const downline of downlineUsers) {
        const downlineDailyROI = todayDailyROI.filter(
          (t) => String(t.user) === String(downline._id)
        );
        const downlineROITotal = downlineDailyROI.reduce((sum, t) => sum + t.amount, 0);
        expectedTeamIncome += downlineROITotal * 0.01; // 1% of downline's daily ROI
      }

      console.log(`\n  User: ${user.name || user.telegramUsername || user._id}`);
      console.log(`    Daily ROI: $${userDailyROITotal.toFixed(2)}`);
      console.log(`    Team Income Received: $${userTeamIncomeTotal.toFixed(2)}`);
      console.log(`    Expected Team Income (1% of downline): $${expectedTeamIncome.toFixed(2)}`);
      console.log(`    Downline Count: ${downlineUsers.length}`);
    }

    // 5. Check settings
    const { Setting } = await import('../features/settings/models/setting.model');
    const teamLevelPercentage = await Setting.findOne({
      key: 'team_level_income_percentage',
    });
    const maxLevels = await Setting.findOne({
      key: 'team_level_max_levels',
    });

    console.log('\n⚙️  Settings:');
    console.log(`  Team Level Income Percentage: ${teamLevelPercentage?.value || 'Not set'}%`);
    console.log(`  Max Team Levels: ${maxLevels?.value || 'Not set'}`);

    // 6. Check if level 10 exists in database
    const level10Transactions = await IncomeTransaction.find({
      incomeType: 'team_income',
      level: 10,
      status: 'completed',
    });

    console.log(`\n🔟 Level 10 Transactions (All Time): ${level10Transactions.length}`);
    if (level10Transactions.length > 0) {
      const level10Total = level10Transactions.reduce((sum, t) => sum + t.amount, 0);
      console.log(`  Total Level 10 Income: $${level10Total.toFixed(2)}`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Analysis Complete');
    console.log('═══════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
checkTeamLevelROI();

