import { Hono } from 'hono';
import * as s from '@personally/validation';
import { requireAuth, validateBody } from '../middleware';
import type { Env } from '../types/env';

export const assetRoutes = new Hono<Env>();
assetRoutes.use('*', requireAuth);
assetRoutes.get('/dashboard', (c) => c.get('assetController').dashboard(c));
assetRoutes.get('/types', (c) => c.get('assetController').types(c));
assetRoutes.post('/types', validateBody(s.assetTypeInputSchema), (c) =>
  c.get('assetController').createType(c),
);
assetRoutes.patch('/types/:typeId', validateBody(s.assetTypeInputSchema), (c) =>
  c.get('assetController').patchType(c),
);
assetRoutes.delete('/types/:typeId', (c) =>
  c.get('assetController').deleteType(c),
);
assetRoutes.get('/activities', (c) => c.get('assetController').activities(c));
assetRoutes.post('/activities', validateBody(s.assetActivityInputSchema), (c) =>
  c.get('assetController').createActivity(c),
);
assetRoutes.patch(
  '/activities/:activityId',
  validateBody(s.assetActivityInputSchema),
  (c) => c.get('assetController').patchActivity(c),
);
assetRoutes.delete('/activities/:activityId', (c) =>
  c.get('assetController').deleteActivity(c),
);
assetRoutes.get('/', (c) => c.get('assetController').assets(c));
assetRoutes.post('/', validateBody(s.assetCreateSchema), (c) =>
  c.get('assetController').createAsset(c),
);
assetRoutes.get('/:assetId', (c) => c.get('assetController').assetDetail(c));
assetRoutes.patch('/:assetId', validateBody(s.assetPatchSchema), (c) =>
  c.get('assetController').patchAsset(c),
);
assetRoutes.delete('/:assetId', (c) =>
  c.get('assetController').archiveAsset(c),
);
