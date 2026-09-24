import type { Context } from 'hono';
import type { Env } from '../types/env';
import { BudgetService } from '../services/budget.service';
import { AppError } from '../utils/errors';
const body = <T>(c: Context<Env>) => c.get('validatedBody') as T;
export class BudgetController {
  constructor(private service: BudgetService) {}
  list = async (c: Context<Env>) => {
    const year = Number(c.req.query('year'));
    if (!Number.isInteger(year))
      throw new AppError('VALIDATION_ERROR', 'A valid year is required.', 400);
    return c.json({ data: await this.service.list(c.get('authUserId'), year) });
  };
  get = async (c: Context<Env>) => {
    const d = await this.service.get(
      c.get('authUserId'),
      c.req.param('month')!,
    );
    if (!d) throw new AppError('NOT_FOUND', 'Budget record not found.', 404);
    return c.json({ data: d });
  };
  create = async (c: Context<Env>) =>
    c.json(
      { data: await this.service.create(c.get('authUserId'), body(c)) },
      201,
    );
  patch = async (c: Context<Env>) =>
    c.json({
      data: await this.service.patchMonth(
        c.get('authUserId'),
        c.req.param('month')!,
        body(c),
      ),
    });
  source = async (c: Context<Env>) =>
    c.json(
      {
        data: await this.service.source(
          c.get('authUserId'),
          c.req.param('month')!,
          body(c),
        ),
      },
      201,
    );
  patchSource = async (c: Context<Env>) =>
    c.json({
      data: await this.service.patchSource(
        c.get('authUserId'),
        c.req.param('sourceId')!,
        body(c),
      ),
    });
  deleteSource = async (c: Context<Env>) =>
    c.json({
      data: await this.service.deleteSource(
        c.get('authUserId'),
        c.req.param('sourceId')!,
        body(c),
      ),
    });
  deleteIncomeEntry = async (c: Context<Env>) =>
    c.json({
      data: await this.service.deleteIncomeEntry(
        c.get('authUserId'),
        c.req.param('incomeEntryId')!,
        body(c),
      ),
    });
  deleteExpense = async (c: Context<Env>) =>
    c.json({
      data: await this.service.deleteExpense(
        c.get('authUserId'),
        c.req.param('expenseId')!,
        body(c),
      ),
    });
  group = async (c: Context<Env>) =>
    c.json(
      {
        data: await this.service.group(
          c.get('authUserId'),
          c.req.param('month')!,
          body(c),
        ),
      },
      201,
    );
  deleteGroup = async (c: Context<Env>) =>
    c.json({
      data: await this.service.deleteGroup(
        c.get('authUserId'),
        c.req.param('groupId')!,
        body(c),
      ),
    });
  item = async (c: Context<Env>) =>
    c.json(
      {
        data: await this.service.item(
          c.get('authUserId'),
          c.req.param('month')!,
          body(c),
        ),
      },
      201,
    );
  patchItem = async (c: Context<Env>) =>
    c.json({
      data: await this.service.patchItem(
        c.get('authUserId'),
        c.req.param('itemId')!,
        body(c),
      ),
    });
  deleteItem = async (c: Context<Env>) =>
    c.json({
      data: await this.service.deleteItem(
        c.get('authUserId'),
        c.req.param('itemId')!,
        body(c),
      ),
    });
  income = async (c: Context<Env>) =>
    c.json(
      {
        data: await this.service.child(
          c.get('authUserId'),
          'source',
          c.req.param('sourceId')!,
          body(c),
        ),
      },
      201,
    );
  expense = async (c: Context<Env>) =>
    c.json(
      {
        data: await this.service.child(
          c.get('authUserId'),
          'item',
          c.req.param('itemId')!,
          body(c),
        ),
      },
      201,
    );
  copy = async (c: Context<Env>) =>
    c.json(
      {
        data: await this.service.copy(
          c.get('authUserId'),
          c.req.param('month')!,
          body(c),
        ),
      },
      201,
    );
}
