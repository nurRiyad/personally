import { Hono } from 'hono';
import { corsMiddleware, errorHandler } from './middleware';
import { routes } from './routes';
import type { Env } from './types/env';

const app = new Hono<Env>();
app.use('*', corsMiddleware);
app.route('/', routes);
app.onError(errorHandler);

export default app;
