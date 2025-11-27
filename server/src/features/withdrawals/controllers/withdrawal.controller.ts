import { Response, NextFunction } from 'express';
import { withdrawalService } from '../services/withdrawal.service';
import { CreateWithdrawalDto, UpdateWithdrawalStatusDto } from '../types/withdrawal.types';
import { AuthRequest } from '../../../middleware/auth.middleware';
import { AdminAuthRequest } from '../../../middleware/admin.middleware';

export class WithdrawalController {
  /**
   * Create a new withdrawal request
   */
  async createWithdrawal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const withdrawalData: CreateWithdrawalDto = req.body;

      if (!withdrawalData.amount || withdrawalData.amount <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Valid withdrawal amount is required',
        });
        return;
      }

      if (!withdrawalData.walletAddress || withdrawalData.walletAddress.trim().length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'Wallet address is required',
        });
        return;
      }

      const withdrawal = await withdrawalService.createWithdrawal(userId, withdrawalData);

      res.status(201).json({
        status: 'success',
        message: 'Withdrawal request created successfully. Amount deducted from earning wallet.',
        data: { withdrawal },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get user's withdrawals
   */
  async getUserWithdrawals(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      const result = await withdrawalService.getUserWithdrawals(userId, status, limit, skip);

      res.status(200).json({
        status: 'success',
        results: result.withdrawals.length,
        total: result.total,
        data: { withdrawals: result.withdrawals },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get withdrawal by ID
   */
  async getWithdrawalById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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
      const withdrawal = await withdrawalService.getWithdrawalById(id);

      if (!withdrawal) {
        res.status(404).json({
          status: 'error',
          message: 'Withdrawal not found',
        });
        return;
      }

      // Check if withdrawal belongs to user
      if (withdrawal.user.toString() !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { withdrawal },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Update withdrawal status (Admin only)
   */
  async updateWithdrawalStatus(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateWithdrawalStatusDto = req.body;
      const adminId = req.admin?.id;

      if (!updateData.status) {
        res.status(400).json({
          status: 'error',
          message: 'Status is required',
        });
        return;
      }

      const withdrawal = await withdrawalService.updateWithdrawalStatus(id, updateData, adminId);

      res.status(200).json({
        status: 'success',
        message: 'Withdrawal status updated successfully',
        data: { withdrawal },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get all withdrawals (Admin only)
   */
  async getAllWithdrawals(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 25));
      const skip = (page - 1) * limit;

      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
      
      const requestedSortField = (req.query.sortField as string) || 'createdAt';
      const sortDirectionParam = (req.query.sortDirection as string) === 'asc' ? 1 : -1;

      const result = await withdrawalService.getAllWithdrawals(
        status,
        search,
        requestedSortField,
        sortDirectionParam,
        limit,
        skip
      );

      const totalPages = Math.ceil(result.total / limit);

      res.status(200).json({
        status: 'success',
        results: result.withdrawals.length,
        total: result.total,
        page,
        limit,
        totalPages,
        data: { withdrawals: result.withdrawals },
        meta: {
          page,
          limit,
          totalPages,
          total: result.total,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get pending withdrawals count (Admin only)
   */
  async getPendingWithdrawalsCount(_req: AdminAuthRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      const count = await withdrawalService.getPendingWithdrawalsCount();

      res.status(200).json({
        status: 'success',
        data: { count },
      });
    } catch (error: any) {
      _next(error);
    }
  }
}

export const withdrawalController = new WithdrawalController();

