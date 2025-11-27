import { ITransaction, Transaction } from '../models/transaction.model';
import { User } from '../../users/models/user.model';
import { CreateTransactionDto } from '../types/transaction.types';

export class TransactionService {
  async createTransaction(data: CreateTransactionDto): Promise<ITransaction> {
    // Get user's current balance
    const user = await User.findById(data.user);
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate balance after based on transaction type
    let balanceAfter = 0;
    if (data.type === 'investment') {
      balanceAfter = user.investmentWallet + (data.amount >= 0 ? data.amount : 0) - (data.amount < 0 ? Math.abs(data.amount) : 0);
    } else if (data.type === 'withdrawal') {
      balanceAfter = user.earningWallet + (data.amount >= 0 ? data.amount : 0) - (data.amount < 0 ? Math.abs(data.amount) : 0);
    } else {
      // For income, referral, bonus, team_income - use earning wallet
      balanceAfter = user.earningWallet + (data.amount >= 0 ? data.amount : 0) - (data.amount < 0 ? Math.abs(data.amount) : 0);
    }

    const transaction = new Transaction({
      ...data,
      balanceAfter,
      status: data.status || 'completed',
    });

    return await transaction.save();
  }

  async getUserTransactions(
    userId: string,
    type?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ transactions: ITransaction[]; total: number }> {
    const query: any = { user: userId };
    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Transaction.countDocuments(query);

    return { transactions, total };
  }

  async getTransactionById(id: string): Promise<ITransaction | null> {
    return await Transaction.findById(id).populate('user');
  }

  async getTransactionsByType(
    type: string,
    limit: number = 100
  ): Promise<ITransaction[]> {
    return await Transaction.find({ type })
      .populate('user')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const transactionService = new TransactionService();

