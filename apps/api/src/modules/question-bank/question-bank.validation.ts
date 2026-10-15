import { z } from 'zod';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '@university-lms/shared';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const statusEnum = z.enum(['active', 'draft', 'archived']);
const questionTypeEnum = z.enum([
  'mcq',
  'multi_select',
  'true_false',
  'fill_blank',
  'short',
  'long',
  'numerical',
  'matching',
]);
const difficultyEnum = z.enum(['easy', 'medium', 'hard']);
const bloomEnum = z.enum([
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
]);

const optionSchema = z.object({
  key: z.string().min(1).max(10),
  text: z.string().min(1).max(2000),
  isCorrect: z.boolean().optional(),
});

const matchingPairSchema = z.object({
  left: z.string().min(1).max(500),
  right: z.string().min(1).max(500),
});

// Subjects
export const subjectCreateSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(30).optional().nullable(),
  departmentId: objectId.optional().nullable(),
  status: statusEnum.optional(),
});

export const subjectUpdateSchema = subjectCreateSchema.partial();

export const listSubjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().optional(),
  status: statusEnum.optional(),
  departmentId: objectId.optional(),
});

// Units
export const unitCreateSchema = z.object({
  subjectId: objectId,
  name: z.string().min(1).max(200),
  order: z.number().int().min(0).optional(),
  status: statusEnum.optional(),
});

export const unitUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  order: z.number().int().min(0).optional(),
  status: statusEnum.optional(),
});

export const listUnitsQuerySchema = z.object({
  subjectId: objectId.optional(),
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

// Topics
export const topicCreateSchema = z.object({
  unitId: objectId,
  name: z.string().min(1).max(200),
  order: z.number().int().min(0).optional(),
  status: statusEnum.optional(),
});

export const topicUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  order: z.number().int().min(0).optional(),
  status: statusEnum.optional(),
});

export const listTopicsQuerySchema = z.object({
  unitId: objectId.optional(),
  subjectId: objectId.optional(),
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

// Questions
export const questionCreateSchema = z.object({
  subjectId: objectId,
  unitId: objectId.optional().nullable(),
  topicId: objectId.optional().nullable(),
  type: questionTypeEnum,
  stem: z.string().min(1).max(5000),
  richText: z.string().max(50000).optional().nullable(),
  options: z.array(optionSchema).optional(),
  correctAnswer: z.string().max(2000).optional().nullable(),
  matchingPairs: z.array(matchingPairSchema).optional(),
  marks: z.number().min(0).max(1000).default(1),
  difficulty: difficultyEnum.optional(),
  bloomLevel: bloomEnum.optional().nullable(),
  explanation: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string().max(50)).optional(),
  status: statusEnum.optional(),
});

export const questionUpdateSchema = questionCreateSchema.partial().omit({ subjectId: true }).extend({
  subjectId: objectId.optional(),
});

export const listQuestionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().optional(),
  subjectId: objectId.optional(),
  unitId: objectId.optional(),
  topicId: objectId.optional(),
  type: questionTypeEnum.optional(),
  difficulty: difficultyEnum.optional(),
  status: statusEnum.optional(),
  tags: z.string().optional(), // comma-separated
});

export const importQuestionsSchema = z.object({
  questions: z.array(questionCreateSchema).min(1).max(500),
});
