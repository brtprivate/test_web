import mongoose, { Schema, Document } from 'mongoose';

export interface IIncomeTransaction extends Document {
  user: mongoose.Types.ObjectId;
  incomeType: 'daily_roi' | 'referral' | 'team_income' | 'bonus' | 'compounding' | 'weekly_trade';
  amount: number;
  earningWalletBefore: number;
  earningWalletAfter: number;
  description: string;
  referenceId?: string; // Investment ID, Referral ID, etc.
  investmentId?: mongoose.Types.ObjectId; // If income is from investment
  level?: number; // For team income (1-9)
  status: 'pending' | 'completed' | 'failed';
  incomeDate: Date; // Date when income was earned
  createdAt: Date;
  updatedAt: Date;
}

const incomeTransactionSchema = new Schema<IIncomeTransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    incomeType: {
      type: String,
      enum: ['daily_roi', 'referral', 'team_income', 'bonus', 'compounding', 'weekly_trade'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Income amount is required'],
      min: 0,
    },
    earningWalletBefore: {
      type: Number,
      required: true,
      min: 0,
    },
    earningWalletAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    referenceId: {
      type: String,
    },
    investmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Investment',
    },
    level: {
      type: Number,
      min: 1,
      max: 10,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
      index: true,
    },
    incomeDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
incomeTransactionSchema.index({ user: 1, incomeDate: -1 });
incomeTransactionSchema.index({ user: 1, incomeType: 1 });
incomeTransactionSchema.index({ user: 1, status: 1 });
incomeTransactionSchema.index({ investmentId: 1 });
incomeTransactionSchema.index({ incomeDate: 1 });

export const IncomeTransaction = mongoose.model<IIncomeTransaction>(
  'IncomeTransaction',
  incomeTransactionSchema
);

