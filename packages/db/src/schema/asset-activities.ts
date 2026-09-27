import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { assets } from './assets';

export const assetActivities = sqliteTable(
  'asset_activities',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    amount: integer('amount').notNull(),
    activityDate: text('activity_date').notNull(),
    sourceAssetId: text('source_asset_id').references(() => assets.id, {
      onDelete: 'restrict',
    }),
    destinationAssetId: text('destination_asset_id').references(() => assets.id, { onDelete: 'restrict' }),
    sourceEndpoint: text('source_endpoint'),
    destinationEndpoint: text('destination_endpoint'),
    note: text('note'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    index('asset_activity_owner_date').on(t.userId, t.activityDate, t.createdAt, t.id),
    index('asset_activity_source_date').on(t.sourceAssetId, t.activityDate, t.createdAt, t.id),
    index('asset_activity_destination_date').on(t.destinationAssetId, t.activityDate, t.createdAt, t.id),
  ],
);
