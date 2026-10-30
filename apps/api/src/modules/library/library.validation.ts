import { z } from 'zod';

export const listItemsQuerySchema = z.object({
  q: z.string().optional(),
  type: z.enum(['book', 'journal', 'ebook', 'media', 'other']).optional(),
  status: z.enum(['active', 'retired']).optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createItemSchema = z.object({
  isbn: z.string().trim().max(32).optional().nullable(),
  title: z.string().trim().min(1).max(500),
  authors: z.array(z.string().trim().min(1)).default([]),
  type: z.enum(['book', 'journal', 'ebook', 'media', 'other']).default('book'),
  categoryTags: z.array(z.string().trim()).default([]),
  totalCopies: z.number().int().min(0).default(1),
  digitalUrl: z.string().url().optional().nullable().or(z.literal('')),
  location: z.string().max(200).optional().nullable(),
  shelf: z.string().max(100).optional().nullable(),
  status: z.enum(['active', 'retired']).default('active'),
  description: z.string().max(5000).optional().nullable(),
  publisher: z.string().max(200).optional().nullable(),
  publishedYear: z.number().int().min(1000).max(2100).optional().nullable(),
});

export const updateItemSchema = createItemSchema.partial();

export const createLoanSchema = z.object({
  itemId: z.string().min(1),
  studentId: z.string().min(1),
  copyBarcode: z.string().max(64).optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  loanDays: z.number().int().min(1).max(365).optional(),
});

export const returnLoanSchema = z.object({
  markLost: z.boolean().optional(),
});

export const createReservationSchema = z.object({
  itemId: z.string().min(1),
  studentId: z.string().min(1).optional(),
});

export const listLoansQuerySchema = z.object({
  studentId: z.string().optional(),
  itemId: z.string().optional(),
  status: z.enum(['active', 'returned', 'overdue', 'lost']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listFinesQuerySchema = z.object({
  studentId: z.string().optional(),
  status: z.enum(['pending', 'waived', 'settled_external']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const waiveFineSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});
