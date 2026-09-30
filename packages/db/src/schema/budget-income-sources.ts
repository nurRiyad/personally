import { integer, index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { budgetMonths } from './budget-months';

export const budgetIncomeSources = sqliteTable(
  'budget_income_sources',
  {
    id: text('id').primaryKey(),
    budgetMonthId: text('budget_month_id')
      .notNull()
      .references(() => budgetMonths.id),
    name: text('name').notNull(),
    plannedAmount: integer('planned_amount').notNull(),
    isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull(),
    position: integer('position').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [index('budget_income_source_order').on(t.budgetMonthId, t.position)],
);
