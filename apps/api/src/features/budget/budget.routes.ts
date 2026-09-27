import { Hono, type Context } from 'hono';
import * as s from '@personally/validation';
import { requireAuth, validateBody } from '../../middleware';
import type { Env } from '../../types/env';
import { D1BudgetRepository } from './budget.repository';
import { BudgetService } from './budget.service';
import { AppError } from '../../utils/errors';

const param = (c: Context<Env>, name: string) => c.req.param(name)!;
const serviceFor = (c: Context<Env>) => new BudgetService(new D1BudgetRepository(c.env.DB));

export const budgetRoutes = new Hono<Env>();
budgetRoutes.use('*', requireAuth);
budgetRoutes.get('/months', async (c) => {
  const year = Number(c.req.query('year'));
  if (!Number.isInteger(year)) throw new AppError('VALIDATION_ERROR', 'A valid year is required.', 400);
  return c.json({ data: await serviceFor(c).list(c.get('authUserId'), year) });
});
budgetRoutes.get('/months/:month', async (c) => {
  const data = await serviceFor(c).get(c.get('authUserId'), param(c, 'month'));
  if (!data) throw new AppError('NOT_FOUND', 'Budget record not found.', 404);
  return c.json({ data });
});
budgetRoutes.post('/months', validateBody(s.budgetMonthInputSchema), async (c) =>
  c.json(
    {
      data: await serviceFor(c).create(c.get('authUserId'), c.get('validatedBody')),
    },
    201,
  ),
);
budgetRoutes.patch('/months/:month', validateBody(s.budgetMonthPatchSchema), (c) =>
  c.json({
    data: serviceFor(c).patchMonth(c.get('authUserId'), param(c, 'month'), c.get('validatedBody')),
  }),
);
budgetRoutes.post('/months/:month/income-sources', validateBody(s.incomeSourceInputSchema), (c) =>
  c.json(
    {
      data: serviceFor(c).source(c.get('authUserId'), param(c, 'month'), c.get('validatedBody')),
    },
    201,
  ),
);
budgetRoutes.post('/months/:month/groups', validateBody(s.budgetGroupInputSchema), (c) =>
  c.json(
    {
      data: serviceFor(c).group(c.get('authUserId'), param(c, 'month'), c.get('validatedBody')),
    },
    201,
  ),
);
budgetRoutes.post('/months/:month/items', validateBody(s.budgetItemInputSchema), (c) =>
  c.json(
    {
      data: serviceFor(c).item(c.get('authUserId'), param(c, 'month'), c.get('validatedBody')),
    },
    201,
  ),
);
budgetRoutes.post('/income-sources/:sourceId/income', validateBody(s.incomeEntryInputSchema), (c) =>
  c.json(
    {
      data: serviceFor(c).child(c.get('authUserId'), 'source', param(c, 'sourceId'), c.get('validatedBody')),
    },
    201,
  ),
);
budgetRoutes.post('/items/:itemId/expenses', validateBody(s.expenseInputSchema), (c) =>
  c.json(
    {
      data: serviceFor(c).child(c.get('authUserId'), 'item', param(c, 'itemId'), c.get('validatedBody')),
    },
    201,
  ),
);
budgetRoutes.patch('/income-sources/:sourceId', validateBody(s.incomeSourcePatchSchema), (c) =>
  c.json({
    data: serviceFor(c).patchSource(c.get('authUserId'), param(c, 'sourceId'), c.get('validatedBody')),
  }),
);
budgetRoutes.patch('/items/:itemId', validateBody(s.budgetItemPatchSchema), (c) =>
  c.json({
    data: serviceFor(c).patchItem(c.get('authUserId'), param(c, 'itemId'), c.get('validatedBody')),
  }),
);
budgetRoutes.post('/months/:month/copy', validateBody(s.copyBudgetInputSchema), (c) =>
  c.json(
    {
      data: serviceFor(c).copy(c.get('authUserId'), param(c, 'month'), c.get('validatedBody')),
    },
    201,
  ),
);
const version = (c: Context<Env>) => c.get('validatedBody');
budgetRoutes.delete('/income-sources/:sourceId', validateBody(s.budgetVersionSchema), (c) =>
  c.json({
    data: serviceFor(c).deleteSource(c.get('authUserId'), param(c, 'sourceId'), version(c)),
  }),
);
budgetRoutes.delete('/income-entries/:incomeEntryId', validateBody(s.budgetVersionSchema), (c) =>
  c.json({
    data: serviceFor(c).deleteIncomeEntry(c.get('authUserId'), param(c, 'incomeEntryId'), version(c)),
  }),
);
budgetRoutes.delete('/expenses/:expenseId', validateBody(s.budgetVersionSchema), (c) =>
  c.json({
    data: serviceFor(c).deleteExpense(c.get('authUserId'), param(c, 'expenseId'), version(c)),
  }),
);
budgetRoutes.delete('/groups/:groupId', validateBody(s.budgetVersionSchema), (c) =>
  c.json({
    data: serviceFor(c).deleteGroup(c.get('authUserId'), param(c, 'groupId'), version(c)),
  }),
);
budgetRoutes.delete('/items/:itemId', validateBody(s.budgetVersionSchema), (c) =>
  c.json({
    data: serviceFor(c).deleteItem(c.get('authUserId'), param(c, 'itemId'), version(c)),
  }),
);
