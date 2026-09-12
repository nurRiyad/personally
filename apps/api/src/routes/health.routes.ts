import { Hono } from 'hono';
import type { Env } from '../types/env';

export const healthRoutes = new Hono<Env>();
healthRoutes.get('/', (c) => c.json({ data: { status: 'ok' } }));
healthRoutes.get('/db', async (c) => {
  const result = await c.env.DB.prepare('SELECT 1 AS ok').first<{
    ok: number;
  }>();
  return c.json({ data: { status: result?.ok === 1 ? 'ok' : 'error' } });
});
