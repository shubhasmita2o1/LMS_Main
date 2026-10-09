import { z } from 'zod';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '@university-lms/shared';

const statusEnum = z.enum(['active', 'inactive', 'archived']);
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().optional(),
  status: statusEnum.optional(),
  universityId: objectId.optional(),
  campusId: objectId.optional(),
  schoolId: objectId.optional(),
  departmentId: objectId.optional(),
  programId: objectId.optional(),
  batchId: objectId.optional(),
  academicYearId: objectId.optional(),
});

export const universityCreateSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(32),
  type: z.enum(['public', 'private', 'deemed', 'autonomous', 'other']).default('private'),
  address: z.string().max(500).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(30).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  status: statusEnum.optional(),
});

export const universityUpdateSchema = universityCreateSchema.partial();

export const campusCreateSchema = z.object({
  universityId: objectId,
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(32),
  address: z.string().max(500).optional(),
  isMainCampus: z.boolean().optional(),
  status: statusEnum.optional(),
});

export const campusUpdateSchema = campusCreateSchema.partial().omit({ universityId: true }).extend({
  universityId: objectId.optional(),
});

export const schoolCreateSchema = z.object({
  universityId: objectId,
  campusId: objectId.optional().nullable(),
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(32),
  status: statusEnum.optional(),
});

export const schoolUpdateSchema = schoolCreateSchema.partial();

export const departmentCreateSchema = z.object({
  universityId: objectId,
  campusId: objectId.optional().nullable(),
  schoolId: objectId.optional().nullable(),
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(32),
  hodUserId: objectId.optional().nullable(),
  status: statusEnum.optional(),
});

export const departmentUpdateSchema = departmentCreateSchema.partial();

export const programCreateSchema = z.object({
  departmentId: objectId,
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(32),
  degreeType: z
    .enum(['certificate', 'diploma', 'ug', 'pg', 'doctoral', 'integrated', 'other'])
    .default('ug'),
  durationYears: z.number().min(0.5).max(10),
  totalCredits: z.number().min(0).max(1000),
  coordinatorUserId: objectId.optional().nullable(),
  status: statusEnum.optional(),
});

export const programUpdateSchema = programCreateSchema.partial();

export const academicYearCreateSchema = z.object({
  name: z.string().min(2).max(50),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isCurrent: z.boolean().optional(),
  status: statusEnum.optional(),
});

export const academicYearUpdateSchema = academicYearCreateSchema.partial();

export const semesterCreateSchema = z.object({
  academicYearId: objectId,
  name: z.string().min(1).max(50),
  sequence: z.number().int().min(1).max(12),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isCurrent: z.boolean().optional(),
  status: statusEnum.optional(),
});

export const semesterUpdateSchema = semesterCreateSchema.partial();

export const batchCreateSchema = z.object({
  programId: objectId,
  academicYearId: objectId.optional().nullable(),
  name: z.string().min(1).max(100),
  startYear: z.number().int().min(1990).max(2100),
  endYear: z.number().int().min(1990).max(2100),
  status: statusEnum.optional(),
});

export const batchUpdateSchema = batchCreateSchema.partial();

export const sectionCreateSchema = z.object({
  batchId: objectId,
  name: z.string().min(1).max(50),
  maxStudents: z.number().int().min(1).max(500).default(60),
  advisorUserId: objectId.optional().nullable(),
  status: statusEnum.optional(),
});

export const sectionUpdateSchema = sectionCreateSchema.partial();

export const assignUserSchema = z.object({
  userId: objectId.nullable(),
});

export const academicConfigUpdateSchema = z.object({
  gradingScheme: z
    .object({
      name: z.string().min(1),
      scaleMax: z.number().min(1).max(100),
      bands: z
        .array(
          z.object({
            letter: z.string().min(1).max(5),
            minPercent: z.number().min(0).max(100),
            maxPercent: z.number().min(0).max(100),
            gradePoint: z.number().min(0).max(100),
          })
        )
        .min(1),
    })
    .optional(),
  creditStructure: z
    .object({
      minCreditsPerSemester: z.number().min(0),
      maxCreditsPerSemester: z.number().min(0),
      creditHoursPerLecture: z.number().min(0),
      creditHoursPerLab: z.number().min(0),
    })
    .optional(),
  attendanceRules: z
    .object({
      minimumPercent: z.number().min(0).max(100),
      considerMedicalLeave: z.boolean(),
    })
    .optional(),
  promotionRules: z
    .object({
      minCgpaToPass: z.number().min(0),
      maxBacklogsAllowed: z.number().int().min(0),
    })
    .optional(),
});
