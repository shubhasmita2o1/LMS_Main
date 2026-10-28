import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  unreadOnly: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .optional()
    .transform((v) => v === true || v === 'true' || v === '1'),
});

export const updatePreferencesSchema = z.object({
  preferences: z.record(
    z.string(),
    z.record(z.enum(['in_app', 'email', 'push', 'sms']), z.boolean())
  ),
});

export const createTemplateSchema = z.object({
  key: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(160),
  channel: z.enum(['in_app', 'email', 'push', 'sms']),
  subjectTemplate: z.string().max(300).nullable().optional(),
  bodyTemplate: z.string().min(1).max(10000),
  isActive: z.boolean().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  subjectTemplate: z.string().max(300).nullable().optional(),
  bodyTemplate: z.string().min(1).max(10000).optional(),
  isActive: z.boolean().optional(),
});

export const deliveryLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  channel: z.enum(['in_app', 'email', 'push', 'sms']).optional(),
  status: z
    .enum(['pending', 'queued', 'sent', 'delivered', 'failed', 'read'])
    .optional(),
});
