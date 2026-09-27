import {
  index,
  sqliteTable,
  text,
  uniqueIndex,
  integer,
} from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const assetTypes = sqliteTable(
  'asset_types',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    uniqueIndex('asset_type_owner_name').on(t.userId, t.normalizedName),
    index('asset_type_owner_name_order').on(t.userId, t.name),
  ],
);
