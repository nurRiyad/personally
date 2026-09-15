import { LearningController } from '../controllers/learning.controller';
import { LearningService } from '../services/learning.service';
import { D1LearningRepository } from '../repositories/learning.repository';
import { learningRoutes } from './learning.routes';
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

routes.use('/learning/*', async (c, next) => {
  c.set('authConfig', createAuthConfig(c.env));
  c.set(
    'learningController',
    new LearningController(
      new LearningService(new D1LearningRepository(createDb(c.env.DB))),
    ),
  );
  await next();
});
routes.route('/learning', learningRoutes);
