import axios from 'axios';
import { Web3 } from 'web3';
import { Deposit } from '../features/deposits/models/deposit.model';
import { User } from '../features/users/models/user.model';
// walletService not used - deposit service handles wallet updates
import { depositService } from '../features/deposits/services/deposit.service';

export class WalletMonitorService {
  private provider: any;
  private usdtContract: string;
  // These properties are set in constructor and may be used in future methods
  // @ts-ignore - Properties are set in constructor for future use
  private usdtReceiveWallet: string;
  // @ts-ignore - Properties are set in constructor for future use
  private gasWallet: string;
  // @ts-ignore - Properties are set in constructor for future use
  private gasPrivateKey: string;
  private web3: Web3;
  private nonceCache: Map<string, { nonce: number; timestamp: number }>;
  private nonceLock: Map<string, Promise<void>>;

  constructor(usdtReceiveWallet: string, gasWallet: string, gasPrivateKey: string) {
    this.provider = axios.create({
      baseURL: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    });
    this.usdtReceiveWallet = usdtReceiveWallet;
    this.gasWallet = gasWallet;
    this.gasPrivateKey = gasPrivateKey;
    this.usdtContract = '0x55d398326f99059fF775485246999027B3197955'; // USDT on BSC
    this.web3 = new Web3(process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org');
    this.nonceCache = new Map();
    this.nonceLock = new Map();

    // Validate addresses
    if (!/^0x[a-fA-F0-9]{40}$/.test(gasWallet)) {
      throw new Error('Invalid gas wallet address format');
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(usdtReceiveWallet)) {
      throw new Error('Invalid USDT receive wallet address format');
    }
  }

  /**
   * Get BNB balance for an address
   */
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
    } catch (error: any) {
      console.error('Error fetching BNB balance:', error.message);
      return 0;
    }
  }

  /**
   * Get USDT balance for an address
   */
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

      const balance = parseInt(body.result, 16);
      return balance / 10 ** 18; // USDT has 18 decimals
    } catch (error: any) {
      console.error('Error fetching USDT balance:', error.message);
      return 0;
    }
  }

  /**
   * Monitor a user's wallet and process deposits
   */
  async monitorUserWallet(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId).select('+privateKey');
      if (!user || !user.walletAddress || !user.privateKey) {
        console.log(`User ${userId} does not have a wallet configured`);
        return;
      }

      const walletAddress = user.walletAddress;
      console.log(`Checking wallet: ${walletAddress} for user ${userId}`);

      // Check USDT balance
      const usdtBalance = await this.getUSDTBalance(walletAddress);
      const bnbBalance = await this.getBNBBalance(walletAddress);

      console.log(`Wallet ${walletAddress} - USDT: ${usdtBalance}, BNB: ${bnbBalance}`);

      if (usdtBalance > 0) {
        // Check if deposit already exists for this balance
        const existingDeposit = await Deposit.findOne({
          user: userId,
          walletAddress,
          amount: usdtBalance,
          status: { $in: ['pending', 'confirmed', 'completed'] },
        }).sort({ createdAt: -1 });

        if (!existingDeposit) {
          // Create new deposit record
          console.log(`Creating deposit record for ${usdtBalance} USDT`);
          await depositService.createDeposit(userId, {
            amount: usdtBalance,
            currency: 'USDT',
            network: 'BEP20',
            walletAddress,
            description: `Automatic deposit detected - ${usdtBalance} USDT`,
          });
        } else if (existingDeposit.status === 'pending') {
          // Update existing pending deposit
          console.log(`Updating existing deposit ${existingDeposit._id}`);
          // Admin can manually confirm it later
        }
      }
    } catch (error: any) {
      console.error(`Error monitoring wallet for user ${userId}:`, error.message);
    }
  }

  /**
   * Monitor all active user wallets
   */
  async monitorAllWallets(): Promise<void> {
    try {
      const users = await User.find({
        walletAddress: { $exists: true, $ne: null },
        isActive: true,
      }).select('_id');

      console.log(`Monitoring ${users.length} user wallets...`);

      for (const user of users) {
        await this.monitorUserWallet(String(user._id));
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      console.error('Error monitoring all wallets:', error.message);
    }
  }

  /**
   * Get transaction count (nonce) for an address
   * @private - May be used in future for transaction management
   */
  // @ts-ignore - Method may be used in future
  private async getTransactionCount(address: string): Promise<number> {
    try {
      // Check cache first
      const cached = this.nonceCache.get(address);
      if (cached && Date.now() - cached.timestamp < 5000) {
        return cached.nonce;
      }

      // Check if locked
      if (this.nonceLock.has(address)) {
        await this.nonceLock.get(address);
      }

      // Create lock
      let resolveLock: () => void;
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

        // Cache nonce
        this.nonceCache.set(address, {
          nonce,
          timestamp: Date.now(),
        });

        return nonce;
      } finally {
        // Release lock
        if (this.nonceLock.has(address)) {
          this.nonceLock.get(address)?.then(() => resolveLock());
          this.nonceLock.delete(address);
        }
      }
    } catch (error: any) {
      console.error('Error getting transaction count:', error.message);
      throw error;
    }
  }
}

// Export singleton instance (will be initialized with env vars)
export let walletMonitorService: WalletMonitorService | null = null;

/**
 * Initialize wallet monitor service
 */
export function initializeWalletMonitor(
  usdtReceiveWallet: string,
  gasWallet: string,
  gasPrivateKey: string
): void {
  walletMonitorService = new WalletMonitorService(usdtReceiveWallet, gasWallet, gasPrivateKey);
}

