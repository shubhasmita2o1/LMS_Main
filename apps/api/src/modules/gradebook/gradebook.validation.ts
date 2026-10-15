import { z } from 'zod';
import {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  GRADE_COMPONENT_TYPES,
  GRADE_COMPONENT_SOURCES,
  GRADEBOOK_STATUSES,
} from '@university-lms/shared';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const componentSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, 'key must be alphanumeric/underscore/hyphen'),
  name: z.string().min(1).max(200),
  type: z.enum(GRADE_COMPONENT_TYPES as unknown as [string, ...string[]]),
  weightPercent: z.number().min(0).max(100),
  maxMarks: z.number().min(0).max(10000).default(100),
  source: z.enum(GRADE_COMPONENT_SOURCES as unknown as [string, ...string[]]).default('manual'),
  sourceIds: z.array(objectId).optional().default([]),
  dropLowest: z.number().int().min(0).max(50).optional().default(0),
});

export const listGradebooksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  courseId: objectId.optional(),
  offeringId: objectId.optional(),
  status: z.enum(GRADEBOOK_STATUSES as unknown as [string, ...string[]]).optional(),
  search: z.string().optional(),
});

export const gradebookCreateSchema = z
  .object({
    courseId: objectId,
    offeringId: objectId.optional().nullable(),
    academicYearId: objectId.optional().nullable(),
    semesterId: objectId.optional().nullable(),
    title: z.string().min(1).max(300),
    components: z.array(componentSchema).min(1).max(30),
  })
  .superRefine((data, ctx) => {
    const sum = data.components.reduce((s, c) => s + c.weightPercent, 0);
    if (Math.abs(sum - 100) > 0.5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Component weights must sum to 100 (got ${sum.toFixed(2)})`,
        path: ['components'],
      });
    }
    const keys = data.components.map((c) => c.key);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Component keys must be unique',
        path: ['components'],
      });
    }
  });

export const gradebookUpdateSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    offeringId: objectId.optional().nullable(),
    academicYearId: objectId.optional().nullable(),
    semesterId: objectId.optional().nullable(),
    components: z.array(componentSchema).min(1).max(30).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.components) {
      const sum = data.components.reduce((s, c) => s + c.weightPercent, 0);
      if (Math.abs(sum - 100) > 0.5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Component weights must sum to 100 (got ${sum.toFixed(2)})`,
          path: ['components'],
        });
      }
      const keys = data.components.map((c) => c.key);
      if (new Set(keys).size !== keys.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Component keys must be unique',
          path: ['components'],
        });
      }
    }
  });

export const upsertEntriesSchema = z.object({
  entries: z
    .array(
      z.object({
        studentId: objectId,
        componentKey: z.string().min(1).max(64),
        rawMarks: z.number().min(0).optional(),
        overriddenMarks: z.number().min(0).optional().nullable(),
        overrideReason: z.string().max(1000).optional().nullable(),
        isExcluded: z.boolean().optional(),
      })
    )
    .min(1)
    .max(500),
});

export const publishResultsSchema = z.object({
  studentIds: z.array(objectId).optional(),
  remarks: z.string().max(2000).optional().nullable(),
});
