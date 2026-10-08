import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
  TenantStatus,
  PlanTier,
  TenantBranding,
  TenantLimits,
  TenantFeatureFlags,
  BillingProvider,
} from '@university-lms/shared';
import {
  DEFAULT_PLAN_LIMITS,
  DEFAULT_PLAN_FEATURE_FLAGS,
} from '@university-lms/shared';

export interface ITenant extends Document {
  name: string;
  slug: string;
  status: TenantStatus;
  branding: TenantBranding;
  planId: string;
  planTier: PlanTier;
  featureFlags: TenantFeatureFlags;
  limits: TenantLimits;
  /** Stripe / Razorpay customer id */
  billingCustomerId?: string | null;
  billingProvider: BillingProvider;
  subscriptionId?: string | null;
  currentPeriodEnd?: Date | null;
  trialEndsAt?: Date | null;
  cancelAtPeriodEnd: boolean;
  customDomain?: string | null;
  settings: Record<string, unknown>;
  ownerId?: Types.ObjectId | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BrandingSchema = new Schema(
  {
    name: { type: String },
    logoUrl: { type: String },
    primaryColor: { type: String },
    secondaryColor: { type: String },
    faviconUrl: { type: String },
    customDomain: { type: String },
  },
  { _id: false }
);

const LimitsSchema = new Schema(
  {
    maxStudents: { type: Number, required: true },
    maxFaculty: { type: Number, required: true },
    maxStorageGB: { type: Number, required: true },
    maxCourses: { type: Number, required: true },
    maxAdmins: { type: Number, required: true },
  },
  { _id: false }
);

const TenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'],
    },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'suspended'],
      default: 'trialing',
      index: true,
    },
    branding: {
      type: BrandingSchema,
      default: () => ({}),
    },
    planId: {
      type: String,
      required: true,
      default: 'free',
      index: true,
    },
    planTier: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free',
      index: true,
    },
    featureFlags: {
      type: Schema.Types.Mixed,
      default: () => ({ ...DEFAULT_PLAN_FEATURE_FLAGS.free }),
    },
    limits: {
      type: LimitsSchema,
      default: () => ({ ...DEFAULT_PLAN_LIMITS.free }),
    },
    billingCustomerId: { type: String, default: null, index: true },
    billingProvider: {
      type: String,
      enum: ['stripe', 'razorpay', 'none'],
      default: 'none',
    },
    subscriptionId: { type: String, default: null },
    currentPeriodEnd: { type: Date, default: null },
    trialEndsAt: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    customDomain: {
      type: String,
      default: null,
      lowercase: true,
      trim: true
    },
    settings: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

TenantSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
TenantSchema.index(
  { customDomain: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { isDeleted: false, customDomain: { $type: 'string' } },
  }
);
TenantSchema.index({ status: 1, planTier: 1 });
TenantSchema.index({ isDeleted: 1, createdAt: -1 });

export const Tenant = mongoose.model<ITenant>('Tenant', TenantSchema);
