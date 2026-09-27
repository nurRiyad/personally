import type { HealthRepository } from './health.repository';

export class HealthService {
  constructor(private readonly repository: HealthRepository) {}

  status() {
    return { status: 'ok' as const };
  }

  async databaseStatus() {
    return {
      status: ((await this.repository.databaseIsHealthy()) ? 'ok' : 'error') as 'ok' | 'error',
    };
  }
}
