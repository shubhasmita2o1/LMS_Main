import { z } from 'zod';

const brandingSchema = z
  .object({
    name: z.string().max(200).optional(),
    logoUrl: z.string().url().max(2048).optional().or(z.literal('')),
    primaryColor: z
      .string()
      .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color')
      .optional()
      .or(z.literal('')),
    secondaryColor: z
      .string()
      .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color')
      .optional()
      .or(z.literal('')),
    faviconUrl: z.string().url().max(2048).optional().or(z.literal('')),
    customDomain: z.string().max(253).optional().or(z.literal('')),
  })
  .partial();

const limitsSchema = z
  .object({
    maxStudents: z.number().int().min(0).optional(),
    maxFaculty: z.number().int().min(0).optional(),
    maxStorageGB: z.number().min(0).optional(),
    maxCourses: z.number().int().min(0).optional(),
    maxAdmins: z.number().int().min(0).optional(),
  })
  .partial();

export const createTenantSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  planTier: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),
  ownerEmail: z.string().email().optional(),
  ownerFirstName: z.string().min(1).max(100).optional(),
  ownerLastName: z.string().min(1).max(100).optional(),
  ownerPassword: z.string().min(8).max(128).optional(),
  branding: brandingSchema.optional(),
  trialDays: z.number().int().min(0).max(90).optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'suspended']).optional(),
  planTier: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  branding: brandingSchema.optional(),
  limits: limitsSchema.optional(),
  featureFlags: z.record(z.boolean()).optional(),
  customDomain: z.string().max(253).nullable().optional(),
  settings: z.record(z.unknown()).optional(),
  trialEndsAt: z.coerce.date().nullable().optional(),
});

export const updateTenantMeSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  branding: brandingSchema.optional(),
  settings: z.record(z.unknown()).optional(),
  customDomain: z.string().max(253).nullable().optional(),
});

export const onboardTenantSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  planTier: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),
  owner: z.object({
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/[A-Za-z]/)
      .regex(/[0-9]/),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
  }),
  branding: brandingSchema.optional(),
});

export const listTenantsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'suspended']).optional(),
  planTier: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
});

export type CreateTenantBody = z.infer<typeof createTenantSchema>;
export type UpdateTenantBody = z.infer<typeof updateTenantSchema>;
export type OnboardTenantBody = z.infer<typeof onboardTenantSchema>;
