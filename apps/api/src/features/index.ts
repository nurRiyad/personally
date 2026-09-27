import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authRoutes } from './auth/auth.routes';
import { budgetRoutes } from './budget/budget.routes';
import { assetRoutes } from './assets/assets.routes';
import { learningRoutes } from './learning/learning.routes';
import { healthRoutes } from './health/health.routes';

export const featureRoutes = new Hono<Env>();
featureRoutes.route('/health', healthRoutes);
featureRoutes.route('/auth', authRoutes);
featureRoutes.route('/budget', budgetRoutes);
featureRoutes.route('/assets', assetRoutes);
featureRoutes.route('/learning', learningRoutes);
