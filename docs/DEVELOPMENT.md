# Development and Database

`pnpm dev` currently starts Next.js and Wrangler through `concurrently`; it does not automatically apply migrations. Run `pnpm setup:local` or `pnpm db:migrate:local` first when needed. Expected URLs are `http://localhost:3000` and `http://localhost:8787`.

Use persistent Wrangler local D1 state where practical. Keep local and production D1 completely separate; never connect ordinary local work to production. Ignore local DB state. Migrations are the source of truth: `pnpm db:generate`, `pnpm db:migrate:local`, and `pnpm db:migrate:prod`. A reset command, if provided, must be development-only; production reset functionality must not exist.

`apps/web/.env.example` provides `NEXT_PUBLIC_API_URL=http://localhost:8787`. An API `.dev.vars.example` is not currently present. Never commit real secrets. The API provides `GET /health` returning `{"data":{"status":"ok"}}`; DB integration should be treated as a foundation target until implemented.
