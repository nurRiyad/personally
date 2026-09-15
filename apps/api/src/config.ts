export function createAuthConfig(env: {
  JWT_SECRET: string;
  JWT_ISSUER?: string;
  JWT_AUDIENCE?: string;
}) {
  return {
    secret: env.JWT_SECRET,
    issuer: env.JWT_ISSUER ?? 'personally-api',
    audience: env.JWT_AUDIENCE ?? 'personally-web',
    expiresInSeconds: 7 * 24 * 60 * 60,
  };
}
