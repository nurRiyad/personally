import type {
  assetActivityInputSchema,
  assetActivityQuerySchema,
  assetCreateSchema,
  assetDateRangeSchema,
  assetListQuerySchema,
  assetPatchSchema,
  assetTypeInputSchema,
} from '@personally/validation';
import type { z } from 'zod';
import type { AssetRepository, ActivityRow } from './assets.repository';
import { AppError, NotFoundError } from '../../utils/errors';

type CreateAsset = z.infer<typeof assetCreateSchema>;
type PatchAsset = z.infer<typeof assetPatchSchema>;
type ActivityInput = z.infer<typeof assetActivityInputSchema>;
type ActivityQuery = z.infer<typeof assetActivityQuerySchema>;
type DateRange = z.infer<typeof assetDateRangeSchema>;
type AssetQuery = z.infer<typeof assetListQuerySchema>;
type TypeInput = z.infer<typeof assetTypeInputSchema>;
type AssetRow = Record<string, any>;
type BalanceSnapshot = {
  value: number;
  openingValue: number;
  periodChange: number;
  activityCount: number;
};
type Posting = { date: string; createdAt: number; id: string; delta: number };

const iso = (value: number) => new Date(value).toISOString();
const timestamp = () => Date.now();
const normalizeName = (name: string) => name.trim().toLocaleLowerCase('en-US');
const notFound = () => new NotFoundError();
const conflict = (code: string, message: string) => new AppError(code, message, 409);
const dbConflict = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('ASSET_NEGATIVE_BALANCE'))
    throw conflict('ASSET_NEGATIVE_BALANCE', 'This activity would make an asset balance negative.');
  if (message.includes('UNIQUE constraint failed'))
    throw conflict('ASSET_NAME_EXISTS', 'An asset type with that name already exists.');
  throw error;
};
const currentDate = () => new Date().toISOString().slice(0, 10);
const defaultRange = (range: DateRange) => {
  const today = currentDate();
  return {
    from: range.from ?? `${today.slice(0, 4)}-01-01`,
    to: range.to ?? today,
  };
};

function signedPostings(rows: ActivityRow[]) {
  const postings = new Map<string, Posting[]>();
  for (const row of rows) {
    const amount = Number(row.amount);
    if (row.source_asset_id) {
      const entries = postings.get(row.source_asset_id) ?? [];
      entries.push({
        date: row.activity_date,
        createdAt: Number(row.created_at),
        id: row.id,
        delta: -amount,
      });
      postings.set(row.source_asset_id, entries);
    }
    if (row.destination_asset_id) {
      const entries = postings.get(row.destination_asset_id) ?? [];
      entries.push({
        date: row.activity_date,
        createdAt: Number(row.created_at),
        id: row.id,
        delta: amount,
      });
      postings.set(row.destination_asset_id, entries);
    }
  }
  for (const entries of postings.values())
    entries.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  return postings;
}

function balanceAt(entries: Posting[] | undefined, date?: string) {
  let value = 0;
  for (const entry of entries ?? []) if (!date || entry.date <= date) value += entry.delta;
  return value;
}

function monthSeries(
  assets: AssetRow[],
  postings: ReturnType<typeof signedPostings>,
  from: string,
  to: string,
  assetId?: string,
) {
  const points: Array<{ date: string; value: number }> = [];
  const activeIds = assetId
    ? new Set([assetId])
    : new Set(assets.filter((asset) => asset.archived_at === null).map((asset) => asset.id));
  const events = [...postings.entries()]
    .filter(([id]) => activeIds.has(id))
    .flatMap(([assetId, entries]) => entries.map((entry) => ({ assetId, ...entry })))
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  let eventIndex = 0;
  let runningTotal = 0;
  const start = new Date(`${from.slice(0, 7)}-01T00:00:00.000Z`);
  const end = new Date(`${to.slice(0, 7)}-01T00:00:00.000Z`);
  for (
    let cursor = start;
    cursor <= end;
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
  ) {
    const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0))
      .toISOString()
      .slice(0, 10);
    const date = monthEnd > to ? to : monthEnd;
    if (date < from) continue;
    while (eventIndex < events.length && events[eventIndex].date <= date) {
      runningTotal += events[eventIndex].delta;
      eventIndex += 1;
    }
    points.push({ date, value: runningTotal });
  }
  if (!points.length || points[points.length - 1].date !== to) {
    while (eventIndex < events.length && events[eventIndex].date <= to) {
      runningTotal += events[eventIndex].delta;
      eventIndex += 1;
    }
    points.push({ date: to, value: runningTotal });
  }
  return points;
}

export class AssetService {
  constructor(private readonly repo: AssetRepository) {}

  async types(userId: string) {
    const rows = await this.repo.types(userId);
    return rows.map((row: AssetRow) => ({
      id: row.id,
      name: row.name,
      assetCount: Number(row.asset_count),
      createdAt: iso(Number(row.created_at)),
      updatedAt: iso(Number(row.updated_at)),
    }));
  }
  async createType(userId: string, input: TypeInput) {
    const now = timestamp();
    const id = crypto.randomUUID();
    try {
      await this.repo.createType({
        id,
        userId,
        name: input.name,
        normalizedName: normalizeName(input.name),
        now,
      });
    } catch (error) {
      dbConflict(error);
    }
    return (await this.types(userId)).find((item) => item.id === id)!;
  }
  async patchType(userId: string, id: string, input: TypeInput) {
    if (!(await this.repo.type(userId, id))) throw notFound();
    try {
      await this.repo.patchType(userId, id, input.name, normalizeName(input.name), timestamp());
    } catch (error) {
      dbConflict(error);
    }
    return (await this.types(userId)).find((item) => item.id === id)!;
  }
  async deleteType(userId: string, id: string) {
    if (!(await this.repo.type(userId, id))) throw notFound();
    const count = await this.repo.first<{ total: number }>(
      'SELECT COUNT(*) AS total FROM assets WHERE user_id=? AND asset_type_id=?',
      userId,
      id,
    );
    if (Number(count?.total))
      throw conflict('ASSET_TYPE_NOT_EMPTY', 'Archive or move every asset before deleting this type.');
    await this.repo.deleteType(userId, id);
  }

  private async ownedAsset(userId: string, id: string, includeArchived = false) {
    const row = (await this.repo.asset(userId, id)) as AssetRow | null;
    if (!row || (!includeArchived && row.archived_at !== null)) throw notFound();
    return row;
  }
  private async assetStats(userId: string, row: AssetRow, range: DateRange): Promise<BalanceSnapshot> {
    const ledger = await this.repo.ledger(userId);
    return this.assetStatsFromLedger(row, ledger, range);
  }
  private assetStatsFromLedger(row: AssetRow, ledger: ActivityRow[], range: DateRange): BalanceSnapshot {
    const postings = signedPostings(ledger);
    const resolved = defaultRange(range);
    const entries = postings.get(row.id) ?? [];
    return {
      value: balanceAt(entries, currentDate()),
      openingValue: balanceAt(entries, addDays(resolved.from, -1)),
      periodChange: balanceAt(entries, resolved.to) - balanceAt(entries, addDays(resolved.from, -1)),
      activityCount: ledger.filter(
        (activity) => activity.source_asset_id === row.id || activity.destination_asset_id === row.id,
      ).length,
    };
  }
  private async assetDto(userId: string, row: AssetRow, range: DateRange, ledger?: ActivityRow[]) {
    const stats = ledger ? this.assetStatsFromLedger(row, ledger, range) : await this.assetStats(userId, row, range);
    return {
      id: row.id,
      typeId: row.asset_type_id,
      typeName: row.type_name,
      name: row.name,
      detail: row.detail,
      isLiquid: Boolean(row.is_liquid),
      isReceivable: Boolean(row.is_receivable),
      openedOn: row.opened_on,
      archivedAt: row.archived_at === null ? null : iso(Number(row.archived_at)),
      currentValue: stats.value,
      openingValue: stats.openingValue,
      periodChange: stats.periodChange,
      activityCount: stats.activityCount,
      createdAt: iso(Number(row.created_at)),
      updatedAt: iso(Number(row.updated_at)),
    };
  }
  async assets(userId: string, query: AssetQuery, range: DateRange = {}) {
    const [rows, ledger] = await Promise.all([
      this.repo.assets(userId, query.typeId, query.includeArchived),
      this.repo.ledger(userId),
    ]);
    const postings = signedPostings(ledger);
    const resolved = defaultRange(range);
    const activityCounts = new Map<string, number>();
    for (const activity of ledger) {
      for (const assetId of new Set([activity.source_asset_id, activity.destination_asset_id])) {
        if (assetId) activityCounts.set(assetId, (activityCounts.get(assetId) ?? 0) + 1);
      }
    }
    return rows.map((row: AssetRow) => {
      const entries = postings.get(row.id) ?? [];
      const currentValue = balanceAt(entries, currentDate());
      const openingValue = balanceAt(entries, addDays(resolved.from, -1));
      return {
        id: row.id,
        typeId: row.asset_type_id,
        typeName: row.type_name,
        name: row.name,
        detail: row.detail,
        isLiquid: Boolean(row.is_liquid),
        isReceivable: Boolean(row.is_receivable),
        openedOn: row.opened_on,
        archivedAt: row.archived_at === null ? null : iso(Number(row.archived_at)),
        currentValue,
        openingValue,
        periodChange: balanceAt(entries, resolved.to) - balanceAt(entries, addDays(resolved.from, -1)),
        activityCount: activityCounts.get(row.id) ?? 0,
        createdAt: iso(Number(row.created_at)),
        updatedAt: iso(Number(row.updated_at)),
      };
    });
  }
  async createAsset(userId: string, input: CreateAsset) {
    if (!(await this.repo.type(userId, input.typeId))) throw notFound();
    const now = timestamp();
    const id = crypto.randomUUID();
    try {
      await this.repo.createAsset({
        id,
        userId,
        typeId: input.typeId,
        name: input.name,
        detail: input.detail,
        isLiquid: input.isLiquid,
        isReceivable: input.isReceivable,
        openedOn: input.openedOn,
        now,
        openingActivity: input.openingValue > 0 ? { id: crypto.randomUUID(), amount: input.openingValue } : undefined,
      });
    } catch (error) {
      dbConflict(error);
    }
    const row = await this.ownedAsset(userId, id);
    return this.assetDto(userId, row as AssetRow, {});
  }
  async patchAsset(userId: string, id: string, input: PatchAsset) {
    const current = await this.ownedAsset(userId, id);
    const liquid = input.isLiquid ?? Boolean(current.is_liquid);
    const receivable = input.isReceivable ?? Boolean(current.is_receivable);
    if (liquid && receivable)
      throw new AppError('VALIDATION_ERROR', 'A receivable cannot be liquid money.', 400, {
        isReceivable: ['A receivable cannot be liquid money.'],
      });
    if (input.typeId && !(await this.repo.type(userId, input.typeId))) throw notFound();
    await this.repo.patchAsset(userId, id, input as Record<string, unknown>, timestamp());
    return this.assetDto(userId, await this.ownedAsset(userId, id), {});
  }
  async archiveAsset(userId: string, id: string) {
    await this.ownedAsset(userId, id);
    await this.repo.archiveAsset(userId, id, timestamp());
  }

  private endpointIds(input: ActivityInput) {
    return {
      kind: input.kind,
      amount: input.amount,
      activityDate: input.activityDate,
      sourceAssetId: 'assetId' in input.source ? input.source.assetId : null,
      destinationAssetId: 'assetId' in input.destination ? input.destination.assetId : null,
      sourceEndpoint: 'endpoint' in input.source ? input.source.endpoint : null,
      destinationEndpoint: 'endpoint' in input.destination ? input.destination.endpoint : null,
      note: input.note,
    };
  }
  private async validateActivity(userId: string, input: ActivityInput) {
    const ids = [
      'assetId' in input.source ? input.source.assetId : undefined,
      'assetId' in input.destination ? input.destination.assetId : undefined,
    ].filter(Boolean) as string[];
    const assets = await Promise.all(ids.map((id) => this.repo.asset(userId, id) as Promise<AssetRow | null>));
    if (assets.some((asset) => !asset)) throw notFound();
    if (assets.some((asset) => asset!.archived_at !== null))
      throw conflict('ASSET_ARCHIVED', 'Activities cannot use an archived asset.');
    if (input.kind === 'Lending' && !Boolean(assets[1]?.is_receivable))
      throw new AppError('VALIDATION_ERROR', 'Lending must end at a receivable asset.', 400, {
        destination: ['Choose a receivable asset.'],
      });
    if (input.kind === 'Repayment' && !Boolean(assets[0]?.is_receivable))
      throw new AppError('VALIDATION_ERROR', 'Repayment must start from a receivable asset.', 400, {
        source: ['Choose a receivable asset.'],
      });
  }
  private async blockArchivedActivity(userId: string, row: ActivityRow) {
    const ids = [row.source_asset_id, row.destination_asset_id].filter(Boolean) as string[];
    const refs = await Promise.all(ids.map((id) => this.repo.asset(userId, id) as Promise<AssetRow | null>));
    if (refs.some((asset) => asset?.archived_at !== null))
      throw conflict('ASSET_ARCHIVED', 'Activities involving archived assets cannot be edited or deleted.');
  }
  private endpointDto(assetId: string | null, endpoint: string | null, name: string | null) {
    return assetId
      ? { ref: { assetId }, name: name ?? 'Archived asset' }
      : {
          ref: { endpoint: endpoint! },
          name:
            endpoint === 'outside'
              ? 'Outside Assets'
              : endpoint === 'growth_return'
                ? 'Growth or return'
                : 'Personal use',
        };
  }
  private activityDto(row: ActivityRow) {
    const source = this.endpointDto(row.source_asset_id, row.source_endpoint, row.source_name);
    const destination = this.endpointDto(row.destination_asset_id, row.destination_endpoint, row.destination_name);
    return {
      id: row.id,
      kind: row.kind,
      amount: Number(row.amount),
      activityDate: row.activity_date,
      source: source.ref,
      destination: destination.ref,
      sourceName: source.name,
      destinationName: destination.name,
      note: row.note,
      createdAt: iso(Number(row.created_at)),
      updatedAt: iso(Number(row.updated_at)),
    };
  }
  async activities(userId: string, query: ActivityQuery) {
    const rows = await this.repo.ledger(userId);
    const filtered = rows.filter(
      (row) =>
        (!query.from || row.activity_date >= query.from) &&
        (!query.to || row.activity_date <= query.to) &&
        (!query.kind || row.kind === query.kind) &&
        (!query.assetId || row.source_asset_id === query.assetId || row.destination_asset_id === query.assetId),
    );
    const offset = (query.page - 1) * query.pageSize;
    return {
      data: filtered.slice(offset, offset + query.pageSize).map((row) => this.activityDto(row)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / query.pageSize),
      },
    };
  }
  async createActivity(userId: string, input: ActivityInput) {
    if (input.kind === 'Opening')
      throw new AppError(
        'VALIDATION_ERROR',
        'Opening activities are created with a holding and cannot be recorded directly.',
        400,
      );
    await this.validateActivity(userId, input);
    const id = crypto.randomUUID();
    try {
      await this.repo.createActivity(userId, id, this.endpointIds(input), timestamp());
    } catch (error) {
      dbConflict(error);
    }
    const created = await this.repo.activity(userId, id);
    return this.activityDto(created!);
  }
  async patchActivity(userId: string, id: string, input: ActivityInput) {
    const existing = await this.repo.activity(userId, id);
    if (!existing) throw notFound();
    await this.blockArchivedActivity(userId, existing);
    if (
      existing.kind === 'Opening' &&
      (input.kind !== 'Opening' ||
        !('endpoint' in input.source) ||
        input.source.endpoint !== 'outside' ||
        !('assetId' in input.destination) ||
        input.destination.assetId !== existing.destination_asset_id)
    )
      throw new AppError('VALIDATION_ERROR', 'An opening activity can only update its amount, date, and note.', 400);
    await this.validateActivity(userId, input);
    try {
      await this.repo.patchActivity(userId, id, this.endpointIds(input), timestamp());
    } catch (error) {
      dbConflict(error);
    }
    const row = await this.repo.activity(userId, id);
    return this.activityDto(row!);
  }
  async deleteActivity(userId: string, id: string) {
    const existing = await this.repo.activity(userId, id);
    if (!existing) throw notFound();
    await this.blockArchivedActivity(userId, existing);
    try {
      await this.repo.deleteActivity(userId, id);
    } catch (error) {
      dbConflict(error);
    }
  }
  async assetDetail(userId: string, id: string, range: DateRange) {
    const row = await this.ownedAsset(userId, id, true);
    const ledger = await this.repo.ledger(userId);
    const stats = this.assetStatsFromLedger(row, ledger, range);
    const bounds = defaultRange(range);
    const dto = await this.assetDto(userId, row, range, ledger);
    const activities = ledger
      .filter((entry) => entry.source_asset_id === id || entry.destination_asset_id === id)
      .map((entry) => this.activityDto(entry));
    return {
      ...dto,
      ...stats,
      activities,
      series: monthSeries([row], signedPostings(ledger), bounds.from, bounds.to, id),
    };
  }
  async dashboard(userId: string, range: DateRange) {
    const bounds = defaultRange(range);
    const [assets, ledger, types] = await Promise.all([
      this.repo.assets(userId, undefined, true),
      this.repo.ledger(userId),
      this.types(userId),
    ]);
    const active = assets.filter((row: AssetRow) => row.archived_at === null) as AssetRow[];
    const postings = signedPostings(ledger);
    const previous = addDays(bounds.from, -1);
    const totalAt = (date: string) => active.reduce((sum, row) => sum + balanceAt(postings.get(row.id), date), 0);
    const total = totalAt(currentDate());
    const periodChange = totalAt(bounds.to) - totalAt(previous);
    const liquidMoney = active
      .filter((row) => Boolean(row.is_liquid))
      .reduce((sum, row) => sum + balanceAt(postings.get(row.id), currentDate()), 0);
    const moneyLent = active
      .filter((row) => Boolean(row.is_receivable))
      .reduce((sum, row) => sum + balanceAt(postings.get(row.id), currentDate()), 0);
    const values = active
      .map((row) => {
        const openingValue = balanceAt(postings.get(row.id), previous);
        const closing = balanceAt(postings.get(row.id), bounds.to);
        const change = closing - openingValue;
        const growthRate = openingValue === 0 ? null : (change / openingValue) * 100;
        return { row, openingValue, closing, change, growthRate };
      })
      .filter((entry) => entry.change > 0)
      .sort((a, b) => (b.growthRate ?? Infinity) - (a.growthRate ?? Infinity))
      .slice(0, 5);
    const topGrowingAssets = await Promise.all(
      values.map(async ({ row, openingValue, closing, change, growthRate }) => ({
        ...(await this.assetDto(userId, row, bounds, ledger)),
        currentValue: closing,
        openingValue,
        periodChange: change,
        growthRate,
        growthLabel: growthRate === null ? 'New' : `${growthRate.toFixed(1)}%`,
      })),
    );
    const currentValues = new Map<string, number>();
    for (const asset of active) {
      currentValues.set(
        asset.asset_type_id,
        (currentValues.get(asset.asset_type_id) ?? 0) + balanceAt(postings.get(asset.id), currentDate()),
      );
    }
    const assetMix = types
      .filter((type) => currentValues.has(type.id))
      .map((type) => {
        const value = currentValues.get(type.id)!;
        return {
          typeId: type.id,
          typeName: type.name,
          value,
          percentage: total === 0 ? 0 : Math.round((value / total) * 100),
        };
      });
    return {
      summary: {
        totalAssets: total,
        periodChange,
        liquidMoney,
        moneyLent,
        assetCount: active.length,
      },
      assetMix,
      topGrowingAssets,
      recentActivity: ledger.slice(0, 6).map((row) => this.activityDto(row)),
      series: monthSeries(assets as AssetRow[], postings, bounds.from, bounds.to),
    };
  }
}

function addDays(value: string, amount: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
