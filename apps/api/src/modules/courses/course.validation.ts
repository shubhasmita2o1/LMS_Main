import { z } from 'zod';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '@university-lms/shared';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const courseTypeEnum = z.enum([
  'core',
  'elective',
  'lab',
  'project',
  'seminar',
  'audit',
  'other',
]);
const courseStatusEnum = z.enum(['draft', 'active', 'archived', 'inactive']);
const prereqTypeEnum = z.enum(['required', 'recommended']);
const contentTypeEnum = z.enum([
  'pdf',
  'ppt',
  'pptx',
  'docx',
  'image',
  'zip',
  'video',
  'link',
  'text',
  'other',
]);
const offeringStatusEnum = z.enum(['planned', 'active', 'completed', 'cancelled']);
const enrollmentStatusEnum = z.enum([
  'enrolled',
  'dropped',
  'completed',
  'failed',
  'withdrawn',
]);
const moduleStatusEnum = z.enum(['draft', 'published', 'archived']);

const creditsSchema = z.object({
  theory: z.number().min(0).max(30).default(0),
  practical: z.number().min(0).max(30).default(0),
  total: z.number().min(0).max(60).default(0),
});

const learningOutcomeSchema = z.object({
  code: z.string().max(20).optional(),
  description: z.string().min(1).max(1000),
  order: z.number().int().min(0).optional(),
});

const prerequisiteSchema = z.object({
  courseId: objectId,
  type: prereqTypeEnum.default('required'),
});

export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().optional(),
  programId: objectId.optional(),
  departmentId: objectId.optional(),
  courseType: courseTypeEnum.optional(),
  status: courseStatusEnum.optional(),
  sort: z.string().optional(),
});

export const courseCreateSchema = z.object({
  programId: objectId,
  departmentId: objectId.optional().nullable(),
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(200),
  shortName: z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  courseType: courseTypeEnum.optional(),
  credits: creditsSchema.optional(),
  lectureHours: z.number().min(0).max(200).optional(),
  labHours: z.number().min(0).max(200).optional(),
  tutorialHours: z.number().min(0).max(200).optional(),
  prerequisites: z.array(prerequisiteSchema).optional(),
  corequisites: z.array(objectId).optional(),
  learningOutcomes: z.array(learningOutcomeSchema).optional(),
  syllabusOutline: z.string().max(10000).optional(),
  status: courseStatusEnum.optional(),
  isElective: z.boolean().optional(),
  isLab: z.boolean().optional(),
  maxSeats: z.number().int().min(0).optional().nullable(),
});

export const courseUpdateSchema = courseCreateSchema.partial().omit({ programId: true }).extend({
  programId: objectId.optional(),
});

export const setPrerequisitesSchema = z.object({
  prerequisites: z.array(prerequisiteSchema),
});

export const moduleCreateSchema = z.object({
  title: z.string().min(1).max(200),
  order: z.number().int().min(0).optional(),
  description: z.string().max(2000).optional(),
  status: moduleStatusEnum.optional(),
});

export const moduleUpdateSchema = moduleCreateSchema.partial();

export const lessonCreateSchema = z.object({
  title: z.string().min(1).max(200),
  order: z.number().int().min(0).optional(),
  contentType: contentTypeEnum.optional(),
  durationMinutes: z.number().min(0).max(1000).optional().nullable(),
  isFreePreview: z.boolean().optional(),
  contentSummary: z.string().max(2000).optional(),
  contentUrl: z.string().max(2000).optional().nullable(),
  fileKey: z.string().max(500).optional().nullable(),
  fileName: z.string().max(255).optional().nullable(),
  mimeType: z.string().max(120).optional().nullable(),
  fileSize: z.number().min(0).optional().nullable(),
  textBody: z.string().max(100000).optional().nullable(),
  videoProvider: z.enum(['url', 'youtube', 'vimeo']).optional().nullable(),
  videoUrl: z.string().max(2000).optional().nullable(),
  durationSeconds: z.number().min(0).optional().nullable(),
  captionsUrl: z.string().max(2000).optional().nullable(),
  transcript: z.string().max(500000).optional().nullable(),
  allowDownload: z.boolean().optional(),
});

export const lessonUpdateSchema = lessonCreateSchema.partial();

export const offeringCreateSchema = z.object({
  sectionId: objectId.optional().nullable(),
  batchId: objectId.optional().nullable(),
  academicYearId: objectId.optional().nullable(),
  semesterId: objectId.optional().nullable(),
  facultyIds: z.array(objectId).optional(),
  maxStudents: z.number().int().min(0).optional().nullable(),
  status: offeringStatusEnum.optional(),
});

export const assignFacultySchema = z.object({
  facultyIds: z.array(objectId).min(0),
});

export const curriculumCreateSchema = z.object({
  programId: objectId,
  courseId: objectId,
  semesterNumber: z.number().int().min(1).max(20).optional().nullable(),
  yearNumber: z.number().int().min(1).max(10).optional().nullable(),
  isMandatory: z.boolean().optional(),
  creditsOverride: z.number().min(0).max(60).optional().nullable(),
  order: z.number().int().min(0).optional(),
});

export const enrollmentCreateSchema = z.object({
  studentId: objectId,
  courseId: objectId,
  offeringId: objectId.optional().nullable(),
  sectionId: objectId.optional().nullable(),
  status: enrollmentStatusEnum.optional(),
});

export const listEnrollmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  courseId: objectId.optional(),
  studentId: objectId.optional(),
  offeringId: objectId.optional(),
  status: enrollmentStatusEnum.optional(),
});
