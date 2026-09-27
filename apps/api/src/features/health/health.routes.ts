import { Hono } from 'hono';
import type { Env } from '../../types/env';

const healthService = {
  status: () => ({ status: 'ok' as const }),
  async database(db: D1Database) {
    const result = await db.prepare('SELECT 1 AS ok').first<{ ok: number }>();
    return { status: result?.ok === 1 ? ('ok' as const) : ('error' as const) };
  },
};

export const healthRoutes = new Hono<Env>();
healthRoutes.get('/', (c) => c.json({ data: healthService.status() }));
healthRoutes.get('/db', async (c) => c.json({ data: await healthService.database(c.env.DB) }));
