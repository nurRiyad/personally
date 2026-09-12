# Architecture and Stack

Use pnpm workspaces; Next.js, TypeScript, Tailwind, shadcn/ui, Motion, React Hook Form, Zod, TanStack Query; Hono on Cloudflare Workers; Cloudflare D1 with Drizzle; Prettier, ESLint, Vitest; GitHub Actions; Vercel; and Wrangler.

Use one repository with `apps/web`, `apps/api`, `packages/db`, and `packages/validation`. Keep modules inside the apps and use workspace dependencies. There must be only one root `.git` directory.

Local and production follow `Next.js → Hono Worker → Cloudflare D1`. Local development uses Wrangler’s local D1—not PostgreSQL, MySQL, unrelated SQLite, or a mock database. Do not introduce Nx, Turborepo, Docker, Kubernetes, Redis, queues, microservices, or separate repositories at this stage.
