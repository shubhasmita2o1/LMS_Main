/**
 * Shared constants
 */

import type { PlanTier, TenantFeatureFlags, TenantLimits } from './types';

export const APP_NAME = 'University LMS';
export const APP_VERSION = '0.3.0';

/** Default pagination */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/** JWT related */
export const ACCESS_TOKEN_EXPIRES_IN = '15m';
export const REFRESH_TOKEN_EXPIRES_IN = '7d';
/** Access token lifetime in seconds (for client) */
export const ACCESS_TOKEN_EXPIRES_SECONDS = 15 * 60;

/** Tenant resolution headers / strategies */
export const TENANT_HEADER = 'x-tenant-id';
export const TENANT_SUBDOMAIN_HEADER = 'x-tenant-subdomain';

/** Soft delete flag */
export const SOFT_DELETE_FIELD = 'isDeleted';

/** Bcrypt cost factor */
export const BCRYPT_ROUNDS = 12;

/** Max failed login attempts before temporary lock (Phase 2 basic) */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/** Default trial period when creating a tenant (days) */
export const DEFAULT_TRIAL_DAYS = 14;

/** Known feature flag keys */
export const FEATURE_FLAGS = {
  ADVANCED_ANALYTICS: 'advanced_analytics',
  CUSTOM_DOMAIN: 'custom_domain',
  WHITE_LABEL: 'white_label',
  LAB_MODULE: 'lab_module',
  PLACEMENT_MODULE: 'placement_module',
  LIBRARY_MODULE: 'library_module',
  API_ACCESS: 'api_access',
  SSO: 'sso',
  PRIORITY_SUPPORT: 'priority_support',
  UNLIMITED_STORAGE: 'unlimited_storage',
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

/** Default plan limits by tier */
export const DEFAULT_PLAN_LIMITS: Record<PlanTier, TenantLimits> = {
  free: {
    maxStudents: 50,
    maxFaculty: 5,
    maxStorageGB: 1,
    maxCourses: 10,
    maxAdmins: 1,
  },
  starter: {
    maxStudents: 500,
    maxFaculty: 50,
    maxStorageGB: 20,
    maxCourses: 100,
    maxAdmins: 5,
  },
  professional: {
    maxStudents: 5000,
    maxFaculty: 500,
    maxStorageGB: 200,
    maxCourses: 1000,
    maxAdmins: 25,
  },
  enterprise: {
    maxStudents: 100000,
    maxFaculty: 10000,
    maxStorageGB: 2000,
    maxCourses: 10000,
    maxAdmins: 100,
  },
};

/** Default feature flags by tier */
export const DEFAULT_PLAN_FEATURE_FLAGS: Record<PlanTier, TenantFeatureFlags> = {
  free: {
    [FEATURE_FLAGS.ADVANCED_ANALYTICS]: false,
    [FEATURE_FLAGS.CUSTOM_DOMAIN]: false,
    [FEATURE_FLAGS.WHITE_LABEL]: false,
    [FEATURE_FLAGS.LAB_MODULE]: false,
    [FEATURE_FLAGS.PLACEMENT_MODULE]: false,
    [FEATURE_FLAGS.LIBRARY_MODULE]: true,
    [FEATURE_FLAGS.API_ACCESS]: false,
    [FEATURE_FLAGS.SSO]: false,
    [FEATURE_FLAGS.PRIORITY_SUPPORT]: false,
    [FEATURE_FLAGS.UNLIMITED_STORAGE]: false,
  },
  starter: {
    [FEATURE_FLAGS.ADVANCED_ANALYTICS]: false,
    [FEATURE_FLAGS.CUSTOM_DOMAIN]: false,
    [FEATURE_FLAGS.WHITE_LABEL]: false,
    [FEATURE_FLAGS.LAB_MODULE]: true,
    [FEATURE_FLAGS.PLACEMENT_MODULE]: false,
    [FEATURE_FLAGS.LIBRARY_MODULE]: true,
    [FEATURE_FLAGS.API_ACCESS]: false,
    [FEATURE_FLAGS.SSO]: false,
    [FEATURE_FLAGS.PRIORITY_SUPPORT]: false,
    [FEATURE_FLAGS.UNLIMITED_STORAGE]: false,
  },
  professional: {
    [FEATURE_FLAGS.ADVANCED_ANALYTICS]: true,
    [FEATURE_FLAGS.CUSTOM_DOMAIN]: true,
    [FEATURE_FLAGS.WHITE_LABEL]: true,
    [FEATURE_FLAGS.LAB_MODULE]: true,
    [FEATURE_FLAGS.PLACEMENT_MODULE]: true,
    [FEATURE_FLAGS.LIBRARY_MODULE]: true,
    [FEATURE_FLAGS.API_ACCESS]: true,
    [FEATURE_FLAGS.SSO]: false,
    [FEATURE_FLAGS.PRIORITY_SUPPORT]: true,
    [FEATURE_FLAGS.UNLIMITED_STORAGE]: false,
  },
  enterprise: {
    [FEATURE_FLAGS.ADVANCED_ANALYTICS]: true,
    [FEATURE_FLAGS.CUSTOM_DOMAIN]: true,
    [FEATURE_FLAGS.WHITE_LABEL]: true,
    [FEATURE_FLAGS.LAB_MODULE]: true,
    [FEATURE_FLAGS.PLACEMENT_MODULE]: true,
    [FEATURE_FLAGS.LIBRARY_MODULE]: true,
    [FEATURE_FLAGS.API_ACCESS]: true,
    [FEATURE_FLAGS.SSO]: true,
    [FEATURE_FLAGS.PRIORITY_SUPPORT]: true,
    [FEATURE_FLAGS.UNLIMITED_STORAGE]: true,
  },
};

/** Seed plan catalog (prices in smallest currency unit cents / paise representation for display) */
export const SEED_PLANS = [
  {
    key: 'free' as PlanTier,
    name: 'Free',
    description: 'For small pilots and evaluation',
    price: 0,
    currency: 'USD',
    interval: 'month' as const,
    features: ['Up to 50 students', 'Basic LMS', 'Community support'],
    trialDays: 0,
    sortOrder: 0,
  },
  {
    key: 'starter' as PlanTier,
    name: 'Starter',
    description: 'Growing departments and small colleges',
    price: 99,
    currency: 'USD',
    interval: 'month' as const,
    features: ['Up to 500 students', 'Lab module', 'Email support'],
    trialDays: 14,
    sortOrder: 1,
  },
  {
    key: 'professional' as PlanTier,
    name: 'Professional',
    description: 'Full university departments',
    price: 299,
    currency: 'USD',
    interval: 'month' as const,
    features: [
      'Up to 5,000 students',
      'Custom domain',
      'White-label',
      'Advanced analytics',
      'API access',
    ],
    trialDays: 14,
    sortOrder: 2,
  },
  {
    key: 'enterprise' as PlanTier,
    name: 'Enterprise',
    description: 'Multi-campus institutions',
    price: 999,
    currency: 'USD',
    interval: 'month' as const,
    features: [
      'Unlimited scale',
      'SSO',
      'Priority support',
      'Dedicated success manager',
      'Custom SLAs',
    ],
    trialDays: 30,
    sortOrder: 3,
  },
];

/** Default system role permission sets (seed reference) */
export const SYSTEM_ROLE_PERMISSIONS: Record<
  string,
  Array<{ resource: string; action: string }>
> = {
  super_admin: [
    { resource: 'tenant', action: 'manage' },
    { resource: 'user', action: 'manage' },
    { resource: 'billing', action: 'manage' },
    { resource: 'feature_flag', action: 'manage' },
    { resource: 'plan', action: 'manage' },
  ],
  tenant_admin: [
    { resource: 'user', action: 'manage' },
    { resource: 'role', action: 'manage' },
    { resource: 'university', action: 'manage' },
    { resource: 'course', action: 'manage' },
    { resource: 'student', action: 'manage' },
    { resource: 'faculty', action: 'manage' },
    { resource: 'tenant', action: 'read' },
    { resource: 'tenant', action: 'update' },
    { resource: 'billing', action: 'read' },
    { resource: 'billing', action: 'manage' },
    { resource: 'feature_flag', action: 'read' },
    { resource: 'plan', action: 'read' },
  ],
  university_admin: [
    { resource: 'university', action: 'manage' },
    { resource: 'course', action: 'manage' },
    { resource: 'student', action: 'read' },
    { resource: 'faculty', action: 'read' },
  ],
  faculty: [
    { resource: 'course', action: 'read' },
    { resource: 'assignment', action: 'manage' },
    { resource: 'quiz', action: 'manage' },
    { resource: 'grade', action: 'manage' },
    { resource: 'attendance', action: 'manage' },
    { resource: 'student', action: 'read' },
  ],
  student: [
    { resource: 'course', action: 'read' },
    { resource: 'assignment', action: 'read' },
    { resource: 'quiz', action: 'read' },
    { resource: 'grade', action: 'read' },
    { resource: 'attendance', action: 'read' },
  ],
  staff: [{ resource: 'user', action: 'read' }],
  parent: [{ resource: 'student', action: 'read' }],
  guest: [],
};
