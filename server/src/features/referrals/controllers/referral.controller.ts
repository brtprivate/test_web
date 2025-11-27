import { Response, NextFunction } from 'express';
import { referralService } from '../services/referral.service';
import { AuthRequest } from '../../../middleware/auth.middleware';

export class ReferralController {
  async getMyReferralCode(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const referralCode = await referralService.getReferralCode(userId);

      res.status(200).json({
        status: 'success',
        data: { referralCode },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getReferralStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const stats = await referralService.getReferralStats(userId);

      res.status(200).json({
        status: 'success',
        data: { stats },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getMyReferrals(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const { referrals, total } = await referralService.getMyReferrals(userId);

      res.status(200).json({
        status: 'success',
        results: referrals.length,
        total,
        data: { referrals },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getReferrals(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10))) : undefined;
      const skip = req.query.skip ? Math.max(0, parseInt(req.query.skip as string, 10)) : undefined;

      const { referrals, total } = await referralService.getMyReferrals(userId, limit, skip);

      res.status(200).json({
        status: 'success',
        results: referrals.length,
        total,
        data: { referrals },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getTeamStructure(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const maxLevel = parseInt(req.query.maxLevel as string) || 9;
      const team = await referralService.getTeamStructure(userId, maxLevel);

      res.status(200).json({
        status: 'success',
        data: { team },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getLevelUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const levelParam = parseInt(req.query.level as string, 10);

      if (Number.isNaN(levelParam) || levelParam < 1) {
        res.status(400).json({
          status: 'error',
          message: 'Valid level query parameter is required',
        });
        return;
      }

      const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10))) : 25;
      const skip = req.query.skip ? Math.max(0, parseInt(req.query.skip as string, 10)) : 0;

      const result = await referralService.getLevelUsers(userId, levelParam, limit, skip);

      res.status(200).json({
        status: 'success',
        results: result.users.length,
        total: result.total,
        data: {
          level: result.level,
          users: result.users,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getLevelWiseStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const maxLevels = parseInt(req.query.maxLevels as string) || 10;
      const levels = await referralService.getLevelWiseStats(userId, maxLevels);

      res.status(200).json({
        status: 'success',
        data: { levels },
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const referralController = new ReferralController();






