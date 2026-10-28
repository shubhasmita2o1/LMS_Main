import { z } from 'zod';

export const createThreadSchema = z.object({
  title: z.string().trim().min(1).max(300),
  body: z.string().min(1).max(20000),
  isAnnouncementPin: z.boolean().optional(),
});

export const createReplySchema = z.object({
  body: z.string().min(1).max(10000),
  parentReplyId: z.string().optional().nullable(),
});

export const createReportSchema = z.object({
  threadId: z.string().optional().nullable(),
  replyId: z.string().optional().nullable(),
  reason: z.string().trim().min(3).max(1000),
});

export const listThreadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  status: z.enum(['open', 'resolved', 'dismissed']).optional(),
});

export const resolveReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
});
