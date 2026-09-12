# CI and Deployment

Use `main` as production. Intended flow: feature branch → PR → CI → merge → CI on `main` → deployment. The deployment workflows are planned foundation work; no `.github/workflows/` files currently exist. When added, keep CI and production deployment separate, install with `pnpm install --frozen-lockfile`, and deploy only after successful CI for the exact main commit.

Deployment applies committed production D1 migrations first and stops if they fail, then deploys `apps/api` with Wrangler and `apps/web` with the supported Vercel CLI flow. Prefer backward-compatible migrations. GitHub Actions owns production deployment; avoid duplicate Vercel Git deployments. Typical secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`. Keep runtime secrets in Cloudflare/Vercel secret stores. Document branch protection requiring CI before merge.

## Troubleshoot production Worker errors

The API intentionally returns a generic `INTERNAL_ERROR` response to clients. To find the underlying production error, stream the deployed Worker logs:

```bash
pnpm --filter @personally/api exec wrangler tail personally-api-production
```

Keep the command running, reproduce the failing request, and inspect the log output. Stop the stream with `Ctrl+C`. The tail session expires automatically; do not leave it running longer than needed.

You can also view logs in Cloudflare under **Workers & Pages → personally-api-production → Logs**. Never copy API tokens, JWT secrets, passwords, authorization headers, or other sensitive values into issue reports or chat. After changing Worker code or runtime variables, deploy again before retesting:

```bash
pnpm --filter @personally/api exec wrangler deploy --env production
```
