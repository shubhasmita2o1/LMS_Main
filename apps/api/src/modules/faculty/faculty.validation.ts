import { z } from 'zod';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '@university-lms/shared';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const statusEnum = z.enum(['active', 'inactive', 'on_leave', 'retired', 'terminated']);
const employmentEnum = z.enum(['full_time', 'part_time', 'visiting', 'contract', 'adjunct']);

const qualificationSchema = z.object({
  degree: z.string().min(1).max(120),
  institution: z.string().max(200).optional(),
  year: z.number().int().min(1950).max(2100).optional(),
  specialization: z.string().max(200).optional(),
});

export const listFacultyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().optional(),
  status: statusEnum.optional(),
  departmentId: objectId.optional(),
  employmentType: employmentEnum.optional(),
  designation: z.string().optional(),
  sort: z.string().optional(),
});

export const facultyCreateSchema = z.object({
  employeeId: z.string().min(1).max(50),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  alternatePhone: z.string().max(30).optional(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  designation: z.string().max(120).optional(),
  employmentType: employmentEnum.optional(),
  departmentId: objectId.optional().nullable(),
  additionalDepartmentIds: z.array(objectId).optional(),
  dateOfJoining: z.coerce.date().optional().nullable(),
  dateOfLeaving: z.coerce.date().optional().nullable(),
  status: statusEnum.optional(),
  qualifications: z.array(qualificationSchema).optional(),
  specializations: z.array(z.string().max(100)).optional(),
  experienceYears: z.number().min(0).max(60).optional(),
  bio: z.string().max(4000).optional(),
  officeLocation: z.string().max(200).optional(),
  officeHours: z.string().max(500).optional(),
  userId: objectId.optional().nullable(),
});

export const facultyUpdateSchema = facultyCreateSchema.partial();

export const statusChangeSchema = z.object({
  status: statusEnum,
});

export const assignDepartmentSchema = z.object({
  departmentId: objectId.optional().nullable(),
  additionalDepartmentIds: z.array(objectId).optional(),
});

export const assignmentCreateSchema = z.object({
  courseId: objectId.optional().nullable(),
  sectionId: objectId.optional().nullable(),
  academicYearId: objectId.optional().nullable(),
  semesterId: objectId.optional().nullable(),
  role: z
    .enum(['instructor', 'coordinator', 'lab_instructor', 'guest_lecturer', 'other'])
    .optional(),
  workloadHours: z.number().min(0).max(80).optional(),
});
