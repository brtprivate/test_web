import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
  username: string;
  email: string;
  password: string;
  role: 'admin';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  // Check if password hash is valid bcrypt format
  if (!this.password || typeof this.password !== 'string') {
    throw new Error('Password hash is missing or invalid');
  }

  // Valid bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$
  if (!this.password.match(/^\$2[abxy]\$\d{2}\$/)) {
    throw new Error(`Invalid password hash format. The stored password appears to be corrupted or not properly hashed. Expected bcrypt hash format, but got: ${this.password.substring(0, 10)}...`);
  }

  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error: any) {
    // If bcrypt comparison fails due to invalid hash, provide a clearer error
    if (error.message.includes('Invalid salt revision')) {
      throw new Error(`Invalid password hash in database. The password for this admin account needs to be reset. Original error: ${error.message}`);
    }
    throw error;
  }
};

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);

