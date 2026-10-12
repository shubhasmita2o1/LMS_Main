import { z } from 'zod';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '@university-lms/shared';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const statusEnum = z.enum([
  'active',
  'inactive',
  'graduated',
  'suspended',
  'withdrawn',
  'on_leave',
  'alumni',
]);

const addressSchema = z
  .object({
    line1: z.string().max(200).optional(),
    line2: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
  })
  .optional();

const guardianSchema = z.object({
  name: z.string().min(1).max(120),
  relation: z.string().min(1).max(60),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  occupation: z.string().max(100).optional(),
  address: z.string().max(300).optional(),
  isPrimary: z.boolean().optional(),
});

const emergencySchema = z.object({
  name: z.string().min(1).max(120),
  relation: z.string().min(1).max(60),
  phone: z.string().min(5).max(30),
});

const previousEducationSchema = z.object({
  institution: z.string().min(1).max(200),
  boardOrUniversity: z.string().max(200).optional(),
  year: z.number().int().min(1950).max(2100).optional(),
  percentageOrCgpa: z.string().max(20).optional(),
  qualification: z.string().max(100).optional(),
});

export const listStudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().optional(),
  status: statusEnum.optional(),
  programId: objectId.optional(),
  batchId: objectId.optional(),
  sectionId: objectId.optional(),
  departmentId: objectId.optional(),
  sort: z.string().optional(),
});

export const studentCreateSchema = z.object({
  enrollmentNumber: z.string().min(1).max(50),
  rollNumber: z.string().max(50).optional(),
  registrationNumber: z.string().max(50).optional(),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  alternatePhone: z.string().max(30).optional(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'])
    .optional(),
  nationality: z.string().max(80).optional(),
  category: z.string().max(80).optional(),
  permanentAddress: addressSchema,
  currentAddress: addressSchema,
  photoUrl: z.string().url().optional().or(z.literal('')),
  status: statusEnum.optional(),
  enrollmentStatus: z
    .enum(['enrolled', 'provisional', 'deferred', 'completed', 'cancelled'])
    .optional(),
  programId: objectId.optional().nullable(),
  batchId: objectId.optional().nullable(),
  sectionId: objectId.optional().nullable(),
  departmentId: objectId.optional().nullable(),
  admissionDate: z.coerce.date().optional().nullable(),
  admissionType: z
    .enum(['regular', 'lateral', 'transfer', 'nri', 'management', 'other'])
    .optional(),
  currentSemesterId: objectId.optional().nullable(),
  academicYearId: objectId.optional().nullable(),
  academicNotes: z.string().max(2000).optional(),
  guardians: z.array(guardianSchema).optional(),
  emergencyContacts: z.array(emergencySchema).optional(),
  previousEducation: z.array(previousEducationSchema).optional(),
  userId: objectId.optional().nullable(),
});

export const studentUpdateSchema = studentCreateSchema.partial();

export const statusChangeSchema = z.object({
  status: statusEnum,
  academicNotes: z.string().max(2000).optional(),
});

export const enrollSchema = z.object({
  programId: objectId.optional().nullable(),
  batchId: objectId.optional().nullable(),
  sectionId: objectId.optional().nullable(),
  departmentId: objectId.optional().nullable(),
  enrollmentStatus: z
    .enum(['enrolled', 'provisional', 'deferred', 'completed', 'cancelled'])
    .optional(),
  currentSemesterId: objectId.optional().nullable(),
  academicYearId: objectId.optional().nullable(),
});

export const documentCreateSchema = z.object({
  type: z.enum(['id_proof', 'marksheet', 'photo', 'certificate', 'address_proof', 'other']),
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url(),
  mimeType: z.string().max(100).optional(),
  size: z.number().int().min(0).optional(),
});

export const bulkCreateSchema = z.object({
  students: z.array(studentCreateSchema).min(1).max(200),
});

export const exportQuerySchema = listStudentsQuerySchema.extend({
  format: z.enum(['json', 'csv']).default('json'),
});
