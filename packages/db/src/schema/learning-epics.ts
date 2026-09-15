import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  index,
  check,
} from 'drizzle-orm/sqlite-core';
import { users } from './users';
export const learningEpics = sqliteTable(
  'learning_epics',
  {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    targetDate: text('target_date').notNull(),
    targetMinutes: integer('target_minutes').notNull(),
    comment: text('comment'),
    completedAt: integer('completed_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    index('learning_epics_owner_created').on(t.userId, t.createdAt, t.id),
    check(
      'learning_epics_target',
      sql`${t.targetMinutes} > 0 AND typeof(${t.targetMinutes}) = 'integer'`,
    ),
    check('learning_epics_version', sql`${t.version} >= 1`),
  ],
);
