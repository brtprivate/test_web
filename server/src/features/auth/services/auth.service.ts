import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../../users/models/user.model';
import { Setting } from '../../settings/models/setting.model';
import { SignupDto, LoginDto } from '../types/auth.types';
import { env } from '../../../config/env';
import { walletService } from '../../wallet/services/wallet.service';
import { settingService } from '../../settings/services/setting.service';
import { investmentService } from '../../investments/services/investment.service';
import { InvestmentPlan } from '../../investment-plans/models/investment-plan.model';
import { walletGeneratorService } from '../../../services/wallet-generator.service';

export class AuthService {
  async signup(data: SignupDto): Promise<IUser> {
    // Check if user already exists
    const existingUser = await User.findOne({ telegramChatId: data.telegramChatId });
    
    if (existingUser) {
      throw new Error('User with this Telegram Chat ID already exists');
    }

    // Handle referral code if provided
    let referredBy = null;
    if (data.referralCode) {
      const referralCodeUpper = data.referralCode.toUpperCase().trim();
      
      // Try to find referrer by referral code
      const referrer = await User.findOne({ referralCode: referralCodeUpper });
      
      if (referrer) {
        referredBy = referrer._id;
        console.log(`✅ Referrer found: ${referrer.name} (${referralCodeUpper})`);
      } else {
        // If referral code not found, try to find a default/system user
        // Look for a user with referral code "SYSTEM" or similar
        const systemUser = await User.findOne({ 
          referralCode: { $in: ['SYSTEM', 'DEFAULT', 'AICRYPTO'] },
          isActive: true 
        });
        
        if (systemUser) {
          referredBy = systemUser._id;
          console.log(`⚠️ Referral code ${referralCodeUpper} not found, using system user: ${systemUser.referralCode}`);
        } else {
          // If no system user found, try to use the first active user as default
          const defaultUser = await User.findOne({ isActive: true }).sort({ createdAt: 1 });
          if (defaultUser) {
            referredBy = defaultUser._id;
            console.log(`⚠️ Using first active user as default referrer: ${defaultUser.referralCode}`);
          } else {
            console.log(`⚠️ No referrer found for code: ${referralCodeUpper}, and no default user available`);
          }
        }
      }
    } else {
      // If no referral code provided, use default/system user
      const systemUser = await User.findOne({ 
        referralCode: { $in: ['SYSTEM', 'DEFAULT', 'AICRYPTO'] },
        isActive: true 
      });
      
      if (systemUser) {
        referredBy = systemUser._id;
        console.log(`📝 No referral code provided, using system user: ${systemUser.referralCode}`);
      } else {
        // Fallback: use first active user
        const defaultUser = await User.findOne({ isActive: true }).sort({ createdAt: 1 });
        if (defaultUser) {
          referredBy = defaultUser._id;
          console.log(`📝 No referral code provided, using first active user as default: ${defaultUser.referralCode}`);
        }
      }
    }
    
    // Ensure referredBy is set (required)
    if (!referredBy) {
      console.warn('⚠️ WARNING: No referrer found, user will be created without referredBy');
    }

    // Get welcome bonus amount from settings (dynamic)
    const welcomeBonusAmount = await settingService.getWelcomeBonusAmount();
    const hasWelcomeBonus = welcomeBonusAmount > 0;
    const shouldAutoInvest = hasWelcomeBonus && (await settingService.shouldAutoInvestWelcomeBonus());

    // Generate wallet address and private key for user (MANDATORY)
    let walletAddress: string;
    let privateKey: string;
    try {
      const wallet = walletGeneratorService.generateWallet();
      walletAddress = wallet.address;
      privateKey = wallet.privateKey;
      console.log(`✅ Generated wallet for new user: ${walletAddress}`);
      
      // Validate generated wallet
      if (!walletGeneratorService.isValidAddress(walletAddress)) {
        throw new Error('Generated wallet address is invalid');
      }
      if (!walletGeneratorService.isValidPrivateKey(privateKey)) {
        throw new Error('Generated private key is invalid');
      }
    } catch (error: any) {
      console.error('❌ Failed to generate wallet during signup:', error.message);
      // Wallet generation is mandatory - fail registration if it fails
      throw new Error(`Failed to generate wallet during registration: ${error.message}`);
    }

    // Generate referral code with prefix from Setting model (before creating user to avoid validation issues)
    let referralCode: string = '';
    let prefix = 'AI'; // Default prefix
    
    try {
      // Check Setting model directly for referral_code_prefix
      const prefixSetting = await Setting.findOne({ key: 'referral_code_prefix', isActive: true });
      if (prefixSetting && prefixSetting.value) {
        const prefixValue = String(prefixSetting.value).trim();
        if (prefixValue) {
          prefix = prefixValue.toUpperCase();
        }
      }
    } catch (error: any) {
      // If setting not found or error, use default "AI"
      console.warn('Could not get referral code prefix from Setting model, using default AI:', error?.message);
      prefix = 'AI';
    }
    
    // Ensure prefix is not empty
    if (!prefix || prefix.trim() === '') {
      prefix = 'AI';
    }
    
    // Generate unique referral code with format: {PREFIX}{8_CHAR_RANDOM} (e.g., AI12345678)
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      attempts++;
      // Generate 8 character random code (4 bytes = 8 hex chars)
      const randomCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      referralCode = `${prefix}${randomCode}`;
      
      try {
        const existingUser = await User.findOne({ referralCode });
        if (!existingUser) {
          isUnique = true;
        }
      } catch (error: any) {
        // If query fails, assume unique and break
        console.warn('Error checking referral code uniqueness:', error?.message);
        isUnique = true;
      }
    }
    
    // Final fallback if still no code generated
    if (!referralCode || referralCode.trim() === '') {
      const randomCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      referralCode = `AI${randomCode}`;
    }

    // Create new user
    const user = new User({
      name: data.name,
      telegramChatId: data.telegramChatId,
      telegramUsername: data.telegramUsername,
      telegramFirstName: data.telegramFirstName,
      telegramLastName: data.telegramLastName,
      referralCode: referralCode, // Set referral code before save
      referredBy,
      isActive: true,
      investmentWallet: 0, // Start with 0, will add welcome bonus via service
      freeBonusReceived: hasWelcomeBonus,
      walletAddress, // Auto-generated wallet address
      privateKey, // Auto-generated private key
    });

    const savedUser = await user.save();
    const userId = String(savedUser._id);

    if (hasWelcomeBonus) {
      // Add welcome bonus to investment wallet (creates transaction)
      await walletService.addToInvestmentWallet(
        userId,
        welcomeBonusAmount,
        `Welcome bonus - $${welcomeBonusAmount}`
      );
    } else {
      console.log('ℹ️ Welcome bonus disabled via settings; skipping bonus funding.');
    }

    // Auto invest welcome bonus if setting is enabled
    if (shouldAutoInvest && hasWelcomeBonus) {
      try {
        // Find the appropriate plan for this amount
        const plan = await InvestmentPlan.findOne({
          minAmount: { $lte: welcomeBonusAmount },
          $or: [
            { maxAmount: { $gte: welcomeBonusAmount } },
            { maxAmount: { $exists: false } }
          ],
          isActive: true,
          planType: 'bot',
        }).sort({ minAmount: -1 });

        if (plan) {
          // Create automatic investment from welcome bonus
          // This will deduct from investmentWallet automatically
          const planId = String(plan._id);
          await investmentService.createInvestment(userId, {
            planId: planId,
            amount: welcomeBonusAmount,
            isWelcomeBonusInvestment: true, // Mark as welcome bonus investment
          });
          console.log(`✅ Welcome bonus ${welcomeBonusAmount} USDT added to investment wallet and auto-invested`);
        } else {
          console.warn(`⚠️ No suitable investment plan found for welcome bonus amount: ${welcomeBonusAmount}`);
        }
      } catch (error: any) {
        // Log error but don't fail user registration
        console.error('Failed to auto-invest welcome bonus:', error.message);
      }
    }

    return savedUser;
  }

  async login(data: LoginDto): Promise<IUser | null> {
    console.log('🔍 [AUTH SERVICE] Login called with:', {
      telegramChatId: data.telegramChatId,
      type: typeof data.telegramChatId,
    });

    try {
      // Try to find user with the exact telegramChatId
      const user = await User.findOne({ telegramChatId: data.telegramChatId });
      console.log('🔍 [AUTH SERVICE] Database query result:', user ? {
        id: user._id,
        telegramChatId: user.telegramChatId,
        isActive: user.isActive,
      } : 'null');

      // Also check if there are any users in the database
      const totalUsers = await User.countDocuments();
      console.log('🔍 [AUTH SERVICE] Total users in database:', totalUsers);

      if (!user) {
        console.log('❌ [AUTH SERVICE] User not found for telegramChatId:', data.telegramChatId);
        // Try to find with different type (string vs number)
        const userAsString = await User.findOne({ telegramChatId: String(data.telegramChatId) });
        const userAsNumber = await User.findOne({ telegramChatId: Number(data.telegramChatId) });
        console.log('🔍 [AUTH SERVICE] Alternative lookups:', {
          asString: userAsString ? 'found' : 'not found',
          asNumber: userAsNumber ? 'found' : 'not found',
        });
        return null;
      }

      console.log('🔍 [AUTH SERVICE] User found, checking isActive:', user.isActive);
      if (!user.isActive) {
        console.log('❌ [AUTH SERVICE] User account is inactive');
        throw new Error('User account is inactive');
      }

      console.log('✅ [AUTH SERVICE] Login successful for user:', user._id);
      return user;
    } catch (error: any) {
      console.error('❌ [AUTH SERVICE] Error in login:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async verifyTelegramChatId(chatId: number): Promise<boolean> {
    // This can be enhanced with actual Telegram Bot API verification
    // For now, we'll just check if it's a valid number
    return typeof chatId === 'number' && chatId > 0;
  }

  generateToken(user: IUser): string {
    const userId = String(user._id);
    const payload = {
      id: userId,
      telegramChatId: user.telegramChatId,
    };

    return jwt.sign(payload, String(env.JWT_SECRET), {
      expiresIn: String(env.JWT_EXPIRE),
    } as jwt.SignOptions);
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

export const authService = new AuthService();

