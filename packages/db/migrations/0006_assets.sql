CREATE TABLE asset_types (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE assets (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_type_id TEXT NOT NULL REFERENCES asset_types(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  is_liquid INTEGER NOT NULL DEFAULT 0 CHECK(is_liquid IN (0,1)),
  is_receivable INTEGER NOT NULL DEFAULT 0 CHECK(is_receivable IN (0,1)),
  opened_on TEXT NOT NULL,
  archived_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK(is_liquid=0 OR is_receivable=0),
  CHECK(length(name) BETWEEN 1 AND 120),
  CHECK(length(detail) <= 200)
);
--> statement-breakpoint
CREATE TABLE asset_activities (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('Opening','Income','Growth','Transfer','Contribution','Lending','Repayment','External use')),
  amount INTEGER NOT NULL CHECK(amount > 0 AND amount <= 999999999 AND typeof(amount)='integer'),
  activity_date TEXT NOT NULL CHECK(length(activity_date)=10 AND activity_date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  source_asset_id TEXT REFERENCES assets(id) ON DELETE RESTRICT,
  destination_asset_id TEXT REFERENCES assets(id) ON DELETE RESTRICT,
  source_endpoint TEXT CHECK(source_endpoint IN ('outside','growth_return')),
  destination_endpoint TEXT CHECK(destination_endpoint IN ('outside','personal_use')),
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK((source_asset_id IS NOT NULL) != (source_endpoint IS NOT NULL)),
  CHECK((destination_asset_id IS NOT NULL) != (destination_endpoint IS NOT NULL)),
  CHECK(source_asset_id IS NULL OR source_asset_id != destination_asset_id),
  CHECK((kind IN ('Opening','Income') AND source_endpoint='outside' AND destination_asset_id IS NOT NULL AND destination_endpoint IS NULL)
     OR (kind='Growth' AND source_endpoint='growth_return' AND destination_asset_id IS NOT NULL AND destination_endpoint IS NULL)
     OR (kind IN ('Transfer','Contribution','Lending','Repayment') AND source_asset_id IS NOT NULL AND destination_asset_id IS NOT NULL AND source_endpoint IS NULL AND destination_endpoint IS NULL)
     OR (kind='External use' AND source_asset_id IS NOT NULL AND source_endpoint IS NULL AND destination_endpoint='personal_use' AND destination_asset_id IS NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX asset_type_owner_name ON asset_types(user_id, normalized_name);
--> statement-breakpoint
CREATE INDEX asset_type_owner_name_order ON asset_types(user_id, name);
--> statement-breakpoint
CREATE INDEX asset_owner_type_active ON assets(user_id, asset_type_id, archived_at, name COLLATE NOCASE);
--> statement-breakpoint
CREATE INDEX asset_activity_owner_date ON asset_activities(user_id, activity_date DESC, created_at DESC, id DESC);
--> statement-breakpoint
CREATE INDEX asset_activity_source_date ON asset_activities(source_asset_id, activity_date, created_at, id);
--> statement-breakpoint
CREATE INDEX asset_activity_destination_date ON asset_activities(destination_asset_id, activity_date, created_at, id);
--> statement-breakpoint
CREATE TRIGGER asset_activity_nonnegative_insert AFTER INSERT ON asset_activities
BEGIN
  SELECT (CASE WHEN EXISTS (
    SELECT 1 FROM assets a WHERE a.user_id=NEW.user_id AND EXISTS (
      SELECT 1 FROM (
        SELECT asset_id, SUM(delta) OVER (PARTITION BY asset_id ORDER BY activity_date, created_at, activity_id ROWS UNBOUNDED PRECEDING) AS balance
        FROM (
          SELECT source_asset_id AS asset_id, activity_date, created_at, id AS activity_id, -amount AS delta
          FROM asset_activities WHERE user_id=NEW.user_id AND source_asset_id IS NOT NULL
          UNION ALL
          SELECT destination_asset_id, activity_date, created_at, id, amount
          FROM asset_activities WHERE user_id=NEW.user_id AND destination_asset_id IS NOT NULL
        ) postings WHERE asset_id=a.id
      ) running WHERE balance < 0
    )
  ) THEN RAISE(ABORT, 'ASSET_NEGATIVE_BALANCE') END);
END;
--> statement-breakpoint
CREATE TRIGGER asset_activity_nonnegative_update AFTER UPDATE ON asset_activities
BEGIN
  SELECT (CASE WHEN EXISTS (
    SELECT 1 FROM assets a WHERE a.user_id=NEW.user_id AND EXISTS (
      SELECT 1 FROM (
        SELECT asset_id, SUM(delta) OVER (PARTITION BY asset_id ORDER BY activity_date, created_at, activity_id ROWS UNBOUNDED PRECEDING) AS balance
        FROM (
          SELECT source_asset_id AS asset_id, activity_date, created_at, id AS activity_id, -amount AS delta
          FROM asset_activities WHERE user_id=NEW.user_id AND id!=NEW.id AND source_asset_id IS NOT NULL
          UNION ALL
          SELECT destination_asset_id, activity_date, created_at, id, amount
          FROM asset_activities WHERE user_id=NEW.user_id AND id!=NEW.id AND destination_asset_id IS NOT NULL
          UNION ALL SELECT NEW.source_asset_id, NEW.activity_date, NEW.created_at, NEW.id, -NEW.amount WHERE NEW.source_asset_id IS NOT NULL
          UNION ALL SELECT NEW.destination_asset_id, NEW.activity_date, NEW.created_at, NEW.id, NEW.amount WHERE NEW.destination_asset_id IS NOT NULL
        ) postings WHERE asset_id=a.id
      ) running WHERE balance < 0
    )
  ) THEN RAISE(ABORT, 'ASSET_NEGATIVE_BALANCE') END);
END;
--> statement-breakpoint
CREATE TRIGGER asset_activity_nonnegative_delete BEFORE DELETE ON asset_activities
BEGIN
  SELECT (CASE WHEN EXISTS (
    SELECT 1 FROM assets a WHERE a.user_id=OLD.user_id AND EXISTS (
      SELECT 1 FROM (
        SELECT asset_id, SUM(delta) OVER (PARTITION BY asset_id ORDER BY activity_date, created_at, activity_id ROWS UNBOUNDED PRECEDING) AS balance
        FROM (
          SELECT source_asset_id AS asset_id, activity_date, created_at, id AS activity_id, -amount AS delta
          FROM asset_activities WHERE user_id=OLD.user_id AND id!=OLD.id AND source_asset_id IS NOT NULL
          UNION ALL
          SELECT destination_asset_id, activity_date, created_at, id, amount
          FROM asset_activities WHERE user_id=OLD.user_id AND id!=OLD.id AND destination_asset_id IS NOT NULL
        ) postings WHERE asset_id=a.id
      ) running WHERE balance < 0
    )
  ) THEN RAISE(ABORT, 'ASSET_NEGATIVE_BALANCE') END);
END;
