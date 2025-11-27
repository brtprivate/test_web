import { Response, NextFunction } from 'express';
import { incomeService } from '../services/income.service';
import { AuthRequest } from '../../../middleware/auth.middleware';

export class IncomeController {
  async getMyIncome(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      const income = await incomeService.getUserIncome(userId, startDate, endDate);

      res.status(200).json({
        status: 'success',
        data: { income },
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const incomeController = new IncomeController();

