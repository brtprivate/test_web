import mongoose, { Schema, Document } from 'mongoose';
import { PlanPayoutType, PlanType } from '../../investment-plans/models/investment-plan.model';

export interface IInvestmentTopUpEntry {
  amount: number;
  date: Date;
  walletSource: 'earning' | 'investment';
  previousAmount: number;
  newAmount: number;
}

export interface IInvestment extends Document {
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  amount: number;
  dailyROI: number;
  currentBalance: number; // For compounding
  totalEarned: number;
  compoundingEnabled: boolean;
  status: 'active' | 'completed' | 'cancelled';
  isWelcomeBonusInvestment?: boolean; // Flag to mark welcome bonus investments (no ROI on these)
  startDate: Date;
  lastPayoutDate?: Date;
  endDate?: Date;
  planType: PlanType;
  durationDays: number;
  payoutType: PlanPayoutType;
  payoutDelayHours?: number;
  lumpSumPercentage?: number;
  lumpSumPaid?: boolean;
  createdAt: Date;
  updatedAt: Date;
  topUpHistory?: IInvestmentTopUpEntry[];
}

const investmentSchema = new Schema<IInvestment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'InvestmentPlan',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Investment amount is required'],
      min: 0,
    },
    dailyROI: {
      type: Number,
      required: true,
      min: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    compoundingEnabled: {
      type: Boolean,
      default: true,
    },
    isWelcomeBonusInvestment: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    lastPayoutDate: {
      type: Date,
    },
    endDate: {
      type: Date,
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
    lumpSumPercentage: {
      type: Number,
      min: 0,
    },
    lumpSumPaid: {
      type: Boolean,
      default: false,
    },
    topUpHistory: {
      type: [
        {
          amount: {
            type: Number,
            required: true,
            min: 0,
          },
          date: {
            type: Date,
            default: Date.now,
          },
          walletSource: {
            type: String,
            enum: ['earning', 'investment'],
            required: true,
          },
          previousAmount: {
            type: Number,
            required: true,
            min: 0,
          },
          newAmount: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
investmentSchema.index({ user: 1, status: 1 });
investmentSchema.index({ status: 1, lastPayoutDate: 1 });
investmentSchema.index({ planType: 1, payoutType: 1 });

export const Investment = mongoose.model<IInvestment>('Investment', investmentSchema);

