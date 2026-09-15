import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  index,
  check,
} from 'drizzle-orm/sqlite-core';
import { learningEpics } from './learning-epics';
export const learningTasks = sqliteTable(
  'learning_tasks',
  {
    id: text('id').primaryKey().notNull(),
    epicId: text('epic_id')
      .notNull()
      .references(() => learningEpics.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    status: text('status', {
      enum: ['Todo', 'In progress', 'Done', 'Blocked', 'Cancelled'],
    })
      .notNull()
      .default('Todo'),
    targetMinutes: integer('target_minutes').notNull(),
    weight: integer('weight').notNull().default(1),
    sortOrder: integer('sort_order').notNull(),
    comment: text('comment'),
    completedAt: integer('completed_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    index('learning_tasks_order').on(t.epicId, t.sortOrder, t.id),
    index('learning_tasks_status').on(t.epicId, t.status),
    check(
      'learning_tasks_status_check',
      sql`${t.status} IN ('Todo','In progress','Done','Blocked','Cancelled')`,
    ),
    check(
      'learning_tasks_target',
      sql`${t.targetMinutes} > 0 AND typeof(${t.targetMinutes}) = 'integer'`,
    ),
    check(
      'learning_tasks_weight',
      sql`${t.weight} BETWEEN 1 AND 10 AND typeof(${t.weight}) = 'integer'`,
    ),
    check(
      'learning_tasks_order_check',
      sql`${t.sortOrder} >= 0 AND typeof(${t.sortOrder}) = 'integer'`,
    ),
    check('learning_tasks_version', sql`${t.version} >= 1`),
  ],
);
