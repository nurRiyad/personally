# Personally Agent Instructions

The detailed project and agent instructions are maintained in [`docs/PROJECT_FOUNDATION.md`](./docs/PROJECT_FOUNDATION.md).

Before working, load NVM and run `nvm use`, then read that document for the current scope, architecture, commands, and quality requirements. In non-interactive shells, NVM may not be loaded automatically; use:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use
```

If `nvm` is still unavailable after this, report the environment issue and continue only with commands that do not depend on selecting the Node version.

## Project-local skills

Use the skills in `.agents/skills/` only when the task matches their purpose. Do not load all skills by default:

- `vercel-react-best-practices`: React or Next.js implementation, review, or performance work.
- `wrangler`: Cloudflare Workers, D1, Wrangler commands, configuration, or deployment.
- `vitest`: Test setup, test writing, or Vitest troubleshooting.
- `drizzle` / `drizzle-migrations`: Database schema, queries, or migrations.
- `github-actions`: CI/CD workflow design or changes.
- `shadcn` / `tailwind`: UI components or Tailwind styling.
- `web-design-guidelines`: UI, accessibility, or UX review.

For frontend UI work, always use a shadcn/ui component when a suitable component is available. Prefer native HTML and small local components when shadcn/ui does not provide a relevant component.

If a task does not match one of these areas, work without loading a project-local skill. Always follow the skill's `SKILL.md` instructions when it is used.
