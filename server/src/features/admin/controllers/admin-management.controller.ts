import { Request, Response, NextFunction } from 'express';
import type { PipelineStage, SortOrder } from 'mongoose';
import { AdminAuthRequest } from '../../../middleware/admin.middleware';
import { User } from '../../users/models/user.model';
import { Investment } from '../../investments/models/investment.model';
import { InvestmentPlan } from '../../investment-plans/models/investment-plan.model';
import { Transaction } from '../../transactions/models/transaction.model';
import { IncomeTransaction } from '../../income/models/income-transaction.model';
import { settingService } from '../../settings/services/setting.service';
import { authService } from '../../auth/services/auth.service';
import { incomeService } from '../../income/services/income.service';

export class AdminManagementController {
  // Dashboard Stats
  async getDashboardStats(_req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalUsers,
        activeUsers,
        totalInvestments,
        activeInvestments,
        totalInvestmentAmount,
        totalEarnings,
        totalTransactions,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Investment.countDocuments(),
        Investment.countDocuments({ status: 'active' }),
        Investment.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        IncomeTransaction.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.countDocuments(),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          stats: {
            users: {
              total: totalUsers,
              active: activeUsers,
            },
            investments: {
              total: totalInvestments,
              active: activeInvestments,
              totalAmount: totalInvestmentAmount[0]?.total || 0,
            },
            earnings: {
              total: totalEarnings[0]?.total || 0,
            },
            transactions: {
              total: totalTransactions,
            },
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  // User Management
  async getAllUsers(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
      const skip = (page - 1) * limit;
      const search = (req.query.search as string) || '';
      const status = (req.query.status as string) || 'all';
      const bonus = (req.query.bonus as string) || 'all';
      const capital = (req.query.capital as string) || 'all';
      const requestedSortField = (req.query.sortField as string) || 'createdAt';
      const sortDirectionParam = (req.query.sortDirection as string) === 'asc' ? 1 : -1;

      const allowedSortFields = new Set(['createdAt', 'name', 'totalInvested', 'totalEarned']);
      const sortField = allowedSortFields.has(requestedSortField) ? requestedSortField : 'createdAt';

      const SORT_DIRECTION = sortDirectionParam === 1 ? 1 : -1;
      const capitalBrackets: Record<string, { min: number; max: number }> = {
        all: { min: 0, max: Number.MAX_SAFE_INTEGER },
        starters: { min: 0, max: 1000 },
        scaling: { min: 1000, max: 10000 },
        whales: { min: 10000, max: Number.MAX_SAFE_INTEGER },
      };

      const query: Record<string, any> = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { telegramUsername: { $regex: search, $options: 'i' } },
          { referralCode: { $regex: search, $options: 'i' } },
        ];
      }

      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'suspended') {
        query.isActive = false;
      }

      if (bonus === 'bonus') {
        query.freeBonusReceived = true;
      } else if (bonus === 'no-bonus') {
        query.freeBonusReceived = false;
      }

      if (capital !== 'all') {
        const bracket = capitalBrackets[capital] ?? capitalBrackets.all;
        query.totalInvested = { $gte: bracket.min };
        if (bracket.max !== Number.MAX_SAFE_INTEGER) {
          query.totalInvested.$lt = bracket.max;
        }
      }

      const sort: Record<string, SortOrder> = { [sortField]: SORT_DIRECTION };

      const [users, total, aggregateTotals] = await Promise.all([
        User.find(query)
          .select('-password')
          .populate('referredBy', 'name referralCode telegramUsername telegramChatId')
          .sort(sort)
          .limit(limit)
          .skip(skip),
        User.countDocuments(query),
        User.aggregate([
          { $match: query },
          {
            $group: {
              _id: null,
              totalInvested: { $sum: '$totalInvested' },
              totalEarned: { $sum: '$totalEarned' },
              active: {
                $sum: {
                  $cond: [{ $eq: ['$isActive', true] }, 1, 0],
                },
              },
              whales: {
                $sum: {
                  $cond: [{ $gte: ['$totalInvested', capitalBrackets.whales.min] }, 1, 0],
                },
              },
              bonusClaimed: {
                $sum: {
                  $cond: [{ $eq: ['$freeBonusReceived', true] }, 1, 0],
                },
              },
            },
          },
        ]),
      ]);

      const totals = aggregateTotals[0] || {
        totalInvested: 0,
        totalEarned: 0,
        active: 0,
        whales: 0,
        bonusClaimed: 0,
      };

      const totalPages = Math.max(1, Math.ceil(total / limit));

      res.status(200).json({
        status: 'success',
        results: users.length,
        total,
        meta: {
          page,
          totalPages,
          limit,
          sortField,
          sortDirection: SORT_DIRECTION === 1 ? 'asc' : 'desc',
          totals,
        },
        data: { users },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAllInvestments(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 25));
      const skip = (page - 1) * limit;

      const rawSearch = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const status = typeof req.query.status === 'string' ? req.query.status : 'all';
      const bonus = typeof req.query.bonus === 'string' ? req.query.bonus : 'all';
      const requestedSortField = (req.query.sortField as string) || 'createdAt';
      const sortDirectionParam = (req.query.sortDirection as string) === 'asc' ? 1 : -1;

      const minAmount = req.query.minAmount ? Number(req.query.minAmount) : undefined;
      const maxAmount = req.query.maxAmount ? Number(req.query.maxAmount) : undefined;

      const sortFieldMap: Record<string, string> = {
        createdAt: 'createdAt',
        amount: 'amount',
        startDate: 'startDate',
        status: 'status',
      };
      const sortField = sortFieldMap[requestedSortField] || 'createdAt';
      const sortDirection = sortDirectionParam === 1 ? 1 : -1;

      const matchStage: Record<string, unknown> = {};
      if (status && status !== 'all') {
        matchStage.status = status;
      }
      if (bonus && bonus !== 'all') {
        if (bonus === 'bonus') {
          matchStage.isWelcomeBonusInvestment = true;
        } else if (bonus === 'no-bonus') {
          matchStage.isWelcomeBonusInvestment = { $ne: true };
        }
      }
      if (!Number.isNaN(minAmount) || !Number.isNaN(maxAmount)) {
        const amountRange: Record<string, number> = {};
        if (typeof minAmount === 'number' && !Number.isNaN(minAmount)) {
          amountRange.$gte = minAmount;
        }
        if (typeof maxAmount === 'number' && !Number.isNaN(maxAmount)) {
          amountRange.$lte = maxAmount;
        }
        if (Object.keys(amountRange).length > 0) {
          matchStage.amount = amountRange;
        }
      }

      const escapeRegex = (value: string) => {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };

      const searchRegex =
        rawSearch.length > 0 ? new RegExp(escapeRegex(rawSearch), 'i') : undefined;

      const pipeline: PipelineStage[] = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'investmentplans',
            localField: 'plan',
            foreignField: '_id',
            as: 'plan',
          },
        },
        { $unwind: '$plan' },
      ];

      if (searchRegex) {
        pipeline.push({
          $match: {
            $or: [
              { 'user.name': searchRegex },
              { 'user.email': searchRegex },
              { 'user.telegramUsername': searchRegex },
              { 'plan.name': searchRegex },
            ],
          },
        });
      }

      pipeline.push({
        $project: {
          _id: 1,
          amount: 1,
          status: 1,
          startDate: 1,
          endDate: 1,
          dailyROI: 1,
          createdAt: 1,
          updatedAt: 1,
          isWelcomeBonusInvestment: { $ifNull: ['$isWelcomeBonusInvestment', false] },
          totalROI: { $ifNull: ['$totalEarned', 0] },
          user: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email',
            telegramUsername: '$user.telegramUsername',
            telegramChatId: '$user.telegramChatId',
          },
          plan: {
            _id: '$plan._id',
            name: '$plan.name',
            dailyROI: '$plan.dailyROI',
            termDays: '$plan.termDays',
          },
        },
      });

      const sortStage: PipelineStage = {
        $sort: {
          [sortField]: sortDirection,
        },
      };

      pipeline.push({
        $facet: {
          paginated: [sortStage, { $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
          statusStats: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                totalEarnings: { $sum: '$totalROI' },
              },
            },
          ],
        },
      });

      const aggregateResult = await Investment.aggregate(pipeline);
      const facetOutput = aggregateResult[0] || {
        paginated: [],
        totalCount: [],
        statusStats: [],
      };

      const investments = facetOutput.paginated ?? [];
      const total = facetOutput.totalCount?.[0]?.count ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));

      const statusStats: Array<{
        _id: string;
        count: number;
        totalAmount: number;
        totalEarnings: number;
      }> = facetOutput.statusStats ?? [];

      const totals = statusStats.reduce(
        (acc, stat) => {
          if (stat._id === 'active') acc.active = stat.count;
          if (stat._id === 'completed') acc.completed = stat.count;
          if (stat._id === 'cancelled') acc.cancelled = stat.count;
          acc.totalAmount += stat.totalAmount || 0;
          acc.totalEarnings += stat.totalEarnings || 0;
          return acc;
        },
        { active: 0, completed: 0, cancelled: 0, totalAmount: 0, totalEarnings: 0 }
      );

      // Get total earning wallet and total earned from all users
      const [earningWalletStats, totalEarnedStats] = await Promise.all([
        User.aggregate([
          {
            $group: {
              _id: null,
              totalEarningWallet: { $sum: '$earningWallet' },
            },
          },
        ]),
        User.aggregate([
          {
            $group: {
              _id: null,
              totalEarned: { $sum: '$totalEarned' },
            },
          },
        ]),
      ]);

      const totalEarningWallet = earningWalletStats[0]?.totalEarningWallet || 0;
      const totalEarned = totalEarnedStats[0]?.totalEarned || 0;

      res.status(200).json({
        status: 'success',
        results: investments.length,
        total,
        data: { investments },
        meta: {
          page,
          totalPages,
          limit,
          totals: {
            ...totals,
            totalEarningWallet,
            totalEarned,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select('-password');

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select('-password');

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async generateUserLoginToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select('-password');

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }

      // Generate login token for the user
      const token = authService.generateToken(user);

      res.status(200).json({
        status: 'success',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            telegramChatId: user.telegramChatId,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  // Investment Plan Management
  async getAllPlans(_req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await InvestmentPlan.find().sort({ minAmount: 1 });

      res.status(200).json({
        status: 'success',
        results: plans.length,
        data: { plans },
      });
    } catch (error: any) {
      next(error);
    }
  }

  // Income Management - Get All Incomes with Level ROI
  async getAllIncomes(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 25));
      const skip = (page - 1) * limit;

      const rawSearch = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const incomeType = typeof req.query.incomeType === 'string' ? req.query.incomeType : 'all';
      const level = req.query.level ? parseInt(req.query.level as string, 10) : undefined;
      const status = typeof req.query.status === 'string' ? req.query.status : 'all';
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const minAmount = req.query.minAmount ? Number(req.query.minAmount) : undefined;
      const maxAmount = req.query.maxAmount ? Number(req.query.maxAmount) : undefined;

      const requestedSortField = (req.query.sortField as string) || 'incomeDate';
      const sortDirectionParam = (req.query.sortDirection as string) === 'asc' ? 1 : -1;

      const sortFieldMap: Record<string, string> = {
        incomeDate: 'incomeDate',
        createdAt: 'createdAt',
        amount: 'amount',
        level: 'level',
        incomeType: 'incomeType',
      };
      const sortField = sortFieldMap[requestedSortField] || 'incomeDate';
      const sortDirection = sortDirectionParam === 1 ? 1 : -1;

      const matchStage: Record<string, unknown> = {};

      if (incomeType && incomeType !== 'all') {
        matchStage.incomeType = incomeType;
      }

      if (level !== undefined && !Number.isNaN(level)) {
        matchStage.level = level;
      }

      if (status && status !== 'all') {
        matchStage.status = status;
      }

      if (startDate || endDate) {
        matchStage.incomeDate = {};
        if (startDate) {
          matchStage.incomeDate = { ...matchStage.incomeDate as Record<string, unknown>, $gte: startDate };
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          matchStage.incomeDate = { ...matchStage.incomeDate as Record<string, unknown>, $lte: endOfDay };
        }
      }

      if (!Number.isNaN(minAmount) || !Number.isNaN(maxAmount)) {
        const amountRange: Record<string, number> = {};
        if (typeof minAmount === 'number' && !Number.isNaN(minAmount)) {
          amountRange.$gte = minAmount;
        }
        if (typeof maxAmount === 'number' && !Number.isNaN(maxAmount)) {
          amountRange.$lte = maxAmount;
        }
        if (Object.keys(amountRange).length > 0) {
          matchStage.amount = amountRange;
        }
      }

      const escapeRegex = (value: string) => {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };

      const searchRegex =
        rawSearch.length > 0 ? new RegExp(escapeRegex(rawSearch), 'i') : undefined;

      const pipeline: PipelineStage[] = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'investments',
            localField: 'investmentId',
            foreignField: '_id',
            as: 'investment',
          },
        },
        {
          $unwind: {
            path: '$investment',
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup investment plan from investment
        {
          $lookup: {
            from: 'investmentplans',
            localField: 'investment.plan',
            foreignField: '_id',
            as: 'investmentPlan',
          },
        },
        {
          $unwind: {
            path: '$investmentPlan',
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup referred user for referral income (referenceId contains referred user ID)
        // Convert referenceId string to ObjectId for lookup
        {
          $addFields: {
            referenceIdObjectId: {
              $cond: {
                if: { $and: [{ $ne: ['$referenceId', null] }, { $ne: ['$referenceId', ''] }] },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: '$referenceId' }, 'string'] },
                    then: { $toObjectId: '$referenceId' },
                    else: '$referenceId',
                  },
                },
                else: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'referenceIdObjectId',
            foreignField: '_id',
            as: 'referredUser',
          },
        },
        {
          $unwind: {
            path: '$referredUser',
            preserveNullAndEmptyArrays: true,
          },
        },
      ];

      if (searchRegex) {
        pipeline.push({
          $match: {
            $or: [
              { 'user.name': searchRegex },
              { 'user.email': searchRegex },
              { 'user.telegramUsername': searchRegex },
              { description: searchRegex },
              { referenceId: searchRegex },
            ],
          },
        });
      }

      pipeline.push({
        $project: {
          _id: 1,
          user: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email',
            telegramUsername: '$user.telegramUsername',
            telegramChatId: '$user.telegramChatId',
          },
          incomeType: 1,
          amount: 1,
          earningWalletBefore: 1,
          earningWalletAfter: 1,
          description: 1,
          referenceId: 1,
          investmentId: 1,
          level: 1,
          status: 1,
          incomeDate: 1,
          createdAt: 1,
          updatedAt: 1,
          investment: {
            $cond: {
              if: { $ne: [{ $ifNull: ['$investment._id', null] }, null] },
              then: {
                _id: '$investment._id',
                amount: '$investment.amount',
                status: '$investment.status',
                plan: {
                  $cond: {
                    if: { $ne: [{ $ifNull: ['$investmentPlan._id', null] }, null] },
                    then: {
                      _id: '$investmentPlan._id',
                      name: '$investmentPlan.name',
                      dailyROI: '$investmentPlan.dailyROI',
                      termDays: '$investmentPlan.termDays',
                    },
                    else: null,
                  },
                },
              },
              else: null,
            },
          },
          referredUser: {
            $cond: {
              if: { $ne: [{ $ifNull: ['$referredUser._id', null] }, null] },
              then: {
                _id: '$referredUser._id',
                name: '$referredUser.name',
                email: '$referredUser.email',
                telegramUsername: '$referredUser.telegramUsername',
                telegramChatId: '$referredUser.telegramChatId',
                totalInvested: '$referredUser.totalInvested',
              },
              else: null,
            },
          },
        },
      });

      const sortStage: PipelineStage = {
        $sort: {
          [sortField]: sortDirection,
        },
      };

      pipeline.push({
        $facet: {
          paginated: [sortStage, { $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
          incomeTypeStats: [
            {
              $group: {
                _id: '$incomeType',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
              },
            },
          ],
          levelStats: [
            {
              $match: {
                level: { $exists: true, $ne: null },
              },
            },
            {
              $group: {
                _id: '$level',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
              },
            },
            {
              $sort: { _id: 1 },
            },
          ],
          totalAmount: [
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' },
              },
            },
          ],
        },
      });

      const aggregateResult = await IncomeTransaction.aggregate(pipeline);
      const facetOutput = aggregateResult[0] || {
        paginated: [],
        totalCount: [],
        incomeTypeStats: [],
        levelStats: [],
        totalAmount: [],
      };

      const incomes = facetOutput.paginated ?? [];
      const total = facetOutput.totalCount?.[0]?.count ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));

      const incomeTypeStats: Array<{
        _id: string;
        count: number;
        totalAmount: number;
      }> = facetOutput.incomeTypeStats ?? [];

      const levelStats: Array<{
        _id: number;
        count: number;
        totalAmount: number;
      }> = facetOutput.levelStats ?? [];

      const totalAmount = facetOutput.totalAmount?.[0]?.total ?? 0;

      res.status(200).json({
        status: 'success',
        results: incomes.length,
        total,
        data: { incomes },
        meta: {
          page,
          totalPages,
          limit,
          sortField,
          sortDirection: sortDirection === 1 ? 'asc' : 'desc',
          totals: {
            totalAmount,
            incomeTypeStats,
            levelStats,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  // Settings Management
  async updateSetting(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const { value } = req.body;

      if (value === undefined) {
        res.status(400).json({
          status: 'error',
          message: 'Value is required',
        });
        return;
      }

      const setting = await settingService.updateSetting(key, { value });

      if (!setting) {
        res.status(404).json({
          status: 'error',
          message: 'Setting not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { setting },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async triggerDailyRewards(_req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const startedAt = Date.now();
      const processedInvestments = await incomeService.processDailyROI();
      const durationMs = Date.now() - startedAt;

      res.status(200).json({
        status: 'success',
        data: {
          processedInvestments,
          durationMs,
          message: 'Manual trigger executed: Daily ROI and Team Level ROI processed.',
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async triggerDailyRewardsForce(_req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const startedAt = Date.now();
      const processedInvestments = await incomeService.processDailyROI(true);
      const durationMs = Date.now() - startedAt;

      res.status(200).json({
        status: 'success',
        data: {
          processedInvestments,
          durationMs,
          message: 'Force trigger executed: Daily ROI and Team Level ROI processed without cooldown.',
        },
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const adminManagementController = new AdminManagementController();

