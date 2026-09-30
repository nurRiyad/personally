import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { budgetGroups } from './budget-groups';
import { budgetMonths } from './budget-months';

export const budgetItems = sqliteTable('budget_items', {
  id: text('id').primaryKey(),
  budgetMonthId: text('budget_month_id')
    .notNull()
    .references(() => budgetMonths.id),
  groupId: text('group_id')
    .notNull()
    .references(() => budgetGroups.id),
  name: text('name').notNull(),
  plannedAmount: integer('planned_amount').notNull(),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull(),
  note: text('note'),
  position: integer('position').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
