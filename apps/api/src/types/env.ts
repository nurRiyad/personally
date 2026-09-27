import type { createAuthConfig } from '../utils/config';

export type Env = {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
    JWT_ISSUER?: string;
    JWT_AUDIENCE?: string;
    ALLOWED_ORIGINS?: string;
    ENABLE_DEV_SEED?: string;
  };
  Variables: {
    authConfig: ReturnType<typeof createAuthConfig>;
    authUserId: string;
    validatedBody: unknown;
  };
};
