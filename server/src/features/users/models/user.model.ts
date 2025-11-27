import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';
import { Setting } from '../../settings/models/setting.model';

export interface IUser extends Document {
  name: string;
  email?: string;
  password?: string;
  telegramChatId: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  isActive: boolean;
  // Referral System
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  // Wallets
  investmentWallet: number; // For investments only
  earningWallet: number; // For all earnings (ROI, referrals, team income)
  totalEarned: number;
  totalInvested: number;
  // USDT Wallet
  walletAddress?: string; // USDT wallet address
  privateKey?: string; // Private key (encrypted)
  // Wallet Address (for withdrawals)
  walletAddressForWithdrawal?: string; // Wallet address for withdrawals
  // Free Bonus
  freeBonusReceived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true, // Allows multiple null values but unique for non-null
    },
    password: {
      type: String,
      select: false, // Don't return password by default
    },
    telegramChatId: {
      type: Number,
      required: [true, 'Telegram Chat ID is required'],
      unique: true,
      index: true,
    },
    telegramUsername: {
      type: String,
      trim: true,
    },
    telegramFirstName: {
      type: String,
      trim: true,
    },
    telegramLastName: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Referral System
    referralCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Wallets
    investmentWallet: {
      type: Number,
      default: 0,
      min: 0,
    },
    earningWallet: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalInvested: {
      type: Number,
      default: 0,
      min: 0,
    },
    // USDT Wallet
    walletAddress: {
      type: String,
      trim: true,
      sparse: true, // Allows multiple null values but unique for non-null
      index: true,
    },
    privateKey: {
      type: String,
      select: false, // Don't return private key by default
      trim: true,
    },
    // Wallet Address (for withdrawals)
    walletAddressForWithdrawal: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    // Free Bonus
    freeBonusReceived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique referral code before saving
userSchema.pre('save', async function (next) {
  // Only generate if referralCode is not set
  if (!this.referralCode || this.referralCode.trim() === '') {
    // Get referral code prefix from settings (default: 'AI')
    let prefix = 'AI';
    try {
      const prefixSetting = await Setting.findOne({ key: 'referral_code_prefix' });
      if (prefixSetting && prefixSetting.value) {
        const prefixValue = String(prefixSetting.value).trim();
        if (prefixValue) {
          prefix = prefixValue.toUpperCase();
        }
      }
    } catch (error: any) {
      // If settings not available, use default prefix
      console.warn('Could not get referral code prefix from settings, using default: AI', error?.message);
    }

    // Ensure prefix is not empty
    if (!prefix || prefix.trim() === '') {
      prefix = 'AI';
    }

    let code: string = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loop
    
    while (!isUnique && attempts < maxAttempts) {
      attempts++;
      // Generate 8 character alphanumeric code
      const randomCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      // Combine prefix with random code (e.g., AI12345678)
      code = `${prefix}${randomCode}`;
      
      try {
        const existingUser = await mongoose.model('User').findOne({ referralCode: code });
        if (!existingUser) {
          isUnique = true;
        }
      } catch (error: any) {
        // If query fails, assume it's unique and break
        console.warn('Error checking referral code uniqueness, using generated code:', error?.message);
        isUnique = true;
      }
    }
    
    // Ensure code is set
    if (!code || code.trim() === '') {
      // Fallback: generate without prefix if something went wrong
      code = crypto.randomBytes(4).toString('hex').toUpperCase();
      if (prefix && prefix !== '') {
        code = `${prefix}${code}`;
      }
    }
    
    this.referralCode = code;
  }
  next();
});

export const User = mongoose.model<IUser>('User', userSchema);

