import { incomeService } from '../features/income/services/income.service';
import { walletMonitorService } from './wallet-monitor.service';
import { env } from '../config/env';

export class CronService {
  private dailyROIInterval: NodeJS.Timeout | null = null;
  private walletMonitorInterval: NodeJS.Timeout | null = null;
  private dailyRewardSchedule: NodeJS.Timeout | null = null;

  /**
   * Start daily ROI job (runs every 24 hours from start time)
   * For exact 12 AM scheduling, use startDailyRewardJob instead
   */
  startDailyROIJob(): void {
    // Process daily ROI every 24 hours
    // For testing, you can change this to run more frequently
    const interval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Process immediately on start (for testing)
    this.processDailyROI();

    // Then schedule it daily
    this.dailyROIInterval = setInterval(() => {
      this.processDailyROI();
    }, interval);

    console.log('✅ Daily ROI cron job started');
  }

  /**
   * Start daily reward job that runs exactly at 12 AM (midnight) every day
   * This processes:
   * 1. Daily ROI for all active investments
   * 2. Team Level Income (Level ROI) for referrals
   */
  startDailyRewardJob(): void {
    console.log('🕛 Starting daily reward cron job (runs at 12 AM daily)...');

    // Calculate milliseconds until next 12 AM
    const now = new Date();
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0); // Set to next midnight (12 AM)

    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    console.log(`⏰ Next reward distribution scheduled for: ${nextMidnight.toLocaleString()}`);

    // Schedule first run at next midnight
    this.dailyRewardSchedule = setTimeout(() => {
      // Process rewards at midnight
      this.processDailyRewards();

      // Then schedule it to run every 24 hours
      this.dailyRewardSchedule = setInterval(() => {
        this.processDailyRewards();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, msUntilMidnight);

    console.log('✅ Daily reward cron job scheduled (12 AM daily)');
  }

  startWalletMonitorJob(): void {
    if (!env.ENABLE_WALLET_MONITOR || !walletMonitorService) {
      console.log('⚠️ Wallet monitor is disabled or not initialized');
      return;
    }

    // Monitor wallets every 5 minutes
    const interval = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Process immediately on start
    this.monitorWallets();

    // Then schedule it
    this.walletMonitorInterval = setInterval(() => {
      this.monitorWallets();
    }, interval);

    console.log('✅ Wallet monitor cron job started');
  }

  private async processDailyROI(): Promise<void> {
    try {
      console.log('🔄 Processing daily ROI...');
      await incomeService.processDailyROI();
      console.log('✅ Daily ROI processed successfully');
    } catch (error: any) {
      console.error('❌ Error processing daily ROI:', error.message);
    }
  }

  /**
   * Process daily rewards at 12 AM:
   * 1. Daily ROI for all active investments
   * 2. Team Level Income (Level ROI) for referrals
   */
  private async processDailyRewards(): Promise<void> {
    try {
      const startTime = new Date();
      console.log('═══════════════════════════════════════════════════════');
      console.log('🕛 MIDNIGHT REWARD DISTRIBUTION STARTED');
      console.log(`⏰ Time: ${startTime.toLocaleString()}`);
      console.log('═══════════════════════════════════════════════════════');

      // Step 1: Process Daily ROI for all active investments
      console.log('📊 Step 1: Processing Daily ROI for investments...');
      const processedCount = await incomeService.processDailyROI();
      console.log(`✅ Daily ROI processed successfully (${processedCount} investments)`);

      // Note: Team Level Income (Level ROI) is automatically processed in processDailyROI()
      // It distributes 1% per level (up to 10 levels) to upline users based on their downline's daily ROI

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;

      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ MIDNIGHT REWARD DISTRIBUTION COMPLETED');
      console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
      console.log(`⏰ Completed at: ${endTime.toLocaleString()}`);
      console.log('═══════════════════════════════════════════════════════');
    } catch (error: any) {
      console.error('❌ Error processing daily rewards:', error.message);
      console.error('Stack:', error.stack);
    }
  }

  private async monitorWallets(): Promise<void> {
    try {
      if (!walletMonitorService) {
        return;
      }
      console.log('🔄 Monitoring user wallets for deposits...');
      await walletMonitorService.monitorAllWallets();
      console.log('✅ Wallet monitoring completed');
    } catch (error: any) {
      console.error('❌ Error monitoring wallets:', error.message);
    }
  }

  stopDailyROIJob(): void {
    if (this.dailyROIInterval) {
      clearInterval(this.dailyROIInterval);
      this.dailyROIInterval = null;
      console.log('⏹️ Daily ROI cron job stopped');
    }
  }

  stopWalletMonitorJob(): void {
    if (this.walletMonitorInterval) {
      clearInterval(this.walletMonitorInterval);
      this.walletMonitorInterval = null;
      console.log('⏹️ Wallet monitor cron job stopped');
    }
  }

  stopDailyRewardJob(): void {
    if (this.dailyRewardSchedule) {
      clearInterval(this.dailyRewardSchedule);
      this.dailyRewardSchedule = null;
      console.log('⏹️ Daily reward cron job stopped');
    }
  }

  /**
   * Stop all cron jobs
   */
  stopAllJobs(): void {
    this.stopDailyROIJob();
    this.stopWalletMonitorJob();
    this.stopDailyRewardJob();
    console.log('⏹️ All cron jobs stopped');
  }
}

export const cronService = new CronService();

