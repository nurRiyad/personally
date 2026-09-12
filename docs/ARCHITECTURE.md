# Architecture and Stack

Use pnpm workspaces; Next.js, TypeScript, Tailwind, shadcn/ui, Motion, React Hook Form, Zod, TanStack Query; Hono on Cloudflare Workers; Cloudflare D1 with Drizzle; Prettier, ESLint, Vitest; GitHub Actions; Vercel; and Wrangler.

Use one repository with `apps/web`, `apps/api`, `packages/db`, and `packages/validation`. Keep modules inside the apps and use workspace dependencies. There must be only one root `.git` directory.

Local and production follow `Next.js → Hono Worker → Cloudflare D1`. Local development uses Wrangler’s local D1—not PostgreSQL, MySQL, unrelated SQLite, or a mock database. Do not introduce Nx, Turborepo, Docker, Kubernetes, Redis, queues, microservices, or separate repositories at this stage.

## API Architecture

All API features follow this dependency direction:

```text
Route → Controller → Service → Repository → Database
```

- `apps/api/src/index.ts` is the single Worker entrypoint. It creates the Hono app, mounts the route tree, registers shared error handling, and exports the Worker. Do not create a separate `app.ts` entrypoint.
- `apps/api/src/routes/index.ts` is the route composition barrel. It exports or mounts every route module and owns route-tree middleware such as auth dependency composition. Individual route files define paths, HTTP methods, and route-specific middleware only.
- `apps/api/src/controllers/` contains thin HTTP adapters. Controllers read Hono request/context data, call services, and format HTTP responses. They must not contain business rules or direct database queries. Export controllers through `controllers/index.ts`.
- `apps/api/src/services/` contains application and domain behavior. Services are framework-independent and receive repositories or other dependencies through constructors. Export services through `services/index.ts`.
- `apps/api/src/repositories/` contains persistence interfaces and D1/Drizzle implementations. Repositories must not format HTTP responses or know about Hono. Export implementations and interfaces through `repositories/index.ts`.
- `apps/api/src/middleware/` contains request-pipeline concerns: CORS, validation, authentication, and the global error handler. If a function receives a Hono context and calls `next`, it belongs here. Pure helpers that do not participate in the request pipeline belong in `utils/`.
- `apps/api/src/utils/` contains shared non-request utilities such as error classes, normalization helpers, and other framework-independent helpers. Do not put Hono middleware in this folder.
- Use dependency injection at the route composition boundary so services and controllers can be tested with in-memory repository fakes. Do not recreate controller factories inside every request handler.

### Validation and Errors

- Define reusable request, response, and error schemas in `packages/validation` using Zod.
- Validate request bodies in middleware before controllers run.
- Use typed application errors and one shared error handler to map domain failures to structured HTTP responses.
- Never expose database errors, credentials, password hashes, secrets, or account-enumeration details.

### Database Schema Layout

- Database changes start with a committed SQL migration in `packages/db/migrations`.
- Each database table gets its own file under `packages/db/src/schema/`.
- `packages/db/src/schema/index.ts` is the schema barrel and exports all table definitions.
- `packages/db/src/index.ts` re-exports the database client and schema barrel.
- `packages/db/drizzle.config.ts` must point to `src/schema/index.ts`.
- Do not place multiple table definitions in a single top-level `schema.ts` file.
