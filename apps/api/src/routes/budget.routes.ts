import { Hono } from 'hono';
import * as s from '@personally/validation';
import { requireAuth, validateBody } from '../middleware';
import type { Env } from '../types/env';
export const budgetRoutes = new Hono<Env>();
budgetRoutes.use('*', requireAuth);
budgetRoutes.get('/months', (c) => c.get('budgetController').list(c));
budgetRoutes.get('/months/:month', (c) => c.get('budgetController').get(c));
budgetRoutes.post('/months', validateBody(s.budgetMonthInputSchema), (c) =>
  c.get('budgetController').create(c),
);
budgetRoutes.patch(
  '/months/:month',
  validateBody(s.budgetMonthPatchSchema),
  (c) => c.get('budgetController').patch(c),
);
budgetRoutes.post(
  '/months/:month/income-sources',
  validateBody(s.incomeSourceInputSchema),
  (c) => c.get('budgetController').source(c),
);
budgetRoutes.post(
  '/months/:month/groups',
  validateBody(s.budgetGroupInputSchema),
  (c) => c.get('budgetController').group(c),
);
budgetRoutes.post(
  '/months/:month/items',
  validateBody(s.budgetItemInputSchema),
  (c) => c.get('budgetController').item(c),
);
budgetRoutes.post(
  '/income-sources/:sourceId/income',
  validateBody(s.incomeEntryInputSchema),
  (c) => c.get('budgetController').income(c),
);
budgetRoutes.post(
  '/items/:itemId/expenses',
  validateBody(s.expenseInputSchema),
  (c) => c.get('budgetController').expense(c),
);
budgetRoutes.patch(
  '/income-sources/:sourceId',
  validateBody(s.incomeSourcePatchSchema),
  (c) => c.get('budgetController').patchSource(c),
);
budgetRoutes.patch(
  '/items/:itemId',
  validateBody(s.budgetItemPatchSchema),
  (c) => c.get('budgetController').patchItem(c),
);
budgetRoutes.post(
  '/months/:month/copy',
  validateBody(s.copyBudgetInputSchema),
  (c) => c.get('budgetController').copy(c),
);
budgetRoutes.delete(
  '/income-sources/:sourceId',
  validateBody(s.budgetVersionSchema),
  (c) => c.get('budgetController').deleteSource(c),
);
budgetRoutes.delete(
  '/income-entries/:incomeEntryId',
  validateBody(s.budgetVersionSchema),
  (c) => c.get('budgetController').deleteIncomeEntry(c),
);
budgetRoutes.delete(
  '/expenses/:expenseId',
  validateBody(s.budgetVersionSchema),
  (c) => c.get('budgetController').deleteExpense(c),
);
budgetRoutes.delete(
  '/groups/:groupId',
  validateBody(s.budgetVersionSchema),
  (c) => c.get('budgetController').deleteGroup(c),
);
budgetRoutes.delete(
  '/items/:itemId',
  validateBody(s.budgetVersionSchema),
  (c) => c.get('budgetController').deleteItem(c),
);
