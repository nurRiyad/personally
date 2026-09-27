import { Hono, type Context } from 'hono';
import { createDb } from '@personally/db';
import * as s from '@personally/validation';
import { createAuthConfig } from '../../utils/config';
import { requireAuth, validateBody } from '../../middleware';
import type { Env } from '../../types/env';
import { AppError } from '../../utils/errors';
import { D1LearningRepository } from './learning.repository';
import { LearningService } from './learning.service';

const serviceFor = (c: Context<Env>) => new LearningService(new D1LearningRepository(createDb(c.env.DB)));
const query = <T>(
  c: Context<Env>,
  schema: {
    safeParse(value: unknown): { success: true; data: T } | { success: false };
  },
): T => {
  const result = schema.safeParse(c.req.query());
  if (!result.success) throw new AppError('VALIDATION_ERROR', 'Invalid filter or page.', 400);
  return result.data;
};
const user = (c: Context<Env>) => c.get('authUserId');
const body = <T>(c: Context<Env>) => c.get('validatedBody') as T;
const epicId = (c: Context<Env>) => c.req.param('epicId')!;
const taskId = (c: Context<Env>) => c.req.param('taskId')!;
const param = (c: Context<Env>, name: string) => c.req.param(name)!;

export const learningRoutes = new Hono<Env>();
learningRoutes.use('*', async (c, next) => {
  c.set('authConfig', createAuthConfig(c.env));
  await requireAuth(c, next);
});
learningRoutes.get('/summary', async (c) => c.json({ data: await serviceFor(c).summary(user(c)) }));
learningRoutes.get('/epics', async (c) => c.json(await serviceFor(c).listEpics(user(c), query(c, s.epicQuerySchema))));
learningRoutes.post('/epics', validateBody(s.epicInputSchema), async (c) =>
  c.json({ data: await serviceFor(c).createEpic(user(c), body(c)) }, 201),
);
const E = '/epics/:epicId',
  T = `${E}/tasks/:taskId`;
learningRoutes.get(E, async (c) => c.json({ data: await serviceFor(c).epic(user(c), epicId(c)) }));
learningRoutes.patch(E, validateBody(s.epicPatchSchema), async (c) =>
  c.json({ data: await serviceFor(c).patchEpic(user(c), epicId(c), body(c)) }),
);
learningRoutes.delete(E, validateBody(s.versionSchema), async (c) => {
  await serviceFor(c).deleteEpic(user(c), epicId(c), body<{ version: number }>(c).version);
  return c.body(null, 204);
});
learningRoutes.get(`${E}/tasks`, async (c) =>
  c.json(await serviceFor(c).listTasks(user(c), epicId(c), query(c, s.taskQuerySchema))),
);
learningRoutes.post(`${E}/tasks`, validateBody(s.taskInputSchema), async (c) =>
  c.json({ data: await serviceFor(c).createTask(user(c), epicId(c), body(c)) }, 201),
);
learningRoutes.put(`${E}/task-order`, validateBody(s.orderInputSchema), async (c) => {
  const input = body<{ version: number; taskIds: string[] }>(c);
  return c.json({
    data: await serviceFor(c).order(user(c), epicId(c), input.version, input.taskIds),
  });
});
learningRoutes.get(T, async (c) => c.json({ data: await serviceFor(c).task(user(c), epicId(c), taskId(c)) }));
learningRoutes.patch(T, validateBody(s.taskPatchSchema), async (c) =>
  c.json({
    data: await serviceFor(c).patchTask(user(c), epicId(c), taskId(c), body(c)),
  }),
);
learningRoutes.delete(T, validateBody(s.versionSchema), async (c) => {
  await serviceFor(c).deleteTask(user(c), epicId(c), taskId(c), body<{ version: number }>(c).version);
  return c.body(null, 204);
});
learningRoutes.patch(`${T}/status`, validateBody(s.statusInputSchema), async (c) =>
  c.json({
    data: await serviceFor(c).status(user(c), epicId(c), taskId(c), body(c)),
  }),
);
learningRoutes.post(`${T}/complete`, validateBody(s.completeInputSchema), async (c) =>
  c.json({
    data: await serviceFor(c).complete(user(c), epicId(c), taskId(c), body(c)),
  }),
);
learningRoutes.get(`${T}/times`, async (c) =>
  c.json(await serviceFor(c).times(user(c), epicId(c), taskId(c), query(c, s.pageQuerySchema.strict()))),
);
learningRoutes.post(`${T}/times`, validateBody(s.createTimeSchema), async (c) =>
  c.json(
    {
      data: await serviceFor(c).createTime(user(c), epicId(c), taskId(c), body(c)),
    },
    201,
  ),
);
learningRoutes.patch(`${T}/times/:timeId`, validateBody(s.patchTimeSchema), async (c) =>
  c.json({
    data: await serviceFor(c).patchManual(user(c), epicId(c), taskId(c), param(c, 'timeId'), body(c)),
  }),
);
learningRoutes.delete(`${T}/times/:timeId`, validateBody(s.deleteTimeSchema), async (c) => {
  await serviceFor(c).deleteManual(user(c), epicId(c), taskId(c), param(c, 'timeId'), body(c));
  return c.body(null, 204);
});
