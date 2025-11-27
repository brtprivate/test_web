import mongoose from 'mongoose';
import { User } from '../../users/models/user.model';
// walletService and transactionService not used in this service
import { Investment } from '../../investments/models/investment.model';
import { incomeTransactionService } from '../../income/services/income-transaction.service';
import { settingService } from '../../settings/services/setting.service';
import { IncomeTransaction } from '../../income/models/income-transaction.model';

export class ReferralService {
  async getReferralCode(userId: string): Promise<string> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.referralCode;
  }

  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    activeReferrals: number;
    totalEarned: number;
    teamSize: number;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Direct referrals
    const directReferrals = await User.find({ referredBy: userId });
    const totalReferrals = directReferrals.length;

    // Active referrals (those who have invested)
    const activeReferralIds = directReferrals.map(r => r._id);
    const activeReferralUsers = await Investment.distinct('user', {
      user: { $in: activeReferralIds },
      status: 'active',
    });
    const activeReferrals = activeReferralUsers.length;

    // Total earned from referrals
    const { Transaction } = await import('../../transactions/models/transaction.model');
    const referralTransactions = await Transaction.find({
      user: userId,
      type: { $in: ['referral', 'team_income'] },
      status: 'completed',
    });

    const totalEarned = referralTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Team size (all levels)
    const teamSize = await this.getTeamSize(userId);

    return {
      totalReferrals,
      activeReferrals,
      totalEarned,
      teamSize,
    };
  }

  async getTeamStructure(userId: string, maxLevel: number = 10): Promise<any> {
    const team: any = {
      level: 0,
      userId: userId.toString(),
      referrals: [],
    };

    await this.buildTeamTree(team, 0, maxLevel);

    return team;
  }

  private async buildTeamTree(node: any, currentLevel: number, maxLevel: number): Promise<void> {
    if (currentLevel >= maxLevel) return;

    const referrals = await User.find({ referredBy: node.userId }).select('_id name referralCode totalInvested');

    for (const referral of referrals) {
      const referralNode: any = {
        level: currentLevel + 1,
        userId: String(referral._id),
        name: referral.name,
        referralCode: referral.referralCode,
        totalInvested: referral.totalInvested,
        referrals: [],
      };

      await this.buildTeamTree(referralNode, currentLevel + 1, maxLevel);
      node.referrals.push(referralNode);
    }
  }

  async getTeamSize(userId: string): Promise<number> {
    const allReferrals: string[] = [];
    
    const getReferrals = async (parentId: string) => {
      const referrals = await User.find({ referredBy: parentId }).select('_id');
      for (const ref of referrals) {
        const refId = String(ref._id);
        allReferrals.push(refId);
        await getReferrals(refId);
      }
    };

    await getReferrals(userId);
    return allReferrals.length;
  }

  async processReferralBonus(
    referrerId: string,
    referredUserId: string,
    investmentAmount: number,
    investmentId?: string
  ): Promise<void> {
    const referrer = await User.findById(referrerId);
    if (!referrer) {
      throw new Error('Referrer not found');
    }

    const bonusAmount = await this.calculateReferralBonus(investmentAmount);
    if (bonusAmount <= 0) {
      return;
    }

    await incomeTransactionService.createIncomeTransaction({
      user: referrerId,
      incomeType: 'referral',
      amount: bonusAmount,
      description: `Referral bonus from user ${referredUserId}`,
      referenceId: referredUserId,
      investmentId,
      incomeDate: new Date(),
    });
  }

  async distributeLevelIncomeFromInvestment(
    investorId: string,
    investmentAmount: number,
    investmentId: string
  ): Promise<void> {
    if (investmentAmount <= 0) {
      return;
    }

    const investor = await User.findById(investorId);
    if (!investor || !investor.referredBy) {
      return;
    }

    const levelPercentage = await settingService.getTeamLevelIncomePercentage();
    const maxLevels = await settingService.getMaxTeamLevels();
    const levelAmount = (investmentAmount * levelPercentage) / 100;

    if (levelAmount <= 0) {
      return;
    }

    await this.distributeTeamIncome(
      investor.referredBy.toString(),
      investorId,
      levelAmount,
      investmentId,
      1,
      maxLevels
    );
  }

  private async distributeTeamIncome(
    parentId: string,
    sourceUserId: string,
    amount: number,
    investmentId: string,
    level: number,
    maxLevels: number = 10
  ): Promise<void> {
    if (level > maxLevels) return;

    const parent = await User.findById(parentId);
    if (!parent) return;

    await incomeTransactionService.createIncomeTransaction({
      user: parentId,
      incomeType: 'team_income',
      amount,
      description: `Level ${level} income from ${sourceUserId}`,
      referenceId: sourceUserId,
      investmentId,
      level,
      incomeDate: new Date(),
    });

    if (parent.referredBy) {
      await this.distributeTeamIncome(
        parent.referredBy.toString(),
        sourceUserId,
        amount,
        investmentId,
        level + 1,
        maxLevels
      );
    }
  }

  async getMyReferrals(userId: string, limit?: number, skip?: number): Promise<{ referrals: any[]; total: number }> {
    const query = User.find({ referredBy: userId })
      .select('name telegramUsername referralCode totalInvested investmentWallet earningWallet createdAt')
      .sort({ createdAt: -1 });

    // Get total count
    const total = await User.countDocuments({ referredBy: userId });

    // Apply pagination if provided
    if (limit !== undefined) {
      query.limit(limit);
    }
    if (skip !== undefined) {
      query.skip(skip);
    }

    const referrals = await query.exec();

    return {
      referrals: referrals.map(ref => ({
        id: ref._id,
        name: ref.name,
        telegramUsername: ref.telegramUsername,
        referralCode: ref.referralCode,
        totalInvested: ref.totalInvested,
        investmentWallet: ref.investmentWallet,
        earningWallet: ref.earningWallet,
        joinedAt: ref.createdAt,
      })),
      total,
    };
  }

  /**
   * Get level-wise referral statistics
   * Returns count, earnings, and purchase amount for each level (1-10)
   */
  async getLevelWiseStats(userId: string, maxLevels: number = 10): Promise<Array<{
    level: number;
    userCount: number;
    purchaseAmount: number;
    reward: number;
    commission: number;
  }>> {
    // Get team level income percentage from settings
    const teamIncomePercentage = await settingService.getTeamLevelIncomePercentage();
    const configuredMaxLevels = await settingService.getMaxTeamLevels();
    const effectiveMaxLevels = Math.min(maxLevels, configuredMaxLevels);
    
    // Initialize levels array
    const levels: Array<{
      level: number;
      userCount: number;
      purchaseAmount: number;
      reward: number;
      commission: number;
    }> = [];

    // Pre-compute users available at each level to avoid off-by-one errors
    const levelUserIdsMap = await this.buildLevelUserIdsMap(userId, effectiveMaxLevels);

    // Get earnings from team_income transactions grouped by level
    const earningsByLevel = await IncomeTransaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          incomeType: 'team_income',
          status: 'completed',
          level: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$level',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const earningsMap = new Map<number, number>();
    earningsByLevel.forEach((item: any) => {
      earningsMap.set(item._id, item.total);
    });

    // Process each level
    for (let level = 1; level <= effectiveMaxLevels; level++) {
      const userIds = levelUserIdsMap.get(level) ?? [];
      const userCount = userIds.length;

      // Get total purchase amount from users at this level
      let purchaseAmount = 0;
      if (userIds.length > 0) {
        const users = await User.find({ _id: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) } }).select('totalInvested');
        purchaseAmount = users.reduce((sum, user) => sum + (user.totalInvested || 0), 0);
      }

      // Get total earnings from this level
      const reward = earningsMap.get(level) || 0;

      levels.push({
        level,
        userCount,
        purchaseAmount,
        reward,
        commission: teamIncomePercentage,
      });
    }

    return levels;
  }

  async getLevelUsers(
    userId: string,
    level: number,
    limit: number = 25,
    skip: number = 0
  ): Promise<{
    level: number;
    total: number;
    users: Array<{
      _id: string;
      name?: string;
      telegramUsername?: string;
      telegramFirstName?: string;
      telegramLastName?: string;
      referralCode?: string;
      totalInvested?: number;
      investmentWallet?: number;
      earningWallet?: number;
      createdAt?: Date;
    }>;
  }> {
    const configuredMaxLevels = await settingService.getMaxTeamLevels();

    if (level < 1 || level > configuredMaxLevels) {
      const error: any = new Error(`Level must be between 1 and ${configuredMaxLevels}`);
      error.statusCode = 400;
      throw error;
    }

    const sanitizedLimit = Math.min(Math.max(limit, 1), 100);
    const sanitizedSkip = Math.max(skip, 0);

    const levelUserIdsMap = await this.buildLevelUserIdsMap(userId, level);
    const targetLevelUserIds = levelUserIdsMap.get(level) ?? [];
    const total = targetLevelUserIds.length;

    if (total === 0) {
      return {
        level,
        total: 0,
        users: [],
      };
    }

    const paginatedIds = targetLevelUserIds.slice(sanitizedSkip, sanitizedSkip + sanitizedLimit);

    if (paginatedIds.length === 0) {
      return {
        level,
        total,
        users: [],
      };
    }

    const objectIds = paginatedIds.map(id => new mongoose.Types.ObjectId(id));

    const users = await User.find({ _id: { $in: objectIds } })
      .select(
        'name telegramUsername telegramFirstName telegramLastName referralCode totalInvested investmentWallet earningWallet createdAt isActive'
      )
      .lean();

    const userMap = new Map(users.map(user => [String(user._id), user]));
    const orderedUsers = paginatedIds
      .map(id => userMap.get(id))
      .filter((user): user is typeof users[number] => Boolean(user));

    const formattedUsers = orderedUsers.map(user => {
      const { _id, ...rest } = user;
      return {
        ...rest,
        _id: String(_id),
      };
    });

    return {
      level,
      total,
      users: formattedUsers,
    };
  }

  private async calculateReferralBonus(amount: number): Promise<number> {
    if (amount <= 0) {
      return 0;
    }

    const tiers = await settingService.getReferralBonusTiers();
    for (const tier of tiers) {
      const min = tier.minAmount ?? 0;
      const max = tier.maxAmount ?? Number.POSITIVE_INFINITY;

      if (amount >= min && amount <= max) {
        if (tier.type === 'fixed') {
          return tier.value;
        }
        if (tier.type === 'percentage') {
          return (amount * tier.value) / 100;
        }
      }
    }

    return 0;
  }

  private async buildLevelUserIdsMap(
    userId: string,
    maxLevels: number
  ): Promise<Map<number, string[]>> {
    const levelUserIdsMap = new Map<number, string[]>();
    let currentLevelUserIds: string[] = [userId];

    for (let level = 1; level <= maxLevels; level++) {
      if (currentLevelUserIds.length === 0) {
        levelUserIdsMap.set(level, []);
        continue;
      }

      const parentObjectIds = currentLevelUserIds.map(id => new mongoose.Types.ObjectId(id));
      const referrals = await User.find({ referredBy: { $in: parentObjectIds } }).select('_id');
      const userIdsAtLevel = referrals.map(u => String(u._id));

      levelUserIdsMap.set(level, userIdsAtLevel);
      currentLevelUserIds = userIdsAtLevel;
    }

    return levelUserIdsMap;
  }
}

export const referralService = new ReferralService();

