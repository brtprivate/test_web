import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawal extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  currency: string; // BNB, USDT, etc.
  network: string; // BEP20, TRC20, ERC20
  walletAddress: string; // Wallet address (compulsory)
  status: 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';
  transactionHash?: string; // Blockchain transaction hash (when processed)
  approvedAt?: Date;
  completedAt?: Date;
  rejectedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId; // Admin who approved
  rejectedBy?: mongoose.Types.ObjectId; // Admin who rejected
  adminNote?: string; // Admin can add notes
  userNote?: string; // User can add notes
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>(
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
      enum: ['BNB', 'USDT', 'BTC', 'ETH'],
    },
    network: {
      type: String,
      required: true,
      default: 'BEP20',
      enum: ['BEP20', 'TRC20', 'ERC20'],
    },
    walletAddress: {
      type: String,
      required: [true, 'Wallet address is required'],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    transactionHash: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    approvedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    adminNote: {
      type: String,
      trim: true,
    },
    userNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
withdrawalSchema.index({ user: 1, status: 1 });
withdrawalSchema.index({ transactionHash: 1 }, { unique: true, sparse: true });
withdrawalSchema.index({ createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 }); // For admin pending withdrawals

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);

