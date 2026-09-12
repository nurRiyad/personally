import type { NewUser, User } from '@personally/db/schema';
import {
  ConflictError,
  InvalidCredentialsError,
  UnauthorizedError,
} from '../utils/errors';
import {
  hashPassword,
  passwordAlgorithm,
  verifyPassword,
} from '../security/password-hasher';
import { signAccessToken } from '../security/jwt';
import type { UserRepository } from '../repositories/user.repository';
import type { LoginRequest, RegisterRequest } from '@personally/validation';

type AuthConfig = {
  secret: string;
  issuer: string;
  audience: string;
  expiresInSeconds: number;
};
const normalizePhone = (value: string) =>
  value.replace(/[^\d+]/g, '').replace(/^00/, '+');
const normalizeUsername = (value: string) => value.trim().toLowerCase();
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const safeUser = (user: User) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  phone: user.phone,
});

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly config: AuthConfig,
  ) {}

  async register(input: RegisterRequest) {
    const normalized = {
      username: normalizeUsername(input.username),
      email: normalizeEmail(input.email),
      phone: normalizePhone(input.phone),
    };
    if (
      (await this.users.findByIdentifier(normalized.username)) ||
      (await this.users.findByIdentifier(normalized.email)) ||
      (await this.users.findByIdentifier(normalized.phone))
    )
      throw new ConflictError();
    const now = new Date();
    const user: NewUser = {
      id: crypto.randomUUID(),
      ...normalized,
      passwordHash: await hashPassword(input.password),
      passwordAlgorithm,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    try {
      const created = await this.users.create(user);
      return {
        user: safeUser(created),
        accessToken: await signAccessToken(created.id, this.config),
        tokenType: 'Bearer' as const,
      };
    } catch (error) {
      if (error instanceof Error && /unique|constraint/i.test(error.message))
        throw new ConflictError();
      throw error;
    }
  }

  async login(input: LoginRequest) {
    const raw = input.identifier.trim();
    const identifiers = [
      normalizeUsername(raw),
      normalizeEmail(raw),
      normalizePhone(raw),
    ].filter((identifier, index, all) => all.indexOf(identifier) === index);
    let user: User | undefined;
    for (const identifier of identifiers) {
      user = await this.users.findByIdentifier(identifier);
      if (user) break;
    }
    if (
      !user ||
      !user.isActive ||
      !(await verifyPassword(input.password, user.passwordHash))
    )
      throw new InvalidCredentialsError();
    return {
      user: safeUser(user),
      accessToken: await signAccessToken(user.id, this.config),
      tokenType: 'Bearer' as const,
    };
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError();
    return safeUser(user);
  }
}
