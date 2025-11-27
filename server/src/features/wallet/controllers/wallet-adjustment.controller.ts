import { Response, NextFunction } from 'express';
import { AdminAuthRequest } from '../../../middleware/admin.middleware';
import { walletAdjustmentService, CreateWalletAdjustmentDto, WalletAdjustmentListParams } from '../services/wallet-adjustment.service';

export class WalletAdjustmentController {
  /**
   * Create wallet adjustment (add or deduct)
   */
  async createAdjustment(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.admin?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Admin not authenticated',
        });
        return;
      }

      const { userId, walletType, action, amount, description } = req.body;

      // Validation
      if (!userId) {
        res.status(400).json({
          status: 'error',
          message: 'User ID is required',
        });
        return;
      }

      if (!walletType || !['investment', 'earning'].includes(walletType)) {
        res.status(400).json({
          status: 'error',
          message: 'Wallet type must be either "investment" or "earning"',
        });
        return;
      }

      if (!action || !['add', 'deduct'].includes(action)) {
        res.status(400).json({
          status: 'error',
          message: 'Action must be either "add" or "deduct"',
        });
        return;
      }

      if (!amount || amount <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Valid amount is required (must be greater than 0)',
        });
        return;
      }

      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'Description is required',
        });
        return;
      }

      const adjustmentData: CreateWalletAdjustmentDto = {
        userId,
        walletType,
        action,
        amount: Number(amount),
        description: description.trim(),
        adminId,
      };

      const adjustment = await walletAdjustmentService.createAdjustment(adjustmentData);

      res.status(201).json({
        status: 'success',
        message: `Successfully ${action === 'add' ? 'added' : 'deducted'} ${amount} from ${walletType} wallet`,
        data: { adjustment },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get wallet adjustments with filters
   */
  async getAdjustments(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        userId,
        walletType,
        action,
        adminId,
        startDate,
        endDate,
        page = 1,
        limit = 50,
      } = req.query;

      const params: WalletAdjustmentListParams = {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
      };

      if (userId) params.userId = String(userId);
      if (walletType && ['investment', 'earning'].includes(String(walletType))) {
        params.walletType = walletType as 'investment' | 'earning';
      }
      if (action && ['add', 'deduct'].includes(String(action))) {
        params.action = action as 'add' | 'deduct';
      }
      if (adminId) params.adminId = String(adminId);
      if (startDate) params.startDate = new Date(String(startDate));
      if (endDate) params.endDate = new Date(String(endDate));

      const result = await walletAdjustmentService.getAdjustments(params);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get adjustment by ID
   */
  async getAdjustmentById(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const adjustment = await walletAdjustmentService.getAdjustmentById(id);

      if (!adjustment) {
        res.status(404).json({
          status: 'error',
          message: 'Wallet adjustment not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { adjustment },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get user's adjustment history
   */
  async getUserAdjustments(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const result = await walletAdjustmentService.getUserAdjustments(
        userId,
        Number(page) || 1,
        Number(limit) || 50
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get adjustment statistics
   */
  async getAdjustmentStats(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const stats = await walletAdjustmentService.getAdjustmentStats(
        startDate ? new Date(String(startDate)) : undefined,
        endDate ? new Date(String(endDate)) : undefined
      );

      res.status(200).json({
        status: 'success',
        data: { stats },
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const walletAdjustmentController = new WalletAdjustmentController();



