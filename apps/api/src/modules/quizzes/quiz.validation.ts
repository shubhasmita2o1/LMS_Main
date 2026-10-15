import { z } from 'zod';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '@university-lms/shared';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const statusEnum = z.enum(['draft', 'published', 'closed', 'archived']);
const showResultsEnum = z.enum(['never', 'after_submit', 'after_close']);

const quizQuestionSchema = z.object({
  questionId: objectId,
  marks: z.number().min(0).optional().nullable(),
  order: z.number().int().min(0).optional(),
});

export const listQuizzesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  courseId: objectId.optional(),
  status: statusEnum.optional(),
  search: z.string().optional(),
});

export const quizCreateSchema = z.object({
  courseId: objectId,
  offeringId: objectId.optional().nullable(),
  title: z.string().min(1).max(300),
  description: z.string().max(10000).optional().nullable(),
  instructions: z.string().max(10000).optional().nullable(),
  questions: z.array(quizQuestionSchema).optional(),
  durationMinutes: z.number().int().min(1).max(600).optional().nullable(),
  maxAttempts: z.number().int().min(1).max(20).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  showResults: showResultsEnum.optional(),
  availableFrom: z.string().datetime().optional().nullable().or(z.date().optional().nullable()),
  dueAt: z.string().datetime().optional().nullable().or(z.date().optional().nullable()),
  status: statusEnum.optional(),
  passPercent: z.number().min(0).max(100).optional().nullable(),
  negativeMarking: z.number().min(0).max(100).optional().nullable(),
  autoSubmitOnTimeout: z.boolean().optional(),
});

export const quizUpdateSchema = quizCreateSchema.partial().omit({ courseId: true });

export const attachQuestionsSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1),
});

export const saveAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: objectId,
        response: z.union([
          z.string(),
          z.array(z.string()),
          z.array(z.object({ left: z.string(), right: z.string() })),
          z.null(),
        ]).optional(),
      })
    )
    .min(1),
});

export const gradeAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: objectId,
        marksAwarded: z.number().min(0),
        isCorrect: z.boolean().optional().nullable(),
      })
    )
    .min(1),
  feedback: z.string().max(5000).optional(),
});
