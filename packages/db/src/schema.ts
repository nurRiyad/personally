import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const foundation = sqliteTable('foundation', {
  id: integer('id').primaryKey(),
  status: text('status').notNull(),
});
