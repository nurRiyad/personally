# Development and Database

`pnpm dev` currently starts Next.js and Wrangler through `concurrently`; it does not automatically apply migrations. Run `pnpm setup:local` or `pnpm db:migrate:local` first when needed. Expected URLs are `http://localhost:3000` and `http://localhost:8787`.

Use persistent Wrangler local D1 state where practical. Keep local and production D1 completely separate; never connect ordinary local work to production. Ignore local DB state. Migrations are the source of truth: `pnpm db:generate`, `pnpm db:migrate:local`, and `pnpm db:migrate:prod`. A reset command, if provided, must be development-only; production reset functionality must not exist.

`apps/web/.env.example` provides `NEXT_PUBLIC_API_URL=http://localhost:8787`. Copy `apps/api/.dev.vars.example` to `apps/api/.dev.vars` for local Worker secrets; `JWT_SECRET` is required for registration and login. Never commit real secrets. The API provides `GET /health` returning `{"data":{"status":"ok"}}`. Budget and Learning use the local D1 database after their committed migrations have been applied.

## D1 migration checks

- In a `CREATE TRIGGER` body, wrap `CASE ... END` in parentheses, for example `SELECT (CASE WHEN ... THEN ... END);`. D1 has a known trigger parsing issue with an unparenthesized `CASE ... END`, which can fail remotely with `incomplete input` even when local SQLite accepts it. See [Cloudflare Workers SDK issue #4727](https://github.com/cloudflare/workers-sdk/issues/4727).
- Before deploying a migration that adds triggers or otherwise depends on D1-specific behavior, apply the complete migration history to a disposable **remote test D1 database** using a temporary Wrangler config that points only to that test database. A successful local migration alone does not prove the remote D1 migration path will accept it.
- Confirm the test database records the migration in `d1_migrations` and contains the expected schema objects. Delete the temporary database and config after the check.
- Never diagnose a failed production migration by applying its statements one at a time to production. Use an isolated test database; do not manually edit `d1_migrations`.
