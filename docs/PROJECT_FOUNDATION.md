# Personally — Phase 0 Project Foundation

## 1. Current Goal

The current work is NOT to implement Personally's product features.

The current goal is to build a production-ready foundation with:

* monorepo structure
* local development environment
* local database
* frontend development server
* backend development server
* readable frontend/backend logs
* formatting
* linting
* type checking
* production builds
* test infrastructure
* GitHub CI
* automatic production deployment
* Cloudflare D1 migrations
* Vercel frontend deployment
* Cloudflare Worker backend deployment

Actual product design will happen later.

Do not spend time designing the final UI.

---

# 2. Technology Stack

Use:

```text
Package Manager
pnpm

Monorepo
pnpm workspaces

Frontend
Next.js
TypeScript
Tailwind
shadcn/ui
Motion
React Hook Form
Zod
TanStack Query

Backend
Hono
Cloudflare Workers

Database
Cloudflare D1

ORM
Drizzle ORM

Validation
Zod

Formatting
Prettier

Linting
ESLint

Testing
Vitest

CI/CD
GitHub Actions

Frontend Production
Vercel

Backend Production
Cloudflare Workers
```

Do NOT introduce:

```text
Nx
Turborepo
Docker
Kubernetes
Redis
queues
microservices
separate repositories
```

at this stage.

---

# 3. Repository Structure

Use one Git repository.

```text
personally/
│
├── apps/
│   │
│   ├── web/
│   │   ├── src/
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   │
│   └── api/
│       ├── src/
│       ├── package.json
│       ├── wrangler.jsonc
│       └── tsconfig.json
│
├── packages/
│   │
│   ├── db/
│   │   ├── src/
│   │   ├── migrations/
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── validation/
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy-production.yml
│
├── .prettierignore
├── .prettierrc
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

There must only be one:

```text
.git/
```

at the repository root.

---

# 4. Initial Personally Applications

Personally initially contains three independent applications:

```text
Monthly Budget

Asset Management

Learning Management
```

These are modules inside the same Personally product.

They are NOT separate deployable services.

For Phase 0, create only simple placeholder pages.

Example:

```text
/budget

Monthly Budget
Hello World
```

```text
/assets

Asset Management
Hello World
```

```text
/learning

Learning Management
Hello World
```

Do NOT design their real dashboards yet.

---

# 5. Initial Frontend Routes

Phase 0 only needs enough routes to verify architecture.

Create:

```text
/
```

Simple placeholder public page:

```text
Personally
Hello World
```

Create:

```text
/dashboard
```

Simple authenticated-app-shell placeholder.

It can contain links/cards for:

```text
Monthly Budget
Asset Management
Learning Management
```

Also create:

```text
/budget
/assets
/learning
```

Do not spend significant effort styling these pages.

The real UX will be designed later.

---

# 6. Rendering Foundation

Keep the architecture ready for two rendering modes.

## Public website

Future public pages such as:

```text
/
/about
/privacy
/terms
```

will use Next.js server/static rendering for SEO.

### Public-page layout convention

All public pages must use the shared centered content frame:

```text
mx-auto w-full max-w-6xl px-5 sm:px-8
```

This keeps public-page content aligned with the site header and footer. Inner
text blocks may use a narrower maximum width when needed for readable line
lengths, but their outer frame must remain `max-w-6xl`.

## Application

Future pages such as:

```text
/dashboard
/budget
/assets
/learning
```

will behave primarily as CSR application pages.

However, Phase 0 does NOT need the final public pages or final authenticated experience.

Only establish route organization and layouts.

---

# 7. pnpm Workspace

Create:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Use workspace dependencies such as:

```json
{
  "@personally/db": "workspace:*",
  "@personally/validation": "workspace:*"
}
```

---

# 8. Local Development Philosophy

Local development should be as close to production as reasonably possible.

Production:

```text
Next.js
   ↓
Hono Worker
   ↓
Cloudflare D1
```

Local:

```text
Next.js dev server
   ↓
Hono through Wrangler
   ↓
local D1 through Wrangler
```

Do NOT replace D1 locally with:

```text
PostgreSQL
MySQL
random SQLite setup
mock database
```

Use Wrangler's local D1 support.

The goal is:

```text
same Worker code
same D1 binding
same Drizzle schema
same migrations
```

between local and production.

---

# 9. Local D1

Use Wrangler's local D1 environment.

Running:

```bash
wrangler dev
```

should use a local D1 database.

Local database data should persist between development server restarts.

Production D1 must remain completely separate.

Do NOT accidentally connect normal local development directly to production D1.

---

# 10. Local Database Location

Use an explicit persistence location where practical.

For example:

```text
.personally/
└── d1/
```

or Wrangler's normal local state directory.

The exact implementation can follow current Wrangler conventions.

Add generated local DB state to:

```text
.gitignore
```

Do not commit local database files.

---

# 11. Database Migrations

Database migrations are the single source of truth.

Use Drizzle to generate migrations.

Use Wrangler to apply D1 migrations.

Required commands:

```bash
pnpm db:generate
```

Generate migration files from Drizzle schema.

```bash
pnpm db:migrate:local
```

Apply unapplied migrations to local D1.

```bash
pnpm db:migrate:prod
```

Apply unapplied migrations to production D1.

The production migration command must not be casually executed during normal development.

---

# 12. Local Development Startup

The ideal developer workflow should be:

```bash
git clone ...
cd personally
pnpm install
pnpm dev
```

and then development is ready.

`pnpm dev` should:

```text
1. Apply pending migrations to local D1

2. Start Next.js

3. Start Hono through Wrangler

4. Stream logs from both processes
```

Expected URLs:

```text
Web
http://localhost:3000

API
http://localhost:8787
```

---

# 13. Development Logs

When running:

```bash
pnpm dev
```

both servers should run in the same terminal session.

Logs must remain distinguishable.

Example:

```text
[web]  GET /dashboard 200
[web]  Compiled /budget

[api]  GET /health 200
[api]  POST /api/example 201
```

Use pnpm's parallel/stream capabilities or a small development dependency such as `concurrently`.

Prefer the simplest reliable solution.

The developer should not need to manually maintain two terminals unless desired.

---

# 14. Development Scripts

Root `package.json` should expose clear commands.

Approximately:

```json
{
  "scripts": {
    "dev": "...",
    "dev:web": "...",
    "dev:api": "...",

    "build": "...",
    "build:web": "...",
    "build:api": "...",

    "typecheck": "...",
    "lint": "...",

    "format": "...",
    "format:check": "...",

    "test": "...",
    "test:watch": "...",

    "db:generate": "...",
    "db:migrate:local": "...",
    "db:migrate:prod": "..."
  }
}
```

Exact command syntax should use the installed current versions of the tools.

---

# 15. Optional Local Setup Command

Also provide:

```bash
pnpm setup:local
```

This should perform safe first-time local initialization.

For example:

```text
verify environment files
apply local database migrations
perform any local setup required
```

It must NOT modify production resources.

---

# 16. Environment Files

Provide example environment files.

Example:

```text
apps/web/.env.example

apps/api/.dev.vars.example
```

Do NOT commit real secrets.

Frontend example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

Backend development secrets should use the Wrangler-supported local secret file.

---

# 17. Database Development Convenience

The developer must be able to quickly:

```text
create a migration
apply it
inspect local database
reset development data if necessary
```

Provide documented scripts.

Suggested:

```bash
pnpm db:generate

pnpm db:migrate:local

pnpm db:studio
```

If Drizzle Studio works cleanly with the chosen D1 local setup, expose it.

If not, document the simplest supported way to inspect local D1.

Do not create a custom database admin tool.

---

# 18. Local Database Reset

Provide a clearly named development-only command if practical:

```bash
pnpm db:reset:local
```

It may:

```text
delete local D1 state
recreate it
apply all migrations
```

It must be impossible for this command to reset production accidentally.

Production reset functionality must NOT exist.

---

# 19. API Health Endpoint

Create:

```http
GET /health
```

Return:

```json
{
  "data": {
    "status": "ok"
  }
}
```

Also create a simple internal DB health check or development route that proves:

```text
Hono
 ↓
Drizzle
 ↓
D1
```

works correctly.

Do not build product endpoints yet.

---

# 20. Code Quality

Phase 0 must configure:

```text
TypeScript strict mode

ESLint

Prettier
```

The following commands must exist:

```bash
pnpm typecheck
pnpm lint
pnpm format
pnpm format:check
pnpm build
```

All commands must work from the repository root.

---

# 21. Formatting

Use Prettier.

Provide:

```text
.prettierrc
.prettierignore
```

Use one formatting configuration for the repository where possible.

Command:

```bash
pnpm format
```

should modify files.

Command:

```bash
pnpm format:check
```

should only check formatting and return non-zero when formatting is incorrect.

CI should run:

```bash
pnpm format:check
```

not:

```bash
pnpm format
```

CI must never silently modify source code.

---

# 22. Type Checking

Each workspace should have a proper TypeScript configuration.

Root command:

```bash
pnpm typecheck
```

must type-check:

```text
web
api
packages/db
packages/validation
```

Use strict TypeScript.

---

# 23. Production Build

Root:

```bash
pnpm build
```

must prove that production builds succeed.

It should build at least:

```text
Next.js application
Cloudflare Worker application
```

Shared packages should also be type-safe/buildable as appropriate.

---

# 24. Testing Foundation

Install and configure:

```text
Vitest
```

now.

The testing architecture should support:

```text
frontend unit tests
backend unit tests
domain/business logic tests
validation tests
```

Use a root Vitest configuration with multiple projects where useful.

Conceptually:

```ts
test: {
  projects: [
    "apps/web",
    "apps/api",
    "packages/*"
  ]
}
```

Do not create large fake test suites simply to say tests exist.

---

# 25. Testing Before v1.0.0

Before:

```text
v1.0.0
```

tests are NOT a mandatory CI gate.

Meaning the following should be required:

```text
format check
lint
typecheck
build
```

but:

```text
tests
```

do not have to block deployment yet.

However:

```bash
pnpm test
```

must already exist.

Vitest infrastructure must already be ready.

This avoids having to restructure testing later.

---

# 26. Testing After v1.0.0

When the project reaches:

```text
v1.0.0
```

change CI to require:

```text
format check
lint
typecheck
test
build
```

No architectural changes should be necessary at that point.

Only enable the existing test command as a required gate.

---

# 27. Git Workflow

Use:

```text
main
```

as the production branch.

Normal workflow:

```text
feature branch
      ↓
Pull Request
      ↓
CI
      ↓
merge
      ↓
main
      ↓
CI again
      ↓
production deployment
```

Production deployment must NEVER run before the main-branch CI succeeds.

---

# 28. GitHub CI Workflow

Create:

```text
.github/workflows/ci.yml
```

Run CI for:

```yaml
pull_request:

push:
  branches:
    - main
```

CI should:

```text
checkout repository
        ↓
setup Node
        ↓
setup pnpm
        ↓
pnpm install --frozen-lockfile
        ↓
pnpm format:check
        ↓
pnpm lint
        ↓
pnpm typecheck
        ↓
pnpm build
```

Before v1.0.0:

```text
do not require tests
```

After v1.0.0:

```text
pnpm test
```

should be inserted before build or as a parallel required job.

---

# 29. GitHub Branch Protection

Document that `main` should eventually have GitHub branch protection enabled.

Require:

```text
CI must pass before merge
```

Direct production changes should normally happen through PRs.

Do not hard-code repository-specific GitHub settings into the application.

Document the recommended settings in README.

---

# 30. Separate CI and Deployment Workflows

Use two workflows:

```text
ci.yml

deploy-production.yml
```

Do NOT combine deployment directly into an unchecked `push main` job.

The deployment workflow must only run after CI for the `main` commit succeeds.

Desired flow:

```text
push/merge → main
        ↓
CI
        ↓
SUCCESS?
   │
   ├── no → STOP
   │
   └── yes
        ↓
Production Deployment
```

A GitHub `workflow_run` dependency is acceptable for implementing this.

---

# 31. Production Deployment Workflow

Create:

```text
.github/workflows/deploy-production.yml
```

Trigger only after successful completion of the CI workflow for `main`.

Deployment flow:

```text
CI passed
   ↓
checkout exact commit
   ↓
install dependencies
   ↓
apply production D1 migrations
   ↓
deploy Cloudflare Worker
   ↓
deploy Next.js to Vercel
```

Deployment must stop immediately if migration fails.

---

# 32. Production Database Migration

Before backend deployment:

```bash
wrangler d1 migrations apply <database> --remote
```

or the current equivalent should apply pending production migrations.

Cloudflare's D1 migration tooling tracks unapplied migrations, so deployment should apply only migrations that have not already been applied.

Do not run arbitrary SQL in the deployment workflow.

Use committed migration files.

---

# 33. Migration Safety Rule

All normal application migrations should be backward compatible where possible.

Prefer:

```text
add table
add nullable column
add index
introduce new schema
```

before immediately performing destructive changes.

Reason:

```text
migration succeeds
Worker deployment follows
```

There can briefly be a database schema newer than the currently running Worker.

Therefore migrations should avoid unnecessarily breaking the previously deployed application.

---

# 34. Cloudflare Worker Deployment

Use the official Cloudflare Wrangler deployment tooling.

Required GitHub secrets:

```text
CLOUDFLARE_API_TOKEN

CLOUDFLARE_ACCOUNT_ID
```

Use:

```text
cloudflare/wrangler-action
```

or the equivalent current officially supported approach.

Cloudflare officially supports deploying Workers through GitHub Actions using Wrangler and API credentials stored as GitHub secrets.

Worker project directory:

```text
apps/api
```

---

# 35. Vercel Deployment

Production frontend:

```text
apps/web
```

should deploy to Vercel.

Use Vercel CLI from GitHub Actions rather than relying on a second uncontrolled automatic Git deployment.

This is important because deployment should occur only after our CI gate succeeds.

Conceptually:

```bash
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```

or use the current officially supported Vercel CLI deployment flow.

A production Vercel deployment can be triggered through `vercel deploy --prod`.

Required secrets typically include:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

Do not commit these values.

---

# 36. Avoid Duplicate Vercel Deployments

If GitHub Actions owns production deployment:

disable or configure Vercel's Git integration so a merge to `main` does NOT create another independent production deployment before CI has passed.

There should be one clear deployment owner.

For this project:

```text
GitHub Actions
```

owns the production deployment pipeline.

---

# 37. Deployment Job Dependencies

Production deployment should conceptually contain jobs like:

```text
migration
   ↓
backend deployment
   ↓
frontend deployment
```

or:

```text
migration
      ↓
 ┌────┴────┐
 ↓         ↓
API       Web
```

after migration succeeds.

Because frontend and backend are independently deployable, they may deploy in parallel after database migration if that remains safe.

For Phase 0, sequential deployment is also acceptable because simplicity is more important than saving seconds.

---

# 38. Production Secrets

GitHub should contain required deployment secrets.

Examples:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID

VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

Runtime application secrets should remain in:

```text
Cloudflare Worker secrets

Vercel environment variables
```

unless CI specifically requires them.

Do not put production secrets into:

```text
.env
repository files

---

# Agent Working Instructions

These instructions apply to agents working on this repository.

## Before working

- Run `nvm use` from the repository root. This selects Node 24 from `.nvmrc`.
- Use `pnpm` for package management and scripts.
- Keep changes within the existing monorepo structure.

## Project boundaries

- Phase 0 is foundation work. Keep pages minimal and do not design the final product UI unless explicitly requested.
- Keep product modules inside `apps/web` and `apps/api`.
- Shared database and validation code belongs in `packages/db` and `packages/validation`.
- Use Wrangler’s local D1 for local database work. Never connect local development to production D1.

## Quality checks

After changes, run the applicable checks:

```bash
nvm use
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run `pnpm format` when formatting needs to be applied. Keep migrations committed and do not commit secrets, local database state, or generated build output.

## Change discipline

- Follow existing patterns and keep changes focused.
- Update `README.md` when developer commands or setup behavior changes.
- Treat this document as the detailed source of truth; keep `AGENTS.md` concise and refer back here.
Git history
```

---

# 39. Local Development and Production Parity

The intended parity is:

```text
LOCAL                           PRODUCTION

Next dev                        Next/Vercel
   │                               │
   ▼                               ▼
Hono / Wrangler                 Hono Worker
   │                               │
   ▼                               ▼
local D1                        Cloudflare D1
```

Local D1 runs through Wrangler/Miniflare and is isolated from production while using Cloudflare's local Worker/D1 development model.

This is close enough to production without making local development painful.

---

# 40. Developer Experience Target

A new developer or AI agent should be able to run:

```bash
git clone <repo>
cd personally
pnpm install
pnpm dev
```

and receive something similar to:

```text
[db]  Local migrations applied

[web] ▲ Next.js
[web] Local: http://localhost:3000

[api] Cloudflare Worker
[api] Ready: http://localhost:8787
[api] D1 binding: local
```

Then opening:

```text
http://localhost:3000
```

should work immediately.

---

# 41. Development Verification

After startup, verify:

```text
GET localhost:8787/health
```

works.

Frontend should also contain one small development integration proving it can communicate with the API.

For example:

```text
API Status: Connected
```

on the temporary root or setup page.

This is only for Phase 0 and can later be removed.

---

# 42. Phase 0 UI

Do NOT design the product.

Only create minimal pages.

Example root:

```text
Personally

Project foundation is running.

API: Connected
```

Dashboard:

```text
Personally

Applications

Monthly Budget
Asset Management
Learning Management
```

Budget:

```text
Monthly Budget

Hello World
```

Assets:

```text
Asset Management

Hello World
```

Learning:

```text
Learning Management

Hello World
```

That's enough.

---

# 43. shadcn/ui

Set up shadcn/ui correctly.

Only install a minimal set of components needed for the placeholder UI, such as:

```text
Button
Card
```

Do not install every shadcn component.

The setup itself matters more than visual design right now.

---

# 44. React Hook Form + Zod

Configure the dependencies and shared validation architecture.

Create one trivial development/example form only if necessary to prove the integration.

Do not build product forms yet.

---

# 45. TanStack Query

Configure:

```text
QueryClient
QueryClientProvider
```

and central API access.

A health-query can be used to prove:

```text
Next.js
 ↓
TanStack Query
 ↓
Hono
```

works.

Do not create product queries yet.

---

# 46. Motion

Install and configure Motion.

No significant animations need to be implemented during Phase 0.

A tiny nonessential usage is enough to verify configuration if desired.

Do not spend time on animation design.

---

# 47. Drizzle Package

`packages/db` owns:

```text
Drizzle schema
migration generation
database types
```

Initially create only the minimum database structure required to verify migration support.

Do NOT create tables for:

```text
budgets
assets
learning
```

yet unless there is a concrete Phase 0 need.

The real database design happens during vertical feature development.

---

# 48. Validation Package

Create:

```text
@personally/validation
```

with the package structure ready.

Do not fill it with speculative product schemas.

Only add schemas required by current foundation code.

---

# 49. Test Structure

Configure Vitest now.

Suggested organization:

```text
apps/web/
└── vitest.config.ts

apps/api/
└── vitest.config.ts

packages/db/
└── vitest.config.ts

packages/validation/
└── vitest.config.ts
```

or use root projects configuration where simpler.

Prefer the least complicated valid setup.

Vitest supports monorepo projects through its current `test.projects` configuration.

---

# 50. README

README must explain:

## Installation

```bash
pnpm install
```

## Local development

```bash
pnpm dev
```

## Individual services

```bash
pnpm dev:web

pnpm dev:api
```

## Formatting

```bash
pnpm format

pnpm format:check
```

## Linting

```bash
pnpm lint
```

## Type checking

```bash
pnpm typecheck
```

## Building

```bash
pnpm build
```

## Tests

```bash
pnpm test
```

Mention that tests are configured but not a required CI gate before v1.0.0.

## Database

```bash
pnpm db:generate

pnpm db:migrate:local
```

## Local DB reset

```bash
pnpm db:reset:local
```

if implemented.

## Deployment

Explain:

```text
PR
 ↓
CI
 ↓
merge main
 ↓
CI
 ↓
D1 migration
 ↓
Cloudflare deployment
 ↓
Vercel deployment
```

---

# 51. Phase 0 Definition of Done

The foundation is complete only when all of these work.

```text
01. One Git monorepo                         ✓

02. pnpm workspace                          ✓

03. pnpm install                            ✓

04. pnpm dev                                ✓

05. Next.js starts                          ✓

06. Wrangler/Hono starts                    ✓

07. Both logs visible together              ✓

08. Local D1 starts automatically           ✓

09. Local D1 persists data                  ✓

10. Local migrations apply                  ✓

11. Drizzle works with local D1             ✓

12. /health works                           ✓

13. Frontend can call /health               ✓

14. / loads                                 ✓

15. /dashboard loads                        ✓

16. /budget loads                           ✓

17. /assets loads                           ✓

18. /learning loads                         ✓

19. shadcn configured                       ✓

20. Tailwind configured                     ✓

21. React Hook Form installed/configured    ✓

22. Zod installed/configured                ✓

23. TanStack Query configured               ✓

24. Motion configured                       ✓

25. pnpm format works                       ✓

26. pnpm format:check works                 ✓

27. pnpm lint works                         ✓

28. pnpm typecheck works                    ✓

29. pnpm build works                        ✓

30. Vitest configured                       ✓

31. pnpm test command works                 ✓

32. GitHub PR CI works                      ✓

33. GitHub main CI works                    ✓

34. Failed CI blocks deployment             ✓

35. Production D1 migration pipeline works ✓

36. Cloudflare Worker deploy works          ✓

37. Vercel deployment works                 ✓

38. README documents everything             ✓
```

---

# 52. Important Phase 0 Rule

Do NOT start implementing actual:

```text
Budget functionality
Asset functionality
Learning functionality
final authentication
final homepage
final dashboard
final navigation
final product design
```

during this phase.

Only establish the technical foundation.

When Phase 0 is complete, product development will happen through vertical slices.

---

# 53. Instruction to Codex

Implement this specification as a project-foundation task.

Prioritize:

```text
reliable local development
production parity
clear scripts
simple architecture
clean CI/CD
reproducible builds
safe database migrations
good developer experience
```

over product features.

Do not invent product requirements.

Do not over-engineer.

Do not add Nx or Turborepo.

Do not add infrastructure that is not necessary.

Use current stable versions of dependencies that are compatible with each other.

After implementation:

1. run formatting checks,
2. run linting,
3. run type checking,
4. run production builds,
5. run available test command,
6. verify local D1 migration,
7. verify web → API communication,
8. summarize any manual Cloudflare/Vercel/GitHub setup still required.

The Phase 0 output should leave the repository ready for the first real vertical product feature.
