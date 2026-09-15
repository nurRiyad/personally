import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

export const corsMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const origins = (c.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return cors({
    origin: (origin) =>
      origin && origins.includes(origin) ? origin : undefined,
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })(c, next);
};
