import mongoose, { Schema, Document, Types } from 'mongoose';
import type { SystemRole, Permission, LoginHistoryEntry } from '@university-lms/shared';

export interface IRefreshToken {
  token: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ip?: string;
  deviceId?: string;
}

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: SystemRole[];
  permissions: Permission[];
  /** null for super_admin only */
  tenantId: Types.ObjectId | null;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  loginHistory: LoginHistoryEntry[];
  refreshTokens: IRefreshToken[];
  failedLoginAttempts: number;
  lockUntil?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  emailVerificationToken?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema(
  {
    resource: { type: String, required: true },
    action: { type: String, required: true },
    scope: { type: String },
  },
  { _id: false }
);

const RefreshTokenSchema = new Schema(
  {
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    userAgent: { type: String },
    ip: { type: String },
    deviceId: { type: String },
  },
  { _id: false }
);

const LoginHistorySchema = new Schema(
  {
    at: { type: Date, required: true },
    ip: { type: String },
    userAgent: { type: String },
    success: { type: Boolean, required: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, required: true, trim: true, maxlength: 100 },
    roles: {
      type: [String],
      required: true,
      default: [],
    },
    permissions: {
      type: [PermissionSchema],
      default: [],
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    loginHistory: {
      type: [LoginHistorySchema],
      default: [],
    },
    refreshTokens: {
      type: [RefreshTokenSchema],
      default: [],
      select: false,
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
    emailVerificationToken: { type: String, default: null, select: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.emailVerificationToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique: same email can exist in different tenants; super_admin email is unique globally (tenantId null)
UserSchema.index(
  { email: 1, tenantId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);
UserSchema.index({ tenantId: 1, isDeleted: 1 });
UserSchema.index({ 'refreshTokens.token': 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
