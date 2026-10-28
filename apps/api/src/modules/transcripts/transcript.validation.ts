import { z } from 'zod';

export const generateTranscriptSchema = z.object({
  studentId: z.string().min(1),
});

export const createCertificateSchema = z.object({
  studentId: z.string().min(1),
  type: z.enum(['provisional', 'degree', 'transcript', 'bonafide']),
  title: z.string().trim().min(1).max(300),
  body: z.string().max(5000).optional().nullable(),
  programName: z.string().max(200).optional().nullable(),
  yearLabel: z.string().max(80).optional().nullable(),
  classDivision: z.string().max(80).optional().nullable(),
});

export const listQuerySchema = z.object({
  studentId: z.string().optional(),
  status: z.enum(['draft', 'issued', 'revoked']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
