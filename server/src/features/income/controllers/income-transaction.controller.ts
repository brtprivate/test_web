import { Response, NextFunction } from 'express';
import { incomeTransactionService } from '../services/income-transaction.service';
import { AuthRequest } from '../../../middleware/auth.middleware';

export class IncomeTransactionController {
  async getMyIncomeTransactions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const incomeType = req.query.incomeType as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = parseInt(req.query.skip as string) || 0;

      const { transactions, total } = await incomeTransactionService.getUserIncomeTransactions(
        userId,
        incomeType,
        startDate,
        endDate,
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

  async getIncomeSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const summary = await incomeTransactionService.getIncomeSummary(userId, startDate, endDate);

      res.status(200).json({
        status: 'success',
        data: { summary },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getDailyIncome(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const transactions = await incomeTransactionService.getDailyIncome(userId, date);

      res.status(200).json({
        status: 'success',
        results: transactions.length,
        data: { transactions },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getIncomeByType(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const { type } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const total = await incomeTransactionService.getTotalIncomeByType(
        userId,
        type,
        startDate,
        endDate
      );

      res.status(200).json({
        status: 'success',
        data: {
          incomeType: type,
          totalIncome: total,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const incomeTransactionController = new IncomeTransactionController();








