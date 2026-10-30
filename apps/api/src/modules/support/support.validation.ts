import { z } from 'zod';

export const createTicketSchema = z.object({
  category: z.enum([
    'academic',
    'technical',
    'hostel',
    'finance_query',
    'grievance',
    'counseling',
    'other',
  ]),
  subject: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(10000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  attachments: z
    .array(
      z.object({
        fileKey: z.string().min(1),
        fileName: z.string().min(1),
        mimeType: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export const updateTicketSchema = z.object({
  status: z
    .enum(['open', 'in_progress', 'waiting_student', 'resolved', 'closed'])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: z.string().nullable().optional(),
  category: z
    .enum([
      'academic',
      'technical',
      'hostel',
      'finance_query',
      'grievance',
      'counseling',
      'other',
    ])
    .optional(),
});

export const listTicketsQuerySchema = z.object({
  status: z
    .enum(['open', 'in_progress', 'waiting_student', 'resolved', 'closed'])
    .optional(),
  category: z
    .enum([
      'academic',
      'technical',
      'hostel',
      'finance_query',
      'grievance',
      'counseling',
      'other',
    ])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: z.string().optional(),
  studentId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createMessageSchema = z.object({
  body: z.string().trim().min(1).max(10000),
  isInternalNote: z.boolean().optional().default(false),
});

export const escalateSchema = z.object({
  note: z.string().max(1000).optional().nullable(),
});
