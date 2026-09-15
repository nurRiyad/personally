import type { Context } from 'hono';
import type { z } from 'zod';
import * as schemas from '@personally/validation';
import type { Env } from '../types/env';
import { LearningService } from '../services/learning.service';
import { AppError } from '../utils/errors';

type C = Context<Env>;
const params = (c: C) =>
  [
    c.get('authUserId'),
    c.req.param('epicId')!,
    c.req.param('taskId')!,
  ] as const;
const body = <T>(c: C) => c.get('validatedBody') as T;
function query<T>(
  c: C,
  schema: {
    safeParse(v: unknown): { success: true; data: T } | { success: false };
  },
) {
  const result = schema.safeParse(c.req.query());
  if (!result.success)
    throw new AppError('VALIDATION_ERROR', 'Invalid filter or page.', 400);
  return result.data;
}
export class LearningController {
  constructor(private readonly service: LearningService) {}
  summary = async (c: C) =>
    c.json({ data: await this.service.summary(c.get('authUserId')) });
  listEpics = async (c: C) =>
    c.json(
      await this.service.listEpics(
        c.get('authUserId'),
        query(c, schemas.epicQuerySchema),
      ),
    );
  createEpic = async (c: C) =>
    c.json(
      { data: await this.service.createEpic(c.get('authUserId'), body(c)) },
      201,
    );
  epic = async (c: C) =>
    c.json({
      data: await this.service.epic(
        c.get('authUserId'),
        c.req.param('epicId')!,
      ),
    });
  patchEpic = async (c: C) =>
    c.json({
      data: await this.service.patchEpic(
        c.get('authUserId'),
        c.req.param('epicId')!,
        body(c),
      ),
    });
  deleteEpic = async (c: C) => {
    await this.service.deleteEpic(
      c.get('authUserId'),
      c.req.param('epicId')!,
      body<{ version: number }>(c).version,
    );
    return c.body(null, 204);
  };
  listTasks = async (c: C) =>
    c.json(
      await this.service.listTasks(
        c.get('authUserId'),
        c.req.param('epicId')!,
        query(c, schemas.taskQuerySchema),
      ),
    );
  createTask = async (c: C) =>
    c.json(
      {
        data: await this.service.createTask(
          c.get('authUserId'),
          c.req.param('epicId')!,
          body(c),
        ),
      },
      201,
    );
  order = async (c: C) => {
    const b = body<z.infer<typeof schemas.orderInputSchema>>(c);
    return c.json({
      data: await this.service.order(
        c.get('authUserId'),
        c.req.param('epicId')!,
        b.version,
        b.taskIds,
      ),
    });
  };
  task = async (c: C) =>
    c.json({ data: await this.service.task(...params(c)) });
  patchTask = async (c: C) =>
    c.json({ data: await this.service.patchTask(...params(c), body(c)) });
  status = async (c: C) =>
    c.json({ data: await this.service.status(...params(c), body(c)) });
  deleteTask = async (c: C) => {
    await this.service.deleteTask(
      ...params(c),
      body<{ version: number }>(c).version,
    );
    return c.body(null, 204);
  };
  complete = async (c: C) =>
    c.json({ data: await this.service.complete(...params(c), body(c)) });
  times = async (c: C) =>
    c.json(
      await this.service.times(
        ...params(c),
        query(c, schemas.pageQuerySchema.strict()),
      ),
    );
  createTime = async (c: C) => {
    const b = body<z.infer<typeof schemas.createTimeSchema>>(c);
    return c.json(
      { data: await this.service.createTime(...params(c), b) },
      201,
    );
  };
  patchTime = async (c: C) =>
    c.json({
      data: await this.service.patchManual(
        ...params(c),
        c.req.param('timeId')!,
        body(c),
      ),
    });
  deleteTime = async (c: C) => {
    await this.service.deleteManual(
      ...params(c),
      c.req.param('timeId')!,
      body(c),
    );
    return c.body(null, 204);
  };
}
