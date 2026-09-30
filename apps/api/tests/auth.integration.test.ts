import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import app from '../src/index';
import { createAuthConfig } from '../src/utils/config';
import { signAccessToken } from '../src/utils/jwt';

const runtime = new Miniflare(
  convertV4MiniflareOptions({
    modules: true,
    script: 'export default { fetch() { return new Response("test"); } }',
    compatibilityDate: '2025-02-01',
    d1Databases: ['DB'],
  }),
);
let db: D1Database;
let token = '';
let userId = '';
const secret = crypto.randomUUID();

beforeAll(async () => {
  db = await runtime.getD1Database('DB');
  const dir = new URL('../../../packages/db/migrations/', import.meta.url);
  for (const name of (await readdir(dir)).filter((file) => file.endsWith('.sql')).sort()) {
    const sql = await readFile(new URL(name, dir), 'utf8');
    const statements = sql
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean);
    await db.batch(statements.map((statement) => db.prepare(statement)));
  }
}, 30000);

beforeEach(async () => {
  userId = `auth-user-${crypto.randomUUID()}`;
  await db
    .prepare(
      'INSERT INTO users (id,username,email,phone,password_hash,password_algorithm,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',
    )
    .bind(userId, userId, `${userId}@example.test`, userId, 'not-a-login-hash', 'test', Date.now(), Date.now())
    .run();
  token = await signAccessToken(userId, createAuthConfig({ JWT_SECRET: secret }));
});

afterAll(() => runtime.dispose());

describe('auth API', () => {
  it('accepts a valid access token on GET /auth/me', async () => {
    const response = await app.request(
      'http://localhost/auth/me',
      { headers: { Authorization: `Bearer ${token}` } },
      { DB: db, JWT_SECRET: secret },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: {
        user: {
          id: userId,
          username: userId,
          email: `${userId}@example.test`,
          phone: userId,
        },
      },
    });
  });
});
