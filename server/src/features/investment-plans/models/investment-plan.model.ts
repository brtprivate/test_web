import mongoose, { Schema, Document } from 'mongoose';

export type PlanType = 'bot' | 'weekly';
export type PlanPayoutType = 'daily' | 'lump_sum';

export interface WeeklyVisibilityWindow {
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday (UTC reference)
  startHourUtc?: number;
  durationHours?: number;
}

export interface IInvestmentPlan extends Document {
  name: string;
  description?: string;
  minAmount: number;
  maxAmount?: number;
  dailyROI?: number; // Percentage (e.g., 5.5 for 5.5%)
  compoundingEnabled: boolean;
  isActive: boolean;
  planType: PlanType;
  durationDays: number;
  payoutType: PlanPayoutType;
  payoutDelayHours?: number;
  lumpSumROI?: number;
  visibility?: WeeklyVisibilityWindow;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const investmentPlanSchema = new Schema<IInvestmentPlan>(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    minAmount: {
      type: Number,
      required: [true, 'Minimum amount is required'],
      min: 0,
    },
    maxAmount: {
      type: Number,
      min: 0,
    },
    dailyROI: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    compoundingEnabled: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    planType: {
      type: String,
      enum: ['bot', 'weekly'],
      default: 'bot',
      index: true,
    },
    durationDays: {
      type: Number,
      min: 1,
      default: 20,
    },
    payoutType: {
      type: String,
      enum: ['daily', 'lump_sum'],
      default: 'daily',
    },
    payoutDelayHours: {
      type: Number,
      min: 1,
    },
    lumpSumROI: {
      type: Number,
      min: 0,
      max: 1000,
    },
    visibility: {
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
      },
      startHourUtc: {
        type: Number,
        min: 0,
        max: 23,
        default: 0,
      },
      durationHours: {
        type: Number,
        min: 1,
        max: 168,
        default: 24,
      },
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding plans by amount range
investmentPlanSchema.index({ minAmount: 1, maxAmount: 1 });
investmentPlanSchema.index({ planType: 1, isActive: 1, displayOrder: 1 });

export const InvestmentPlan = mongoose.model<IInvestmentPlan>('InvestmentPlan', investmentPlanSchema);








