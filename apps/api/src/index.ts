import { Hono } from 'hono';
import { corsMiddleware, errorHandler } from './middleware';
import { featureRoutes } from './features';
import type { Env } from './types/env';

const app = new Hono<Env>();
app.use('*', corsMiddleware);
app.route('/', featureRoutes);
app.onError(errorHandler);

export default app;
