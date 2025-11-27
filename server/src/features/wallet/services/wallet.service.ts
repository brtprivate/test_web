import { User } from '../../users/models/user.model';
import { transactionService } from '../../transactions/services/transaction.service';

export class WalletService {
  async getBalances(userId: string): Promise<{ investmentWallet: number; earningWallet: number; total: number }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      investmentWallet: user.investmentWallet,
      earningWallet: user.earningWallet,
      total: user.investmentWallet + user.earningWallet,
    };
  }

  async getInvestmentWallet(userId: string): Promise<number> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.investmentWallet;
  }

  async getEarningWallet(userId: string): Promise<number> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.earningWallet;
  }

  // Add to Earning Wallet (for all earnings)
  async addToEarningWallet(
    userId: string,
    amount: number,
    type: 'income' | 'deposit' | 'referral' | 'bonus' | 'team_income' | 'weekly_trade',
    description?: string,
    referenceId?: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.earningWallet += amount;
    await user.save();

    // Create transaction
    await transactionService.createTransaction({
      user: userId,
      type,
      amount,
      description: description || `Earning wallet credit: ${type}`,
      referenceId,
    });
  }

  // Add to Investment Wallet (for deposits/transfers)
  async addToInvestmentWallet(
    userId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.investmentWallet += amount;
    await user.save();

    // Create transaction
    await transactionService.createTransaction({
      user: userId,
      type: 'deposit',
      amount,
      description: description || 'Investment wallet deposit',
      referenceId,
    });
  }

  // Transfer from Earning Wallet to Investment Wallet
  async transferToInvestmentWallet(
    userId: string,
    amount: number
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.earningWallet < amount) {
      throw new Error('Insufficient earning wallet balance');
    }

    user.earningWallet -= amount;
    user.investmentWallet += amount;
    await user.save();

    // Create transaction for transfer
    await transactionService.createTransaction({
      user: userId,
      type: 'deposit',
      amount,
      description: 'Transfer from earning wallet to investment wallet',
    });
  }

  // Deduct from Investment Wallet (for investments)
  async deductFromInvestmentWallet(
    userId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.investmentWallet < amount) {
      throw new Error('Insufficient investment wallet balance');
    }

    user.investmentWallet -= amount;
    await user.save();

    // Create transaction
    await transactionService.createTransaction({
      user: userId,
      type: 'investment',
      amount: -amount,
      description: description || 'Investment wallet debit',
      referenceId,
    });
  }

  // Deduct from Earning Wallet (for withdrawals)
  async deductFromEarningWallet(
    userId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.earningWallet < amount) {
      throw new Error('Insufficient earning wallet balance');
    }

    user.earningWallet -= amount;
    await user.save();

    // Create transaction
    await transactionService.createTransaction({
      user: userId,
      type: 'withdrawal',
      amount: -amount,
      description: description || 'Earning wallet withdrawal',
      referenceId,
    });
  }

  async processWithdrawal(
    userId: string,
    amount: number,
    withdrawalAddress: string
  ): Promise<void> {
    // Withdrawals are from Earning Wallet only
    await this.deductFromEarningWallet(
      userId,
      amount,
      `Withdrawal to ${withdrawalAddress}`
    );

    // TODO: Integrate with payment gateway/blockchain for actual withdrawal
    // For now, just deduct from earning wallet
  }
}

export const walletService = new WalletService();

