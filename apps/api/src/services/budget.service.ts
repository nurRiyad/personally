import type { D1BudgetRepository } from '../repositories/budget.repository';
import { AppError, NotFoundError } from '../utils/errors';
const id = () => crypto.randomUUID(),
  now = () => Date.now();
const conflict = () => {
  throw new AppError(
    'BUDGET_CONFLICT',
    'This budget changed. Refresh and try again.',
    409,
  );
};
export class BudgetService {
  constructor(private repo: D1BudgetRepository) {}
  private async month(user: string, key: string) {
    const m = await this.repo.month(user, key);
    if (!m) throw new NotFoundError();
    return m;
  }
  private async check(user: string, key: string, v: number) {
    const m = await this.month(user, key);
    if (m.version !== v) conflict();
    return m;
  }
  private async touch(m: any) {
    const r = await this.repo.run(
      'UPDATE budget_months SET version=version+1,updated_at=? WHERE id=? AND version=?',
      now(),
      m.id,
      m.version,
    );
    if (!r.meta.changes) conflict();
  }
  get(user: string, key: string) {
    return this.repo.aggregate(user, key);
  }
  async list(user: string, year: number) {
    const ms = await this.repo.list(user, year);
    return Promise.all(
      ms.map(async (m) => {
        const a = await this.repo.aggregate(user, m.month);
        return { month: m.month, summary: a!.summary, version: m.version };
      }),
    );
  }
  async create(user: string, input: any) {
    if (await this.repo.month(user, input.month))
      throw new AppError(
        'BUDGET_EXISTS',
        'A budget already exists for this month.',
        409,
      );
    const t = now();
    await this.repo.run(
      'INSERT INTO budget_months (id,user_id,month,note,created_at,updated_at,version) VALUES (?,?,?,?,?,?,?)',
      id(),
      user,
      input.month,
      input.note ?? null,
      t,
      t,
      1,
    );
    return this.get(user, input.month);
  }
  async patchMonth(user: string, key: string, x: any) {
    const m = await this.check(user, key, x.monthVersion);
    const fields: string[] = [],
      values: any[] = [];
    if (x.note !== undefined) {
      fields.push('note=?');
      values.push(x.note);
    }
    if (x.cashInPocket !== undefined) {
      fields.push('cash_in_pocket=?');
      values.push(x.cashInPocket);
    }
    await this.repo.run(
      `UPDATE budget_months SET ${fields.join(',')},version=version+1,updated_at=? WHERE id=? AND version=?`,
      ...values,
      now(),
      m.id,
      m.version,
    );
    return this.get(user, key);
  }
  async source(user: string, key: string, x: any) {
    const m = await this.check(user, key, x.monthVersion),
      p = await this.repo.run(
        'SELECT COALESCE(MAX(position),-1)+1 p FROM budget_income_sources WHERE budget_month_id=?',
        m.id,
      );
    const pos = (p.results?.[0] as any)?.p ?? 0;
    await this.repo.run(
      'INSERT INTO budget_income_sources VALUES (?,?,?,?,?,?,?,?)',
      id(),
      m.id,
      x.name,
      x.plannedAmount,
      x.isRecurring ? 1 : 0,
      pos,
      now(),
      now(),
    );
    await this.touch(m);
    return this.get(user, key);
  }
  async patchSource(user: string, record: string, x: any) {
    const r = await this.repo.run(
        'SELECT m.* FROM budget_income_sources s JOIN budget_months m ON m.id=s.budget_month_id WHERE s.id=? AND m.user_id=?',
        record,
        user,
      ),
      m = r.results?.[0] as any;
    if (!m) throw new NotFoundError();
    if (m.version !== x.monthVersion) conflict();
    const fields: string[] = [],
      vals: any[] = [];
    for (const [db, k] of [
      ['name', 'name'],
      ['planned_amount', 'plannedAmount'],
      ['is_recurring', 'isRecurring'],
    ] as const)
      if (x[k] !== undefined) {
        fields.push(`${db}=?`);
        vals.push(k === 'isRecurring' ? (x[k] ? 1 : 0) : x[k]);
      }
    if (!fields.length)
      throw new AppError('VALIDATION_ERROR', 'Provide a field to update.', 400);
    await this.repo.run(
      `UPDATE budget_income_sources SET ${fields.join(',')},updated_at=? WHERE id=?`,
      ...vals,
      now(),
      record,
    );
    await this.touch(m);
    return this.get(user, m.month);
  }
  async deleteSource(user: string, record: string, x: any) {
    const r = await this.repo.run(
        'SELECT m.* FROM budget_income_sources s JOIN budget_months m ON m.id=s.budget_month_id WHERE s.id=? AND m.user_id=?',
        record,
        user,
      ),
      m = r.results?.[0] as any;
    if (!m) throw new NotFoundError();
    if (m.version !== x.monthVersion) conflict();
    const count = await this.repo.run(
      'SELECT COUNT(*) total FROM budget_income_entries WHERE income_source_id=?',
      record,
    );
    if (Number((count.results?.[0] as any)?.total) > 0)
      throw new AppError(
        'BUDGET_INCOME_SOURCE_NOT_EMPTY',
        'Delete all recorded income entries before deleting this source.',
        409,
      );
    await this.repo.run('DELETE FROM budget_income_sources WHERE id=?', record);
    await this.touch(m);
    return this.get(user, m.month);
  }
  async deleteIncomeEntry(user: string, record: string, x: any) {
    const r = await this.repo.run(
        'SELECT m.* FROM budget_income_entries e JOIN budget_income_sources s ON s.id=e.income_source_id JOIN budget_months m ON m.id=s.budget_month_id WHERE e.id=? AND m.user_id=?',
        record,
        user,
      ),
      m = r.results?.[0] as any;
    if (!m) throw new NotFoundError();
    if (m.version !== x.monthVersion) conflict();
    await this.repo.run('DELETE FROM budget_income_entries WHERE id=?', record);
    await this.touch(m);
    return this.get(user, m.month);
  }
  async deleteExpense(user: string, record: string, x: any) {
    const r = await this.repo.run(
        'SELECT m.* FROM budget_expenses e JOIN budget_items i ON i.id=e.budget_item_id JOIN budget_months m ON m.id=i.budget_month_id WHERE e.id=? AND m.user_id=?',
        record,
        user,
      ),
      m = r.results?.[0] as any;
    if (!m) throw new NotFoundError();
    if (m.version !== x.monthVersion) conflict();
    await this.repo.run('DELETE FROM budget_expenses WHERE id=?', record);
    await this.touch(m);
    return this.get(user, m.month);
  }
  async group(user: string, key: string, x: any) {
    const m = await this.check(user, key, x.monthVersion),
      p = await this.repo.run(
        'SELECT COALESCE(MAX(position),-1)+1 p FROM budget_groups WHERE budget_month_id=?',
        m.id,
      );
    await this.repo.run(
      'INSERT INTO budget_groups VALUES (?,?,?,?,?,?)',
      id(),
      m.id,
      x.name,
      (p.results?.[0] as any)?.p ?? 0,
      now(),
      now(),
    );
    await this.touch(m);
    return this.get(user, key);
  }
  async deleteGroup(user: string, record: string, x: any) {
    const r = await this.repo.run(
        'SELECT m.* FROM budget_groups g JOIN budget_months m ON m.id=g.budget_month_id WHERE g.id=? AND m.user_id=?',
        record,
        user,
      ),
      m = r.results?.[0] as any;
    if (!m) throw new NotFoundError();
    if (m.version !== x.monthVersion) conflict();
    const count = await this.repo.run(
      'SELECT COUNT(*) total FROM budget_items WHERE group_id=?',
      record,
    );
    if (Number((count.results?.[0] as any)?.total) > 0)
      throw new AppError(
        'BUDGET_GROUP_NOT_EMPTY',
        'Remove or move all items before deleting this block.',
        409,
      );
    await this.repo.run('DELETE FROM budget_groups WHERE id=?', record);
    await this.touch(m);
    return this.get(user, m.month);
  }
  async item(user: string, key: string, x: any) {
    const m = await this.check(user, key, x.monthVersion);
    const g = await this.repo.run(
      'SELECT id FROM budget_groups WHERE id=? AND budget_month_id=?',
      x.groupId,
      m.id,
    );
    if (!g.results?.length)
      throw new AppError(
        'VALIDATION_ERROR',
        'Group must belong to this budget.',
        400,
        { groupId: ['Choose a group in this month.'] },
      );
    const p = await this.repo.run(
      'SELECT COALESCE(MAX(position),-1)+1 p FROM budget_items WHERE group_id=?',
      x.groupId,
    );
    await this.repo.run(
      'INSERT INTO budget_items VALUES (?,?,?,?,?,?,?,?,?,?)',
      id(),
      m.id,
      x.groupId,
      x.name,
      x.plannedAmount,
      x.isRecurring ? 1 : 0,
      x.note ?? null,
      (p.results?.[0] as any)?.p ?? 0,
      now(),
      now(),
    );
    await this.touch(m);
    return this.get(user, key);
  }
  async patchItem(user: string, record: string, x: any) {
    const r = await this.repo.run(
        'SELECT m.* FROM budget_items i JOIN budget_months m ON m.id=i.budget_month_id WHERE i.id=? AND m.user_id=?',
        record,
        user,
      ),
      m = r.results?.[0] as any;
    if (!m) throw new NotFoundError();
    if (m.version !== x.monthVersion) conflict();
    if (x.groupId) {
      const g = await this.repo.run(
        'SELECT id FROM budget_groups WHERE id=? AND budget_month_id=?',
        x.groupId,
        m.id,
      );
      if (!g.results?.length)
        throw new AppError(
          'VALIDATION_ERROR',
          'Group must belong to this budget.',
          400,
          { groupId: ['Choose a group in this month.'] },
        );
    }
    const fields: string[] = [],
      vals: any[] = [];
    for (const [db, k] of [
      ['group_id', 'groupId'],
      ['name', 'name'],
      ['planned_amount', 'plannedAmount'],
      ['is_recurring', 'isRecurring'],
      ['note', 'note'],
    ] as const)
      if (x[k] !== undefined) {
        fields.push(`${db}=?`);
        vals.push(k === 'isRecurring' ? (x[k] ? 1 : 0) : x[k]);
      }
    if (!fields.length)
      throw new AppError('VALIDATION_ERROR', 'Provide a field to update.', 400);
    await this.repo.run(
      `UPDATE budget_items SET ${fields.join(',')},updated_at=? WHERE id=?`,
      ...vals,
      now(),
      record,
    );
    await this.touch(m);
    return this.get(user, m.month);
  }
  async deleteItem(user: string, record: string, x: any) {
    const r = await this.repo.run(
        'SELECT m.* FROM budget_items i JOIN budget_months m ON m.id=i.budget_month_id WHERE i.id=? AND m.user_id=?',
        record,
        user,
      ),
      m = r.results?.[0] as any;
    if (!m) throw new NotFoundError();
    if (m.version !== x.monthVersion) conflict();
    const count = await this.repo.run(
      'SELECT COUNT(*) total FROM budget_expenses WHERE budget_item_id=?',
      record,
    );
    if (Number((count.results?.[0] as any)?.total) > 0)
      throw new AppError(
        'BUDGET_ITEM_NOT_EMPTY',
        'Items with recorded expenses cannot be deleted.',
        409,
      );
    await this.repo.run('DELETE FROM budget_items WHERE id=?', record);
    await this.touch(m);
    return this.get(user, m.month);
  }
  async child(user: string, kind: 'source' | 'item', record: string, x: any) {
    const table = kind === 'source' ? 'budget_income_sources' : 'budget_items';
    const row = await this.repo.run(
      `SELECT m.month,m.id,m.version FROM ${table} r JOIN budget_months m ON m.id=r.budget_month_id WHERE r.id=? AND m.user_id=?`,
      record,
      user,
    );
    const m = row.results?.[0] as any;
    if (!m) throw new NotFoundError();
    if (m.version !== x.monthVersion) conflict();
    const date = kind === 'source' ? x.receivedOn : x.spentOn;
    if (!date.startsWith(m.month))
      throw new AppError(
        'VALIDATION_ERROR',
        'Activity date must be in its budget month.',
        400,
        {
          [kind === 'source' ? 'receivedOn' : 'spentOn']: [
            'Date must be in the budget month.',
          ],
        },
      );
    if (kind === 'source')
      await this.repo.run(
        'INSERT INTO budget_income_entries VALUES (?,?,?,?,?,?,?)',
        id(),
        record,
        x.amount,
        date,
        x.note ?? null,
        now(),
        now(),
      );
    else
      await this.repo.run(
        'INSERT INTO budget_expenses VALUES (?,?,?,?,?,?,?)',
        id(),
        record,
        x.amount,
        date,
        x.note ?? null,
        now(),
        now(),
      );
    await this.touch(m);
    return this.get(user, m.month);
  }
  async copy(user: string, key: string, x: any) {
    const source = await this.check(user, key, x.monthVersion);
    if (await this.repo.month(user, x.targetMonth))
      throw new AppError(
        'BUDGET_EXISTS',
        'The target budget already exists.',
        409,
      );
    const a = await this.get(user, key);
    const t = now(),
      target = id();
    await this.repo.run(
      'INSERT INTO budget_months VALUES (?,?,?,?,?,?,?)',
      target,
      user,
      x.targetMonth,
      null,
      t,
      t,
      1,
    );
    const groups: any[] = [];
    for (const g of a!.groups) {
      const gid = id();
      groups.push([g.id, gid]);
      await this.repo.run(
        'INSERT INTO budget_groups VALUES (?,?,?,?,?,?)',
        gid,
        target,
        g.name,
        g.position,
        t,
        t,
      );
    }
    for (const s of a!.incomeSources.filter(
      (s) => x.mode === 'all' || s.isRecurring,
    ))
      await this.repo.run(
        'INSERT INTO budget_income_sources VALUES (?,?,?,?,?,?,?,?)',
        id(),
        target,
        s.name,
        s.plannedAmount,
        s.isRecurring ? 1 : 0,
        s.position,
        t,
        t,
      );
    for (const g of a!.groups)
      for (const i of g.items.filter(
        (i) => x.mode === 'all' || i.isRecurring,
      )) {
        const gid = groups.find((v) => v[0] === g.id)![1];
        await this.repo.run(
          'INSERT INTO budget_items VALUES (?,?,?,?,?,?,?,?,?,?)',
          id(),
          target,
          gid,
          i.name,
          i.plannedAmount,
          i.isRecurring ? 1 : 0,
          i.note,
          i.position,
          t,
          t,
        );
      }
    return this.get(user, x.targetMonth);
  }
}
