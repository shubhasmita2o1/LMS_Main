import { z } from 'zod';

const eligibilitySchema = z
  .object({
    minCgpa: z.number().min(0).max(10).optional().nullable(),
    programs: z.array(z.string()).optional().nullable(),
    maxBacklogs: z.number().int().min(0).optional().nullable(),
    batchYears: z.array(z.number().int()).optional().nullable(),
  })
  .optional()
  .nullable();

export const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(300),
  industry: z.string().max(200).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['active', 'inactive', 'blacklisted']).default('active'),
  contactEmail: z.string().email().optional().nullable().or(z.literal('')),
  contactPhone: z.string().max(40).optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal('')),
});

export const updateCompanySchema = createCompanySchema.partial();

export const createDriveSchema = z.object({
  companyId: z.string().min(1),
  title: z.string().trim().min(1).max(300),
  jobType: z.enum(['placement', 'internship']),
  description: z.string().max(10000).optional().nullable(),
  packageMin: z.number().min(0).optional().nullable(),
  packageMax: z.number().min(0).optional().nullable(),
  location: z.string().max(300).optional().nullable(),
  eligibility: eligibilitySchema,
  applicationOpenAt: z.string().datetime().optional().nullable(),
  applicationCloseAt: z.string().datetime().optional().nullable(),
  status: z.enum(['draft', 'open', 'closed', 'completed']).optional(),
});

export const updateDriveSchema = createDriveSchema.partial();

export const listDrivesQuerySchema = z.object({
  status: z.enum(['draft', 'open', 'closed', 'completed']).optional(),
  jobType: z.enum(['placement', 'internship']).optional(),
  companyId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const applySchema = z.object({
  driveId: z.string().min(1),
  resumeFileKey: z.string().max(500).optional().nullable(),
  coverNote: z.string().max(5000).optional().nullable(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum([
    'shortlisted',
    'interview',
    'offered',
    'accepted',
    'rejected',
    'withdrawn',
  ]),
  note: z.string().max(1000).optional().nullable(),
});

export const createInterviewSchema = z.object({
  applicationId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  mode: z.enum(['online', 'offline', 'hybrid']).default('online'),
  locationOrLink: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateInterviewSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  mode: z.enum(['online', 'offline', 'hybrid']).optional(),
  locationOrLink: z.string().max(500).optional().nullable(),
  result: z.enum(['pending', 'passed', 'failed', 'no_show', 'rescheduled']).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const createOfferSchema = z.object({
  applicationId: z.string().min(1),
  packageAmount: z.number().min(0).optional().nullable(),
  currency: z.string().max(8).default('INR'),
  roleTitle: z.string().trim().min(1).max(300),
  expiresAt: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const respondOfferSchema = z.object({
  accept: z.boolean(),
});

export const listApplicationsQuerySchema = z.object({
  driveId: z.string().optional(),
  studentId: z.string().optional(),
  status: z
    .enum([
      'draft',
      'applied',
      'shortlisted',
      'interview',
      'offered',
      'accepted',
      'rejected',
      'withdrawn',
    ])
    .optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
