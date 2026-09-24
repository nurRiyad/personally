# Personally Agent Instructions

Task-specific project references are listed below. The always-applicable rules in this file should be loaded for every task.

Before working, load NVM and run `nvm use`. Read the index, then load only the
topic document(s) relevant to the task:

- Web/UI or product scope: `docs/SCOPE.md` and `docs/ARCHITECTURE.md`
- API, D1, Drizzle, or local startup: `docs/DEVELOPMENT.md` and `docs/ARCHITECTURE.md`
- Tests, lint, formatting, types, or builds: `docs/QUALITY.md`
- CI, GitHub Actions, production migrations, or deployment: `docs/DEPLOYMENT.md`
- Budget feature work: `docs/BUDGET.md` (then load the relevant Web/UI or API/D1 documents above)

Do not load all foundation documents by default. In non-interactive shells, NVM may not be loaded automatically; use:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use
```

If `nvm` is still unavailable after this, report the environment issue and continue only with commands that do not depend on selecting the Node version.

## Always-applicable project rules

- Use Node 24 from `.nvmrc`, pnpm, and the existing monorepo structure.
- Keep one Git repository at the project root; do not create nested repositories.
- Keep product modules inside `apps/web` and `apps/api`; shared database and validation code belongs in `packages/db` and `packages/validation`.
- Use Wrangler local D1 for local database work. Never connect local development to production D1.
- Phase 0 does not define product functionality; preserve the current route/UI implementation and do not add speculative product features unless explicitly requested.
- Do not introduce Nx, Turborepo, Docker, Kubernetes, Redis, queues, microservices, or separate repositories at this stage.
- Use shadcn/ui when a suitable component exists for frontend UI; otherwise prefer native HTML or small local components.
- Treat shadcn/ui as the default for frontend UI: reuse an existing component before creating a bespoke equivalent, and add a local shadcn-style primitive when a needed component is not yet present.
- For every date field, use the shared shadcn date-picker composition (`Popover` + `Calendar`/`DayPicker` + Lucide calendar icon). Do not use a native `input type="date"` directly in application forms; keep date values as timezone-safe `YYYY-MM-DD` strings.
- For forms, use the existing React Hook Form dependency for form state and submission, and validate inputs with the shared Zod schemas from `@personally/validation` whenever a schema exists. Keep field-level errors accessible and close to their inputs.
- Keep changes focused, preserve existing patterns, and update `README.md` when commands or setup behavior changes.
- Never commit secrets, local database state, or generated build output. Commit intentional migration files.

## Project-local skills

Use the skills in `.agents/skills/` only when the task matches their purpose. Do not load all skills by default:

- `vercel-react-best-practices`: React or Next.js implementation, review, or performance work.
- `wrangler`: Cloudflare Workers, D1, Wrangler commands, configuration, or deployment.
- `vitest`: Test setup, test writing, or Vitest troubleshooting.
- `drizzle` / `drizzle-migrations`: Database schema, queries, or migrations.
- `github-actions`: CI/CD workflow design or changes.
- `shadcn` / `tailwind`: UI components or Tailwind styling.
- `web-design-guidelines`: UI, accessibility, or UX review.

For frontend UI work, always use a shadcn/ui component when a suitable component is available. Prefer native HTML and small local components when shadcn/ui does not provide a relevant component. For forms, use React Hook Form with shared Zod validation from `@personally/validation` rather than hand-rolled form state or ad hoc validation.

If a task does not match one of these areas, work without loading a project-local skill. Always follow the skill's `SKILL.md` instructions when it is used.

## Change discipline

- Keep Phase 0 pages minimal unless final UX is explicitly requested.
- Keep migrations committed; never commit secrets, local database state, or build output.
- Update `README.md` when developer commands or setup behavior changes.
- Follow existing patterns and keep changes focused; do not invent product requirements.
