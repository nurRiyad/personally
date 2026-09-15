import { and, eq, sql, type SQL } from 'drizzle-orm';
import {
  createDb,
  learningEpics as epics,
  learningTasks as tasks,
  learningTaskTimes as times,
} from '@personally/db';
import type { EpicQuery, TaskQuery, PageQuery } from '@personally/validation';
import { LearningConflictError } from '../utils/errors';

export type EpicRow = typeof epics.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type TimeRow = typeof times.$inferSelect;
export type EpicAggregate = EpicRow & {
  status: 'Todo' | 'In progress' | 'Done';
  actualMinutes: number;
  completedPoints: number;
  eligiblePoints: number;
  taskCount: number;
  progress: number;
};
export type TaskAggregate = TaskRow & {
  epicName: string;
  timerMinutes: number;
  manualMinutes: number;
  sessions: number;
};
export type Change =
  | { kind: 'epic'; values: Partial<EpicRow> }
  | { kind: 'deleteEpic' }
  | { kind: 'createTask'; values: typeof tasks.$inferInsert }
  | { kind: 'task'; id: string; values: Partial<TaskRow> }
  | { kind: 'deleteTask'; id: string }
  | { kind: 'time'; values: TimeRow }
  | { kind: 'editTime'; id: string; values: Partial<TimeRow> }
  | { kind: 'deleteTime'; id: string };
export interface LearningRepository {
  epic(userId: string, id: string): Promise<EpicAggregate | undefined>;
  task(
    userId: string,
    epicId: string,
    id: string,
  ): Promise<TaskAggregate | undefined>;
  listEpics(
    userId: string,
    query: EpicQuery,
  ): Promise<{ rows: EpicAggregate[]; total: number }>;
  listTasks(
    userId: string,
    epicId: string,
    query: TaskQuery,
  ): Promise<{ rows: TaskAggregate[]; total: number }>;
  summary(
    userId: string,
  ): Promise<{ total: number; completed: number; inProgress: number }>;
  createEpic(values: typeof epics.$inferInsert): Promise<void>;
  mutate(epic: EpicRow, changes: Change[]): Promise<void>;
  taskIds(epicId: string): Promise<string[]>;
  nextTaskOrder(epicId: string): Promise<number>;
  time(taskId: string, id: string): Promise<TimeRow | undefined>;
  times(
    taskId: string,
    query: PageQuery,
  ): Promise<{ rows: TimeRow[]; total: number }>;
}
// Pre-aggregate each time source independently: joining the raw sources multiplies totals.
const taskCTE = (userId: string) => sql`WITH owned_tasks AS (
 SELECT t.* FROM learning_tasks t JOIN learning_epics e ON e.id=t.epic_id WHERE e.user_id=${userId}
), timer AS (
 SELECT task_id, SUM(minutes) minutes, COUNT(*) count FROM learning_task_times WHERE type='stopwatch' AND task_id IN (SELECT id FROM owned_tasks) GROUP BY task_id
), manual AS (
 SELECT task_id, SUM(minutes) minutes FROM learning_task_times WHERE type='manual' AND task_id IN (SELECT id FROM owned_tasks) GROUP BY task_id
), task_data AS (
 SELECT t.id, t.epic_id AS epicId, e.name AS epicName, t.name, t.description, t.status,
 t.target_minutes AS targetMinutes, t.weight, t.sort_order AS sortOrder,
 t.comment, t.completed_at AS completedAt, t.created_at AS createdAt, t.updated_at AS updatedAt, t.version,
 COALESCE(timer.minutes,0) AS timerMinutes, COALESCE(manual.minutes,0) AS manualMinutes,
 COALESCE(timer.count,0) AS sessions
 FROM owned_tasks t JOIN learning_epics e ON e.id = t.epic_id
 LEFT JOIN timer ON timer.task_id=t.id LEFT JOIN manual ON manual.task_id=t.id
)`;
const epicCTE = (userId: string) => sql`${taskCTE(userId)}, epic_data AS (
 SELECT e.id, e.user_id AS userId, e.name, e.description, e.target_date AS targetDate,
 e.target_minutes AS targetMinutes, e.comment, e.completed_at AS completedAt,
 e.created_at AS createdAt, e.updated_at AS updatedAt, e.version,
 COUNT(t.id) AS taskCount,
 COALESCE(SUM(t.timerMinutes + t.manualMinutes),0) AS actualMinutes,
 COALESCE(SUM(CASE WHEN t.status='Done' THEN t.weight ELSE 0 END),0) AS completedPoints,
 COALESCE(SUM(CASE WHEN t.status!='Cancelled' THEN t.weight ELSE 0 END),0) AS eligiblePoints,
 CASE WHEN SUM(CASE WHEN t.status='In progress' THEN 1 ELSE 0 END)>0 THEN 'In progress'
 WHEN SUM(CASE WHEN t.status='Done' THEN 1 ELSE 0 END)>0 AND SUM(CASE WHEN t.status NOT IN ('Done','Cancelled') THEN 1 ELSE 0 END)=0 THEN 'Done'
 ELSE 'Todo' END AS status
 FROM learning_epics e LEFT JOIN task_data t ON t.epicId=e.id WHERE e.user_id=${userId} GROUP BY e.id
), epic_summary AS (SELECT *, CASE WHEN eligiblePoints=0 THEN 0 ELSE ROUND(100.0 * completedPoints / eligiblePoints) END AS progress FROM epic_data)`;

export class D1LearningRepository implements LearningRepository {
  constructor(private readonly db: ReturnType<typeof createDb>) {}
  async epic(userId: string, id: string) {
    return (
      await this.db.all<EpicAggregate>(
        sql`${epicCTE(userId)} SELECT * FROM epic_summary WHERE userId=${userId} AND id=${id}`,
      )
    )[0];
  }
  async task(userId: string, epicId: string, id: string) {
    return (
      await this.db.all<TaskAggregate>(
        sql`${taskCTE(userId)} SELECT * FROM task_data WHERE id=${id} AND epicId=${epicId} AND EXISTS (SELECT 1 FROM learning_epics WHERE id=${epicId} AND user_id=${userId})`,
      )
    )[0];
  }
  async listEpics(userId: string, q: EpicQuery) {
    const cutoff = Date.now() - 30 * 86400000;
    const where = sql`userId=${userId} AND (${q.status}='All' OR status=${q.status}) AND (${q.created}='all' OR (${q.created}='recent30' AND createdAt>=${cutoff}) OR (${q.created}='older30' AND createdAt<${cutoff}))`;
    const order = {
      newest: sql`createdAt DESC`,
      oldest: sql`createdAt ASC`,
      name: sql`name COLLATE NOCASE ASC`,
      progress: sql`progress DESC`,
    }[q.sort];
    const [rows, counts] = await Promise.all([
      this.db.all<EpicAggregate>(
        sql`${epicCTE(userId)} SELECT * FROM epic_summary WHERE ${where} ORDER BY ${order}, id LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
      ),
      this.db.all<{ total: number }>(
        sql`${epicCTE(userId)} SELECT COUNT(*) total FROM epic_summary WHERE ${where}`,
      ),
    ]);
    return { rows, total: counts[0].total };
  }
  async listTasks(userId: string, epicId: string, q: TaskQuery) {
    const where = sql`epicId=${epicId} AND (${q.status}='All' OR status=${q.status}) AND EXISTS (SELECT 1 FROM learning_epics WHERE id=${epicId} AND user_id=${userId})`;
    const order = {
      'weight-desc': sql`weight DESC`,
      'weight-asc': sql`weight ASC`,
      name: sql`name COLLATE NOCASE ASC`,
      manual: sql`sortOrder ASC`,
    }[q.sort];
    const [rows, counts] = await Promise.all([
      this.db.all<TaskAggregate>(
        sql`${taskCTE(userId)} SELECT * FROM task_data WHERE ${where} ORDER BY ${order}, id LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
      ),
      this.db.all<{ total: number }>(
        sql`${taskCTE(userId)} SELECT COUNT(*) total FROM task_data WHERE ${where}`,
      ),
    ]);
    return { rows, total: counts[0].total };
  }
  async summary(userId: string) {
    return (
      await this.db.all<{
        total: number;
        completed: number;
        inProgress: number;
      }>(
        sql`${epicCTE(userId)} SELECT COUNT(*) total, COALESCE(SUM(status='Done'),0) completed, COALESCE(SUM(status='In progress'),0) inProgress FROM epic_summary WHERE userId=${userId}`,
      )
    )[0];
  }
  async createEpic(values: typeof epics.$inferInsert) {
    await this.db.insert(epics).values(values);
  }
  async nextTaskOrder(epicId: string) {
    return (
      await this.db
        .select({ value: sql<number>`coalesce(max(${tasks.sortOrder}),-1)+1` })
        .from(tasks)
        .where(eq(tasks.epicId, epicId))
    )[0].value;
  }
  async taskIds(epicId: string) {
    return (
      await this.db
        .select({ id: tasks.id })
        .from(tasks)
        .where(eq(tasks.epicId, epicId))
        .orderBy(tasks.sortOrder, tasks.id)
    ).map((t) => t.id);
  }
  async time(taskId: string, id: string) {
    return this.db
      .select()
      .from(times)
      .where(and(eq(times.taskId, taskId), eq(times.id, id)))
      .get();
  }
  async times(taskId: string, q: PageQuery) {
    const [rows, count] = await this.db.batch([
      this.db
        .select()
        .from(times)
        .where(eq(times.taskId, taskId))
        .orderBy(
          sql`coalesce(${times.startedAt}, unixepoch(${times.entryDate})) DESC`,
          times.id,
        )
        .limit(q.pageSize)
        .offset((q.page - 1) * q.pageSize),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(times)
        .where(eq(times.taskId, taskId)),
    ]);
    return { rows, total: count[0].total };
  }
  async mutate(epic: EpicRow, changes: Change[]) {
    const now = Date.now();
    // The epic version is a lock for this aggregate. A failed CHECK aborts the
    // entire D1 batch, including time inserts and completion metadata updates.
    const guard = this.db
      .update(epics)
      .set({
        version: sql`CASE WHEN ${epics.version}=${epic.version} THEN ${epics.version}+1 ELSE 0 END`,
        updatedAt: now,
      })
      .where(and(eq(epics.id, epic.id), eq(epics.userId, epic.userId)));
    const operations = changes.map((change) => {
      switch (change.kind) {
        case 'epic':
          return this.db
            .update(epics)
            .set(change.values)
            .where(eq(epics.id, epic.id));
        case 'deleteEpic':
          return this.db.delete(epics).where(eq(epics.id, epic.id));
        case 'createTask':
          return this.db.insert(tasks).values(change.values);
        case 'task':
          return this.db
            .update(tasks)
            .set({
              ...change.values,
              updatedAt: now,
              version: sql`${tasks.version}+1`,
            })
            .where(and(eq(tasks.id, change.id), eq(tasks.epicId, epic.id)));
        case 'deleteTask':
          return this.db
            .delete(tasks)
            .where(and(eq(tasks.id, change.id), eq(tasks.epicId, epic.id)));
        case 'time':
          return this.db.insert(times).values(change.values);
        case 'editTime':
          return this.db
            .update(times)
            .set({
              ...change.values,
              updatedAt: now,
              version: sql`${times.version}+1`,
            })
            .where(eq(times.id, change.id));
        case 'deleteTime':
          return this.db.delete(times).where(eq(times.id, change.id));
      }
    });
    const complete: SQL = sql`EXISTS (SELECT 1 FROM learning_tasks WHERE epic_id=${epic.id} AND status='Done') AND NOT EXISTS (SELECT 1 FROM learning_tasks WHERE epic_id=${epic.id} AND status NOT IN ('Done','Cancelled'))`;
    try {
      await this.db.batch([
        guard,
        ...operations,
        this.db
          .update(epics)
          .set({
            completedAt: sql`CASE WHEN ${complete} THEN COALESCE(${epics.completedAt},${now}) ELSE NULL END`,
          })
          .where(eq(epics.id, epic.id)),
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? `${error.message} ${String(error.cause)}` : '';
      if (
        /CHECK constraint|UNIQUE constraint|FOREIGN KEY constraint/.test(
          message,
        )
      )
        throw new LearningConflictError();
      throw error;
    }
  }
}
