# Scope and Product Boundaries

Personally is in an early product phase: maintain the monorepo foundation, local development, database, servers, logs, quality tooling, tests, CI, and deployment while delivering explicitly requested product modules. Do not design speculative final product UI unless explicitly requested.

The modules are one product, not separate services: Monthly Budget (`/budget`), Asset Management (`/assets`), and Learning Management (`/learning`). Current routes are `/`, `/about`, `/privacy`, `/terms`, `/dashboard`, `/budget`, `/assets`, and `/learning`. Budget and Learning contain implemented domain functionality; Assets remains a placeholder.

Public pages use Next.js server/static rendering for SEO and the outer frame `mx-auto w-full max-w-6xl px-5 sm:px-8`. Application pages are primarily CSR.
