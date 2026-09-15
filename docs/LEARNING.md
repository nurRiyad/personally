# Learning: current system

Status: implemented locally. This document is the source of truth for the current Learning feature; it replaces the former requirements and implementation-plan documents.

## Scope

Learning is a private, account-scoped workflow for planning larger learning goals as Epics, breaking them into weighted Tasks, and recording time. The current implementation does not include sharing, reminders, recurring tasks, tags, resources, attachments, subtasks, or cross-device active timers.

## Web application

The feature is mounted at:

- `/learning` — summary and paginated Epic list.
- `/learning/epics/[id]` — Epic details, task list, filtering, sorting, pagination, editing, deletion, and ordering.
- `/learning/epics/[id]/tasks/[taskId]` — task details, status, timer, completion, manual time, notes, editing, and deletion.

The learning layout provides the authenticated client context. `learning-provider.tsx` owns shared query/mutation behavior and the active timer workflow; `learning-display.tsx`, `learning-forms.tsx`, and `learning-ui.tsx` contain page composition, forms, and presentational controls. API responses are parsed with shared Zod schemas in `packages/validation`.

Forms use React Hook Form and shared validation. The UI uses the existing shadcn-style primitives, preserves form values when a request fails, disables duplicate submissions, and refreshes affected Epic, Task, list, and summary queries after successful mutations.

The active timer is browser state. It uses timestamps to calculate elapsed minutes and survives navigation within the learning layout, but it is not persisted until a session is saved or completion is submitted. Only one timer can run at a time. A sub-minute interval is not saved.

## API architecture

The API follows:

`Route → Controller → Service → Repository → D1`

Learning routes are protected by the existing auth middleware and mounted under `/learning`. Dependency composition occurs in `apps/api/src/routes/index.ts`; the Worker entrypoint remains unchanged.

Relevant modules:

- `apps/api/src/routes/learning.routes.ts` — HTTP methods and paths.
- `apps/api/src/controllers/learning.controller.ts` — thin Hono adapters.
- `apps/api/src/services/learning.service.ts` — ownership checks, domain rules, calculations, idempotency, and version conflicts.
- `apps/api/src/repositories/learning.repository.ts` — D1/Drizzle persistence, aggregates, pagination, guarded writes, and cascades.
- `apps/api/tests/learning.integration.test.ts` — local Miniflare/D1 contract and concurrency coverage.

Responses use `{ data: ... }`; paginated responses also include `meta.page`, `meta.pageSize`, `meta.total`, and `meta.totalPages`. Invalid input returns 400, missing or foreign-owned resources return 404, stale versions and invalid domain transitions return 409, and unauthenticated requests return 401.

## Current endpoints

Let `E = /learning/epics/:epicId` and `T = E/tasks/:taskId`.

| Method           | Path                | Purpose                                                            |
| ---------------- | ------------------- | ------------------------------------------------------------------ |
| GET              | `/learning/summary` | Account-wide Epic totals.                                          |
| GET              | `/learning/epics`   | Filtered, sorted, paginated Epic summaries.                        |
| POST             | `/learning/epics`   | Create an Epic.                                                    |
| GET/PATCH/DELETE | `E`                 | Read, update, or version-checked delete an Epic.                   |
| GET              | `E/tasks`           | Filtered, sorted, paginated Tasks.                                 |
| POST             | `E/tasks`           | Create a Task at the end of the order.                             |
| PUT              | `E/task-order`      | Save a complete, version-checked Task order.                       |
| GET/PATCH/DELETE | `T`                 | Read, update, or version-checked delete a Task.                    |
| PATCH            | `T/status`          | Version-checked Task status change.                                |
| POST             | `T/complete`        | Atomically save optional elapsed time/comment and complete a Task. |
| GET/POST         | `T/times`           | List or create stopwatch/manual time records.                      |
| PATCH/DELETE     | `T/times/:timeId`   | Edit or delete a time record with Task and entry versions.         |

Time records use `type: "stopwatch"` or `type: "manual"`. Stopwatch requests contain a stable client-generated ID, timestamps, duration, and Task version. Manual requests contain a stable ID, `YYYY-MM-DD` date, minutes, and Task version.

## Data model

The database relationship is:

`users → learning_epics → learning_tasks → learning_task_times`

Tables are defined in `packages/db/src/schema/` and migrated through the committed SQL files in `packages/db/migrations/`:

- `learning_epics` stores name, description, target date/minutes, comment, timestamps, completion timestamp, and version.
- `learning_tasks` stores Epic ownership, name, description, status, target minutes, weight, sort order, comment, completion timestamp, timestamps, and version.
- `learning_task_times` stores stopwatch or manual records. Stopwatch rows contain start/end timestamps; manual rows contain a calendar date. Foreign keys cascade when a Task or Epic is deleted.

Persistence stores epoch milliseconds for timestamps. The API returns ISO timestamps. Calendar dates remain timezone-safe `YYYY-MM-DD` strings.

## Domain behavior

Task statuses are `Todo`, `In progress`, `Done`, `Blocked`, and `Cancelled`. Blocked and Cancelled Tasks cannot be completed directly. Done Tasks cannot receive a new timer session. Status changes and completion use optimistic version checks. The current UI/API also support moving a completed Task back to another status; its completion timestamp is cleared when it leaves Done.

Epic status is derived, never independently edited:

- `Done` requires at least one Done Task and every Task to be Done or Cancelled.
- `In progress` is used when any Task is In progress and the Epic is not Done.
- Otherwise the Epic is `Todo`.

Calculated values are not stored as writable aggregates:

- Task actual minutes = stopwatch minutes + manual minutes.
- Epic actual minutes = total Task actual minutes.
- Weighted progress = Done weight / non-Cancelled weight × 100; it is 0 when there are no eligible points.
- Difference = actual minutes − target minutes.
- Percentage used = actual minutes / target minutes × 100.
- Average session minutes uses stopwatch sessions only; manual time is excluded.

The service uses idempotent client IDs for time records and completion sessions. Replaying identical content returns the existing result; reusing an ID with different content returns a conflict. Aggregate writes use the Epic version as a guard so concurrent updates cannot silently overwrite one another.

## Validation and errors

Shared contracts live in `packages/validation/src/learning.ts`. They validate names, descriptions, comments, dates, positive whole-minute durations, status enums, weights from 1–10, pagination, strict request fields, and optimistic versions. The API never accepts ownership from request data; ownership comes from the authenticated user and the Epic/Task relationship.

## Verification

Run the standard checks from the repository root with Node 24 and pnpm:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The integration suite uses an isolated local D1 runtime, applies committed migrations, and covers CORS, ownership, validation, aggregates, pagination, time idempotency, completion, rollback, concurrency, ordering, and deletion cascades. Production D1 deployment is separate from local development and follows `docs/DEPLOYMENT.md`.
