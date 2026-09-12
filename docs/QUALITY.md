# Quality and Testing

Configure strict TypeScript, ESLint, Prettier, and Vitest. Root commands: `pnpm format`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. `format` may edit; `format:check` only checks. Typecheck web, API, DB, and validation; build the Next.js app and Worker.

Vitest is currently configured at the root and the repository has a validation test. Frontend, backend, and domain test projects can be added as those areas gain logic. Before v1.0.0, tests are not a required CI gate; CI requires format check, lint, typecheck, and build. At v1.0.0, enable the existing test command without restructuring.
