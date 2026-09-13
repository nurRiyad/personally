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

export const learningEpicSchema = z.object({
  name: z.string().trim().min(1, 'Epic name is required.').max(120),
  targetDate: z.string().min(1, 'Target date is required.'),
});

export const learningTaskSchema = z.object({
  name: z.string().trim().min(1, 'Task name is required.').max(120),
  description: z
    .string()
    .trim()
    .min(1, 'Task description is required.')
    .max(500),
  targetMinutes: z.coerce
    .number()
    .int()
    .min(1, 'Target time must be at least 1 minute.'),
  weight: z.coerce.number().int().min(1, 'Weight must be at least 1.').max(10),
});

export type LearningEpicInput = z.infer<typeof learningEpicSchema>;
export type LearningTaskInput = z.infer<typeof learningTaskSchema>;

export const manualTimeSchema = z.object({
  date: z.string().min(1, 'Date is required.'),
  minutes: z.coerce
    .number()
    .int()
    .min(1, 'Duration must be at least 1 minute.')
    .max(1440, 'Duration cannot exceed 24 hours.'),
  note: z
    .string()
    .trim()
    .max(300, 'Note must be 300 characters or fewer.')
    .optional(),
});
