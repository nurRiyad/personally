import { Hono } from 'hono';
import { createDb } from '@personally/db';
import { loginRequestSchema, registerRequestSchema } from '@personally/validation';
import { createAuthConfig } from '../../utils/config';
import { requireAuth, validateBody } from '../../middleware';
import type { Env } from '../../types/env';
import { D1UserRepository } from './auth.repository';
import { AuthService } from './auth.service';
import type { Context } from 'hono';

const serviceFor = (c: Context<Env>) =>
  new AuthService(new D1UserRepository(createDb(c.env.DB)), createAuthConfig(c.env));

export const authRoutes = new Hono<Env>();

authRoutes.post('/register', validateBody(registerRequestSchema), async (c) =>
  c.json(
    {
      data: await serviceFor(c).register(c.get('validatedBody') as import('@personally/validation').RegisterRequest),
    },
    201,
  ),
);
authRoutes.post('/login', validateBody(loginRequestSchema), async (c) =>
  c.json({
    data: await serviceFor(c).login(c.get('validatedBody') as import('@personally/validation').LoginRequest),
  }),
);
authRoutes.post('/logout', (c) => c.body(null, 204));
authRoutes.get('/me', requireAuth, async (c) =>
  c.json({ data: { user: await serviceFor(c).me(c.get('authUserId')) } }),
);
