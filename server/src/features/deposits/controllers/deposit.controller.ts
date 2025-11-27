import { Response, NextFunction } from 'express';
import { depositService } from '../services/deposit.service';
import { CreateDepositDto, UpdateDepositStatusDto } from '../types/deposit.types';
import { AuthRequest } from '../../../middleware/auth.middleware';
import { AdminAuthRequest } from '../../../middleware/admin.middleware';

export class DepositController {
  /**
   * Create a new deposit request
   */
  async createDeposit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const depositData: CreateDepositDto = req.body;

      if (!depositData.amount || depositData.amount <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Valid deposit amount is required',
        });
        return;
      }

      const deposit = await depositService.createDeposit(userId, depositData);

      res.status(201).json({
        status: 'success',
        message: 'Deposit request created successfully',
        data: { deposit },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get user's deposits
   */
  async getUserDeposits(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = parseInt(req.query.skip as string) || 0;

      const result = await depositService.getUserDeposits(userId, status, limit, skip);

      res.status(200).json({
        status: 'success',
        results: result.deposits.length,
        total: result.total,
        data: { deposits: result.deposits },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get deposit by ID
   */
  async getDepositById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const { id } = req.params;
      const deposit = await depositService.getDepositById(id);

      if (!deposit) {
        res.status(404).json({
          status: 'error',
          message: 'Deposit not found',
        });
        return;
      }

      // Check if deposit belongs to user
      if (deposit.user.toString() !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { deposit },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Update deposit status (Admin only)
   */
  async updateDepositStatus(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateDepositStatusDto = req.body;

      if (!updateData.status) {
        res.status(400).json({
          status: 'error',
          message: 'Status is required',
        });
        return;
      }

      const deposit = await depositService.updateDepositStatus(id, updateData);

      res.status(200).json({
        status: 'success',
        message: 'Deposit status updated successfully',
        data: { deposit },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get all deposits (Admin only)
   */
  async getAllDeposits(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = parseInt(req.query.skip as string) || 0;

      const result = await depositService.getAllDeposits(status, limit, skip);

      res.status(200).json({
        status: 'success',
        results: result.deposits.length,
        total: result.total,
        data: { deposits: result.deposits },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get pending deposits count (Admin only)
   */
  async getPendingDepositsCount(_req: AdminAuthRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      const count = await depositService.getPendingDepositsCount();

      res.status(200).json({
        status: 'success',
        data: { count },
      });
    } catch (error: any) {
      _next(error);
    }
  }
}

export const depositController = new DepositController();

