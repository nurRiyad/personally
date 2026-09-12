import { Hono } from 'hono';
import { createDb } from '@personally/db';
import { createAuthConfig } from '../config';
import { D1UserRepository } from '../repositories';
import { AuthService } from '../services';
import type { Env } from '../types/env';
import { healthRoutes } from './health.routes';
import { createAuthRoutes } from './auth.routes';

export const routes = new Hono<Env>();
routes.use('/auth/*', async (c, next) => {
  c.set('authConfig', createAuthConfig(c.env));
  c.set(
    'authService',
    new AuthService(
      new D1UserRepository(createDb(c.env.DB)),
      c.get('authConfig'),
    ),
  );
  await next();
});

routes.route('/health', healthRoutes);
routes.route('/auth', createAuthRoutes());
