import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z
    .enum([
      'super_admin',
      'tenant_admin',
      'university_admin',
      'faculty',
      'student',
      'staff',
      'parent',
      'guest',
    ])
    .optional(),
  tenantId: z.string().nullable().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantId: z.string().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
  tenantId: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
