import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { assetTypes } from './asset-types';

export const assets = sqliteTable(
  'assets',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assetTypeId: text('asset_type_id')
      .notNull()
      .references(() => assetTypes.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    detail: text('detail').notNull().default(''),
    isLiquid: integer('is_liquid', { mode: 'boolean' }).notNull().default(false),
    isReceivable: integer('is_receivable', { mode: 'boolean' }).notNull().default(false),
    openedOn: text('opened_on').notNull(),
    archivedAt: integer('archived_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [index('asset_owner_type_active').on(t.userId, t.assetTypeId, t.archivedAt, t.name)],
);
