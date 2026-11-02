import { z } from 'zod';

const hierarchyConfigSchema = z
  .object({
    campus: z.boolean().optional(),
    school: z.boolean().optional(),
    department: z.boolean().optional(),
    program: z.boolean().optional(),
    academicYear: z.boolean().optional(),
    semester: z.boolean().optional(),
    batch: z.boolean().optional(),
    section: z.boolean().optional(),
  })
  .optional();

const featureTogglesSchema = z
  .object({
    labs: z.boolean().optional(),
    placement: z.boolean().optional(),
    library: z.boolean().optional(),
    examinations: z.boolean().optional(),
    admissions: z.boolean().optional(),
    finance: z.boolean().optional(),
    research: z.boolean().optional(),
    hostel: z.boolean().optional(),
    transport: z.boolean().optional(),
  })
  .optional();

export const completeSetupSchema = z.object({
  institution: z.object({
    name: z.string().trim().min(2).max(200),
    code: z.string().trim().max(50).optional(),
    type: z
      .enum([
        'affiliated',
        'autonomous',
        'private_university',
        'public_university',
        'deemed',
        'multi_campus',
        'standalone',
        'technical',
        'other',
      ])
      .optional(),
    hierarchyConfig: hierarchyConfigSchema,
    featureToggles: featureTogglesSchema,
  }),
  admin: z.object({
    email: z.string().trim().email().max(255),
    password: z
      .string()
      .min(10, 'Password must be at least 10 characters')
      .max(128)
      .regex(/[A-Z]/, 'Password must include an uppercase letter')
      .regex(/[a-z]/, 'Password must include a lowercase letter')
      .regex(/[0-9]/, 'Password must include a number'),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
  }),
});

export type CompleteSetupBody = z.infer<typeof completeSetupSchema>;
