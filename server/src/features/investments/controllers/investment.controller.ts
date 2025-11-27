import { Request, Response, NextFunction } from 'express';
import { investmentService } from '../services/investment.service';
import { CreateInvestmentDto } from '../types/investment.types';
import { AuthRequest } from '../../../middleware/auth.middleware';

export class InvestmentController {
  async createInvestment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const investmentData: CreateInvestmentDto = req.body;
      const investment = await investmentService.createInvestment(userId, investmentData);
      
      res.status(201).json({
        status: 'success',
        data: { investment },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getMyInvestments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const status = req.query.status as string;
      const investments = await investmentService.getUserInvestments(userId, status);
      
      res.status(200).json({
        status: 'success',
        results: investments.length,
        data: { investments },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getInvestmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const investment = await investmentService.getInvestmentById(id);
      
      if (!investment) {
        res.status(404).json({
          status: 'error',
          message: 'Investment not found',
        });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        data: { investment },
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const investmentController = new InvestmentController();








