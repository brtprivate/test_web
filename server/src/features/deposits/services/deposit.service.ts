import { IDeposit, Deposit } from '../models/deposit.model';
import { User } from '../../users/models/user.model';
import { CreateDepositDto, UpdateDepositStatusDto } from '../types/deposit.types';
import { walletService } from '../../wallet/services/wallet.service';

export class DepositService {
  /**
   * Create a new deposit request
   */
  async createDeposit(userId: string, data: CreateDepositDto): Promise<IDeposit> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate amount
    if (data.amount <= 0) {
      throw new Error('Deposit amount must be greater than 0');
    }

    // Use user's wallet address if provided, otherwise use from data
    const walletAddress = user.walletAddress || data.walletAddress;
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    // Check if transaction hash already exists (prevent duplicates)
    if (data.transactionHash) {
      const existingDeposit = await Deposit.findOne({
        transactionHash: data.transactionHash,
      });
      if (existingDeposit) {
        throw new Error('Deposit with this transaction hash already exists');
      }
    }

    // Create deposit
    const deposit = new Deposit({
      user: userId,
      amount: data.amount,
      currency: data.currency || 'USDT',
      network: data.network || 'TRC20',
      transactionHash: data.transactionHash,
      walletAddress,
      fromAddress: data.fromAddress,
      status: 'pending',
      description: data.description || `Deposit of ${data.amount} ${data.currency || 'USDT'}`,
    });

    return await deposit.save();
  }

  /**
   * Update deposit status (admin only)
   */
  async updateDepositStatus(
    depositId: string,
    data: UpdateDepositStatusDto
  ): Promise<IDeposit> {
    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      throw new Error('Deposit not found');
    }

    // If status is being changed to completed, add to investment wallet
    if (data.status === 'completed' && deposit.status !== 'completed') {
      // Add to investment wallet
      const depositId = String(deposit._id);
      await walletService.addToInvestmentWallet(
        deposit.user.toString(),
        deposit.amount,
        `Deposit of ${deposit.amount} ${deposit.currency} via ${deposit.network}`,
        depositId
      );

      deposit.completedAt = new Date();
    }

    // If status is being changed to confirmed
    if (data.status === 'confirmed' && deposit.status === 'pending') {
      deposit.confirmedAt = new Date();
    }

    deposit.status = data.status;
    if (data.adminNote) {
      deposit.adminNote = data.adminNote;
    }
    if (data.confirmationCount !== undefined) {
      deposit.confirmationCount = data.confirmationCount;
    }

    return await deposit.save();
  }

  /**
   * Get user's deposits
   */
  async getUserDeposits(
    userId: string,
    status?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ deposits: IDeposit[]; total: number }> {
    const query: any = { user: userId };
    if (status) {
      query.status = status;
    }

    const deposits = await Deposit.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Deposit.countDocuments(query);

    return { deposits, total };
  }

  /**
   * Get deposit by ID
   */
  async getDepositById(depositId: string): Promise<IDeposit | null> {
    return await Deposit.findById(depositId).populate('user', 'name email telegramUsername');
  }

  /**
   * Get all deposits (admin)
   */
  async getAllDeposits(
    status?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ deposits: IDeposit[]; total: number }> {
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const deposits = await Deposit.find(query)
      .populate('user', 'name email telegramUsername walletAddress')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Deposit.countDocuments(query);

    return { deposits, total };
  }

  /**
   * Get pending deposits count (admin)
   */
  async getPendingDepositsCount(): Promise<number> {
    return await Deposit.countDocuments({ status: 'pending' });
  }

  /**
   * Auto-confirm deposit based on transaction hash (if blockchain integration exists)
   */
  async confirmDepositByHash(transactionHash: string): Promise<IDeposit | null> {
    const deposit = await Deposit.findOne({ transactionHash, status: 'pending' });
    if (!deposit) {
      return null;
    }

    // Update to confirmed status
    const depositId = String(deposit._id);
    return await this.updateDepositStatus(depositId, {
      status: 'confirmed',
      confirmationCount: 1,
    });
  }
}

export const depositService = new DepositService();

