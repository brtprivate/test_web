import { Response, NextFunction } from 'express';
import { walletGeneratorService, WalletMonitorService } from '../own-pay.service';
import { User } from '../../users/models/user.model';
import { Deposit } from '../../deposits/models/deposit.model';
import { walletService } from '../../wallet/services/wallet.service';
import { depositService } from '../../deposits/services/deposit.service';
import { investmentService } from '../../investments/services/investment.service';
import { AuthRequest } from '../../../middleware/auth.middleware';
import { AdminAuthRequest } from '../../../middleware/admin.middleware';
import { env } from '../../../config/env';
import { Web3 } from 'web3';

export class PaymentController {
  /**
   * Generate new wallet for user
   */
  async generateNewWallet(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          status: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Check if user already has a wallet
      const user = await User.findById(userId).select('+privateKey');
      if (user && user.walletAddress && user.privateKey) {
        console.log(`User ${userId} already has a wallet, returning existing wallet`);
        res.status(200).json({
          status: true,
          wallet: {
            address: user.walletAddress,
            privateKey: user.privateKey,
          },
          message: 'Using existing wallet',
          existing: true,
        });
        return;
      }

      // Generate a new wallet if user doesn't have one
      const wallet = walletGeneratorService.generateWallet();

      // Save to user
      if (user) {
        user.walletAddress = wallet.address;
        user.privateKey = wallet.privateKey;
        await user.save();
      }

      res.status(200).json({
        status: true,
        wallet: wallet,
        message: 'Wallet generated successfully',
        existing: false,
      });
    } catch (error: any) {
      console.error('Error in generateNewWallet:', error);
      res.status(500).json({
        status: false,
        message: 'Failed to generate wallet: ' + error.message,
      });
    }
  }

  /**
   * Save wallet to user profile
   */
  async saveWallet(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      const walletAddress = req.body.walletAddress;
      const walletPrivateKey = req.body.walletPrivateKey;
      const userId = req.user?.id;

      if (!walletAddress || !walletPrivateKey) {
        res.status(400).json({
          message: 'Missing required parameters',
          status: false,
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          message: 'User not authenticated',
          status: false,
        });
        return;
      }

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        res.status(400).json({
          message: 'Invalid wallet address format',
          status: false,
        });
        return;
      }

      console.log(`Saving wallet ${walletAddress} to user ${userId}`);

      // Update user document with wallet information
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          message: 'User not found',
          status: false,
        });
        return;
      }

      user.walletAddress = walletAddress;
      user.privateKey = walletPrivateKey;
      await user.save();

      console.log('Wallet saved successfully');

      res.status(200).json({
        message: 'Wallet saved successfully',
        status: true,
      });
    } catch (error: any) {
      console.error('Error saving wallet:', error);
      res.status(500).json({
        message: 'Error saving wallet: ' + error.message,
        status: false,
      });
    }
  }

  /**
   * Start monitoring wallet for deposits
   */
  async startMonitoring(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { walletAddress, walletPrivateKey, amount, planId } = req.body;
      const userId = req.user?.id;

      if (!walletAddress || !walletPrivateKey) {
        res.status(400).json({
          status: false,
          message: 'Wallet address and private key are required',
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          status: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get user data
      const userData = await User.findById(userId);
      if (!userData) {
        res.status(404).json({
          status: false,
          message: 'User not found',
        });
        return;
      }

      // Get wallet addresses from env with fallbacks to OwnPay configuration
      const usdtReceiveWallet = env.USDT_RECEIVE_WALLET || env.OWN_PAY_ADDRESS;
      const gasWallet = env.GAS_WALLET || env.OWN_PAY_GAS_ADDRESS;
      const gasPrivateKey = env.GAS_PRIVATE_KEY || env.OWN_PAY_GAS_PRIVATE_KEY;

      if (!usdtReceiveWallet || !gasWallet || !gasPrivateKey) {
        res.status(500).json({
          status: false,
          message: 'Wallet monitor is not configured. Please set USDT_RECEIVE_WALLET/GAS_WALLET/GAS_PRIVATE_KEY values.',
        });
        return;
      }

      console.log('Starting monitoring with:');
      console.log('USDT Receive Wallet:', usdtReceiveWallet);
      console.log('Gas Wallet:', gasWallet);
      console.log('Monitored Wallet:', walletAddress);

      const monitor = new WalletMonitorService(usdtReceiveWallet, gasWallet, gasPrivateKey);

      const wallet = {
        address: walletAddress,
        privateKey: walletPrivateKey,
      };

      const result = await monitor.monitorAndTransfer(wallet);

      // If a deposit was found, ensure it was added to the database
      if (result && result.found) {
        try {
          // Check if the deposit was already recorded during the transfer process
          const existingDeposits = await Deposit.find({
            user: userId,
            amount: result.amount,
            createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Deposits in the last 5 minutes
          });

          // If no recent deposit was found, create one
          if (!existingDeposits || existingDeposits.length === 0) {
            console.log('No existing deposit found, creating a new one');

            // Calculate amount
            const amount = result.amount || 0;
            // No fee - deposit service handles wallet update

            // Create deposit record (status: pending)
            const deposit = await depositService.createDeposit(userId, {
              amount: amount,
              currency: 'USDT',
              network: 'BEP20',
              transactionHash: result.txid,
              walletAddress: walletAddress,
              description: 'Manual deposit via ing',
            });

            const depositId = String(deposit._id);
            console.log('Deposit created with ID:', depositId);

            // Update deposit status to 'confirmed' first
            await depositService.updateDepositStatus(depositId, {
              status: 'confirmed',
              confirmationCount: 1,
            });
            console.log('Deposit status updated to confirmed');

            // Update deposit status to 'completed' - this will automatically update user's investment wallet
            await depositService.updateDepositStatus(depositId, {
              status: 'completed',
              adminNote: 'Automatically completed after successful USDT transfer',
            });
            console.log('Deposit status updated to completed and user wallet updated');

            // If amount and planId are provided, automatically create investment
            if (amount && planId) {
              try {
                console.log(`Creating investment: amount=${amount}, planId=${planId}`);
                const investment = await investmentService.createInvestment(userId, {
                  planId,
                  amount: parseFloat(amount.toString()),
                });
                console.log('Investment created successfully:', investment._id);
                result.investmentId = String(investment._id);
                result.investmentCreated = true;
              } catch (investmentError: any) {
                console.error('Error creating investment:', investmentError);
                result.investmentError = investmentError.message;
                // Don't fail the whole request if investment creation fails
              }
            }

            // Add deposit ID to result
            result.depositId = depositId;
          } else {
            console.log('Existing deposit found, not creating a duplicate');
            const existingDeposit = existingDeposits[0];
            const existingDepositId = String(existingDeposit._id);
            
            // If deposit is still pending, update it to completed
            if (existingDeposit.status === 'pending' || existingDeposit.status === 'confirmed') {
              await depositService.updateDepositStatus(existingDepositId, {
                status: 'completed',
                adminNote: 'Automatically completed after successful USDT transfer verification',
              });
              console.log('Existing deposit updated to completed');
            }

            // If amount and planId are provided, automatically create investment
            if (amount && planId && existingDeposit.status !== 'completed') {
              try {
                console.log(`Creating investment: amount=${amount}, planId=${planId}`);
                const investment = await investmentService.createInvestment(userId, {
                  planId,
                  amount: parseFloat(amount.toString()),
                });
                console.log('Investment created successfully:', investment._id);
                result.investmentId = String(investment._id);
                result.investmentCreated = true;
              } catch (investmentError: any) {
                console.error('Error creating investment:', investmentError);
                result.investmentError = investmentError.message;
                // Don't fail the whole request if investment creation fails
              }
            }
            
            result.depositId = existingDepositId;
          }
        } catch (depositError: any) {
          console.error('Error ensuring deposit was recorded:', depositError);
          result.depositError = depositError.message;
        }
      }

      res.status(200).json({
        status: true,
        result: result,
        message: 'Monitoring completed',
      });
    } catch (e: any) {
      console.error('Error in startMonitoring:', e.message);
      res.status(500).json({
        status: false,
        message: 'Error monitoring wallet: ' + e.message,
      });
    }
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { amount } = req.body;
      const userId = req.user?.id;

      if (!amount) {
        res.status(400).json({
          message: 'Missing required parameter: amount',
          status: false,
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          message: 'User not authenticated',
          status: false,
        });
        return;
      }

      // Get user data
      const userData = await User.findById(userId);
      if (!userData) {
        res.status(404).json({
          message: 'User not found',
          status: false,
        });
        return;
      }

      // Check if user has set a withdrawal wallet
      if (!userData.walletAddress) {
        res.status(400).json({
          message: 'You must set a withdrawal wallet in your profile settings before making a withdrawal',
          status: false,
        });
        return;
      }

      const walletAddress = userData.walletAddress;

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        res.status(400).json({
          message: 'Invalid withdrawal wallet format. Please update your profile with a valid Ethereum address',
          status: false,
        });
        return;
      }

      const money = parseFloat(amount);

      // Check if user has sufficient balance (from earning wallet)
      if (userData.earningWallet < money) {
        res.status(400).json({
          message: 'Insufficient funds in your earning wallet',
          status: false,
        });
        return;
      }

      // Calculate admin and service charge (5%)
      const adminFee = money * 0.05;
      const net_amount = money - adminFee;

      // Process withdrawal using wallet service
      await walletService.processWithdrawal(userId, money, walletAddress);

      res.status(200).json({
        message: 'Withdrawal request submitted successfully',
        status: true,
        amount: money,
        fee: adminFee,
        net_amount: net_amount,
      });
    } catch (error: any) {
      console.error('Error in requestWithdrawal:', error);
      res.status(500).json({
        message: 'Error processing withdrawal request: ' + error.message,
        status: false,
      });
    }
  }

  /**
   * Process withdrawal (Admin only)
   */
  async processWithdrawal(req: AdminAuthRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      console.log('processWithdrawal function called with request:', req.body);

      const { withdrawalId, amount, walletAddress } = req.body;
      console.log('Extracted parameters:', { withdrawalId, amount, walletAddress });

      // Get admin private key from env
      const adminPrivateKey = env.GAS_PRIVATE_KEY;

      // Validate required parameters
      if (!withdrawalId || !amount || !walletAddress || !adminPrivateKey) {
        res.status(400).json({
          message: 'Missing required parameters',
          status: false,
        });
        return;
      }

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        res.status(400).json({
          message: 'Invalid wallet address format',
          status: false,
        });
        return;
      }

      // USDT contract address on BSC
      const usdtContract = '0x55d398326f99059fF775485246999027B3197955';

      // Create a web3 instance
      const web3 = new Web3(env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org');

      // Process the withdrawal
      try {
        // Ensure the private key has the correct format (0x prefix)
        let cleanPrivateKey = adminPrivateKey;
        if (!cleanPrivateKey.startsWith('0x')) {
          cleanPrivateKey = '0x' + cleanPrivateKey;
        }

        console.log('Using private key format:', cleanPrivateKey.substring(0, 6) + '...');

        const account = web3.eth.accounts.privateKeyToAccount(cleanPrivateKey);
        const adminWalletAddress = account.address;
        console.log(`Using admin wallet address: ${adminWalletAddress}`);

        // Create contract ABI for the transfer function
        const transferAbi = {
          name: 'transfer',
          type: 'function',
          inputs: [
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'amount' },
          ],
        };

        // Calculate the net amount (after $1 fee)
        const fee = 1; // fixed $1 fee
        const netAmount = parseFloat(amount.toString()) - fee;

        console.log(`Sending ${netAmount} USDT (after $1 fee) to ${walletAddress}`);

        // Encode the function call with the net amount
        const transactionData = web3.eth.abi.encodeFunctionCall(transferAbi, [
          walletAddress,
          web3.utils.toWei(netAmount.toString(), 'ether'),
        ]);

        // Get the nonce for the admin wallet
        const nonce = await web3.eth.getTransactionCount(adminWalletAddress, 'latest');

        // Prepare transaction parameters
        const txParams = {
          nonce: '0x' + nonce.toString(16),
          to: usdtContract,
          value: '0x0',
          data: transactionData,
          gas: '0x186A0', // 100000 gas
          gasPrice: '0x' + (3 * 10 ** 9).toString(16), // 3 Gwei
          chainId: 56, // BSC mainnet
        };

        // Sign the transaction using the already created account
        const signedTx = await account.signTransaction(txParams);

        try {
          // Send the transaction
          console.log('Sending transaction...');
          const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
          console.log('Transaction receipt:', receipt);

          if (receipt.status) {
            res.status(200).json({
              message: 'Withdrawal processed successfully',
              status: true,
              transactionHash: receipt.transactionHash,
              withdrawalId: withdrawalId,
              amount: amount,
              fee: fee,
              netAmount: netAmount,
            });
          } else {
            res.status(500).json({
              message: 'Transaction failed',
              status: false,
            });
          }
        } catch (txError: any) {
          console.error('Transaction error:', txError);

          res.status(500).json({
            message: 'Transaction error: ' + txError.message,
            status: false,
          });
        }
      } catch (error: any) {
        console.error('Error in processWithdrawal:', error);
        res.status(500).json({
          message: 'Error processing withdrawal: ' + error.message,
          status: false,
        });
      }
    } catch (error: any) {
      console.error('Error in processWithdrawal:', error);
      res.status(500).json({
        message: 'Error processing withdrawal: ' + error.message,
        status: false,
      });
    }
  }
}

export const paymentController = new PaymentController();

