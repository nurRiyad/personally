import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import app from '../src/index';
import { signAccessToken } from '../src/security/jwt';
import { createAuthConfig } from '../src/config';

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
let otherToken = '';
const secret = crypto.randomUUID();
let userId = 'assets-owner';
let otherId = 'assets-other';

async function request(
  path: string,
  method = 'GET',
  body?: unknown,
  access = token,
) {
  return app.request(
    `http://localhost${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    { DB: db, JWT_SECRET: secret },
  );
}
async function payload(response: Response) {
  return response.json() as Promise<{
    data?: any;
    meta?: any;
    error?: { code: string; message: string };
  }>;
}
async function createType(name = `Type ${crypto.randomUUID()}`) {
  const response = await request('/assets/types', 'POST', { name });
  expect(response.status).toBe(201);
  return (await payload(response)).data as { id: string; name: string };
}
async function createAsset(
  typeId: string,
  values: Partial<Record<string, unknown>> = {},
) {
  const response = await request('/assets', 'POST', {
    typeId,
    name: `Holding ${crypto.randomUUID()}`,
    detail: '',
    isLiquid: false,
    isReceivable: false,
    openedOn: '2026-09-27',
    openingValue: 0,
    ...values,
  });
  const result = await payload(response);
  expect(response.status, JSON.stringify(result)).toBe(201);
  return result.data as {
    id: string;
    currentValue: number;
    isReceivable: boolean;
  };
}
async function createActivity(body: Record<string, unknown>) {
  const response = await request('/assets/activities', 'POST', body);
  return { response, body: await payload(response) };
}
const entry = (
  kind: string,
  source: unknown,
  destination: unknown,
  amount: number,
  activityDate = '2026-09-27',
) => ({
  kind,
  source,
  destination,
  amount,
  activityDate,
});

beforeAll(async () => {
  db = await runtime.getD1Database('DB');
  const dir = new URL('../../../packages/db/migrations/', import.meta.url);
  for (const name of (await readdir(dir))
    .filter((file) => file.endsWith('.sql'))
    .sort()) {
    const sql = await readFile(new URL(name, dir), 'utf8');
    const statements = sql
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean);
    await db.batch(statements.map((statement) => db.prepare(statement)));
  }
}, 30000);
afterAll(() => runtime.dispose());
beforeEach(async () => {
  userId = `assets-owner-${crypto.randomUUID()}`;
  otherId = `assets-other-${crypto.randomUUID()}`;
  for (const id of [userId, otherId]) {
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
  }
  token = await signAccessToken(
    userId,
    createAuthConfig({ JWT_SECRET: secret }),
  );
  otherToken = await signAccessToken(
    otherId,
    createAuthConfig({ JWT_SECRET: secret }),
  );
});

describe('asset ledger API with isolated D1', () => {
  it('creates types and opening activities and calculates the dashboard from the ledger', async () => {
    const type = await createType();
    const asset = await createAsset(type.id, {
      name: 'Opening account',
      openingValue: 1250,
      isLiquid: true,
    });
    expect(asset.currentValue).toBe(1250);
    const history = await request(`/assets/activities?assetId=${asset.id}`);
    const historyJson = await payload(history);
    expect(historyJson.data[0].kind).toBe('Opening');
    const dashboard = await payload(await request('/assets/dashboard'));
    expect(dashboard.data.summary.totalAssets).toBe(1250);
    expect(dashboard.data.summary.liquidMoney).toBe(1250);
    const duplicate = await request('/assets/types', 'POST', {
      name: type.name.toUpperCase(),
    });
    expect(duplicate.status).toBe(409);
    expect((await payload(duplicate)).error?.code).toBe('ASSET_NAME_EXISTS');

    const opening = historyJson.data[0];
    const edited = await request(`/assets/activities/${opening.id}`, 'PATCH', {
      kind: 'Opening',
      source: { endpoint: 'outside' },
      destination: { assetId: asset.id },
      amount: 1500,
      activityDate: '2026-09-26',
      note: 'Corrected opening balance',
    });
    expect(edited.status).toBe(200);
    expect((await payload(edited)).data.amount).toBe(1500);
    const updatedAsset = await payload(await request(`/assets/${asset.id}`));
    expect(updatedAsset.data.currentValue).toBe(1500);

    const directOpening = await createActivity(
      entry('Opening', { endpoint: 'outside' }, { assetId: asset.id }, 10),
    );
    expect(directOpening.response.status).toBe(400);
  });

  it('applies every activity kind with transfers preserving total and receivables driving money lent', async () => {
    const type = await createType();
    const bank = await createAsset(type.id, {
      openingValue: 1000,
      isLiquid: true,
    });
    const dps = await createAsset(type.id);
    const receivable = await createAsset(type.id, { isReceivable: true });
    const outside = { endpoint: 'outside' };
    const personal = { endpoint: 'personal_use' };
    const growth = { endpoint: 'growth_return' };
    for (const body of [
      entry('Income', outside, { assetId: bank.id }, 100),
      entry('Growth', growth, { assetId: bank.id }, 50),
      entry('Transfer', { assetId: bank.id }, { assetId: dps.id }, 200),
      entry('Contribution', { assetId: bank.id }, { assetId: dps.id }, 100),
      entry('Lending', { assetId: bank.id }, { assetId: receivable.id }, 300),
      entry('Repayment', { assetId: receivable.id }, { assetId: dps.id }, 50),
      entry('External use', { assetId: dps.id }, personal, 25),
    ]) {
      const result = await createActivity(body);
      expect(result.response.status, JSON.stringify(result.body)).toBe(201);
    }
    const dashboard = (await payload(await request('/assets/dashboard'))).data;
    expect(dashboard.summary.totalAssets).toBe(1125);
    expect(dashboard.summary.liquidMoney).toBe(550);
    expect(dashboard.summary.moneyLent).toBe(250);
    const list = (await payload(await request('/assets'))).data as Array<{
      id: string;
      currentValue: number;
    }>;
    expect(list.find((item) => item.id === bank.id)?.currentValue).toBe(550);
    expect(list.find((item) => item.id === dps.id)?.currentValue).toBe(325);
  });

  it('rejects cross-account records, invalid receivable use, invalid ownership, and overdrafts', async () => {
    const type = await createType();
    const bank = await createAsset(type.id, {
      openingValue: 100,
      isLiquid: true,
    });
    const normal = await createAsset(type.id);
    const invalidLending = await createActivity(
      entry('Lending', { assetId: bank.id }, { assetId: normal.id }, 1),
    );
    expect(invalidLending.response.status).toBe(400);
    const overdraft = await createActivity(
      entry(
        'External use',
        { assetId: bank.id },
        { endpoint: 'personal_use' },
        101,
      ),
    );
    expect(overdraft.response.status).toBe(409);
    const other = await request(
      `/assets/${bank.id}`,
      'GET',
      undefined,
      otherToken,
    );
    expect(other.status).toBe(404);
    const invalidEndpoint = await request(
      '/assets/activities',
      'POST',
      entry('Income', { endpoint: 'personal_use' }, { assetId: bank.id }, 1),
    );
    expect(invalidEndpoint.status).toBe(400);
  });

  it('revalidates backdated edits and deletions against the complete ordered ledger', async () => {
    const type = await createType();
    const bank = await createAsset(type.id, {
      openingValue: 1000,
      openedOn: '2026-01-10',
    });
    const second = await createAsset(type.id);
    const moved = await createActivity(
      entry(
        'Transfer',
        { assetId: bank.id },
        { assetId: second.id },
        800,
        '2026-01-15',
      ),
    );
    expect(moved.response.status).toBe(201);
    const badBackdate = await createActivity(
      entry(
        'External use',
        { assetId: bank.id },
        { endpoint: 'personal_use' },
        500,
        '2026-01-12',
      ),
    );
    expect(badBackdate.response.status).toBe(409);
    const activityId = moved.body.data.id as string;
    const changed = await request(
      `/assets/activities/${activityId}`,
      'PATCH',
      entry(
        'Transfer',
        { assetId: bank.id },
        { assetId: second.id },
        700,
        '2026-01-15',
      ),
    );
    expect(changed.status, JSON.stringify(await payload(changed))).toBe(200);
    expect(
      (await payload(await request(`/assets/${bank.id}`))).data.currentValue,
    ).toBe(300);
    const deleted = await request(`/assets/activities/${activityId}`, 'DELETE');
    expect(deleted.status).toBe(204);
    expect(
      (await payload(await request(`/assets/${bank.id}`))).data.currentValue,
    ).toBe(1000);
  });

  it('archives holdings, keeps their history, excludes their value, and blocks related activity changes', async () => {
    const type = await createType();
    const bank = await createAsset(type.id, { openingValue: 450 });
    const archived = await request(`/assets/${bank.id}`, 'DELETE');
    expect(archived.status).toBe(204);
    const dashboard = (await payload(await request('/assets/dashboard'))).data;
    expect(dashboard.summary.totalAssets).toBe(0);
    const all = (await payload(await request('/assets?includeArchived=true')))
      .data as Array<{ id: string; archivedAt: string | null }>;
    expect(
      all.find((asset) => asset.id === bank.id)?.archivedAt,
    ).not.toBeNull();
    const history = (
      await payload(await request(`/assets/activities?assetId=${bank.id}`))
    ).data;
    expect(
      history.some((activity: { kind: string }) => activity.kind === 'Opening'),
    ).toBe(true);
    const openingId = history.find(
      (activity: { kind: string }) => activity.kind === 'Opening',
    ).id;
    expect(
      (await request(`/assets/activities/${openingId}`, 'DELETE')).status,
    ).toBe(409);
    expect((await request(`/assets/types/${type.id}`, 'DELETE')).status).toBe(
      409,
    );
  });

  it('keeps type, asset, and activity records private to their owner', async () => {
    const type = await createType();
    const asset = await createAsset(type.id, { openingValue: 10 });
    expect(
      (
        await request(
          `/assets/types/${type.id}`,
          'PATCH',
          { name: 'stolen' },
          otherToken,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await request(
          `/assets/${asset.id}`,
          'PATCH',
          { name: 'stolen' },
          otherToken,
        )
      ).status,
    ).toBe(404);
    const opening = (
      await payload(await request(`/assets/activities?assetId=${asset.id}`))
    ).data[0];
    expect(
      (
        await request(
          `/assets/activities/${opening.id}`,
          'DELETE',
          undefined,
          otherToken,
        )
      ).status,
    ).toBe(404);
  });
});
