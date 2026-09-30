import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { budgetItems } from './budget-items';

export const budgetExpenses = sqliteTable('budget_expenses', {
  id: text('id').primaryKey(),
  budgetItemId: text('budget_item_id')
    .notNull()
    .references(() => budgetItems.id),
  amount: integer('amount').notNull(),
  spentOn: text('spent_on').notNull(),
  note: text('note'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
