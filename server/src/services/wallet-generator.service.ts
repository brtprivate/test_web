import { ec as EC } from 'elliptic';
import keccak256 from 'keccak256';
import crypto from 'crypto';

export interface Wallet {
  address: string;
  privateKey: string;
}

export class WalletGeneratorService {
  private ec: EC;

  constructor() {
    this.ec = new EC('secp256k1');
  }

  /**
   * Generate a new BSC/BEP20 wallet (for USDT)
   * Returns address and private key
   */
  generateWallet(): Wallet {
    try {
      // Generate key pair
      const keyPair = this.ec.genKeyPair({
        entropy: this.generateRandomBytes(32),
      });

      const privateKey = keyPair.getPrivate('hex');
      let publicKey = keyPair.getPublic(false, 'hex');

      // Remove '04' prefix from public key
      publicKey = publicKey.substring(2);

      // Generate address from public key using keccak256
      const address = '0x' + keccak256(Buffer.from(publicKey, 'hex')).toString('hex').substring(24);

      return {
        address: address,
        privateKey: '0x' + privateKey,
      };
    } catch (error: any) {
      console.error('Error generating wallet:', error);
      throw new Error(`Failed to generate wallet: ${error.message}`);
    }
  }

  /**
   * Generate random bytes for entropy
   */
  private generateRandomBytes(length: number): Buffer {
    return crypto.randomBytes(length);
  }

  /**
   * Validate wallet address format
   */
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validate private key format
   */
  isValidPrivateKey(privateKey: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
  }
}

export const walletGeneratorService = new WalletGeneratorService();

