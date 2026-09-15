import type { Context, Next } from 'hono';
import { AppError } from '../utils/errors';

type Schema = {
  safeParse(input: unknown):
    | { success: true; data: unknown }
    | {
        success: false;
        error: { flatten(): { fieldErrors: Record<string, string[]> } };
      };
};

export function validateBody(schema: Schema) {
  return async (c: Context, next: Next) => {
    try {
      const result = schema.safeParse(await c.req.json());
      if (!result.success)
        throw new AppError(
          'VALIDATION_ERROR',
          'Request validation failed.',
          400,
          result.error.flatten().fieldErrors,
        );
      c.set('validatedBody', result.data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'VALIDATION_ERROR',
        'Request body must be valid JSON.',
        400,
      );
    }
    await next();
  };
}
