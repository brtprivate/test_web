import { Response, NextFunction } from 'express';
import { walletService } from '../services/wallet.service';
import { AuthRequest } from '../../../middleware/auth.middleware';
import { walletMonitorService } from '../../../services/wallet-monitor.service';
import { withdrawalService } from '../../withdrawals/services/withdrawal.service';

export class WalletController {
  async getBalances(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const balances = await walletService.getBalances(userId);

      res.status(200).json({
        status: 'success',
        data: { balances },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async transferToInvestment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const { amount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Valid transfer amount is required',
        });
        return;
      }

      await walletService.transferToInvestmentWallet(userId, amount);

      res.status(200).json({
        status: 'success',
        message: 'Amount transferred to investment wallet',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async withdraw(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const { amount, address } = req.body; // Changed from withdrawalAddress to address for frontend compatibility

      if (!amount || amount <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Valid withdrawal amount is required',
        });
        return;
      }

      if (!address) {
        res.status(400).json({
          status: 'error',
          message: 'Wallet address is required',
        });
        return;
      }

      // Use withdrawal service to create withdrawal request
      // This will deduct from earning wallet and create a pending withdrawal
      const withdrawal = await withdrawalService.createWithdrawal(userId, {
        amount,
        walletAddress: address,
        currency: 'BNB',
        network: 'BEP20',
      });

      res.status(200).json({
        status: 'success',
        message: 'Withdrawal request created successfully. Amount deducted from earning wallet.',
        data: { withdrawal },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async monitorWallet(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      if (!walletMonitorService) {
        res.status(503).json({
          status: 'error',
          message: 'Wallet monitor is not configured on the server',
        });
        return;
      }

      await walletMonitorService.monitorUserWallet(userId);

      res.status(200).json({
        status: 'success',
        message: 'Wallet check completed',
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const walletController = new WalletController();

