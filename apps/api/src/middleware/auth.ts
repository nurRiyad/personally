import type { Context, Next } from 'hono';
import { UnauthorizedError } from '../utils/errors';
import { verifyAccessToken } from '../security/jwt';

export async function requireAuth(c: Context, next: Next) {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedError();
  const config = c.get('authConfig');
  const token = header.slice(7).trim();
  c.set('authUserId', (await verifyAccessToken(token, config)).userId);
  await next();
}
