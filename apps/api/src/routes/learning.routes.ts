import { Hono } from 'hono';
import * as s from '@personally/validation';
import { requireAuth, validateBody } from '../middleware';
import type { Env } from '../types/env';
export const learningRoutes = new Hono<Env>();
learningRoutes.use('*', requireAuth);
learningRoutes.get('/summary', (c) => c.get('learningController').summary(c));
learningRoutes.get('/epics', (c) => c.get('learningController').listEpics(c));
learningRoutes.post('/epics', validateBody(s.epicInputSchema), (c) =>
  c.get('learningController').createEpic(c),
);
const E = '/epics/:epicId',
  T = `${E}/tasks/:taskId`;
learningRoutes.get(E, (c) => c.get('learningController').epic(c));
learningRoutes.patch(E, validateBody(s.epicPatchSchema), (c) =>
  c.get('learningController').patchEpic(c),
);
learningRoutes.delete(E, validateBody(s.versionSchema), (c) =>
  c.get('learningController').deleteEpic(c),
);
learningRoutes.get(`${E}/tasks`, (c) =>
  c.get('learningController').listTasks(c),
);
learningRoutes.post(`${E}/tasks`, validateBody(s.taskInputSchema), (c) =>
  c.get('learningController').createTask(c),
);
learningRoutes.put(`${E}/task-order`, validateBody(s.orderInputSchema), (c) =>
  c.get('learningController').order(c),
);
learningRoutes.get(T, (c) => c.get('learningController').task(c));
learningRoutes.patch(T, validateBody(s.taskPatchSchema), (c) =>
  c.get('learningController').patchTask(c),
);
learningRoutes.delete(T, validateBody(s.versionSchema), (c) =>
  c.get('learningController').deleteTask(c),
);
learningRoutes.patch(`${T}/status`, validateBody(s.statusInputSchema), (c) =>
  c.get('learningController').status(c),
);
learningRoutes.post(`${T}/complete`, validateBody(s.completeInputSchema), (c) =>
  c.get('learningController').complete(c),
);
learningRoutes.get(`${T}/times`, (c) => c.get('learningController').times(c));
learningRoutes.post(`${T}/times`, validateBody(s.createTimeSchema), (c) =>
  c.get('learningController').createTime(c),
);
learningRoutes.patch(
  `${T}/times/:timeId`,
  validateBody(s.patchTimeSchema),
  (c) => c.get('learningController').patchTime(c),
);
learningRoutes.delete(
  `${T}/times/:timeId`,
  validateBody(s.deleteTimeSchema),
  (c) => c.get('learningController').deleteTime(c),
);
