# Personally

Personally is a personal management application bringing budgeting, asset management, and learning into one place.

This repository is currently in Phase 0: building a reliable production foundation before implementing product features.

## Stack

- **Web:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **API:** Hono on Cloudflare Workers
- **Database:** Cloudflare D1 with Drizzle ORM
- **Validation and data:** Zod, React Hook Form, TanStack Query
- **Quality:** ESLint, Prettier, Vitest, GitHub Actions
- **Deployment:** Vercel for the web app and Cloudflare for the API/database

## Project structure

```text
apps/
  web/          Next.js frontend
  api/          Hono Cloudflare Worker
packages/
  db/           Drizzle schema and D1 migrations
  validation/   Shared Zod schemas
.github/
  workflows/    CI and production deployment
  ...           Copilot and pull request guidance
docs/
  PROJECT_FOUNDATION.md
```

## Getting started

Requirements: Node 24 and pnpm.

```bash
nvm use
pnpm install
pnpm setup:local
pnpm dev
```

The development servers run at:

- Web: http://localhost:3000
- API: http://localhost:8787

Read [`docs/PROJECT_FOUNDATION.md`](./docs/PROJECT_FOUNDATION.md) for the full architecture and Phase 0 requirements.

## Useful commands

```bash
pnpm dev                 # Start web and API together
pnpm format              # Format source files
pnpm format:check        # Check formatting
pnpm lint                # Run ESLint
pnpm typecheck           # Type-check all workspaces
pnpm test                # Run tests
pnpm build               # Build web and API
pnpm db:generate         # Generate Drizzle migrations
pnpm db:migrate:local    # Apply migrations to local D1
pnpm db:reset:local      # Reset local D1 and reapply migrations
```

## Current routes

- `/` — public placeholder page
- `/dashboard` — application shell placeholder
- `/budget` — Monthly Budget placeholder
- `/assets` — Asset Management placeholder
- `/learning` — Learning Management placeholder

## Contributing

Create focused feature branches and open a pull request against `main`. Before submitting, run the checks listed in the pull request template. Do not commit secrets, local D1 state, or generated build output.

## License

Released under the [MIT License](./LICENSE).
