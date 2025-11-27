import { ISetting, Setting } from '../models/setting.model';
import { CreateSettingDto, UpdateSettingDto } from '../types/setting.types';

export interface ReferralBonusTier {
  minAmount: number;
  maxAmount?: number;
  type: 'fixed' | 'percentage';
  value: number;
}

export class SettingService {
  async createSetting(data: CreateSettingDto): Promise<ISetting> {
    const setting = new Setting(data);
    return await setting.save();
  }

  async getSetting(key: string): Promise<ISetting | null> {
    return await Setting.findOne({ key, isActive: true });
  }

  async getSettingValue<T = any>(key: string, defaultValue?: T): Promise<T> {
    const setting = await Setting.findOne({ key, isActive: true });
    if (!setting) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Setting with key '${key}' not found`);
    }
    return setting.value as T;
  }

  async updateSetting(key: string, data: UpdateSettingDto): Promise<ISetting | null> {
    return await Setting.findOneAndUpdate(
      { key },
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async getSettingsByCategory(category: string): Promise<ISetting[]> {
    return await Setting.find({ category, isActive: true });
  }

  async getAllSettings(): Promise<ISetting[]> {
    return await Setting.find({ isActive: true });
  }

  async deleteSetting(key: string): Promise<boolean> {
    const result = await Setting.findOneAndDelete({ key });
    return !!result;
  }

  // Initialize default settings
  async initializeDefaultSettings(): Promise<void> {
    const defaultSettings = [
      // Bonus Settings
      {
        key: 'welcome_bonus_amount',
        value: 0.5,
        type: 'number' as const,
        description: 'Welcome bonus amount for new users',
        category: 'bonus' as const,
      },
      {
        key: 'auto_invest_welcome_bonus',
        value: true,
        type: 'boolean' as const,
        description: 'Automatically invest welcome bonus',
        category: 'bonus' as const,
      },
      
      // Referral Settings
      {
        key: 'referral_code_prefix',
        value: 'AI',
        type: 'string' as const,
        description: 'Prefix for referral codes (e.g., AI12345678)',
        category: 'referral' as const,
      },
      {
        key: 'referral_bonus_tiers',
        value: [
          { minAmount: 50, maxAmount: 1000, type: 'fixed', value: 15 },
          { minAmount: 1001, type: 'percentage', value: 5 },
        ],
        type: 'array' as const,
        description: 'Tiered referral bonus configuration',
        category: 'referral' as const,
      },
      
      // Team Level Income Settings
      {
        key: 'team_level_income_percentage',
        value: 2,
        type: 'number' as const,
        description: 'Percentage of investment shared per level (1-10)',
        category: 'referral' as const,
      },
      {
        key: 'team_level_max_levels',
        value: 10,
        type: 'number' as const,
        description: 'Maximum team levels for income distribution',
        category: 'referral' as const,
      },
      
      // Investment Settings
      {
        key: 'min_investment_amount',
        value: 0,
        type: 'number' as const,
        description: 'Minimum investment amount',
        category: 'investment' as const,
      },
      {
        key: 'max_investment_amount',
        value: 10000,
        type: 'number' as const,
        description: 'Maximum investment amount',
        category: 'investment' as const,
      },
    ];

    for (const settingData of defaultSettings) {
      const existing = await Setting.findOne({ key: settingData.key });
      if (!existing) {
        await Setting.create(settingData);
      }
    }
  }

  // Helper methods to get specific settings
  async getWelcomeBonusAmount(): Promise<number> {
    return await this.getSettingValue<number>('welcome_bonus_amount', 0.5);
  }

  async shouldAutoInvestWelcomeBonus(): Promise<boolean> {
    return await this.getSettingValue<boolean>('auto_invest_welcome_bonus', true);
  }

  async getTeamLevelIncomePercentage(): Promise<number> {
    return await this.getSettingValue<number>('team_level_income_percentage', 2);
  }

  async getMaxTeamLevels(): Promise<number> {
    return await this.getSettingValue<number>('team_level_max_levels', 10);
  }

  async getReferralCodePrefix(): Promise<string> {
    return await this.getSettingValue<string>('referral_code_prefix', 'AI');
  }

  async getReferralBonusTiers(): Promise<ReferralBonusTier[]> {
    return await this.getSettingValue<ReferralBonusTier[]>('referral_bonus_tiers', [
      { minAmount: 50, maxAmount: 1000, type: 'fixed', value: 15 },
      { minAmount: 1001, type: 'percentage', value: 5 },
    ]);
  }
}

export const settingService = new SettingService();

