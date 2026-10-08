import mongoose, { Schema, Document } from 'mongoose';
import type {
  PlanTier,
  BillingInterval,
  TenantLimits,
  TenantFeatureFlags,
} from '@university-lms/shared';
import {
  DEFAULT_PLAN_LIMITS,
  DEFAULT_PLAN_FEATURE_FLAGS,
  SEED_PLANS,
} from '@university-lms/shared';

export interface IPlan extends Document {
  key: PlanTier;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: BillingInterval;
  features: string[];
  featureFlags: TenantFeatureFlags;
  limits: TenantLimits;
  isActive: boolean;
  isPublic: boolean;
  trialDays: number;
  sortOrder: number;
  /** External price IDs for Stripe / Razorpay */
  stripePriceId?: string | null;
  razorpayPlanId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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

const PlanSchema = new Schema<IPlan>(
  {
    key: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    interval: { type: String, enum: ['month', 'year'], default: 'month' },
    features: { type: [String], default: [] },
    featureFlags: { type: Schema.Types.Mixed, default: {} },
    limits: { type: LimitsSchema, required: true },
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
    trialDays: { type: Number, default: 14 },
    sortOrder: { type: Number, default: 0 },
    stripePriceId: { type: String, default: null },
    razorpayPlanId: { type: String, default: null },
  },
  { timestamps: true }
);

PlanSchema.index({ isActive: 1, isPublic: 1, sortOrder: 1 });

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);

/** Idempotent seed of default plans */
export async function seedPlans(): Promise<void> {
  for (const seed of SEED_PLANS) {
    await Plan.findOneAndUpdate(
      { key: seed.key },
      {
        $setOnInsert: {
          key: seed.key,
          name: seed.name,
          description: seed.description,
          price: seed.price,
          currency: seed.currency,
          interval: seed.interval,
          features: seed.features,
          featureFlags: { ...DEFAULT_PLAN_FEATURE_FLAGS[seed.key] },
          limits: { ...DEFAULT_PLAN_LIMITS[seed.key] },
          isActive: true,
          isPublic: true,
          trialDays: seed.trialDays,
          sortOrder: seed.sortOrder,
        },
      },
      { upsert: true, new: true }
    );
  }
}
