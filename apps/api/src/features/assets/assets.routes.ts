import { Hono, type Context } from 'hono';
import * as s from '@personally/validation';
import { createAuthConfig } from '../../utils/config';
import { requireAuth, validateBody } from '../../middleware';
import type { Env } from '../../types/env';
import { AppError } from '../../utils/errors';
import { D1AssetRepository } from './assets.repository';
import { AssetService } from './assets.service';

const serviceFor = (c: Context<Env>) => new AssetService(new D1AssetRepository(c.env.DB));
const query = <T>(
  c: Context<Env>,
  schema: {
    safeParse(value: unknown): { success: true; data: T } | { success: false };
  },
): T => {
  const result = schema.safeParse(c.req.query());
  if (!result.success) throw new AppError('VALIDATION_ERROR', 'Invalid query parameters.', 400);
  return result.data;
};
const user = (c: Context<Env>) => c.get('authUserId');
const body = <T>(c: Context<Env>) => c.get('validatedBody') as T;
const param = (c: Context<Env>, name: string) => c.req.param(name)!;

export const assetRoutes = new Hono<Env>();
assetRoutes.use('*', async (c, next) => {
  c.set('authConfig', createAuthConfig(c.env));
  await requireAuth(c, next);
});
assetRoutes.get('/dashboard', async (c) =>
  c.json({
    data: await serviceFor(c).dashboard(user(c), query(c, s.assetDateRangeSchema)),
  }),
);
assetRoutes.get('/types', async (c) => c.json({ data: await serviceFor(c).types(user(c)) }));
assetRoutes.post('/types', validateBody(s.assetTypeInputSchema), async (c) =>
  c.json({ data: await serviceFor(c).createType(user(c), body(c)) }, 201),
);
assetRoutes.patch('/types/:typeId', validateBody(s.assetTypeInputSchema), async (c) =>
  c.json({
    data: await serviceFor(c).patchType(user(c), param(c, 'typeId'), body(c)),
  }),
);
assetRoutes.delete('/types/:typeId', async (c) => {
  await serviceFor(c).deleteType(user(c), param(c, 'typeId'));
  return c.body(null, 204);
});
assetRoutes.get('/activities', async (c) =>
  c.json(await serviceFor(c).activities(user(c), query(c, s.assetActivityQuerySchema))),
);
assetRoutes.post('/activities', validateBody(s.assetActivityInputSchema), async (c) =>
  c.json({ data: await serviceFor(c).createActivity(user(c), body(c)) }, 201),
);
assetRoutes.patch('/activities/:activityId', validateBody(s.assetActivityInputSchema), async (c) =>
  c.json({
    data: await serviceFor(c).patchActivity(user(c), param(c, 'activityId'), body(c)),
  }),
);
assetRoutes.delete('/activities/:activityId', async (c) => {
  await serviceFor(c).deleteActivity(user(c), param(c, 'activityId'));
  return c.body(null, 204);
});
assetRoutes.get('/', async (c) => {
  const filters = query(c, s.assetListQuerySchema);
  return c.json({
    data: await serviceFor(c).assets(user(c), filters, {
      from: filters.from,
      to: filters.to,
    }),
  });
});
assetRoutes.post('/', validateBody(s.assetCreateSchema), async (c) =>
  c.json({ data: await serviceFor(c).createAsset(user(c), body(c)) }, 201),
);
assetRoutes.get('/:assetId', async (c) =>
  c.json({
    data: await serviceFor(c).assetDetail(user(c), param(c, 'assetId'), query(c, s.assetDateRangeSchema)),
  }),
);
assetRoutes.patch('/:assetId', validateBody(s.assetPatchSchema), async (c) =>
  c.json({
    data: await serviceFor(c).patchAsset(user(c), param(c, 'assetId'), body(c)),
  }),
);
assetRoutes.delete('/:assetId', async (c) => {
  await serviceFor(c).archiveAsset(user(c), param(c, 'assetId'));
  return c.body(null, 204);
});
