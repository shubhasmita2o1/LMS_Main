import { z } from 'zod';
import {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  ATTENDANCE_STATUSES,
  ATTENDANCE_SESSION_TYPES,
  ATTENDANCE_METHODS,
} from '@university-lms/shared';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const listSessionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  courseId: objectId.optional(),
  offeringId: objectId.optional(),
  sectionId: objectId.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.enum(['open', 'closed']).optional(),
});

export const sessionCreateSchema = z.object({
  courseId: objectId,
  offeringId: objectId.optional().nullable(),
  sectionId: objectId.optional().nullable(),
  date: z.string().min(1), // ISO date
  startTime: z.string().max(10).optional().nullable(),
  endTime: z.string().max(10).optional().nullable(),
  sessionType: z
    .enum(ATTENDANCE_SESSION_TYPES as unknown as [string, ...string[]])
    .default('lecture'),
  topic: z.string().max(500).optional().nullable(),
  title: z.string().max(300).optional().nullable(),
  method: z.enum(ATTENDANCE_METHODS as unknown as [string, ...string[]]).default('manual'),
});

export const sessionUpdateSchema = z.object({
  date: z.string().optional(),
  startTime: z.string().max(10).optional().nullable(),
  endTime: z.string().max(10).optional().nullable(),
  sessionType: z.enum(ATTENDANCE_SESSION_TYPES as unknown as [string, ...string[]]).optional(),
  topic: z.string().max(500).optional().nullable(),
  title: z.string().max(300).optional().nullable(),
});

export const bulkRecordsSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: objectId,
        status: z.enum(ATTENDANCE_STATUSES as unknown as [string, ...string[]]),
        note: z.string().max(500).optional().nullable(),
      })
    )
    .min(1)
    .max(500),
});

export const singleRecordSchema = z.object({
  studentId: objectId,
  status: z.enum(ATTENDANCE_STATUSES as unknown as [string, ...string[]]),
  note: z.string().max(500).optional().nullable(),
});

export const summaryQuerySchema = z.object({
  courseId: objectId,
  offeringId: objectId.optional(),
});

export const meAttendanceQuerySchema = z.object({
  courseId: objectId.optional(),
});

export const shortageQuerySchema = z.object({
  courseId: objectId,
  offeringId: objectId.optional(),
});
