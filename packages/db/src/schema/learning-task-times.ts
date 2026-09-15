import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  index,
  check,
} from 'drizzle-orm/sqlite-core';
import { learningTasks } from './learning-tasks';

export const learningTaskTimes = sqliteTable(
  'learning_task_times',
  {
    id: text('id').primaryKey().notNull(),
    taskId: text('task_id')
      .notNull()
      .references(() => learningTasks.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['stopwatch', 'manual'] }).notNull(),
    startedAt: integer('started_at'),
    endedAt: integer('ended_at'),
    entryDate: text('entry_date'),
    minutes: integer('minutes').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    index('learning_times_task_date').on(
      t.taskId,
      t.entryDate,
      t.startedAt,
      t.id,
    ),
    check(
      'learning_times_type_fields',
      sql`(${t.type} = 'stopwatch' AND ${t.startedAt} IS NOT NULL AND ${t.endedAt} IS NOT NULL) OR (${t.type} = 'manual' AND ${t.entryDate} IS NOT NULL)`,
    ),
    check(
      'learning_times_interval',
      sql`${t.endedAt} IS NULL OR ${t.startedAt} IS NULL OR ${t.endedAt} >= ${t.startedAt}`,
    ),
    check(
      'learning_times_minutes',
      sql`${t.minutes} BETWEEN 1 AND 5256000 AND typeof(${t.minutes}) = 'integer'`,
    ),
    check('learning_times_version', sql`${t.version} >= 1`),
  ],
);
