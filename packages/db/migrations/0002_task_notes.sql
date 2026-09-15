-- Consolidate the legacy completion note into the task's single notes field.
UPDATE learning_tasks
SET comment = COALESCE(comment, completion_note)
WHERE completion_note IS NOT NULL;
--> statement-breakpoint
ALTER TABLE learning_tasks DROP COLUMN completion_note;
