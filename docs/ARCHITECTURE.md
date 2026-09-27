# Architecture and Stack

Use pnpm workspaces; Next.js, TypeScript, Tailwind, shadcn/ui, Motion, React Hook Form, Zod, TanStack Query; Hono on Cloudflare Workers; Cloudflare D1 with Drizzle; Prettier, ESLint, Vitest; GitHub Actions; Vercel; and Wrangler.

Use one repository with `apps/web`, `apps/api`, `packages/db`, and `packages/validation`. Keep modules inside the apps and use workspace dependencies. There must be only one root `.git` directory.

Local and production follow `Next.js → Hono Worker → Cloudflare D1`. Local development uses Wrangler’s local D1—not PostgreSQL, MySQL, unrelated SQLite, or a mock database. Do not introduce Nx, Turborepo, Docker, Kubernetes, Redis, queues, microservices, or separate repositories at this stage.

## API Architecture

All API features follow this dependency direction:

```text
Route → Service → Repository → Database
```

- `apps/api/src/index.ts` is the single Worker entrypoint. It creates the Hono app, mounts the route tree, registers shared error handling, and exports the Worker. Do not create a separate `app.ts` entrypoint.
- `apps/api/src/features/` groups feature code together (`auth`, `budget`, `assets`, `learning`, `health`). Each feature owns its routes, service, and repository where needed. `features/index.ts` mounts the route tree; individual feature route files define paths, validate HTTP input, call services, and format HTTP responses.
- Services contain application and domain behavior and stay independent of Hono. They receive repository dependencies through constructors so tests can provide in-memory fakes.
- Repositories contain persistence interfaces and D1/Drizzle implementations. They must not format HTTP responses or know about Hono.
- `apps/api/src/middleware/` contains request-pipeline concerns: CORS, validation, authentication, and the global error handler. If a function receives a Hono context and calls `next`, it belongs here. Pure helpers that do not participate in the request pipeline belong in `utils/`.
- `apps/api/src/utils/` contains shared non-request utilities such as error classes, normalization helpers, and other framework-independent helpers. Do not put Hono middleware in this folder.
- Keep dependency construction in a small feature-level factory or route composition helper; do not recreate controller factories inside every request handler.

### Validation and Errors

- Define reusable request, response, and error schemas in `packages/validation` using Zod.
- Validate request bodies in middleware before route handlers call services.
- Use typed application errors and one shared error handler to map domain failures to structured HTTP responses.
- Never expose database errors, credentials, password hashes, secrets, or account-enumeration details.

### Database Schema Layout

- Database changes start with a committed SQL migration in `packages/db/migrations`.
- Each database table gets its own file under `packages/db/src/schema/`.
- `packages/db/src/schema/index.ts` is the schema barrel and exports all table definitions.
- `packages/db/src/index.ts` re-exports the database client and schema barrel.
- `packages/db/drizzle.config.ts` must point to `src/schema/index.ts`.
- Do not place multiple table definitions in a single top-level `schema.ts` file.
