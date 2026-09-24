import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';
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
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    version: integer('version').notNull().default(1),
  },
  (t) => [uniqueIndex('budget_month_owner_key').on(t.userId, t.month)],
);
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
