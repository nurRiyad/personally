import { Hono } from 'hono';
import {
  loginRequestSchema,
  registerRequestSchema,
} from '@personally/validation';
import { createAuthController } from '../controllers';
import { requireAuth, validateBody } from '../middleware';
import type { Env } from '../types/env';

export function createAuthRoutes() {
  const app = new Hono<Env>();
  app.post('/register', validateBody(registerRequestSchema), (c) =>
    createAuthController(c.get('authService')).register(c),
  );
  app.post('/login', validateBody(loginRequestSchema), (c) =>
    createAuthController(c.get('authService')).login(c),
  );
  app.post('/logout', (c) =>
    createAuthController(c.get('authService')).logout(c),
  );
  app.get('/me', requireAuth, (c) =>
    createAuthController(c.get('authService')).me(c),
  );
  return app;
}
