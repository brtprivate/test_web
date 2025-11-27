import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service';
import { AuthRequest } from '../../../middleware/auth.middleware';

export class TransactionController {
  async getMyTransactions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const type = req.query.type as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = parseInt(req.query.skip as string) || 0;

      const { transactions, total } = await transactionService.getUserTransactions(
        userId,
        type,
        limit,
        skip
      );

      res.status(200).json({
        status: 'success',
        results: transactions.length,
        total,
        data: { transactions },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await transactionService.getTransactionById(id);

      if (!transaction) {
        res.status(404).json({
          status: 'error',
          message: 'Transaction not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { transaction },
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();








