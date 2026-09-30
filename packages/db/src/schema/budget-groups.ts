import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { budgetMonths } from './budget-months';

export const budgetGroups = sqliteTable('budget_groups', {
  id: text('id').primaryKey(),
  budgetMonthId: text('budget_month_id')
    .notNull()
    .references(() => budgetMonths.id),
  name: text('name').notNull(),
  position: integer('position').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
