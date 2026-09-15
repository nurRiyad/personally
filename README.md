# Personally

Personally is a personal management application bringing budgeting, asset management, and learning into one place.

The repository includes the application foundation, account authentication, and a persistent Learning Management module.

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
  ARCHITECTURE.md
  DEPLOYMENT.md
  DEVELOPMENT.md
  QUALITY.md
  SCOPE.md
```

## Getting started

Requirements: Node 24 and pnpm.

```bash
nvm use
pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars # then replace JWT_SECRET locally
pnpm setup:local
pnpm dev
```

The development servers run at:

- Web: http://localhost:3000
- API: http://localhost:8787

See [`AGENTS.md`](./AGENTS.md) for agent instructions and the relevant focused document in `docs/` for architecture, development, quality, deployment, or scope details.

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
- `/learning` — private epic overview, filters, sorting, and creation
- `/learning/epics/[id]` — epic details, ordered tasks, progress, and comments
- `/learning/epics/[id]/tasks/[taskId]` — task status, timer, manual time, and notes

## Learning development

Run `pnpm db:migrate:local` before starting the API after pulling database changes. Learning uses your signed-in account and starts empty; prototype fixtures are not imported into accounts. Create an epic, then add tasks to it.

Timer state is shared between learning pages in the current tab. Pause, Stop, and Complete save whole minutes. Unsaved time does not survive refreshing or leaving Learning; failed saves can be retried without adding duplicate time.

`pnpm test` includes API integration tests using Miniflare's isolated local D1 runtime, plus shared validation tests. These tests need permission to open local sockets and do not use production or the development database.

See [`docs/LEARNING.md`](./docs/LEARNING.md) for the current Learning API, web architecture, data model, and behavior.

## Contributing

Create focused feature branches and open a pull request against `main`. Before submitting, run the checks listed in the pull request template. Do not commit secrets, local D1 state, or generated build output.

## License

Released under the [MIT License](./LICENSE).
