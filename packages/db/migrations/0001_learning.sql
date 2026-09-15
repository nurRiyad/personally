CREATE TABLE `learning_epics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`target_date` text NOT NULL,
	`target_minutes` integer NOT NULL,
	`comment` text,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "learning_epics_target" CHECK("learning_epics"."target_minutes" > 0 AND typeof("learning_epics"."target_minutes") = 'integer'),
	CONSTRAINT "learning_epics_version" CHECK("learning_epics"."version" >= 1)
);
--> statement-breakpoint
CREATE INDEX `learning_epics_owner_created` ON `learning_epics` (`user_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `learning_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`epic_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'Todo' NOT NULL,
	`target_minutes` integer NOT NULL,
	`weight` integer DEFAULT 1 NOT NULL,
	`sort_order` integer NOT NULL,
	`completion_note` text,
	`comment` text,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`epic_id`) REFERENCES `learning_epics`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "learning_tasks_status_check" CHECK("learning_tasks"."status" IN ('Todo','In progress','Done','Blocked','Cancelled')),
	CONSTRAINT "learning_tasks_target" CHECK("learning_tasks"."target_minutes" > 0 AND typeof("learning_tasks"."target_minutes") = 'integer'),
	CONSTRAINT "learning_tasks_weight" CHECK("learning_tasks"."weight" BETWEEN 1 AND 10 AND typeof("learning_tasks"."weight") = 'integer'),
	CONSTRAINT "learning_tasks_order_check" CHECK("learning_tasks"."sort_order" >= 0 AND typeof("learning_tasks"."sort_order") = 'integer'),
	CONSTRAINT "learning_tasks_version" CHECK("learning_tasks"."version" >= 1)
);
--> statement-breakpoint
CREATE INDEX `learning_tasks_order` ON `learning_tasks` (`epic_id`,`sort_order`,`id`);--> statement-breakpoint
CREATE INDEX `learning_tasks_status` ON `learning_tasks` (`epic_id`,`status`);--> statement-breakpoint
CREATE TABLE `learning_task_time_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `learning_tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "learning_sessions_interval" CHECK("learning_task_time_sessions"."ended_at" >= "learning_task_time_sessions"."started_at"),
	CONSTRAINT "learning_sessions_minutes" CHECK("learning_task_time_sessions"."duration_minutes" > 0 AND typeof("learning_task_time_sessions"."duration_minutes") = 'integer')
);
--> statement-breakpoint
CREATE INDEX `learning_sessions_task_date` ON `learning_task_time_sessions` (`task_id`,`started_at`,`id`);--> statement-breakpoint
CREATE TABLE `learning_task_manual_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`entry_date` text NOT NULL,
	`minutes` integer NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `learning_tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "learning_manual_minutes" CHECK("learning_task_manual_entries"."minutes" BETWEEN 1 AND 1440 AND typeof("learning_task_manual_entries"."minutes") = 'integer'),
	CONSTRAINT "learning_manual_version" CHECK("learning_task_manual_entries"."version" >= 1)
);
--> statement-breakpoint
CREATE INDEX `learning_manual_task_date` ON `learning_task_manual_entries` (`task_id`,`entry_date`,`id`);