import { z } from 'zod';
export const healthSchema = z.object({
  data: z.object({ status: z.literal('ok') }),
});

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.');

export const registerRequestSchema = z
  .object({
    username: z.string().trim().min(1).max(50),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(1).max(30),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export const loginRequestSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export const authUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  phone: z.string(),
});

export const authTokenResponseSchema = z.object({
  data: z.object({
    user: authUserSchema,
    accessToken: z.string(),
    tokenType: z.literal('Bearer'),
  }),
});

export const meResponseSchema = z.object({
  data: z.object({ user: authUserSchema }),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.array(z.string())).optional(),
  }),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export * from './learning';
export * from './budget';
export * from './assets';
