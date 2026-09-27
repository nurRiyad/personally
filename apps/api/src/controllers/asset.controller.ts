import type { Context } from 'hono';
import * as s from '@personally/validation';
import type { Env } from '../types/env';
import { AssetService } from '../services/asset.service';
import { AppError } from '../utils/errors';

type C = Context<Env>;
const body = <T>(c: C) => c.get('validatedBody') as T;
function query<T>(
  c: C,
  schema: {
    safeParse(value: unknown): { success: true; data: T } | { success: false };
  },
): T {
  const result = schema.safeParse(c.req.query());
  if (!result.success)
    throw new AppError('VALIDATION_ERROR', 'Invalid query parameters.', 400);
  return result.data;
}

export class AssetController {
  constructor(private readonly service: AssetService) {}
  dashboard = async (c: C) =>
    c.json({
      data: await this.service.dashboard(
        c.get('authUserId'),
        query(c, s.assetDateRangeSchema),
      ),
    });
  types = async (c: C) =>
    c.json({ data: await this.service.types(c.get('authUserId')) });
  createType = async (c: C) =>
    c.json(
      { data: await this.service.createType(c.get('authUserId'), body(c)) },
      201,
    );
  patchType = async (c: C) =>
    c.json({
      data: await this.service.patchType(
        c.get('authUserId'),
        c.req.param('typeId')!,
        body(c),
      ),
    });
  deleteType = async (c: C) => {
    await this.service.deleteType(c.get('authUserId'), c.req.param('typeId')!);
    return c.body(null, 204);
  };
  assets = async (c: C) => {
    const q = query(c, s.assetListQuerySchema);
    return c.json({
      data: await this.service.assets(c.get('authUserId'), q, {
        from: q.from,
        to: q.to,
      }),
    });
  };
  createAsset = async (c: C) =>
    c.json(
      { data: await this.service.createAsset(c.get('authUserId'), body(c)) },
      201,
    );
  assetDetail = async (c: C) =>
    c.json({
      data: await this.service.assetDetail(
        c.get('authUserId'),
        c.req.param('assetId')!,
        query(c, s.assetDateRangeSchema),
      ),
    });
  patchAsset = async (c: C) =>
    c.json({
      data: await this.service.patchAsset(
        c.get('authUserId'),
        c.req.param('assetId')!,
        body(c),
      ),
    });
  archiveAsset = async (c: C) => {
    await this.service.archiveAsset(
      c.get('authUserId'),
      c.req.param('assetId')!,
    );
    return c.body(null, 204);
  };
  activities = async (c: C) =>
    c.json(
      await this.service.activities(
        c.get('authUserId'),
        query(c, s.assetActivityQuerySchema),
      ),
    );
  createActivity = async (c: C) =>
    c.json(
      { data: await this.service.createActivity(c.get('authUserId'), body(c)) },
      201,
    );
  patchActivity = async (c: C) =>
    c.json({
      data: await this.service.patchActivity(
        c.get('authUserId'),
        c.req.param('activityId')!,
        body(c),
      ),
    });
  deleteActivity = async (c: C) => {
    await this.service.deleteActivity(
      c.get('authUserId'),
      c.req.param('activityId')!,
    );
    return c.body(null, 204);
  };
}
