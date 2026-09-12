# CI and Deployment

Use `main` as production. Intended flow: feature branch → PR → CI → merge → CI on `main` → deployment. The deployment workflows are planned foundation work; no `.github/workflows/` files currently exist. When added, keep CI and production deployment separate, install with `pnpm install --frozen-lockfile`, and deploy only after successful CI for the exact main commit.

Deployment applies committed production D1 migrations first and stops if they fail, then deploys `apps/api` with Wrangler and `apps/web` with the supported Vercel CLI flow. Prefer backward-compatible migrations. GitHub Actions owns production deployment; avoid duplicate Vercel Git deployments. Typical secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`. Keep runtime secrets in Cloudflare/Vercel secret stores. Document branch protection requiring CI before merge.
