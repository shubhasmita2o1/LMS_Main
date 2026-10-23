import { z } from 'zod';
import {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  LAB_LANGUAGES,
  PRACTICAL_STATUSES,
  LAB_STATUSES,
  EXPERIMENT_STATUSES,
  SUBMISSION_KINDS,
  EVALUATION_MODES,
  TEST_CASE_VISIBILITIES,
  LAB_MAX_CODE_LENGTH,
} from '@university-lms/shared';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const languageEnum = z.enum(LAB_LANGUAGES as unknown as [string, ...string[]]);
const practicalStatusEnum = z.enum(PRACTICAL_STATUSES as unknown as [string, ...string[]]);
const labStatusEnum = z.enum(LAB_STATUSES as unknown as [string, ...string[]]);
const experimentStatusEnum = z.enum(EXPERIMENT_STATUSES as unknown as [string, ...string[]]);
const submissionKindEnum = z.enum(SUBMISSION_KINDS as unknown as [string, ...string[]]);
const evaluationModeEnum = z.enum(EVALUATION_MODES as unknown as [string, ...string[]]);
const visibilityEnum = z.enum(TEST_CASE_VISIBILITIES as unknown as [string, ...string[]]);

const attachmentSchema = z.object({
  fileKey: z.string().min(1).max(500),
  fileName: z.string().min(1).max(300),
  mimeType: z.string().max(100).optional(),
  size: z.number().min(0).optional(),
});

const testCaseSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  input: z.string().max(50000).default(''),
  expectedOutput: z.string().max(50000).default(''),
  visibility: visibilityEnum.default('public'),
  weight: z.number().min(0).max(1000).default(1),
  name: z.string().max(200).optional(),
});

// ─── Practical ──────────────────────────────────────────────────────────────

export const listPracticalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  courseId: objectId.optional(),
  status: practicalStatusEnum.optional(),
  search: z.string().max(200).optional(),
});

export const practicalCreateSchema = z.object({
  courseId: objectId,
  offeringId: objectId.optional().nullable(),
  title: z.string().min(1).max(300),
  description: z.string().max(10000).optional().nullable(),
  facultyOwnerIds: z.array(objectId).optional(),
  availableFrom: z.string().datetime().optional().nullable().or(z.date().optional().nullable()),
  availableTo: z.string().datetime().optional().nullable().or(z.date().optional().nullable()),
  maxScore: z.number().min(0).max(10000).optional(),
  weightPercent: z.number().min(0).max(100).optional().nullable(),
  status: practicalStatusEnum.optional(),
});

export const practicalUpdateSchema = practicalCreateSchema.partial().omit({ courseId: true });

// ─── Lab ────────────────────────────────────────────────────────────────────

export const labCreateSchema = z.object({
  practicalId: objectId,
  title: z.string().min(1).max(300),
  order: z.number().int().min(0).optional(),
  instructions: z.string().max(20000).optional().nullable(),
  defaultLanguage: languageEnum.optional(),
  timeoutSec: z.number().int().min(1).max(60).optional(),
  memoryMb: z.number().int().min(32).max(512).optional(),
  status: labStatusEnum.optional(),
});

export const labUpdateSchema = labCreateSchema.partial().omit({ practicalId: true });

// ─── Experiment ─────────────────────────────────────────────────────────────

export const experimentCreateSchema = z.object({
  labId: objectId,
  title: z.string().min(1).max(300),
  statement: z.string().min(1).max(50000),
  allowedLanguages: z.array(languageEnum).min(1).optional(),
  starterCode: z.record(z.string().max(LAB_MAX_CODE_LENGTH)).optional(),
  timeLimitSec: z.number().int().min(1).max(60).optional(),
  memoryLimitMb: z.number().int().min(32).max(512).optional(),
  maxScore: z.number().min(0).max(10000).optional(),
  testCases: z.array(testCaseSchema).max(50).optional(),
  evaluationMode: evaluationModeEnum.optional(),
  attachments: z.array(attachmentSchema).optional(),
  status: experimentStatusEnum.optional(),
  order: z.number().int().min(0).optional(),
  maxAttempts: z.number().int().min(1).max(50).optional(),
});

export const experimentUpdateSchema = experimentCreateSchema.partial().omit({ labId: true });

export const testCasesReplaceSchema = z.object({
  testCases: z.array(testCaseSchema).max(50),
});

// ─── Submission ─────────────────────────────────────────────────────────────

export const submitLabSchema = z.object({
  kind: submissionKindEnum.optional(),
  language: languageEnum.optional().nullable(),
  code: z.string().max(LAB_MAX_CODE_LENGTH).optional().nullable(),
  reportFileKey: z.string().max(500).optional().nullable(),
  screenshotFileKey: z.string().max(500).optional().nullable(),
  outputText: z.string().max(50000).optional().nullable(),
  githubUrl: z.string().url().max(500).optional().nullable().or(z.literal('').transform(() => null)),
  asDraft: z.boolean().optional(),
});

export const evaluateSubmissionSchema = z.object({
  manualScore: z.number().min(0).optional().nullable(),
  vivaScore: z.number().min(0).optional().nullable(),
  feedback: z.string().max(10000).optional().nullable(),
  rubricNotes: z.string().max(10000).optional().nullable(),
  totalScore: z.number().min(0).optional().nullable(),
});

export const listSubmissionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  experimentId: objectId.optional(),
  studentId: objectId.optional(),
  status: z.string().optional(),
});
