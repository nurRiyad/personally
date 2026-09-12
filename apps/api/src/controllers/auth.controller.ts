import type { Context } from 'hono';
import { AuthService } from '../services/auth.service';

export function createAuthController(service: AuthService) {
  return {
    register: async (c: Context) =>
      c.json({ data: await service.register(c.get('validatedBody')) }, 201),
    login: async (c: Context) =>
      c.json({ data: await service.login(c.get('validatedBody')) }),
    logout: (c: Context) => c.body(null, 204),
    me: async (c: Context) =>
      c.json({ data: { user: await service.me(c.get('authUserId')) } }),
  };
}
