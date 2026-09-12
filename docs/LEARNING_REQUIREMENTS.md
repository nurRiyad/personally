# Learning Management Requirements

## 1. Purpose

Learning Management helps a user plan and complete larger learning outcomes through measurable, weighted tasks and recorded learning time.

The first implementation follows this order:

1. Finalize product requirements.
2. Build the frontend experience with local/in-memory prototype state.
3. Implement the backend and replace the prototype state with API persistence.

The initial release is single-user and private. It does not include sharing, reminders, recurring tasks, tags, resources, attachments, or subtasks.

## 2. Core concepts

### Epic

An Epic is a larger learning objective, for example “Complete the AWS Solutions Architect course.” It contains at least one task and has a mandatory target duration stored in minutes.

Epic fields:

- Name
- Description
- Target completion date
- Target time in minutes
- Status
- Ordered tasks
- Actual tracked time, calculated from task time
- Optional comment
- Created and updated timestamps
- Completed timestamp when applicable

### Task

A Task is a smaller unit of work inside one Epic, for example “Complete the S3 module.”

Task fields:

- Name
- Description
- Status
- Target time in minutes, greater than zero
- Weight from 1 through 5, defaulting to 1
- Sort order within the Epic
- Actual tracked time
- Optional completion note
- Optional comment
- Created and updated timestamps
- Completed timestamp when applicable

### Time session

A time session is a saved interval of work on a task. A task may have multiple sessions. Session duration is stored in whole minutes.

Timer sessions are created or updated when the user pauses, stops, or completes work. Starting a timer does not immediately persist a session.

## 3. Status rules

### Task statuses

- `Todo`: task has not been started.
- `In progress`: task is actively being worked on or has been started but is not complete.
- `Done`: user has completed the task.
- `Blocked`: task cannot currently be continued; this prevents the Epic from completing.
- `Cancelled`: task was intentionally abandoned or is no longer needed; it does not prevent the Epic from completing.

Starting a timer automatically changes `Todo` to `In progress`. Users may manually change status where appropriate. A `Done` task cannot start a timer. A completed task cannot be reopened according to the current decision; reopening an Epic is done by adding a new `Todo` or `In progress` task.

### Epic statuses

- `Todo`: no task is in progress and the Epic has not been completed.
- `In progress`: at least one task is `In progress`.
- `Done`: the Epic has at least one task, every task is either `Done` or `Cancelled`, and at least one task is `Done`.

An Epic with no tasks cannot be `Done`. An Epic containing any `Blocked` task cannot be `Done`. Adding a new `Todo` or `In progress` task to a completed Epic reopens it automatically. Epic status is derived from task state and should not be independently editable.

## 4. Progress and time calculations

### Weighted task progress

Epic progress is based on task weight, not task count:

`completed points / eligible points × 100`

Where:

- Completed points = weights of tasks with status `Done`.
- Eligible points = weights of all tasks except `Cancelled` tasks.
- `Blocked` tasks remain in eligible points and therefore reduce progress.

If all tasks are cancelled, progress is 0% because the Epic has no completed task. Progress is capped at 100%.

Changing a task’s weight recalculates Epic progress immediately, including for historical progress views.

### Time totals

- Task actual time = sum of its saved time sessions plus any manually entered actual time.
- Epic actual time = sum of actual time across its tasks.
- Epic target time is entered directly by the user.
- Task target time is entered directly by the user.
- All durations are stored and displayed as whole minutes, with friendly hours/minutes formatting where useful.

From target and actual time, the UI may calculate:

- Difference = actual time − target time.
- Percentage used = actual time ÷ target time × 100.
- Average session duration = actual time ÷ number of sessions.

Negative differences indicate time remaining; positive differences indicate time over target. The UI should label these clearly rather than relying only on color.

## 5. Timer behavior

Only one task timer may run at a time in the current browser session. The timer is primarily frontend state.

### Starting

- The user opens a task and selects Start.
- The task changes to `In progress` if it was `Todo`.
- The frontend records the start timestamp locally.
- No backend time session is saved at start.

### Pausing or stopping

- The frontend calculates elapsed time from timestamps.
- The elapsed duration is rounded or truncated to whole minutes according to one consistent implementation rule.
- The saved duration is sent to persistence when the user pauses or stops.
- The local running timer is cleared.
- The user may start another session later.

### Completing

- The user may stop the timer and mark the task `Done`, or mark it done after manually entering actual time.
- Any currently displayed elapsed timer duration is saved before completion.
- The task completion timestamp is saved.
- An optional completion note and optional comment may be saved.

### Manual time

- Users may enter actual time manually in whole minutes when there is no timer session.
- Manual time is part of the task’s actual total and is not represented as a separate time session.
- Users may edit or delete the manually entered value.
- Manual time cannot be negative.

### Unsaved timer limitation

The active timer is not required to survive refresh, browser close, navigation after state loss, or device switching. Saved actual time survives because it is persisted when paused, stopped, or completed. The frontend should make this boundary understandable to the user.

## 6. Notes and comments

For the MVP, each Epic and task has at most one optional comment. Each task also has one optional completion note.

- Comment: general user-written context about the Epic or task.
- Completion note: reflection or result recorded when completing a task.

Both are private to the user. They can be edited and removed. If a future release needs discussion history, comments can be migrated to a separate one-to-many table.

## 7. Frontend requirements

### `/learning`

The Learning overview should provide:

- Create Epic action.
- Epic cards or rows showing name, status, target date, target time, actual time, and weighted progress.
- Overall learning summary where useful.
- A visible active timer indicator when a task is running.
- Search/filtering can be deferred unless already supported by the application shell.

### `/learning/epics/[id]`

The Epic detail page should provide:

- Epic name and description.
- Edit and delete actions.
- Target completion date.
- Target time, actual time, difference, and percentage used.
- Weighted progress visualization.
- Ordered task list.
- Add task action.
- Reorder tasks action.
- Epic comment.
- Clear indication of blocked, cancelled, and completed tasks.

### `/learning/epics/[id]/tasks/[taskId]`

The task detail page should provide:

- Task name and description.
- Status and weight controls.
- Target and actual time.
- Difference, percentage used, session count, and average session duration.
- Large timer display with Start, Pause, Stop, and Complete actions.
- Saved time information and manual time entry.
- Completion note and task comment.
- Edit and delete actions where allowed.

The UI should use existing shadcn/ui primitives where suitable, React Hook Form for forms, and shared Zod validation schemas once backend contracts exist.

## 8. Frontend prototype state

Before backend implementation, the frontend may use a local repository/state adapter with the same interfaces intended for the API. It should support:

- Creating, editing, deleting, and reopening Epics.
- Creating, editing, deleting, reordering, and status-updating tasks.
- Starting, pausing, stopping, and completing timers.
- Multiple saved time sessions.
- Manual time entry, editing, and deletion.
- Automatic Epic status and progress calculation.

The UI should not couple components directly to a temporary storage format. This keeps the later API migration focused on replacing the data adapter.

## 9. Backend requirements

The backend will follow the project architecture:

`Route → Controller → Service → Repository → Database`

Likely persistence entities:

- `epics`
- `tasks`
- `task_time_sessions`

Comments and completion notes can initially be columns on `epics` and `tasks`, because the MVP allows only one of each relevant text value. Database constraints and service validation must enforce:

- Epic target time is positive.
- Task target time is positive.
- Task weight is an integer from 1 to 5.
- A task belongs to an existing Epic.
- A time session duration is a non-negative whole number of minutes.
- A completed task cannot start a new timer.
- An Epic cannot be marked done while it has no completed task or any blocked task.

The API should expose resource operations for Epics, tasks, task ordering, task completion/status changes, time-session persistence, and manual actual-time updates. Derived status, totals, and progress should be calculated consistently in the service/domain layer and returned in response objects.

## 10. Out of scope for the first version

- Multi-user collaboration or sharing.
- Public visibility.
- Multiple comments or comment history.
- Recurring tasks.
- Reminders and notifications.
- Tags, categories, difficulty, or resource links.
- Subtasks.
- Attachments.
- Cross-device active timer synchronization.
- Persisting an active, not-yet-paused timer.
- Calendar scheduling.

## 11. Acceptance criteria

The Learning MVP is ready for frontend/backend integration when:

1. A user can create an Epic with a name, description, target minutes, and target date.
2. An Epic cannot complete without at least one completed task.
3. A user can create and reorder tasks with descriptions, target minutes, status, and weight.
4. A user can run multiple timer sessions over the life of a task.
5. Pausing or stopping saves elapsed time; starting alone does not.
6. A user can manually add, edit, or remove actual task time.
7. Completing a task stores its completion state, time, optional note, and optional comment.
8. Task and Epic actual time totals are correct.
9. Epic weighted progress uses task weights and excludes cancelled tasks from eligible points.
10. Blocked tasks prevent Epic completion, while cancelled tasks do not.
11. Adding a new active or todo task reopens a completed Epic.
12. The three required views—Learning overview, Epic detail, and task detail—support the complete MVP workflow.
