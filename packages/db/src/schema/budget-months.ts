import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const budgetMonths = sqliteTable(
  'budget_months',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    month: text('month').notNull(),
    note: text('note'),
    cashInPocket: integer('cash_in_pocket').notNull().default(0),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    version: integer('version').notNull().default(1),
  },
  (t) => [uniqueIndex('budget_month_owner_key').on(t.userId, t.month)],
);
