import { Hono } from 'hono';
type Bindings = { DB: D1Database };
const app = new Hono<{ Bindings: Bindings }>();
app.get('/health', (c) => c.json({ data: { status: 'ok' } }));
app.get('/health/db', async (c) => {
  const result = await c.env.DB.prepare('SELECT 1 AS ok').first<{
    ok: number;
  }>();
  return c.json({ data: { status: result?.ok === 1 ? 'ok' : 'error' } });
});
export default app;
