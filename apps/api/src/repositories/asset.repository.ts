type Row = Record<string, unknown>;
export type ActivityRow = Row & {
  id: string;
  user_id: string;
  kind: string;
  amount: number;
  activity_date: string;
  source_asset_id: string | null;
  destination_asset_id: string | null;
  source_endpoint: string | null;
  destination_endpoint: string | null;
  note: string | null;
  created_at: number;
  updated_at: number;
  source_name: string | null;
  destination_name: string | null;
};

export class D1AssetRepository {
  constructor(private readonly db: D1Database) {}

  async all<T extends Row = Row>(
    sql: string,
    ...args: unknown[]
  ): Promise<T[]> {
    return (
      await this.db
        .prepare(sql)
        .bind(...args)
        .all<T>()
    ).results;
  }
  first<T extends Row = Row>(sql: string, ...args: unknown[]) {
    return this.db
      .prepare(sql)
      .bind(...args)
      .first<T>();
  }
  run(sql: string, ...args: unknown[]) {
    return this.db
      .prepare(sql)
      .bind(...args)
      .run();
  }

  types(userId: string) {
    return this.all(
      `SELECT t.*, COUNT(CASE WHEN a.archived_at IS NULL THEN 1 END) AS asset_count
       FROM asset_types t LEFT JOIN assets a ON a.asset_type_id=t.id
       WHERE t.user_id=? GROUP BY t.id ORDER BY t.name COLLATE NOCASE, t.id`,
      userId,
    );
  }
  type(userId: string, id: string) {
    return this.first(
      'SELECT * FROM asset_types WHERE user_id=? AND id=?',
      userId,
      id,
    );
  }
  async createType(values: {
    id: string;
    userId: string;
    name: string;
    normalizedName: string;
    now: number;
  }) {
    await this.run(
      'INSERT INTO asset_types (id,user_id,name,normalized_name,created_at,updated_at) VALUES (?,?,?,?,?,?)',
      values.id,
      values.userId,
      values.name,
      values.normalizedName,
      values.now,
      values.now,
    );
  }
  async patchType(
    userId: string,
    id: string,
    name: string,
    normalizedName: string,
    now: number,
  ) {
    return this.run(
      'UPDATE asset_types SET name=?,normalized_name=?,updated_at=? WHERE user_id=? AND id=?',
      name,
      normalizedName,
      now,
      userId,
      id,
    );
  }
  async deleteType(userId: string, id: string) {
    return this.run(
      'DELETE FROM asset_types WHERE user_id=? AND id=?',
      userId,
      id,
    );
  }

  asset(userId: string, id: string) {
    return this.first(
      `SELECT a.*, t.name AS type_name FROM assets a
       JOIN asset_types t ON t.id=a.asset_type_id AND t.user_id=a.user_id
       WHERE a.user_id=? AND a.id=?`,
      userId,
      id,
    );
  }
  async assets(userId: string, typeId?: string, includeArchived = false) {
    const conditions = ['a.user_id=?'];
    const values: unknown[] = [userId];
    if (typeId) {
      conditions.push('a.asset_type_id=?');
      values.push(typeId);
    }
    if (!includeArchived) conditions.push('a.archived_at IS NULL');
    return this.all(
      `SELECT a.*, t.name AS type_name FROM assets a
       JOIN asset_types t ON t.id=a.asset_type_id AND t.user_id=a.user_id
       WHERE ${conditions.join(' AND ')} ORDER BY t.name COLLATE NOCASE, a.name COLLATE NOCASE, a.id`,
      ...values,
    );
  }
  async createAsset(values: {
    id: string;
    userId: string;
    typeId: string;
    name: string;
    detail: string;
    isLiquid: boolean;
    isReceivable: boolean;
    openedOn: string;
    now: number;
    openingActivity?: { id: string; amount: number };
  }) {
    const statements = [
      this.db
        .prepare(
          `INSERT INTO assets (id,user_id,asset_type_id,name,detail,is_liquid,is_receivable,opened_on,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
        )
        .bind(
          values.id,
          values.userId,
          values.typeId,
          values.name,
          values.detail,
          values.isLiquid ? 1 : 0,
          values.isReceivable ? 1 : 0,
          values.openedOn,
          values.now,
          values.now,
        ),
    ];
    if (values.openingActivity)
      statements.push(
        this.db
          .prepare(
            `INSERT INTO asset_activities (id,user_id,kind,amount,activity_date,source_endpoint,destination_asset_id,note,created_at,updated_at)
       VALUES (?,?,'Opening',?,?, 'outside', ?, 'Opening balance', ?, ?)`,
          )
          .bind(
            values.openingActivity.id,
            values.userId,
            values.openingActivity.amount,
            values.openedOn,
            values.id,
            values.now,
            values.now,
          ),
      );
    await this.db.batch(statements);
  }
  async patchAsset(
    userId: string,
    id: string,
    values: Record<string, unknown>,
    now: number,
  ) {
    const map: Record<string, string> = {
      typeId: 'asset_type_id',
      name: 'name',
      detail: 'detail',
      isLiquid: 'is_liquid',
      isReceivable: 'is_receivable',
    };
    const fields: string[] = [];
    const args: unknown[] = [];
    for (const [key, value] of Object.entries(values)) {
      fields.push(`${map[key]}=?`);
      args.push(typeof value === 'boolean' ? Number(value) : value);
    }
    fields.push('updated_at=?');
    args.push(now, userId, id);
    return this.run(
      `UPDATE assets SET ${fields.join(',')} WHERE user_id=? AND id=? AND archived_at IS NULL`,
      ...args,
    );
  }
  async archiveAsset(userId: string, id: string, now: number) {
    return this.run(
      'UPDATE assets SET archived_at=?,updated_at=? WHERE user_id=? AND id=? AND archived_at IS NULL',
      now,
      now,
      userId,
      id,
    );
  }

  async ledger(userId: string): Promise<ActivityRow[]> {
    return this.all<ActivityRow>(
      `SELECT x.*, s.name AS source_name, d.name AS destination_name
       FROM asset_activities x
       LEFT JOIN assets s ON s.id=x.source_asset_id
       LEFT JOIN assets d ON d.id=x.destination_asset_id
       WHERE x.user_id=? ORDER BY x.activity_date DESC, x.created_at DESC, x.id DESC`,
      userId,
    );
  }
  activity(userId: string, id: string) {
    return this.first<ActivityRow>(
      `SELECT x.*, s.name AS source_name, d.name AS destination_name
       FROM asset_activities x LEFT JOIN assets s ON s.id=x.source_asset_id
       LEFT JOIN assets d ON d.id=x.destination_asset_id WHERE x.user_id=? AND x.id=?`,
      userId,
      id,
    );
  }
  async createActivity(
    userId: string,
    id: string,
    input: {
      kind: string;
      amount: number;
      activityDate: string;
      sourceAssetId: string | null;
      destinationAssetId: string | null;
      sourceEndpoint: string | null;
      destinationEndpoint: string | null;
      note?: string;
    },
    now: number,
  ) {
    return this.run(
      `INSERT INTO asset_activities (id,user_id,kind,amount,activity_date,source_asset_id,destination_asset_id,source_endpoint,destination_endpoint,note,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      id,
      userId,
      input.kind,
      input.amount,
      input.activityDate,
      input.sourceAssetId,
      input.destinationAssetId,
      input.sourceEndpoint,
      input.destinationEndpoint,
      input.note ?? null,
      now,
      now,
    );
  }
  async patchActivity(
    userId: string,
    id: string,
    input: {
      kind: string;
      amount: number;
      activityDate: string;
      sourceAssetId: string | null;
      destinationAssetId: string | null;
      sourceEndpoint: string | null;
      destinationEndpoint: string | null;
      note?: string;
    },
    now: number,
  ) {
    return this.run(
      `UPDATE asset_activities SET kind=?,amount=?,activity_date=?,source_asset_id=?,destination_asset_id=?,source_endpoint=?,destination_endpoint=?,note=?,updated_at=?
       WHERE user_id=? AND id=?`,
      input.kind,
      input.amount,
      input.activityDate,
      input.sourceAssetId,
      input.destinationAssetId,
      input.sourceEndpoint,
      input.destinationEndpoint,
      input.note ?? null,
      now,
      userId,
      id,
    );
  }
  deleteActivity(userId: string, id: string) {
    return this.run(
      'DELETE FROM asset_activities WHERE user_id=? AND id=?',
      userId,
      id,
    );
  }
}
