CREATE TABLE budget_months (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, month text NOT NULL, note text, created_at integer NOT NULL, updated_at integer NOT NULL, version integer NOT NULL DEFAULT 1, UNIQUE(user_id, month), CHECK(month GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'), CHECK(version >= 1));
--> statement-breakpoint
CREATE TABLE budget_income_sources (id text PRIMARY KEY NOT NULL, budget_month_id text NOT NULL REFERENCES budget_months(id) ON DELETE CASCADE, name text NOT NULL, planned_amount integer NOT NULL, is_recurring integer NOT NULL DEFAULT 0, position integer NOT NULL, created_at integer NOT NULL, updated_at integer NOT NULL, CHECK(planned_amount >= 0 AND typeof(planned_amount)='integer'), CHECK(position >= 0));
--> statement-breakpoint
CREATE TABLE budget_income_entries (id text PRIMARY KEY NOT NULL, income_source_id text NOT NULL REFERENCES budget_income_sources(id) ON DELETE CASCADE, amount integer NOT NULL, received_on text NOT NULL, note text, created_at integer NOT NULL, updated_at integer NOT NULL, CHECK(amount > 0 AND typeof(amount)='integer'));
--> statement-breakpoint
CREATE TABLE budget_groups (id text PRIMARY KEY NOT NULL, budget_month_id text NOT NULL REFERENCES budget_months(id) ON DELETE CASCADE, name text NOT NULL, position integer NOT NULL, created_at integer NOT NULL, updated_at integer NOT NULL, CHECK(position >= 0));
--> statement-breakpoint
CREATE TABLE budget_items (id text PRIMARY KEY NOT NULL, budget_month_id text NOT NULL REFERENCES budget_months(id) ON DELETE CASCADE, group_id text NOT NULL REFERENCES budget_groups(id) ON DELETE RESTRICT, name text NOT NULL, planned_amount integer NOT NULL, is_recurring integer NOT NULL DEFAULT 0, note text, position integer NOT NULL, created_at integer NOT NULL, updated_at integer NOT NULL, CHECK(planned_amount >= 0 AND typeof(planned_amount)='integer'), CHECK(position >= 0));
--> statement-breakpoint
CREATE TABLE budget_expenses (id text PRIMARY KEY NOT NULL, budget_item_id text NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE, amount integer NOT NULL, spent_on text NOT NULL, note text, created_at integer NOT NULL, updated_at integer NOT NULL, CHECK(amount > 0 AND typeof(amount)='integer'));
--> statement-breakpoint
CREATE UNIQUE INDEX budget_income_source_name ON budget_income_sources(budget_month_id, name COLLATE NOCASE);
--> statement-breakpoint
CREATE UNIQUE INDEX budget_group_name ON budget_groups(budget_month_id, name COLLATE NOCASE);
--> statement-breakpoint
CREATE UNIQUE INDEX budget_item_name ON budget_items(budget_month_id, name COLLATE NOCASE);
--> statement-breakpoint
CREATE INDEX budget_income_source_order ON budget_income_sources(budget_month_id, position);
--> statement-breakpoint
CREATE INDEX budget_income_entry_order ON budget_income_entries(income_source_id, received_on DESC, created_at DESC);
--> statement-breakpoint
CREATE INDEX budget_group_order ON budget_groups(budget_month_id, position);
--> statement-breakpoint
CREATE INDEX budget_item_order ON budget_items(budget_month_id, group_id, position);
--> statement-breakpoint
CREATE INDEX budget_expense_order ON budget_expenses(budget_item_id, spent_on DESC, created_at DESC);
