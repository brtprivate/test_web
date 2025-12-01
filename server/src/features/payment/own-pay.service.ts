// own-pay.service.ts - Blockchain wallet operations for TypeScript
import axios, { AxiosInstance } from 'axios';
import { ec as EC } from 'elliptic';
import keccak256 from 'keccak256';
import { Web3 } from 'web3';
import BigNumber from 'bignumber.js';
import { User } from '../users/models/user.model';
import { depositService } from '../deposits/services/deposit.service';
import { env } from '../../config/env';

export interface Wallet {
  address: string;
  privateKey: string;
}

export interface MonitorResult {
  found: boolean;
  message: string;
  amount?: number;
  currency?: string;
  txid?: string;
  depositId?: string;
  depositError?: string;
  investmentId?: string;
  investmentCreated?: boolean;
  investmentError?: string;
}

export interface NonceCache {
  nonce: number;
  timestamp: number;
}

export class WalletGeneratorService {
  constructor() {
    // Provider not needed for wallet generation
  }

  generateWallet(): Wallet {
    try {
      const ec = new EC('secp256k1');
      // Use a custom random number generator to avoid brorand issues
      const keyPair = ec.genKeyPair({
        entropy: this.generateRandomBytes(32),
      });

      const privateKey = keyPair.getPrivate('hex');
      let publicKey = keyPair.getPublic(false, 'hex');

      publicKey = publicKey.substring(2);
      const address = '0x' + keccak256(Buffer.from(publicKey, 'hex')).toString('hex').substring(24);

      return {
        address: address,
        privateKey: '0x' + privateKey,
      };
    } catch (error: any) {
      console.error('Error generating wallet:', error);
      throw error;
    }
  }

  // Custom random bytes generator to avoid dependency on brorand
  private generateRandomBytes(length: number): Buffer {
    const result = Buffer.alloc(length);
    for (let i = 0; i < length; i++) {
      result[i] = Math.floor(Math.random() * 256);
    }
    return result;
  }
}

export class WalletMonitorService {
  private provider: AxiosInstance;
  private usdtReceiveWallet: string;
  private gasWallet: string;
  private gasPrivateKey: string;
  private usdtContract: string;
  private nonceCache: Map<string, NonceCache>;
  private nonceLock: Map<string, Promise<void>>;
  private web3: Web3;
  private minUsdtThreshold: number;
  private minBnbRequired: number;
  private gasTopUpAmount: number;
  private gasTransferGasLimit: number;
  private gasTransferGasPriceGwei: number;

  constructor(usdtReceiveWallet: string, gasWallet: string, gasPrivateKey: string) {
    try {
      this.provider = axios.create({
        baseURL: env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
      });
      this.usdtReceiveWallet = usdtReceiveWallet;
      this.gasWallet = gasWallet;
      this.gasPrivateKey = gasPrivateKey;
      this.usdtContract = '0x55d398326f99059fF775485246999027B3197955';
      this.web3 = new Web3(env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org');

      // Nonce cache to prevent race conditions
      this.nonceCache = new Map();
      this.nonceLock = new Map();
      this.minUsdtThreshold = env.WALLET_MONITOR_MIN_USDT || 0.00001;
      this.minBnbRequired = env.WALLET_MONITOR_MIN_BNB || 0.005;
      this.gasTopUpAmount = env.GAS_TOPUP_AMOUNT_BNB || 0.005;
      this.gasTransferGasLimit = 21000;
      this.gasTransferGasPriceGwei = 3;

      // Validate addresses
      if (!/^0x[a-fA-F0-9]{40}$/.test(gasWallet)) {
        throw new Error('Invalid gas wallet address format');
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(usdtReceiveWallet)) {
        throw new Error('Invalid USDT receive wallet address format');
      }
    } catch (e: any) {
      console.error('Error in constructor:', e.message);
      throw e;
    }
  }

  async getBNBBalance(address: string): Promise<number> {
    try {
      const response = await this.provider.post('', {
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      });

      const body = response.data;

      if (!body.result) {
        console.warn(`Warning: Invalid response from node for address ${address}`);
        return 0;
      }

      return parseInt(body.result, 16) / 10 ** 18; // Convert Wei to BNB
    } catch (e: any) {
      console.error('Error fetching BNB balance:', e.message);
      return 0;
    }
  }

  async getUSDTBalance(address: string): Promise<number> {
    try {
      // Create function signature for balanceOf(address)
      const methodID = this.web3.utils.sha3('balanceOf(address)')?.substring(0, 10) || '';
      const params = address.substring(2).padStart(64, '0');
      const data = methodID + params;

      const response = await this.provider.post('', {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: this.usdtContract,
            data: data,
          },
          'latest',
        ],
        id: 1,
      });

      const body = response.data;
      if (!body.result || body.result === '0x') {
        return 0;
      }
      return parseInt(body.result, 16) / 10 ** 18; // Convert to USDT (18 decimals)
    } catch (e: any) {
      console.error('Error fetching USDT balance:', e.message);
      return 0;
    }
  }

  async monitorAndTransfer(wallet: Wallet): Promise<MonitorResult> {
    try {
      console.log('Checking wallet:', wallet.address);

      // Get initial balances
      const bnbBalance = await this.getBNBBalance(wallet.address);
      const usdtBalance = await this.getUSDTBalance(wallet.address);

      console.log('BNB Balance:', bnbBalance, 'BNB');
      console.log('USDT Balance:', usdtBalance, 'USDT');

      // First check if USDT balance is worth processing
      if (usdtBalance < this.minUsdtThreshold) {
        console.log(`USDT balance too small to process (< ${this.minUsdtThreshold})`);
        return {
          found: false,
          message: 'No significant USDT balance found',
        };
      }

      // If USDT balance is significant, ensure we have enough BNB
      if (bnbBalance < this.minBnbRequired) {
        console.log('Insufficient BNB for gas. Attempting to send from main wallet...');

        // Try to send BNB from gas wallet
        const gasTopUpResult = await this.sendGasFromMainWallet(wallet.address, bnbBalance);
        if (!gasTopUpResult.success) {
          const errorMessage = gasTopUpResult.error || 'Failed to send BNB for gas';
          console.log(errorMessage);
          return {
            found: false,
            message: errorMessage,
          };
        }

        // Wait for BNB transfer to confirm
        await new Promise((resolve) => setTimeout(resolve, 15000));

        // Verify BNB was received
        const newBnbBalance = await this.getBNBBalance(wallet.address);
        if (newBnbBalance < this.minBnbRequired) {
          console.log('BNB transfer failed to arrive');
          return {
            found: false,
            message: 'BNB transfer failed to arrive',
          };
        }
      }

      // Now proceed with USDT transfer
      console.log('Proceeding with USDT transfer...');
      const success = await this.transferUSDT(wallet.address, wallet.privateKey, usdtBalance);

      if (!success) {
        console.log('USDT transfer failed');
        // Only return BNB if we actually sent some for gas
        const finalBnbBalance = await this.getBNBBalance(wallet.address);
        if (finalBnbBalance > 0.001) {
          console.log(`Attempting to return ${finalBnbBalance} BNB to gas wallet`);
          const returnSuccess = await this.transferBNB(wallet.address, wallet.privateKey, finalBnbBalance);
          if (returnSuccess) {
            console.log('Returned remaining BNB to gas wallet after failed USDT transfer');
          } else {
            console.log('Failed to return BNB to gas wallet');
          }
        }
        return {
          found: false,
          message: 'USDT transfer failed',
        };
      }

      // If USDT transfer succeeded, wait and verify
      console.log('USDT transfer reported as successful, verifying...');
      await new Promise((resolve) => setTimeout(resolve, 10000));
      const finalUsdtBalance = await this.getUSDTBalance(wallet.address);
      console.log(`Final USDT balance verification: ${finalUsdtBalance} USDT`);

      if (finalUsdtBalance < this.minUsdtThreshold) {
        // USDT transfer was successful, now return remaining BNB
        console.log('USDT transfer successful, returning remaining BNB...');
        const finalBnbBalance = await this.getBNBBalance(wallet.address);
        console.log(`Final BNB balance: ${finalBnbBalance} BNB`);
        if (finalBnbBalance > 0.001) {
          const returnSuccess = await this.transferBNB(wallet.address, wallet.privateKey, finalBnbBalance);
          if (returnSuccess) {
            console.log('Returned remaining BNB to gas wallet');
          } else {
            console.log('Failed to return BNB to gas wallet');
          }
        }
        return {
          found: true,
          amount: usdtBalance,
          currency: 'USDT',
          message: 'Transfer completed successfully',
        };
      } else {
        console.log(`USDT transfer verification failed. Expected < ${this.minUsdtThreshold}, got ${finalUsdtBalance}`);
        return {
          found: false,
          message: 'USDT transfer verification failed',
        };
      }
    } catch (e: any) {
      console.error('Error in monitoring:', e.message);
      return {
        found: false,
        message: 'Error: ' + e.message,
      };
    }
  }

  async approveUSDT(fromAddress: string, privateKey: string, amount: number): Promise<boolean> {
    try {
      console.log('Approving USDT transfer...');

      privateKey = privateKey.replace('0x', '');

      // Create approve function data
      const methodID = this.web3.utils.sha3('approve(address,uint256)')?.substring(0, 10) || '';
      const spender = this.usdtReceiveWallet.substring(2).padStart(64, '0');

      // Convert amount to wei format
      const bn = new BigNumber(amount).times(new BigNumber(10).pow(18));
      const amountHex = bn.toString(16).padStart(64, '0');

      const data = methodID + spender + amountHex;

      const nonce = await this.getTransactionCount(fromAddress);

      const txParams = {
        nonce: '0x' + nonce.toString(16),
        to: this.usdtContract,
        value: '0x0',
        data: data,
        gas: '0x186A0', // 100000 gas limit
        gasPrice: '0x' + (5 * 10 ** 9).toString(16), // 5 Gwei
        chainId: 56,
      };

      const account = this.web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
      const signedTx = await account.signTransaction(txParams);

      const txHash = await this.sendRawTransaction(signedTx.rawTransaction);

      // Wait for approval confirmation
      for (let i = 0; i < 30; i++) {
        const status = await this.getTransactionStatus(txHash);
        if (status === true) {
          console.log('Approval confirmed');
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait a bit for blockchain to update
          return true;
        } else if (status === false) {
          console.log('Approval transaction failed');
          return false;
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      console.log('Approval transaction timeout');
      return false;
    } catch (e: any) {
      console.error('Error in approveUSDT:', e.message);
      return false;
    }
  }

  async transferUSDT(fromAddress: string, privateKey: string, amount: number): Promise<boolean> {
    try {
      const actualBalance = await this.getUSDTBalance(fromAddress);
      console.log(`Actual USDT balance: ${actualBalance} USDT`);
      console.log(`Requested transfer amount: ${amount} USDT`);

      // Check if we have enough balance to transfer
      if (actualBalance <= 0) {
        console.log('No USDT balance available for transfer');
        return false;
      }

      // Use the actual balance but with a small safety margin to prevent rounding errors
      const safetyMargin = 0.000001; // 0.000001 USDT safety margin
      const maxTransferAmount = Math.max(0, actualBalance - safetyMargin);
      amount = Math.min(amount, maxTransferAmount);

      // Round to 6 decimal places but ensure we don't exceed the actual balance
      amount = Math.floor(amount * 1000000) / 1000000; // Use floor instead of round to be safe

      // Final check - ensure we have a meaningful amount to transfer
      if (amount <= 0) {
        console.log('Transfer amount is too small after safety margin');
        return false;
      }

      console.log(`Final transfer amount: ${amount} USDT`);
      console.log(`Attempting to transfer ${amount} USDT from ${fromAddress} to ${this.usdtReceiveWallet}`);
      const amount1 = amount;

      // Create contract ABI for the transfer function
      const transferAbi = {
        name: 'transfer',
        type: 'function',
        inputs: [
          { type: 'address', name: 'recipient' },
          { type: 'uint256', name: 'amount' },
        ],
      };

      // Encode the function call properly using web3
      let transactionData: string;
      try {
        // Convert amount to wei with proper precision
        const amountInWei = this.web3.utils.toWei(amount.toString(), 'ether');

        // Double-check that we're not trying to transfer more than the actual balance
        const actualBalanceWei = this.web3.utils.toWei(actualBalance.toString(), 'ether');
        if (parseInt(amountInWei) > parseInt(actualBalanceWei)) {
          console.error(`Transfer amount (${amountInWei} wei) exceeds balance (${actualBalanceWei} wei)`);
          return false;
        }

        transactionData = this.web3.eth.abi.encodeFunctionCall(transferAbi, [this.usdtReceiveWallet, amountInWei]);

        console.log(`Using recipient address: ${this.usdtReceiveWallet}`);
        console.log(`Using amount wei: ${amountInWei}`);
        console.log(`Actual balance wei: ${actualBalanceWei}`);
        console.log(`Encoded transaction data: ${transactionData}`);

        // Verify data is valid hex
        if (!/^0x[0-9a-f]+$/i.test(transactionData)) {
          console.error('Invalid hex data format:', transactionData);
          return false;
        }
      } catch (error: any) {
        console.error('Error encoding transaction data:', error.message);
        return false;
      }

      // Get fresh nonce for USDT transfer
      const nonce = await this.getTransactionCount(fromAddress);
      console.log(`Using nonce ${nonce} for USDT transfer`);

      const txParams = {
        nonce: '0x' + nonce.toString(16),
        to: this.usdtContract,
        value: '0x0',
        data: transactionData,
        gas: '0x186A0', // 100000 gas
        gasPrice: '0x' + (3 * 10 ** 9).toString(16), // 3 Gwei
        chainId: 56,
      };

      // Log transaction details
      console.log(`Processing transfer of ${amount} USDT from ${fromAddress} to ${this.usdtReceiveWallet}`);

      // Sign and send the transaction with retry logic
      const maxRetries = 3;
      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          const cleanPrivateKey = privateKey.replace('0x', '');
          const account = this.web3.eth.accounts.privateKeyToAccount('0x' + cleanPrivateKey);

          console.log('Signing transaction...');
          const signedTx = await account.signTransaction(txParams);

          console.log('Sending transaction...');
          let result1: any = {};

          const txHash = await this.sendRawTransaction2(signedTx.rawTransaction);
          console.log(`Transaction sent with hash: ${txHash}`);

          // Wait for transaction confirmation before checking balance
          console.log('Waiting for USDT transaction confirmation...');
          const maxAttempts = 30;
          let transactionConfirmed = false;

          for (let i = 0; i < maxAttempts; i++) {
            const status = await this.getTransactionStatus(txHash);
            if (status === true) {
              console.log('USDT transaction confirmed');
              transactionConfirmed = true;
              break;
            } else if (status === false) {
              console.log('USDT transaction failed');
              throw new Error('USDT transaction failed');
            }
            console.log(`Waiting for confirmation... Attempt ${i + 1}/${maxAttempts}`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }

          if (!transactionConfirmed) {
            console.log('USDT transaction confirmation timeout');
            throw new Error('USDT transaction confirmation timeout');
          }

          // Wait a bit more for blockchain to update balances
          await new Promise((resolve) => setTimeout(resolve, 5000));

          const newBalance = await this.getUSDTBalance(fromAddress);
          console.log(`New USDT balance after transfer: ${newBalance}`);
          if (newBalance < 0.0001 && amount > 0) {
            try {
              // Calculate deposit amount
              const depositAmount = amount1;

              // Find the user by wallet address
              const userRecord = await User.findOne({ walletAddress: fromAddress });

              if (!userRecord) {
                console.error('User not found for wallet address:', fromAddress);
                throw new Error('User not found for wallet address');
              }

              const userId = String(userRecord._id);
              console.log('Found user for deposit:', userId);

              // Create deposit record using our deposit service (status: pending)
              const deposit = await depositService.createDeposit(userId, {
                amount: depositAmount,
                currency: 'USDT',
                network: 'BEP20',
                transactionHash: txHash,
                walletAddress: fromAddress,
                description: 'Automatic deposit via wallet monitoring',
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

              result1 = deposit;
            } catch (error: any) {
              console.error('Error saving deposit:', error);
              // Still return success but with a warning
              result1.warning = 'Deposit detected but there was an error saving it: ' + error.message;
            }

            console.log(`Transaction sent with hash: ${txHash}`);
            if (result1 && (result1 as any)._id) {
              console.log((result1 as any)._id);
            }

            // Verify the transfer was successful by checking the new balance
            return newBalance < 0.0001;
          } else {
            return false;
          }
        } catch (txError: any) {
          console.error(`USDT transfer attempt ${retry + 1} failed:`, txError.message);

          // Check if it's a nonce error
          if (txError.message.includes('nonce too low') || txError.message.includes('nonce too high')) {
            console.log('Nonce error detected in USDT transfer, waiting before retry...');
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

            // Get fresh nonce for retry
            const freshNonce = await this.getTransactionCount(fromAddress);
            console.log(`Using fresh nonce ${freshNonce} for USDT transfer retry`);
            txParams.nonce = '0x' + freshNonce.toString(16);
            continue; // Retry with fresh nonce
          } else {
            // For other errors, don't retry
            throw txError;
          }
        }
      }

      console.log('All USDT transfer retry attempts failed');
      return false;
    } catch (e: any) {
      console.error('Error in transferUSDT:', e.message);
      return false;
    }
  }

  async transferBNB(fromAddress: string, privateKey: string, amount: number): Promise<boolean> {
    try {
      // Convert amount to Wei for precise calculations
      const amountInWei = amount * 10 ** 18;

      // Gas limit in Wei (21000 gas for simple transfer)
      const gasLimit = 21000;

      // Gas price in Wei (3 Gwei)
      const gasPriceInWei = 3 * 10 ** 9;

      // Calculate total gas cost in Wei
      const gasCostInWei = gasLimit * gasPriceInWei;

      // Check if we have enough for gas + transfer
      if (amountInWei <= gasCostInWei) {
        console.log('Amount too small to transfer after gas costs');
        return false;
      }

      // Calculate amount to send (total - gas cost)
      const sendAmountInWei = amountInWei - gasCostInWei;
      const sendAmount = sendAmountInWei / 10 ** 18;

      // Double-check that we have enough balance
      const currentBalance = await this.getBNBBalance(fromAddress);
      const currentBalanceWei = currentBalance * 10 ** 18;

      if (currentBalanceWei < amountInWei) {
        console.log(`Insufficient balance. Required: ${amountInWei / 10 ** 18} BNB, Available: ${currentBalance} BNB`);
        return false;
      }

      console.log(`Transferring ${sendAmount} BNB to gas wallet: ${this.gasWallet}`);
      console.log(`Gas cost: ${gasCostInWei / 10 ** 18} BNB`);

      // Remove '0x' if present from private key
      privateKey = privateKey.replace('0x', '');

      // Retry logic for nonce management
      const maxRetries = 3;
      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          // Get fresh nonce for each retry
          const nonce = await this.getTransactionCount(fromAddress);
          console.log(`Using nonce ${nonce} for BNB transfer (attempt ${retry + 1})`);

          const txParams = {
            nonce: '0x' + nonce.toString(16),
            to: this.gasWallet,
            value: '0x' + Math.floor(sendAmountInWei).toString(16),
            gas: '0x' + gasLimit.toString(16),
            gasPrice: '0x' + gasPriceInWei.toString(16),
            chainId: 56,
          };

          const account = this.web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
          const signedTx = await account.signTransaction(txParams);

          const txHash = await this.sendRawTransaction(signedTx.rawTransaction);

          console.log('Transaction sent successfully! TxHash:', txHash);

          // Wait for confirmation
          const maxAttempts = 30;
          for (let i = 0; i < maxAttempts; i++) {
            const receipt = await this.getDetailedTransactionReceipt(txHash);

            if (receipt === null) {
              console.log(`Waiting for transaction confirmation... Attempt ${i + 1}/${maxAttempts}`);
              await new Promise((resolve) => setTimeout(resolve, 2000));
              continue;
            }

            if (receipt.status === '0x1') {
              console.log('BNB transfer confirmed');
              return true;
            } else {
              console.log('BNB transfer failed');
              return false;
            }
          }

          console.log('Transaction confirmation timeout');
          return false;
        } catch (txError: any) {
          console.error(`Transaction attempt ${retry + 1} failed:`, txError.message);

          // Check if it's a nonce error
          if (txError.message.includes('nonce too low') || txError.message.includes('nonce too high')) {
            console.log('Nonce error detected, waiting before retry...');
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
            continue; // Retry with fresh nonce
          } else {
            // For other errors, don't retry
            throw txError;
          }
        }
      }

      console.log('All retry attempts failed');
      return false;
    } catch (e: any) {
      console.error('Error in transferBNB:', e.message);
      return false;
    }
  }

  private async getTransactionCount(address: string): Promise<number> {
    try {
      // Check if we have a lock for this address
      if (this.nonceLock.has(address)) {
        // Wait for the lock to be released
        await this.nonceLock.get(address);
      }

      // Create a lock for this address
      let resolveLock: (() => void) | undefined;
      const lockPromise = new Promise<void>((resolve) => {
        resolveLock = resolve;
      });
      this.nonceLock.set(address, lockPromise);

      try {
        const response = await this.provider.post('', {
          jsonrpc: '2.0',
          method: 'eth_getTransactionCount',
          params: [address, 'latest'],
          id: 1,
        });
        const body = response.data;
        const nonce = parseInt(body.result, 16);

        // Cache the nonce with timestamp
        this.nonceCache.set(address, {
          nonce: nonce,
          timestamp: Date.now(),
        });

        return nonce;
      } finally {
        // Release the lock
        if (resolveLock) {
          resolveLock();
        }
        this.nonceLock.delete(address);
      }
    } catch (e: any) {
      console.error('Error getting transaction count:', e.message);
      // Release lock on error
      if (this.nonceLock.has(address)) {
        const lock = this.nonceLock.get(address);
        if (lock) {
          lock.then(() => {});
        }
        this.nonceLock.delete(address);
      }
      throw e;
    }
  }

  private async sendRawTransaction(signedTx: string): Promise<string> {
    try {
      const response = await this.provider.post('', {
        jsonrpc: '2.0',
        method: 'eth_sendRawTransaction',
        params: [signedTx],
        id: 1,
      });

      const body = response.data;

      if (body.error) {
        const errorMessage = body.error.message;
        console.log('Error sending transaction:', errorMessage);

        // Provide more specific error handling
        if (errorMessage.includes('nonce too low')) {
          throw new Error(`Nonce too low: ${errorMessage}`);
        } else if (errorMessage.includes('insufficient funds')) {
          throw new Error(`Insufficient funds: ${errorMessage}`);
        } else if (errorMessage.includes('gas price too low')) {
          throw new Error(`Gas price too low: ${errorMessage}`);
        } else if (errorMessage.includes('replacement transaction underpriced')) {
          throw new Error(`Replacement transaction underpriced: ${errorMessage}`);
        } else {
          throw new Error(`Transaction failed: ${errorMessage}`);
        }
      }

      console.log('Transaction sent successfully! TxHash:', body.result);
      return body.result;
    } catch (e: any) {
      console.error('Error in sendRawTransaction:', e.message);
      throw e;
    }
  }

  private async sendRawTransaction2(signedTx: string): Promise<string> {
    try {
      const response = await this.provider.post('', {
        jsonrpc: '2.0',
        method: 'eth_sendRawTransaction',
        params: [signedTx],
        id: 1,
      });

      const body = response.data;

      if (body.error) {
        const errorMessage = body.error.message;
        console.log('Error sending transaction:', errorMessage);

        // Provide more specific error handling
        if (errorMessage.includes('nonce too low')) {
          throw new Error(`Nonce too low: ${errorMessage}`);
        } else if (errorMessage.includes('insufficient funds')) {
          throw new Error(`Insufficient funds: ${errorMessage}`);
        } else if (errorMessage.includes('gas price too low')) {
          throw new Error(`Gas price too low: ${errorMessage}`);
        } else if (errorMessage.includes('replacement transaction underpriced')) {
          throw new Error(`Replacement transaction underpriced: ${errorMessage}`);
        } else {
          throw new Error(`Transaction failed: ${errorMessage}`);
        }
      } else {
        console.log('Transaction sent successfully! TxHash:', body.result);
        // Wait a bit for the transaction to propagate
        await new Promise((resolve) => setTimeout(resolve, 2000));

        return body.result;
      }
    } catch (e: any) {
      console.error('Error in sendRawTransaction2:', e.message);
      throw e; // Re-throw to properly handle in the calling function
    }
  }

  async transferBNBFromGasWallet(toAddress: string, amount: number): Promise<string | false> {
    try {
      console.log(`Sending ${amount} BNB from gas wallet to ${toAddress}`);
      console.log(`Gas wallet configured as: ${this.gasWallet}`);

      // Convert requested amount to Wei for precise calculations
      const requestedAmountInWei = amount * 10 ** 18;

      // Gas limit in Wei (21000 gas for simple transfer)
      const gasLimit = this.gasTransferGasLimit;

      // Gas price in Wei (3 Gwei)
      const gasPriceInWei = this.gasTransferGasPriceGwei * 10 ** 9;

      // Calculate total gas cost in Wei
      const gasCostInWei = gasLimit * gasPriceInWei;

      // Check current gas wallet balance
      const gasWalletBalance = await this.getBNBBalance(this.gasWallet);
      console.log(
        `Current gas wallet BNB balance for ${this.gasWallet}: ${gasWalletBalance.toFixed(9)} BNB`
      );
      const gasWalletBalanceWei = gasWalletBalance * 10 ** 18;

      // Maximum we can actually send while still paying gas
      const maxSendableWei = gasWalletBalanceWei - gasCostInWei;

      if (maxSendableWei <= 0) {
        console.log(
          `Insufficient balance in gas wallet. Available: ${gasWalletBalance} BNB, gas fee alone requires ${gasCostInWei /
            10 ** 18} BNB`
        );
        return false;
      }

      // Final amount to send in Wei: cannot exceed requested or maxSendable
      const amountInWei = Math.min(requestedAmountInWei, maxSendableWei);

      if (amountInWei <= 0) {
        console.log(
          `Computed transferable amount is zero. Requested=${requestedAmountInWei / 10 ** 18} BNB, maxSendable=${maxSendableWei /
            10 ** 18} BNB`
        );
        return false;
      }

      const totalAmountNeeded = amountInWei + gasCostInWei;
      console.log(
        `Gas wallet balance ${gasWalletBalance.toFixed(
          9
        )} BNB, gas fee ${(gasCostInWei / 10 ** 18).toFixed(
          9
        )} BNB, sending ${(amountInWei / 10 ** 18).toFixed(9)} BNB (total cost ${(totalAmountNeeded /
          10 ** 18).toFixed(9)} BNB)`
      );

      // Remove '0x' if present from private key
      const privateKey = this.gasPrivateKey.replace('0x', '');
      const pkPreview =
        this.gasPrivateKey && this.gasPrivateKey.length > 10
          ? `${this.gasPrivateKey.slice(0, 6)}...${this.gasPrivateKey.slice(-4)} (len=${this.gasPrivateKey.length})`
          : `(len=${this.gasPrivateKey ? this.gasPrivateKey.length : 0})`;
      console.log(`Gas wallet private key preview: ${pkPreview}`);

      // Retry logic for nonce management
      const maxRetries = 3;
      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          // Get fresh nonce for each retry
          const nonce = await this.getTransactionCount(this.gasWallet);
          console.log(`Using nonce ${nonce} for gas wallet transfer (attempt ${retry + 1})`);

          const txParams = {
            nonce: '0x' + nonce.toString(16),
            to: toAddress,
            value: '0x' + Math.floor(amountInWei).toString(16),
            gas: '0x' + gasLimit.toString(16),
            gasPrice: '0x' + gasPriceInWei.toString(16),
            chainId: 56,
          };

          const account = this.web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
          console.log(`Gas transfer will be signed by address: ${account.address}`);
          const signedTx = await account.signTransaction(txParams);

          const txHash = await this.sendRawTransaction(signedTx.rawTransaction);

          console.log('Gas transfer transaction sent! TxHash:', txHash);

          // Wait for confirmation
          const maxAttempts = 30;
          for (let i = 0; i < maxAttempts; i++) {
            const receipt = await this.getDetailedTransactionReceipt(txHash);

            if (receipt === null) {
              console.log(`Waiting for gas transfer confirmation... Attempt ${i + 1}/${maxAttempts}`);
              await new Promise((resolve) => setTimeout(resolve, 2000));
              continue;
            }

            if (receipt.status === '0x1') {
              console.log('Gas transfer confirmed');
              return txHash;
            } else {
              console.log('Gas transfer failed');
              return false;
            }
          }

          console.log('Gas transfer confirmation timeout');
          return false;
        } catch (txError: any) {
          console.error(`Gas transfer attempt ${retry + 1} failed:`, txError.message);

          // Check if it's a nonce error
          if (txError.message.includes('nonce too low') || txError.message.includes('nonce too high')) {
            console.log('Nonce error detected in gas transfer, waiting before retry...');
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
            continue; // Retry with fresh nonce
          } else {
            // For other errors, don't retry
            throw txError;
          }
        }
      }

      console.log('All gas transfer retry attempts failed');
      return false;
    } catch (e: any) {
      console.error('Error in transferBNBFromGasWallet:', e.message);
      return false;
    }
  }

  async sendGasFromMainWallet(toAddress: string, currentTargetBalance = 0): Promise<{ success: boolean; error?: string }> {
    try {
      const deficit = Math.max(this.minBnbRequired - currentTargetBalance, 0);
      let amount = this.gasTopUpAmount;
      if (deficit > 0) {
        amount = Math.max(deficit, this.gasTopUpAmount);
      }

      if (amount <= 0) {
        return { success: true };
      }

      const gasWalletBalance = await this.getBNBBalance(this.gasWallet);
      const transferFee = this.calculateNativeTransferGasFeeBNB();

      // Maximum BNB we can safely send from gas wallet while still paying gas
      const maxSendable = gasWalletBalance - transferFee;

      if (maxSendable <= 0) {
        const errorMessage = `Gas wallet balance ${gasWalletBalance.toFixed(
          6
        )} BNB is too low to cover even the gas fee of ${transferFee.toFixed(6)} BNB.`;
        console.log(errorMessage);
        return { success: false, error: errorMessage };
      }

      // We need at least the deficit to reach minBnbRequired on the target wallet.
      // But we also cap by what the gas wallet can actually afford.
      const amountToSend = Math.min(Math.max(deficit, this.gasTopUpAmount), maxSendable);

      if (amountToSend <= 0) {
        const errorMessage = `Unable to compute a valid gas top-up amount. Gas wallet balance=${gasWalletBalance.toFixed(
          6
        )} BNB, fee=${transferFee.toFixed(6)} BNB.`;
        console.log(errorMessage);
        return { success: false, error: errorMessage };
      }

      console.log(
        `Sending ${amountToSend.toFixed(6)} BNB from gas wallet for operations (requested ${amount.toFixed(
          6
        )} BNB, deficit ${deficit.toFixed(6)} BNB, gas wallet balance ${gasWalletBalance.toFixed(
          6
        )} BNB)`
      );

      const txHash = await this.transferBNBFromGasWallet(toAddress, amountToSend);
      if (!txHash) {
        return { success: false, error: 'Gas transfer transaction failed' };
      }

      console.log('Transaction sent successfully! TxHash:', txHash);

      // Wait for confirmation
      for (let i = 0; i < 30; i++) {
        const status = await this.getTransactionStatus(txHash);
        if (status === true) {
          // Verify the balance was actually received
          await new Promise((resolve) => setTimeout(resolve, 5000));
          const newBalance = await this.getBNBBalance(toAddress);
          if (newBalance >= this.minBnbRequired) {
            return { success: true };
          }
          const errorMessage = `BNB transfer confirmed but balance ${newBalance.toFixed(6)} BNB is still below required ${this.minBnbRequired} BNB`;
          console.log(errorMessage);
          return { success: false, error: errorMessage };
        } else if (status === false) {
          return { success: false, error: 'Gas transfer transaction failed on-chain' };
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      return { success: false, error: 'Gas transfer transaction timeout' };
    } catch (e: any) {
      console.error('Error in sendGasFromMainWallet:', e.message);
      return { success: false, error: 'Failed to send BNB for gas: ' + e.message };
    }
  }

  private calculateNativeTransferGasFeeBNB(): number {
    const gasLimit = this.gasTransferGasLimit;
    const gasPriceInWei = this.gasTransferGasPriceGwei * 10 ** 9;
    return (gasLimit * gasPriceInWei) / 10 ** 18;
  }

  async getDetailedTransactionStatus(txHash: string): Promise<boolean | null> {
    try {
      const response = await this.provider.post('', {
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      });

      const receipt = response.data;

      if (!receipt.result || receipt.result === null) {
        return null; // Transaction not yet mined
      }

      const result = receipt.result;

      // Check if transaction was successful
      if (result.status === '0x1') {
        // Check for token transfer event
        for (const log of result.logs) {
          if (log.address.toLowerCase() === this.usdtContract.toLowerCase()) {
            // This is a USDT transfer event
            console.log('Found USDT transfer event in transaction');
            return true;
          }
        }
        console.log('Transaction successful but no USDT transfer event found');
        return false;
      } else {
        console.log('Transaction failed with status:', result.status);
        return false;
      }
    } catch (e: any) {
      console.error('Error checking transaction status:', e.message);
      return null;
    }
  }

  async checkAllowance(owner: string, spender: string): Promise<number> {
    try {
      const methodID = this.web3.utils.sha3('allowance(address,address)')?.substring(0, 10) || '';
      const param1 = owner.substring(2).padStart(64, '0');
      const param2 = spender.substring(2).padStart(64, '0');
      const data = methodID + param1 + param2;

      const response = await this.provider.post('', {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: this.usdtContract,
            data: data,
          },
          'latest',
        ],
        id: 1,
      });

      const body = response.data;
      return parseInt(body.result, 16) / 10 ** 18;
    } catch (e: any) {
      console.error('Error checking allowance:', e.message);
      return 0;
    }
  }

  async getTransactionError(txHash: string): Promise<string> {
    try {
      // Get transaction
      const response = await this.provider.post('', {
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [txHash],
        id: 1,
      });

      const tx = response.data.result;

      // Try to simulate the transaction to get the error
      const response2 = await this.provider.post('', {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            from: tx.from,
            to: tx.to,
            data: tx.input,
            value: tx.value,
            gas: tx.gas,
            gasPrice: tx.gasPrice,
          },
          'latest',
        ],
        id: 1,
      });

      const result = response2.data;
      return result.error ? result.error.message : 'Unknown error';
    } catch (e: any) {
      return e.message;
    }
  }

  async getTransactionStatus(txHash: string): Promise<boolean | null> {
    try {
      const response = await this.provider.post('', {
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      });

      const receipt = response.data;

      if (!receipt.result) {
        return null; // Transaction not yet mined
      }

      if (receipt.result === null) {
        return null; // Transaction not yet mined
      }

      // Check status (1 = success, 0 = failure)
      return parseInt(receipt.result.status, 16) === 1;
    } catch (e: any) {
      console.error('Error checking transaction status:', e.message);
      return false;
    }
  }

  async getDetailedTransactionReceipt(txHash: string): Promise<any | null> {
    try {
      const response = await this.provider.post('', {
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      });

      const result = response.data;

      if (!result.result) {
        return null;
      }

      return result.result;
    } catch (e: any) {
      console.error('Error getting transaction receipt:', e.message);
      return null;
    }
  }
}

// Export services
export const walletGeneratorService = new WalletGeneratorService();

