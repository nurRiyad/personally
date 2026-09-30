import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { budgetIncomeSources } from './budget-income-sources';

export const budgetIncomeEntries = sqliteTable('budget_income_entries', {
  id: text('id').primaryKey(),
  incomeSourceId: text('income_source_id')
    .notNull()
    .references(() => budgetIncomeSources.id),
  amount: integer('amount').notNull(),
  receivedOn: text('received_on').notNull(),
  note: text('note'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
