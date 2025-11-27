import { User } from '../../users/models/user.model';
import { WalletAdjustment, IWalletAdjustment } from '../models/wallet-adjustment.model';
import { transactionService } from '../../transactions/services/transaction.service';

export interface CreateWalletAdjustmentDto {
  userId: string;
  walletType: 'investment' | 'earning';
  action: 'add' | 'deduct';
  amount: number;
  description: string;
  adminId: string;
}

export interface WalletAdjustmentListParams {
  userId?: string;
  walletType?: 'investment' | 'earning';
  action?: 'add' | 'deduct';
  adminId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class WalletAdjustmentService {
  /**
   * Create wallet adjustment (add or deduct from investment/earning wallet)
   */
  async createAdjustment(data: CreateWalletAdjustmentDto): Promise<IWalletAdjustment> {
    const user = await User.findById(data.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (data.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    let balanceBefore: number;
    let balanceAfter: number;

    // Perform the adjustment
    if (data.walletType === 'investment') {
      balanceBefore = user.investmentWallet;

      if (data.action === 'add') {
        user.investmentWallet += data.amount;
      } else {
        // Deduct
        if (user.investmentWallet < data.amount) {
          throw new Error('Insufficient investment wallet balance');
        }
        user.investmentWallet -= data.amount;
      }

      balanceAfter = user.investmentWallet;
    } else {
      // Earning wallet
      balanceBefore = user.earningWallet;

      if (data.action === 'add') {
        user.earningWallet += data.amount;
      } else {
        // Deduct
        if (user.earningWallet < data.amount) {
          throw new Error('Insufficient earning wallet balance');
        }
        user.earningWallet -= data.amount;
      }

      balanceAfter = user.earningWallet;
    }

    // Save user with updated balance
    await user.save();

    // Create transaction record
    const transactionType = data.action === 'add' 
      ? (data.walletType === 'investment' ? 'deposit' : 'income')
      : (data.walletType === 'investment' ? 'investment' : 'withdrawal');

    await transactionService.createTransaction({
      user: data.userId,
      type: transactionType,
      amount: data.action === 'add' ? data.amount : -data.amount,
      description: `Admin ${data.action}: ${data.description}`,
      referenceId: `admin-adjustment-${Date.now()}`,
    });

    // Create wallet adjustment record
    const adjustment = new WalletAdjustment({
      user: data.userId,
      walletType: data.walletType,
      action: data.action,
      amount: data.amount,
      balanceBefore,
      balanceAfter,
      description: data.description,
      admin: data.adminId,
    });

    return await adjustment.save();
  }

  /**
   * Get wallet adjustments with filters
   */
  async getAdjustments(params: WalletAdjustmentListParams): Promise<{
    adjustments: IWalletAdjustment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query: any = {};

    if (params.userId) {
      query.user = params.userId;
    }

    if (params.walletType) {
      query.walletType = params.walletType;
    }

    if (params.action) {
      query.action = params.action;
    }

    if (params.adminId) {
      query.admin = params.adminId;
    }

    if (params.startDate || params.endDate) {
      query.createdAt = {};
      if (params.startDate) query.createdAt.$gte = params.startDate;
      if (params.endDate) query.createdAt.$lte = params.endDate;
    }

    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const [adjustments, total] = await Promise.all([
      WalletAdjustment.find(query)
        .populate('user', 'name email telegramUsername')
        .populate('admin', 'username email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      WalletAdjustment.countDocuments(query),
    ]);

    return {
      adjustments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get adjustment by ID
   */
  async getAdjustmentById(id: string): Promise<IWalletAdjustment | null> {
    return await WalletAdjustment.findById(id)
      .populate('user', 'name email telegramUsername investmentWallet earningWallet')
      .populate('admin', 'username email');
  }

  /**
   * Get user's adjustment history
   */
  async getUserAdjustments(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    adjustments: IWalletAdjustment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getAdjustments({
      userId,
      page,
      limit,
    });
  }

  /**
   * Get adjustment statistics
   */
  async getAdjustmentStats(startDate?: Date, endDate?: Date): Promise<{
    totalAdjustments: number;
    totalAdded: number;
    totalDeducted: number;
    totalInvestmentAdded: number;
    totalInvestmentDeducted: number;
    totalEarningAdded: number;
    totalEarningDeducted: number;
  }> {
    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const adjustments = await WalletAdjustment.find(query);

    const stats = {
      totalAdjustments: adjustments.length,
      totalAdded: 0,
      totalDeducted: 0,
      totalInvestmentAdded: 0,
      totalInvestmentDeducted: 0,
      totalEarningAdded: 0,
      totalEarningDeducted: 0,
    };

    adjustments.forEach((adj) => {
      if (adj.action === 'add') {
        stats.totalAdded += adj.amount;
        if (adj.walletType === 'investment') {
          stats.totalInvestmentAdded += adj.amount;
        } else {
          stats.totalEarningAdded += adj.amount;
        }
      } else {
        stats.totalDeducted += adj.amount;
        if (adj.walletType === 'investment') {
          stats.totalInvestmentDeducted += adj.amount;
        } else {
          stats.totalEarningDeducted += adj.amount;
        }
      }
    });

    return stats;
  }
}

export const walletAdjustmentService = new WalletAdjustmentService();



