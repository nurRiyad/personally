import { SignJWT, jwtVerify } from 'jose';
import { UnauthorizedError } from '../utils/errors';

type JwtConfig = {
  secret: string;
  issuer: string;
  audience: string;
  expiresInSeconds: number;
};

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(userId: string, config: JwtConfig) {
  return new SignJWT({ sub: userId, type: 'access' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setExpirationTime(`${config.expiresInSeconds}s`)
    .sign(key(config.secret));
}

export async function verifyAccessToken(token: string, config: JwtConfig) {
  try {
    const { payload } = await jwtVerify(token, key(config.secret), {
      issuer: config.issuer,
      audience: config.audience,
    });
    if (payload.type !== 'access' || typeof payload.sub !== 'string')
      throw new Error('Invalid subject');
    return { userId: payload.sub };
  } catch {
    throw new UnauthorizedError('Invalid or expired token.');
  }
}
