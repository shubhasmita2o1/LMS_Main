import { z } from 'zod';

const timeHm = z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:mm');

export const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(40),
  capacity: z.number().int().min(1).max(5000).optional(),
  roomType: z.enum(['classroom', 'lab', 'seminar', 'other']).optional(),
  campusId: z.string().optional().nullable(),
  building: z.string().max(120).optional().nullable(),
  facilities: z.array(z.string()).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateRoomSchema = createRoomSchema.partial().omit({ code: true });

export const createEntrySchema = z.object({
  courseId: z.string().min(1),
  facultyId: z.string().min(1),
  roomId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
  academicYearId: z.string().optional().nullable(),
  termId: z.string().optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: timeHm,
  endTime: timeHm,
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  force: z.boolean().optional(),
});

export const updateEntrySchema = createEntrySchema.partial();

export const listEntriesQuerySchema = z.object({
  facultyId: z.string().optional(),
  sectionId: z.string().optional(),
  roomId: z.string().optional(),
  courseId: z.string().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  status: z.enum(['scheduled', 'cancelled', 'substituted']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const conflictCheckSchema = z.object({
  courseId: z.string().min(1),
  facultyId: z.string().min(1),
  roomId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: timeHm,
  endTime: timeHm,
  excludeEntryId: z.string().optional().nullable(),
});

export const substituteSchema = z.object({
  date: z.string().min(1),
  newFacultyId: z.string().optional().nullable(),
  newRoomId: z.string().optional().nullable(),
  newStartTime: timeHm.optional().nullable(),
  newEndTime: timeHm.optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
});
