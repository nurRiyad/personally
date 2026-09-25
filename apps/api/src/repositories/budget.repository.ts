type Row = Record<string, any>;
export class D1BudgetRepository {
  constructor(private db: D1Database) {}
  async month(userId: string, key: string) {
    return this.db
      .prepare('SELECT * FROM budget_months WHERE user_id=? AND month=?')
      .bind(userId, key)
      .first<Row>();
  }
  async byId(userId: string, id: string) {
    return this.db
      .prepare('SELECT m.* FROM budget_months m WHERE m.user_id=? AND m.id=?')
      .bind(userId, id)
      .first<Row>();
  }
  async list(userId: string, year: number) {
    return (
      await this.db
        .prepare(
          'SELECT * FROM budget_months WHERE user_id=? AND month LIKE ? ORDER BY month',
        )
        .bind(userId, `${year}-%`)
        .all<Row>()
    ).results;
  }
  async aggregate(userId: string, key: string) {
    const m = await this.month(userId, key);
    if (!m) return null;
    const q = (s: string, ...b: any[]) =>
      this.db
        .prepare(s)
        .bind(...b)
        .all<Row>()
        .then((x) => x.results);
    const [sources, entries, groups, items, expenses] = await Promise.all([
      q(
        'SELECT * FROM budget_income_sources WHERE budget_month_id=? ORDER BY position,id',
        m.id,
      ),
      q(
        'SELECT e.* FROM budget_income_entries e JOIN budget_income_sources s ON s.id=e.income_source_id WHERE s.budget_month_id=? ORDER BY e.received_on DESC,e.created_at DESC',
        m.id,
      ),
      q(
        'SELECT * FROM budget_groups WHERE budget_month_id=? ORDER BY position,id',
        m.id,
      ),
      q(
        'SELECT * FROM budget_items WHERE budget_month_id=? ORDER BY position,id',
        m.id,
      ),
      q(
        'SELECT e.* FROM budget_expenses e JOIN budget_items i ON i.id=e.budget_item_id WHERE i.budget_month_id=? ORDER BY e.spent_on DESC,e.created_at DESC',
        m.id,
      ),
    ]);
    const sum = (a: Row[], key: string) =>
        a.reduce((n, x) => n + Number(x[key]), 0),
      pct = (n: number, d: number) =>
        d ? Math.min(100, Math.round((n / d) * 100)) : 0;
    const src = sources.map((s) => {
      const xs = entries.filter((e) => e.income_source_id === s.id);
      const earned = sum(xs, 'amount');
      return {
        id: s.id,
        name: s.name,
        plannedAmount: s.planned_amount,
        isRecurring: !!s.is_recurring,
        position: s.position,
        summary: {
          earnedAmount: earned,
          remainingAmount: s.planned_amount - earned,
          usagePercentage: pct(earned, s.planned_amount),
        },
        income: xs.map((e) => ({
          id: e.id,
          amount: e.amount,
          receivedOn: e.received_on,
          note: e.note,
        })),
      };
    });
    const its = items.map((i) => {
      const xs = expenses.filter((e) => e.budget_item_id === i.id),
        spent = sum(xs, 'amount');
      return {
        id: i.id,
        name: i.name,
        plannedAmount: i.planned_amount,
        isRecurring: !!i.is_recurring,
        note: i.note,
        position: i.position,
        summary: {
          spentAmount: spent,
          remainingAmount: i.planned_amount - spent,
          usagePercentage: pct(spent, i.planned_amount),
        },
        expenses: xs.map((e) => ({
          id: e.id,
          amount: e.amount,
          spentOn: e.spent_on,
          note: e.note,
        })),
      };
    });
    const spent = sum(expenses, 'amount'),
      earned = sum(entries, 'amount'),
      planned = sum(items, 'planned_amount');
    return {
      id: m.id,
      month: m.month,
      note: m.note,
      cashInPocket: m.cash_in_pocket ?? 0,
      version: m.version,
      summary: {
        earnedAmount: earned,
        plannedAmount: planned,
        spentAmount: spent,
        remainingAmount: earned - spent,
        usagePercentage: pct(spent, planned),
      },
      incomeSources: src,
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        position: g.position,
        items: its.filter(
          (i) => items.find((x) => x.id === i.id)?.group_id === g.id,
        ),
      })),
      recentActivity: expenses.slice(0, 10).map((e) => {
        const i = items.find((x) => x.id === e.budget_item_id)!;
        const g = groups.find((x) => x.id === i.group_id)!;
        return {
          id: e.id,
          amount: e.amount,
          spentOn: e.spent_on,
          note: e.note,
          itemId: i.id,
          itemName: i.name,
          groupName: g.name,
        };
      }),
    };
  }
  async run(sql: string, ...args: any[]) {
    return this.db
      .prepare(sql)
      .bind(...args)
      .run();
  }
}
