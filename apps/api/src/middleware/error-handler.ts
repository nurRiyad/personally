import type { ErrorHandler } from 'hono';
import { AppError } from '../utils/errors';

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof AppError)
    return c.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields ? { fields: error.fields } : {}),
        },
      },
      error.status,
    );
  console.error('Unhandled API error', error);
  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    },
    500,
  );
};
