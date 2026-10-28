import { z } from 'zod';

const audienceFilterSchema = z
  .object({
    courseId: z.string().optional().nullable(),
    programId: z.string().optional().nullable(),
    sectionId: z.string().optional().nullable(),
    roles: z.array(z.string()).optional().nullable(),
  })
  .optional()
  .nullable();

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1).max(300),
  body: z.string().min(1).max(20000),
  audienceType: z.enum(['tenant', 'course', 'program', 'section', 'role']),
  audienceFilter: audienceFilterSchema,
  channels: z.array(z.enum(['in_app', 'email', 'push', 'sms'])).optional(),
  status: z.enum(['draft', 'published']).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  body: z.string().min(1).max(20000).optional(),
  audienceType: z.enum(['tenant', 'course', 'program', 'section', 'role']).optional(),
  audienceFilter: audienceFilterSchema,
  channels: z.array(z.enum(['in_app', 'email', 'push', 'sms'])).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const listAnnouncementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});
