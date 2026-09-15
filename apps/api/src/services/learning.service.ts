import type { z } from 'zod';
import type {
  LearningEpicInput,
  LearningTaskInput,
  EpicQuery,
  TaskQuery,
  PageQuery,
  SessionInput,
  CompleteInput,
  epicPatchSchema,
  taskPatchSchema,
  statusInputSchema,
  createTimeSchema,
  patchTimeSchema,
  deleteTimeSchema,
  createManualSchema,
  patchManualSchema,
  deleteManualSchema,
} from '@personally/validation';
import type {
  LearningRepository,
  EpicAggregate,
  TaskAggregate,
  TimeRow,
  Change,
} from '../repositories/learning.repository';
type ManualRow = TimeRow;
import {
  AppError,
  LearningConflictError,
  NotFoundError,
} from '../utils/errors';

const iso = (value: number) => new Date(value).toISOString();
const timestamps = (row: {
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}) => ({
  createdAt: iso(row.createdAt),
  updatedAt: iso(row.updatedAt),
  completedAt: row.completedAt === null ? null : iso(row.completedAt),
});
export function epicDTO(row: EpicAggregate) {
  const { userId: _owner, ...data } = row;
  return {
    ...data,
    ...timestamps(row),
    differenceMinutes: row.actualMinutes - row.targetMinutes,
    percentageUsed: (row.actualMinutes / row.targetMinutes) * 100,
  };
}
export function taskDTO(row: TaskAggregate) {
  const actualMinutes = row.timerMinutes + row.manualMinutes;
  return {
    ...row,
    ...timestamps(row),
    actualMinutes,
    averageSessionMinutes: row.sessions
      ? Math.round(row.timerMinutes / row.sessions)
      : 0,
    differenceMinutes: actualMinutes - row.targetMinutes,
    percentageUsed: (actualMinutes / row.targetMinutes) * 100,
  };
}
const timeDTO = (r: TimeRow) =>
  r.type === 'stopwatch'
    ? {
        type: r.type,
        id: r.id,
        taskId: r.taskId,
        startedAt: iso(r.startedAt!),
        endedAt: iso(r.endedAt!),
        durationMinutes: r.minutes,
        version: r.version,
        createdAt: iso(r.createdAt),
        updatedAt: iso(r.updatedAt),
      }
    : {
        type: r.type,
        id: r.id,
        taskId: r.taskId,
        date: r.entryDate!,
        minutes: r.minutes,
        version: r.version,
        createdAt: iso(r.createdAt),
        updatedAt: iso(r.updatedAt),
      };
const page = <T>(data: T[], total: number, q: PageQuery) => ({
  data,
  meta: { ...q, total, totalPages: Math.ceil(total / q.pageSize) },
});
const checkVersion = (actual: number, expected: number) => {
  if (actual !== expected) throw new LearningConflictError();
};
export class LearningService {
  constructor(private readonly repo: LearningRepository) {}
  private async ownedEpic(user: string, id: string) {
    const row = await this.repo.epic(user, id);
    if (!row) throw new NotFoundError();
    return row;
  }
  private async ownedTask(user: string, epic: string, id: string) {
    const row = await this.repo.task(user, epic, id);
    if (!row) throw new NotFoundError();
    return row;
  }
  summary(user: string) {
    return this.repo.summary(user);
  }
  async listEpics(user: string, q: EpicQuery) {
    const r = await this.repo.listEpics(user, q);
    return page(r.rows.map(epicDTO), r.total, q);
  }
  async epic(user: string, id: string) {
    return epicDTO(await this.ownedEpic(user, id));
  }
  async createEpic(user: string, input: LearningEpicInput) {
    const id = crypto.randomUUID(),
      now = Date.now();
    await this.repo.createEpic({
      ...input,
      id,
      userId: user,
      createdAt: now,
      updatedAt: now,
    });
    return this.epic(user, id);
  }
  async patchEpic(
    user: string,
    id: string,
    input: z.infer<typeof epicPatchSchema>,
  ) {
    const epic = await this.ownedEpic(user, id);
    checkVersion(epic.version, input.version);
    const { version: _v, ...values } = input;
    await this.repo.mutate(epic, [{ kind: 'epic', values }]);
    return this.epic(user, id);
  }
  async deleteEpic(user: string, id: string, version: number) {
    const epic = await this.ownedEpic(user, id);
    checkVersion(epic.version, version);
    await this.repo.mutate(epic, [{ kind: 'deleteEpic' }]);
  }
  async listTasks(user: string, epic: string, q: TaskQuery) {
    await this.ownedEpic(user, epic);
    const r = await this.repo.listTasks(user, epic, q);
    return page(r.rows.map(taskDTO), r.total, q);
  }
  async task(user: string, epic: string, id: string) {
    return taskDTO(await this.ownedTask(user, epic, id));
  }
  async createTask(user: string, epicId: string, input: LearningTaskInput) {
    const epic = await this.ownedEpic(user, epicId);
    const id = crypto.randomUUID(),
      now = Date.now();
    await this.repo.mutate(epic, [
      {
        kind: 'createTask',
        values: {
          ...input,
          id,
          epicId,
          sortOrder: await this.repo.nextTaskOrder(epicId),
          createdAt: now,
          updatedAt: now,
        },
      },
    ]);
    return this.task(user, epicId, id);
  }
  async order(user: string, id: string, version: number, ids: string[]) {
    const epic = await this.ownedEpic(user, id);
    checkVersion(epic.version, version);
    const existing = await this.repo.taskIds(id);
    if (
      ids.length !== existing.length ||
      new Set(ids).size !== ids.length ||
      existing.some((t) => !ids.includes(t))
    )
      throw new AppError(
        'INVALID_ORDER',
        'Include every task exactly once.',
        400,
      );
    await this.repo.mutate(
      epic,
      ids.map((task, index) => ({
        kind: 'task',
        id: task,
        values: { sortOrder: index },
      })),
    );
    return this.epic(user, id);
  }
  async patchTask(
    user: string,
    epicId: string,
    id: string,
    input: z.infer<typeof taskPatchSchema>,
  ) {
    const epic = await this.ownedEpic(user, epicId),
      task = await this.ownedTask(user, epicId, id);
    checkVersion(task.version, input.version);
    const { version: _v, ...values } = input;
    await this.repo.mutate(epic, [{ kind: 'task', id, values }]);
    return this.task(user, epicId, id);
  }
  async status(
    user: string,
    epicId: string,
    id: string,
    input: z.infer<typeof statusInputSchema>,
  ) {
    const epic = await this.ownedEpic(user, epicId),
      task = await this.ownedTask(user, epicId, id);
    checkVersion(task.version, input.version);
    await this.repo.mutate(epic, [
      {
        kind: 'task',
        id,
        values: {
          status: input.status,
          completedAt:
            input.status === 'Done' ? (task.completedAt ?? Date.now()) : null,
        },
      },
    ]);
    return this.task(user, epicId, id);
  }
  async deleteTask(user: string, epicId: string, id: string, version: number) {
    const epic = await this.ownedEpic(user, epicId),
      task = await this.ownedTask(user, epicId, id);
    checkVersion(task.version, version);
    await this.repo.mutate(epic, [{ kind: 'deleteTask', id }]);
  }
  private validateSession(input: SessionInput) {
    if (Date.parse(input.endedAt) > Date.now() + 60000)
      throw new AppError(
        'INVALID_TIME',
        'A session cannot end in the future.',
        400,
      );
  }
  private sessionRow(taskId: string, input: SessionInput): TimeRow {
    return {
      ...input,
      type: 'stopwatch',
      taskId,
      startedAt: Date.parse(input.startedAt),
      endedAt: Date.parse(input.endedAt),
      entryDate: new Date(Date.parse(input.startedAt))
        .toISOString()
        .slice(0, 10),
      minutes: input.durationMinutes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    };
  }
  private sameSession(row: TimeRow, input: SessionInput) {
    if (
      row.startedAt !== Date.parse(input.startedAt) ||
      row.endedAt !== Date.parse(input.endedAt) ||
      row.minutes !== input.durationMinutes
    )
      throw new LearningConflictError(
        'This session ID has already been used for different time.',
      );
  }
  async saveSession(
    user: string,
    epicId: string,
    id: string,
    version: number,
    input: SessionInput,
  ) {
    const epic = await this.ownedEpic(user, epicId),
      task = await this.ownedTask(user, epicId, id);
    const previous = await this.repo.time(id, input.id);
    if (previous) {
      this.sameSession(previous, input);
      return this.task(user, epicId, id);
    }
    checkVersion(task.version, version);
    if (task.status !== 'In progress')
      throw new LearningConflictError(
        'Set this task to In progress before saving a timer session.',
      );
    this.validateSession(input);
    try {
      await this.repo.mutate(epic, [
        { kind: 'time', values: this.sessionRow(id, input) },
        { kind: 'task', id, values: {} },
      ]);
    } catch (error) {
      const saved = await this.repo.time(id, input.id);
      if (!saved) throw error;
      this.sameSession(saved, input);
    }
    return this.task(user, epicId, id);
  }
  async complete(
    user: string,
    epicId: string,
    id: string,
    input: CompleteInput,
  ) {
    const epic = await this.ownedEpic(user, epicId),
      task = await this.ownedTask(user, epicId, id);
    const previous = input.session
      ? await this.repo.time(id, input.session.id)
      : undefined;
    if (previous && input.session) this.sameSession(previous, input.session);
    if (task.status === 'Done') {
      if (input.session && !previous)
        throw new LearningConflictError(
          'Completed tasks cannot accept a new timer session.',
        );
      if (input.comment !== undefined && input.comment !== task.comment)
        throw new LearningConflictError(
          'Completion was already saved. Edit the notes separately.',
        );
      return taskDTO(task);
    }
    checkVersion(task.version, input.version);
    if (task.status === 'Blocked' || task.status === 'Cancelled')
      throw new LearningConflictError(
        'Change this task to Todo or In progress before completing it.',
      );
    const changes: Change[] = [];
    if (input.session && !previous) {
      this.validateSession(input.session);
      changes.push({
        kind: 'time',
        values: this.sessionRow(id, input.session),
      });
    }
    changes.push({
      kind: 'task',
      id,
      values: {
        status: 'Done',
        completedAt: Date.now(),
        ...(input.comment !== undefined ? { comment: input.comment } : {}),
      },
    });
    try {
      await this.repo.mutate(epic, changes);
    } catch (error) {
      const current = await this.ownedTask(user, epicId, id);
      const saved = input.session
        ? await this.repo.time(id, input.session.id)
        : undefined;
      if (current.status !== 'Done' || (input.session && !saved)) throw error;
      if (saved && input.session) this.sameSession(saved, input.session);
      if (input.comment !== undefined && input.comment !== current.comment)
        throw error;
    }
    return this.task(user, epicId, id);
  }
  async times(user: string, epic: string, id: string, q: PageQuery) {
    await this.ownedTask(user, epic, id);
    const r = await this.repo.times(id, q);
    return page(r.rows.map(timeDTO), r.total, q);
  }
  async createTime(
    user: string,
    epic: string,
    id: string,
    input: z.infer<typeof createTimeSchema>,
  ) {
    if (input.type === 'stopwatch')
      return this.saveSession(user, epic, id, input.version, input);
    return this.createManual(user, epic, id, input);
  }
  async createManual(
    user: string,
    epicId: string,
    id: string,
    input: z.infer<typeof createManualSchema>,
  ) {
    const epic = await this.ownedEpic(user, epicId),
      task = await this.ownedTask(user, epicId, id);
    const same = (r: ManualRow) => {
      if (r.entryDate !== input.date || r.minutes !== input.minutes)
        throw new LearningConflictError('This entry ID has already been used.');
      return timeDTO(r);
    };
    const previous = await this.repo.time(id, input.id);
    if (previous) return same(previous);
    checkVersion(task.version, input.version);
    const now = Date.now();
    const row: TimeRow = {
      id: input.id,
      taskId: id,
      type: 'manual',
      startedAt: null,
      endedAt: null,
      entryDate: input.date,
      minutes: input.minutes,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    try {
      await this.repo.mutate(epic, [
        { kind: 'time', values: row },
        { kind: 'task', id, values: {} },
      ]);
    } catch (error) {
      const saved = await this.repo.time(id, input.id);
      if (!saved) throw error;
      return same(saved);
    }
    return timeDTO(row);
  }
  async patchManual(
    user: string,
    epicId: string,
    id: string,
    entryId: string,
    input: z.infer<typeof patchTimeSchema>,
  ) {
    const epic = await this.ownedEpic(user, epicId),
      task = await this.ownedTask(user, epicId, id),
      entry = await this.repo.time(id, entryId);
    if (!entry) throw new NotFoundError();
    checkVersion(task.version, input.version);
    checkVersion(entry.version, input.entryVersion);
    await this.repo.mutate(epic, [
      {
        kind: 'editTime',
        id: entryId,
        values: {
          ...(input.type === 'manual' ? { entryDate: input.date } : {}),
          minutes: input.minutes,
        },
      },
      { kind: 'task', id, values: {} },
    ]);
    return timeDTO((await this.repo.time(id, entryId))!);
  }
  async deleteManual(
    user: string,
    epicId: string,
    id: string,
    entryId: string,
    input: z.infer<typeof deleteManualSchema>,
  ) {
    const epic = await this.ownedEpic(user, epicId),
      task = await this.ownedTask(user, epicId, id),
      entry = await this.repo.time(id, entryId);
    if (!entry) throw new NotFoundError();
    checkVersion(task.version, input.version);
    checkVersion(entry.version, input.entryVersion);
    await this.repo.mutate(epic, [
      { kind: 'deleteTime', id: entryId },
      { kind: 'task', id, values: {} },
    ]);
  }
}
