import mongoose, { Schema, Document } from 'mongoose';

export interface IWalletAdjustment extends Document {
  user: mongoose.Types.ObjectId;
  walletType: 'investment' | 'earning';
  action: 'add' | 'deduct';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  admin: mongoose.Types.ObjectId; // Admin who made the adjustment
  createdAt: Date;
  updatedAt: Date;
}

const walletAdjustmentSchema = new Schema<IWalletAdjustment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    walletType: {
      type: String,
      enum: ['investment', 'earning'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['add', 'deduct'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
walletAdjustmentSchema.index({ user: 1, createdAt: -1 });
walletAdjustmentSchema.index({ admin: 1, createdAt: -1 });
walletAdjustmentSchema.index({ walletType: 1, createdAt: -1 });
walletAdjustmentSchema.index({ action: 1, createdAt: -1 });

export const WalletAdjustment = mongoose.model<IWalletAdjustment>(
  'WalletAdjustment',
  walletAdjustmentSchema
);

