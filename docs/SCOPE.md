# Scope and Product Boundaries

Personally is currently in Phase 0: build the monorepo foundation, local development, database, servers, logs, quality tooling, tests, CI, and deployment. Do not design final product UI unless explicitly requested.

Initial modules are one product, not separate services: Monthly Budget (`/budget`), Asset Management (`/assets`), and Learning Management (`/learning`). Current routes are `/`, `/about`, `/privacy`, `/terms`, `/dashboard`, `/budget`, `/assets`, and `/learning`. Phase 0 does not add product/domain functionality.

Public pages use Next.js server/static rendering for SEO and the outer frame `mx-auto w-full max-w-6xl px-5 sm:px-8`. Application pages are primarily CSR.
