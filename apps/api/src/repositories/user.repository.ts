import { and, eq, or } from 'drizzle-orm';
import { createDb } from '@personally/db/client';
import { users, type NewUser, type User } from '@personally/db/schema';

export interface UserRepository {
  create(user: NewUser): Promise<User>;
  findByIdentifier(identifier: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
}

export class D1UserRepository implements UserRepository {
  constructor(private readonly db: ReturnType<typeof createDb>) {}
  async create(user: NewUser) {
    const [created] = await this.db.insert(users).values(user).returning();
    return created;
  }
  async findByIdentifier(identifier: string) {
    return this.db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, identifier),
          eq(users.email, identifier),
          eq(users.phone, identifier),
        ),
      )
      .get();
  }
  async findById(id: string) {
    return this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.isActive, true)))
      .get();
  }
}
