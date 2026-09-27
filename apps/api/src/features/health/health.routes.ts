import { Hono } from 'hono';
import type { Env } from '../../types/env';
import { D1HealthRepository } from './health.repository';
import { HealthService } from './health.service';

const serviceFor = (db: D1Database) => new HealthService(new D1HealthRepository(db));

export const healthRoutes = new Hono<Env>();
healthRoutes.get('/', (c) => c.json({ data: serviceFor(c.env.DB).status() }));
healthRoutes.get('/db', async (c) => c.json({ data: await serviceFor(c.env.DB).databaseStatus() }));
