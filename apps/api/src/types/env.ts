import type { AuthService } from '../services/auth.service';
import type { createAuthConfig } from '../config';

export type Env = {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
    JWT_ISSUER?: string;
    JWT_AUDIENCE?: string;
    ALLOWED_ORIGINS?: string;
  };
  Variables: {
    learningController: import('../controllers/learning.controller').LearningController;
    authConfig: ReturnType<typeof createAuthConfig>;
    authUserId: string;
    authService: AuthService;
    validatedBody: unknown;
  };
};
