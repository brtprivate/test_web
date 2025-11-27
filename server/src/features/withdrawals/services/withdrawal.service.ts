import { IWithdrawal, Withdrawal } from '../models/withdrawal.model';
import { User } from '../../users/models/user.model';
import { CreateWithdrawalDto, UpdateWithdrawalStatusDto } from '../types/withdrawal.types';
import { walletService } from '../../wallet/services/wallet.service';

export class WithdrawalService {
  /**
   * Create a new withdrawal request
   * Deducts amount from user's earning wallet immediately
   */
  async createWithdrawal(userId: string, data: CreateWithdrawalDto): Promise<IWithdrawal> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate amount
    if (data.amount <= 0) {
      throw new Error('Withdrawal amount must be greater than 0');
    }

    // Check if user has sufficient balance in earning wallet
    if (user.earningWallet < data.amount) {
      throw new Error('Insufficient earning wallet balance');
    }

    // Validate wallet address (compulsory)
    if (!data.walletAddress || data.walletAddress.trim().length === 0) {
      throw new Error('Wallet address is required');
    }

    // Basic wallet address validation (starts with 0x and has 42 characters for BEP20)
    const walletAddress = data.walletAddress.trim();
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      throw new Error('Invalid wallet address format. Must be a valid BEP20 address (0x followed by 40 hex characters)');
    }

    // Deduct amount from earning wallet immediately when request is created
    await walletService.deductFromEarningWallet(
      userId,
      data.amount,
      `Withdrawal request to ${walletAddress}`,
      undefined // Will be set after withdrawal is created
    );

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      user: userId,
      amount: data.amount,
      currency: data.currency || 'USDT',
      network: data.network || 'BEP20',
      walletAddress,
      status: 'pending',
      userNote: data.userNote,
    });

    const savedWithdrawal = await withdrawal.save();

    // Update transaction reference ID
    // Note: This would require updating the transaction service to support updating referenceId
    // For now, the withdrawal ID is stored in the withdrawal record itself

    return savedWithdrawal;
  }

  /**
   * Update withdrawal status (admin only)
   */
  async updateWithdrawalStatus(
    withdrawalId: string,
    data: UpdateWithdrawalStatusDto,
    adminId?: string
  ): Promise<IWithdrawal> {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    const oldStatus = withdrawal.status;

    // If status is being changed to approved
    if (data.status === 'approved' && oldStatus === 'pending') {
      withdrawal.approvedAt = new Date();
      if (adminId) {
        withdrawal.approvedBy = adminId as any;
      }
    }

    // If status is being changed to completed
    if (data.status === 'completed' && oldStatus !== 'completed') {
      withdrawal.completedAt = new Date();
      if (data.transactionHash) {
        withdrawal.transactionHash = data.transactionHash;
      }
    }

    // If status is being changed to rejected
    if (data.status === 'rejected' && oldStatus === 'pending') {
      withdrawal.rejectedAt = new Date();
      if (adminId) {
        withdrawal.rejectedBy = adminId as any;
      }

      // Refund amount back to user's earning wallet if rejected
      await walletService.addToEarningWallet(
        withdrawal.user.toString(),
        withdrawal.amount,
        'income',
        `Withdrawal rejected - refund`,
        String(withdrawal._id)
      );
    }

    // If status is being changed to cancelled
    if (data.status === 'cancelled' && oldStatus === 'pending') {
      // Refund amount back to user's earning wallet if cancelled
      await walletService.addToEarningWallet(
        withdrawal.user.toString(),
        withdrawal.amount,
        'income',
        `Withdrawal cancelled - refund`,
        String(withdrawal._id)
      );
    }

    withdrawal.status = data.status;
    if (data.adminNote) {
      withdrawal.adminNote = data.adminNote;
    }

    return await withdrawal.save();
  }

  /**
   * Get user's withdrawals
   */
  async getUserWithdrawals(
    userId: string,
    status?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ withdrawals: IWithdrawal[]; total: number }> {
    const query: any = { user: userId };
    if (status) {
      query.status = status;
    }

    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Withdrawal.countDocuments(query);

    return { withdrawals, total };
  }

  /**
   * Get withdrawal by ID
   */
  async getWithdrawalById(withdrawalId: string): Promise<IWithdrawal | null> {
    return await Withdrawal.findById(withdrawalId).populate('user', 'name email telegramUsername telegramChatId');
  }

  /**
   * Get all withdrawals (admin)
   */
  async getAllWithdrawals(
    status?: string,
    search?: string,
    sortField: string = 'createdAt',
    sortDirection: number = -1,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ withdrawals: IWithdrawal[]; total: number }> {
    const query: any = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }

    // Build aggregation pipeline for search
    const pipeline: any[] = [];

    // Match stage
    if (Object.keys(query).length > 0) {
      pipeline.push({ $match: query });
    }

    // Lookup user data
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userData',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$userData',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Search functionality - search in user name, email, telegramUsername, walletAddress
    if (search && search.trim()) {
      const searchTrimmed = search.trim();
      const searchRegex = { $regex: searchTrimmed, $options: 'i' };
      const searchConditions: any[] = [
        { 'userData.name': searchRegex },
        { 'userData.email': searchRegex },
        { 'userData.telegramUsername': searchRegex },
        { walletAddress: searchRegex },
        { transactionHash: searchRegex },
      ];

      // If search is a number, also search by telegramChatId
      const searchAsNumber = Number(searchTrimmed);
      if (!isNaN(searchAsNumber)) {
        searchConditions.push({ 'userData.telegramChatId': searchAsNumber });
      }

      pipeline.push({
        $match: {
          $or: searchConditions,
        },
      });
    }

    // Sort stage
    const sortFieldMap: Record<string, string> = {
      createdAt: 'createdAt',
      amount: 'amount',
      status: 'status',
      updatedAt: 'updatedAt',
    };
    const validSortField = sortFieldMap[sortField] || 'createdAt';
    pipeline.push({
      $sort: { [validSortField]: sortDirection },
    });

    // Count total before pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Withdrawal.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Lookup approvedBy and rejectedBy
    pipeline.push({
      $lookup: {
        from: 'admins',
        localField: 'approvedBy',
        foreignField: '_id',
        as: 'approvedByData',
      },
    });

    pipeline.push({
      $lookup: {
        from: 'admins',
        localField: 'rejectedBy',
        foreignField: '_id',
        as: 'rejectedByData',
      },
    });

    pipeline.push({
      $addFields: {
        approvedBy: { $arrayElemAt: ['$approvedByData', 0] },
        rejectedBy: { $arrayElemAt: ['$rejectedByData', 0] },
        user: {
          _id: '$userData._id',
          name: '$userData.name',
          email: '$userData.email',
          telegramUsername: '$userData.telegramUsername',
          telegramChatId: '$userData.telegramChatId',
          referralCode: '$userData.referralCode',
        },
      },
    });

    pipeline.push({
      $project: {
        userData: 0,
        approvedByData: 0,
        rejectedByData: 0,
      },
    });

    const withdrawals = await Withdrawal.aggregate(pipeline);

    return { withdrawals, total };
  }

  /**
   * Get pending withdrawals count (admin)
   */
  async getPendingWithdrawalsCount(): Promise<number> {
    return await Withdrawal.countDocuments({ status: 'pending' });
  }
}

export const withdrawalService = new WithdrawalService();

