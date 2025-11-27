import mongoose, { Schema, Document } from 'mongoose';

export interface IDeposit extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  currency: string; // USDT, BTC, etc.
  network: string; // TRC20, ERC20, BEP20
  transactionHash?: string; // Blockchain transaction hash
  walletAddress: string; // User's wallet address
  fromAddress?: string; // Sender's address
  status: 'pending' | 'confirmed' | 'completed' | 'failed' | 'cancelled';
  confirmedAt?: Date;
  completedAt?: Date;
  confirmationCount?: number; // Number of blockchain confirmations
  description?: string;
  adminNote?: string; // Admin can add notes
  createdAt: Date;
  updatedAt: Date;
}

const depositSchema = new Schema<IDeposit>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USDT',
      enum: ['USDT', 'BTC', 'ETH', 'BNB'],
    },
    network: {
      type: String,
      required: true,
      default: 'TRC20',
      enum: ['TRC20', 'ERC20', 'BEP20'],
    },
    transactionHash: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    walletAddress: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    fromAddress: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    confirmedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    confirmationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    adminNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
depositSchema.index({ user: 1, status: 1 });
depositSchema.index({ transactionHash: 1 }, { unique: true, sparse: true });
depositSchema.index({ createdAt: -1 });

export const Deposit = mongoose.model<IDeposit>('Deposit', depositSchema);








