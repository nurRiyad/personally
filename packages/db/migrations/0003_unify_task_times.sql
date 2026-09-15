CREATE TABLE `learning_task_times` (
  `id` text PRIMARY KEY NOT NULL,
  `task_id` text NOT NULL,
  `type` text NOT NULL,
  `started_at` integer,
  `ended_at` integer,
  `entry_date` text,
  `minutes` integer NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `version` integer DEFAULT 1 NOT NULL,
  FOREIGN KEY (`task_id`) REFERENCES `learning_tasks`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT "learning_times_type_fields" CHECK ((`type` = 'stopwatch' AND `started_at` IS NOT NULL AND `ended_at` IS NOT NULL) OR (`type` = 'manual' AND `entry_date` IS NOT NULL)),
  CONSTRAINT "learning_times_interval" CHECK (`ended_at` IS NULL OR `started_at` IS NULL OR `ended_at` >= `started_at`),
  CONSTRAINT "learning_times_minutes" CHECK (`minutes` BETWEEN 1 AND 5256000 AND typeof(`minutes`) = 'integer'),
  CONSTRAINT "learning_times_version" CHECK (`version` >= 1)
);
--> statement-breakpoint
INSERT INTO `learning_task_times` (`id`, `task_id`, `type`, `started_at`, `ended_at`, `entry_date`, `minutes`, `created_at`, `updated_at`, `version`)
SELECT `id`, `task_id`, 'stopwatch', `started_at`, `ended_at`, date(`started_at` / 1000, 'unixepoch'), `duration_minutes`, `created_at`, `created_at`, 1
FROM `learning_task_time_sessions`;
--> statement-breakpoint
INSERT INTO `learning_task_times` (`id`, `task_id`, `type`, `entry_date`, `minutes`, `created_at`, `updated_at`, `version`)
SELECT `id`, `task_id`, 'manual', `entry_date`, `minutes`, `created_at`, `updated_at`, `version`
FROM `learning_task_manual_entries`;
--> statement-breakpoint
CREATE INDEX `learning_times_task_date` ON `learning_task_times` (`task_id`, `entry_date`, `started_at`, `id`);
--> statement-breakpoint
DROP TABLE `learning_task_time_sessions`;
--> statement-breakpoint
DROP TABLE `learning_task_manual_entries`;
