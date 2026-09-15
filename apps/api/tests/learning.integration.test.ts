import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import app from '../src/index';
import { signAccessToken } from '../src/security/jwt';
import { createAuthConfig } from '../src/config';
import { createDb } from '@personally/db';
import { D1LearningRepository } from '../src/repositories/learning.repository';
import * as s from '@personally/validation';

// Uses the same local D1 engine as Wrangler, isolated from the developer's data.
const runtime = new Miniflare(
  convertV4MiniflareOptions({
    modules: true,
    script: 'export default { fetch() { return new Response("test"); } }',
    compatibilityDate: '2025-02-01',
    d1Databases: ['DB'],
  }),
);
let db: D1Database, token: string, otherToken: string;
const secret = crypto.randomUUID();
async function request(
  path: string,
  method = 'GET',
  body?: unknown,
  access = token,
) {
  const response = await app.request(
    `http://localhost${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    },
    { DB: db, JWT_SECRET: secret },
  );
  return response;
}
async function record<T>(
  path: string,
  schema: { parse(value: unknown): T },
  method = 'GET',
  body?: unknown,
) {
  const r = await request(path, method, body);
  const json = (await r.json()) as { data: unknown };
  expect(r.status, JSON.stringify(json)).toBeLessThan(300);
  return schema.parse(json.data);
}
const epicInput = {
  name: 'TypeScript mastery',
  description: 'Practice type-safe APIs.',
  targetDate: '2026-11-20',
  targetMinutes: 1200,
};
const taskInput = {
  name: 'Typed client',
  description: 'Build a client.',
  targetMinutes: 60,
  weight: 4,
};
async function newEpic() {
  return record('/learning/epics', s.epicResponseSchema, 'POST', epicInput);
}
async function newTask(epicId: string) {
  return record(
    `/learning/epics/${epicId}/tasks`,
    s.taskResponseSchema,
    'POST',
    taskInput,
  );
}
const ep = (id: string) => `/learning/epics/${id}`;
const tp = (e: string, t: string) => `${ep(e)}/tasks/${t}`;
function session(minutes = 5): s.SessionInput {
  const end = Date.now() - 1000;
  return {
    id: crypto.randomUUID(),
    startedAt: new Date(end - minutes * 60000).toISOString(),
    endedAt: new Date(end).toISOString(),
    durationMinutes: minutes,
  };
}

beforeAll(async () => {
  db = await runtime.getD1Database('DB');
  const dir = new URL('../../../packages/db/migrations/', import.meta.url);
  for (const name of (await readdir(dir))
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    const statements = (await readFile(new URL(name, dir), 'utf8'))
      .split(';')
      .map((v) => v.replace(/--> statement-breakpoint/g, '').trim())
      .filter(Boolean);
    await db.batch(statements.map((sql) => db.prepare(sql)));
  }
  for (const id of ['learning-owner', 'learning-other'])
    await db
      .prepare(
        'INSERT INTO users (id,username,email,phone,password_hash,password_algorithm,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',
      )
      .bind(
        id,
        id,
        `${id}@example.test`,
        id,
        'not-a-login-hash',
        'test',
        Date.now(),
        Date.now(),
      )
      .run();
  token = await signAccessToken(
    'learning-owner',
    createAuthConfig({ JWT_SECRET: secret }),
  );
  otherToken = await signAccessToken(
    'learning-other',
    createAuthConfig({ JWT_SECRET: secret }),
  );
}, 30000);
afterAll(() => runtime.dispose());

describe('learning API with local D1', () => {
  it('allows browser preflights for learning mutation methods', async () => {
    for (const method of ['PATCH', 'PUT', 'DELETE']) {
      const response = await app.request(
        'http://localhost/learning/epics/example',
        {
          method: 'OPTIONS',
          headers: {
            Origin: 'http://localhost:3000',
            'Access-Control-Request-Method': method,
            'Access-Control-Request-Headers': 'Content-Type,Authorization',
          },
        },
        { DB: db, JWT_SECRET: secret },
      );
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain(
        method,
      );
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
        'http://localhost:3000',
      );
    }
  });
  it('creates, updates, fetches, and filters empty epics without fixture data', async () => {
    const epic = await newEpic();
    expect(epic.status).toBe('Todo');
    expect(epic.progress).toBe(0);
    expect(epic.taskCount).toBe(0);
    const edited = await record(ep(epic.id), s.epicResponseSchema, 'PATCH', {
      version: epic.version,
      name: 'Changed epic',
      comment: 'Private comment',
    });
    expect(edited.name).toBe('Changed epic');
    expect(edited.version).toBe(2);
    const list = s.epicListResponseSchema.parse(
      await (
        await request('/learning/epics?status=Todo&sort=name&pageSize=1')
      ).json(),
    );
    expect(list.data).toHaveLength(1);
    expect(list.meta.total).toBeGreaterThan(0);
    expect((await record(ep(epic.id), s.epicResponseSchema)).comment).toBe(
      'Private comment',
    );
  });
  it('enforces ownership, nested IDs, authentication, real dates, and JSON numbers', async () => {
    const epic = await newEpic(),
      task = await newTask(epic.id),
      other = await newEpic();
    expect(
      (await request(ep(epic.id), 'GET', undefined, otherToken)).status,
    ).toBe(404);
    expect(
      (
        await request(
          tp(epic.id, task.id),
          'PATCH',
          { version: task.version, name: 'steal' },
          otherToken,
        )
      ).status,
    ).toBe(404);
    expect((await request(tp(other.id, task.id))).status).toBe(404);
    expect(
      (await request('/learning/summary', 'GET', undefined, '')).status,
    ).toBe(401);
    expect(
      (
        await request('/learning/epics', 'POST', {
          ...epicInput,
          targetDate: '2026-02-30',
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request('/learning/epics', 'POST', {
          ...epicInput,
          targetMinutes: '120',
        })
      ).status,
    ).toBe(400);
    expect((await request('/learning/epics?sort=SQL')).status).toBe(400);
  });
  it('saves timer and manual minutes without multiplying aggregates; retries are idempotent', async () => {
    const epic = await newEpic();
    let task = await newTask(epic.id);
    const path = tp(epic.id, task.id);
    task = await record(`${path}/status`, s.taskResponseSchema, 'PATCH', {
      version: task.version,
      status: 'In progress',
    });
    const first = session(5),
      payload = { version: task.version, type: 'stopwatch', ...first };
    task = await record(`${path}/times`, s.taskResponseSchema, 'POST', payload);
    await record(`${path}/times`, s.taskResponseSchema, 'POST', payload);
    task = await record(`${path}/times`, s.taskResponseSchema, 'POST', {
      version: task.version,
      type: 'stopwatch',
      ...session(7),
    });
    const manual = {
      id: crypto.randomUUID(),
      type: 'manual',
      date: '2026-09-14',
      minutes: 20,
      version: task.version,
    };
    await record(`${path}/times`, s.timeResponseSchema, 'POST', manual);
    await record(`${path}/times`, s.timeResponseSchema, 'POST', manual);
    task = await record(path, s.taskResponseSchema);
    await record(`${path}/times`, s.timeResponseSchema, 'POST', {
      id: crypto.randomUUID(),
      type: 'manual',
      date: '2026-09-13',
      minutes: 30,
      version: task.version,
    });
    task = await record(path, s.taskResponseSchema);
    expect(task.actualMinutes).toBe(62);
    expect(task.sessions).toBe(2);
    expect(task.averageSessionMinutes).toBe(6);
    expect(task.manualMinutes).toBe(50);
    expect(
      (await record(ep(epic.id), s.epicResponseSchema)).actualMinutes,
    ).toBe(62);
    expect(
      (
        await request(`${path}/times`, 'POST', {
          ...manual,
          minutes: 21,
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(`${path}/times`, 'POST', {
          version: task.version,
          type: 'stopwatch',
          ...first,
          durationMinutes: 8,
        })
      ).status,
    ).toBe(409);
  });
  it('edits and deletes manual entries with stale-version protection', async () => {
    const epic = await newEpic();
    let task = await newTask(epic.id);
    const path = tp(epic.id, task.id);
    let entry = await record(`${path}/times`, s.timeResponseSchema, 'POST', {
      id: crypto.randomUUID(),
      type: 'manual',
      version: task.version,
      date: '2026-09-14',
      minutes: 50,
    });
    task = await record(path, s.taskResponseSchema);
    entry = await record(
      `${path}/times/${entry.id}`,
      s.timeResponseSchema,
      'PATCH',
      {
        version: task.version,
        entryVersion: entry.version,
        date: '2026-09-12',
        minutes: 25,
        type: 'manual',
      },
    );
    expect(
      (
        await request(`${path}/times/${entry.id}`, 'DELETE', {
          version: task.version,
          entryVersion: 1,
        })
      ).status,
    ).toBe(409);
    task = await record(path, s.taskResponseSchema);
    expect(task.actualMinutes).toBe(25);
    expect(
      (
        await request(`${path}/times/${entry.id}`, 'DELETE', {
          version: task.version,
          entryVersion: entry.version,
        })
      ).status,
    ).toBe(204);
    expect((await record(path, s.taskResponseSchema)).actualMinutes).toBe(0);
  });
  it('uses weighted progress, blocked rules, cancellation, completion timestamps, and reopening', async () => {
    const epic = await newEpic();
    let first = await newTask(epic.id),
      second = await newTask(epic.id);
    first = await record(tp(epic.id, first.id), s.taskResponseSchema, 'PATCH', {
      version: first.version,
      weight: 1,
    });
    second = await record(
      `${tp(epic.id, second.id)}/status`,
      s.taskResponseSchema,
      'PATCH',
      { version: second.version, status: 'Blocked' },
    );
    first = await record(
      `${tp(epic.id, first.id)}/complete`,
      s.taskResponseSchema,
      'POST',
      { version: first.version, comment: 'Learned it' },
    );
    let aggregate = await record(ep(epic.id), s.epicResponseSchema);
    expect(aggregate.progress).toBe(20);
    expect(aggregate.status).toBe('Todo');
    expect(aggregate.completedAt).toBeNull();
    expect(
      (
        await request(`${tp(epic.id, second.id)}/complete`, 'POST', {
          version: second.version,
        })
      ).status,
    ).toBe(409);
    await record(
      `${tp(epic.id, second.id)}/status`,
      s.taskResponseSchema,
      'PATCH',
      { version: second.version, status: 'Cancelled' },
    );
    aggregate = await record(ep(epic.id), s.epicResponseSchema);
    expect(aggregate.progress).toBe(100);
    expect(aggregate.status).toBe('Done');
    expect(aggregate.completedAt).not.toBeNull();
    expect(
      (
        await request(`${tp(epic.id, first.id)}/status`, 'PATCH', {
          version: first.version,
          status: 'Todo',
        })
      ).status,
    ).toBe(200);
    await newTask(epic.id);
    aggregate = await record(ep(epic.id), s.epicResponseSchema);
    expect(aggregate.status).toBe('Todo');
    expect(aggregate.completedAt).toBeNull();
  });
  it('atomically completes with elapsed time and safely replays a lost response', async () => {
    const epic = await newEpic(),
      task = await newTask(epic.id),
      path = tp(epic.id, task.id),
      saved = session(8);
    const body = {
      version: task.version,
      session: saved,
      comment: 'Reflection',
    };
    const completed = await record(
      `${path}/complete`,
      s.taskResponseSchema,
      'POST',
      body,
    );
    const repeated = await record(
      `${path}/complete`,
      s.taskResponseSchema,
      'POST',
      body,
    );
    expect(repeated.sessions).toBe(1);
    expect(repeated.completedAt).toBe(completed.completedAt);
    expect(repeated.actualMinutes).toBe(8);
    expect(
      (
        await request(`${path}/complete`, 'POST', {
          ...body,
          session: session(5),
        })
      ).status,
    ).toBe(409);
  });
  it('rolls back every statement when an aggregate guard or later statement fails', async () => {
    const epic = await newEpic(),
      task = await newTask(epic.id),
      repo = new D1LearningRepository(createDb(db));
    const snapshot = (await repo.epic('learning-owner', epic.id))!;
    const now = Date.now(),
      time = {
        id: crypto.randomUUID(),
        taskId: task.id,
        startedAt: now - 60000,
        endedAt: now,
        durationMinutes: 1,
        createdAt: now,
      };
    await expect(
      repo.mutate(snapshot, [
        {
          kind: 'time',
          values: {
            ...time,
            type: 'stopwatch',
            entryDate: new Date(now).toISOString().slice(0, 10),
            minutes: 1,
            updatedAt: now,
            version: 1,
          },
        },
        { kind: 'task', id: task.id, values: { weight: 0 } },
      ]),
    ).rejects.toThrow();
    expect(await repo.time(task.id, time.id)).toBeUndefined();
    expect((await repo.epic('learning-owner', epic.id))!.version).toBe(
      snapshot.version,
    );
    await repo.mutate(snapshot, [
      { kind: 'task', id: task.id, values: { weight: 2 } },
    ]);
    await expect(
      repo.mutate(snapshot, [
        {
          kind: 'time',
          values: {
            ...time,
            type: 'stopwatch',
            entryDate: new Date(now).toISOString().slice(0, 10),
            minutes: 1,
            updatedAt: now,
            version: 1,
          },
        },
      ]),
    ).rejects.toThrow();
    expect(await repo.time(task.id, time.id)).toBeUndefined();
  });
  it('allows one concurrent writer and rejects partial or foreign task orders', async () => {
    const epic = await newEpic(),
      first = await newTask(epic.id),
      second = await newTask(epic.id);
    const outcomes = await Promise.all([
      request(tp(epic.id, first.id), 'PATCH', {
        version: first.version,
        name: 'A',
      }),
      request(tp(epic.id, first.id), 'PATCH', {
        version: first.version,
        name: 'B',
      }),
    ]);
    expect(outcomes.map((r) => r.status).sort()).toEqual([200, 409]);
    const latest = await record(ep(epic.id), s.epicResponseSchema);
    expect(
      (
        await request(`${ep(epic.id)}/task-order`, 'PUT', {
          version: latest.version,
          taskIds: [first.id],
        })
      ).status,
    ).toBe(400);
    await record(`${ep(epic.id)}/task-order`, s.epicResponseSchema, 'PUT', {
      version: latest.version,
      taskIds: [second.id, first.id],
    });
    const list = s.taskListResponseSchema.parse(
      await (
        await request(`${ep(epic.id)}/tasks?sort=manual&pageSize=1`)
      ).json(),
    );
    expect(list.data[0].id).toBe(second.id);
    expect(list.meta.total).toBe(2);
  });
  it('cascades task and epic deletion through saved time records', async () => {
    const epic = await newEpic(),
      task = await newTask(epic.id);
    const path = tp(epic.id, task.id);
    const entry = await record(`${path}/times`, s.timeResponseSchema, 'POST', {
      version: task.version,
      type: 'manual',
      id: crypto.randomUUID(),
      date: '2026-09-14',
      minutes: 5,
    });
    const latest = await record(ep(epic.id), s.epicResponseSchema);
    expect(
      (await request(ep(epic.id), 'DELETE', { version: latest.version }))
        .status,
    ).toBe(204);
    expect((await request(path)).status).toBe(404);
    expect(
      await db
        .prepare('SELECT id FROM learning_task_times WHERE id=?')
        .bind(entry.id)
        .first(),
    ).toBeNull();
  });
});
