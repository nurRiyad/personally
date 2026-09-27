export interface HealthRepository {
  databaseIsHealthy(): Promise<boolean>;
}

export class D1HealthRepository implements HealthRepository {
  constructor(private readonly db: D1Database) {}

  async databaseIsHealthy() {
    const result = await this.db.prepare('SELECT 1 AS ok').first<{ ok: number }>();
    return result?.ok === 1;
  }
}
