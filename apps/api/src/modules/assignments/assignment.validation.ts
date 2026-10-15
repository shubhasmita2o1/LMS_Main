import { z } from 'zod';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '@university-lms/shared';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const statusEnum = z.enum(['draft', 'published', 'closed', 'archived']);
const submissionStatusEnum = z.enum([
  'draft',
  'submitted',
  'late',
  'graded',
  'returned',
  'resubmitted',
]);

const attachmentSchema = z.object({
  fileKey: z.string().min(1).max(500),
  fileName: z.string().min(1).max(300),
  mimeType: z.string().max(100).optional(),
  size: z.number().min(0).optional(),
});

const rubricSchema = z.object({
  criterion: z.string().min(1).max(200),
  maxMarks: z.number().min(0).max(10000),
  description: z.string().max(1000).optional(),
});

const rubricScoreSchema = z.object({
  criterionIndex: z.number().int().min(0),
  marks: z.number().min(0),
  comment: z.string().max(1000).optional(),
});

export const listAssignmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  courseId: objectId.optional(),
  status: statusEnum.optional(),
  search: z.string().optional(),
});

export const assignmentCreateSchema = z.object({
  courseId: objectId,
  offeringId: objectId.optional().nullable(),
  moduleId: objectId.optional().nullable(),
  lessonId: objectId.optional().nullable(),
  title: z.string().min(1).max(300),
  description: z.string().max(10000).optional().nullable(),
  instructions: z.string().max(10000).optional().nullable(),
  attachments: z.array(attachmentSchema).optional(),
  maxMarks: z.number().min(0).max(10000).default(100),
  passingMarks: z.number().min(0).optional().nullable(),
  availableFrom: z.string().datetime().optional().nullable().or(z.date().optional().nullable()),
  dueAt: z.string().datetime().optional().nullable().or(z.date().optional().nullable()),
  lateDueAt: z.string().datetime().optional().nullable().or(z.date().optional().nullable()),
  allowLate: z.boolean().optional(),
  latePenaltyPercent: z.number().min(0).max(100).optional().nullable(),
  allowResubmission: z.boolean().optional(),
  maxSubmissions: z.number().int().min(1).max(20).optional(),
  rubric: z.array(rubricSchema).optional(),
  status: statusEnum.optional(),
});

export const assignmentUpdateSchema = assignmentCreateSchema.partial().omit({ courseId: true });

export const submitAssignmentSchema = z.object({
  body: z.string().max(50000).optional().nullable(),
  attachments: z.array(attachmentSchema).optional(),
  asDraft: z.boolean().optional(),
});

export const updateSubmissionSchema = z.object({
  body: z.string().max(50000).optional().nullable(),
  attachments: z.array(attachmentSchema).optional(),
  asDraft: z.boolean().optional(),
});

export const gradeSubmissionSchema = z.object({
  marksAwarded: z.number().min(0),
  feedback: z.string().max(10000).optional().nullable(),
  rubricScores: z.array(rubricScoreSchema).optional(),
  status: z.enum(['graded', 'returned']).optional(),
  /** Future: external plagiarism score */
  plagiarismScore: z.number().min(0).max(100).optional().nullable(),
});

export const listSubmissionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  status: submissionStatusEnum.optional(),
  studentId: objectId.optional(),
});
