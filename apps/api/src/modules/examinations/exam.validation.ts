import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

export const examSettingsSchema = z.object({
  maxAttempts: z.number().int().min(1).max(10).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  negativeMarkingEnabled: z.boolean().optional(),
  negativeMarkPerQuestion: z.number().min(0).max(100).nullable().optional(),
  allowNavigation: z.boolean().optional(),
  allowFlagging: z.boolean().optional(),
  autosaveIntervalSec: z.number().int().min(5).max(300).optional(),
  autoSubmitOnTimeout: z.boolean().optional(),
  showResultAfter: z.enum(['submit', 'close', 'manual', 'never']).optional(),
});

export const createExamSchema = z.object({
  title: z.string().min(1).max(300),
  code: z.string().min(1).max(40),
  description: z.string().max(10000).nullable().optional(),
  mode: z.enum(['online', 'offline', 'hybrid']).optional(),
  courseId: objectId.nullable().optional(),
  programId: objectId.nullable().optional(),
  departmentId: objectId.nullable().optional(),
  startAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  endAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  durationMinutes: z.number().int().min(1).max(600),
  settings: examSettingsSchema.optional(),
  centerIds: z.array(objectId).optional(),
});

export const updateExamSchema = createExamSchema.partial();

export const attachQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        questionBankId: objectId,
        marks: z.number().min(0).nullable().optional(),
        order: z.number().int().min(0).optional(),
      })
    )
    .min(1)
    .max(200),
});

export const allocateStudentsSchema = z.object({
  studentIds: z.array(objectId).min(1).max(2000).optional(),
  courseId: objectId.optional(),
  sectionId: objectId.optional(),
  centerId: objectId.nullable().optional(),
  clearExisting: z.boolean().optional(),
});

export const invigilatorSchema = z.object({
  userId: objectId,
  centerId: objectId.nullable().optional(),
  roleNote: z.enum(['chief', 'assistant']).nullable().optional(),
});

export const createCenterSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(40),
  building: z.string().max(120).nullable().optional(),
  room: z.string().max(80).nullable().optional(),
  capacity: z.number().int().min(1).max(5000).optional(),
  address: z.string().max(500).nullable().optional(),
});

export const updateCenterSchema = createCenterSchema.partial();

export const saveAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        response: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
        flagged: z.boolean().optional(),
      })
    )
    .max(200),
});

export const flagQuestionSchema = z.object({
  questionId: z.string().min(1),
  flagged: z.boolean(),
});

export const suspicionEventSchema = z.object({
  type: z.enum([
    'tab_blur',
    'fullscreen_exit',
    'copy_paste',
    'multiple_login',
    'heartbeat_miss',
    'other',
  ]),
  detail: z.string().max(2000).nullable().optional(),
  clientTimestamp: z.string().datetime({ offset: true }).or(z.string()).nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});

export const manualScoreSchema = z.object({
  questionScores: z
    .array(
      z.object({
        questionId: z.string().min(1),
        marksAwarded: z.number().min(0),
      })
    )
    .min(1),
});

export const listExamsQuerySchema = z.object({
  status: z
    .enum(['draft', 'scheduled', 'live', 'closed', 'graded', 'cancelled'])
    .optional(),
  courseId: objectId.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().max(100).optional(),
});
