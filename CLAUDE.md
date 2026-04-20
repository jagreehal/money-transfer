# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Turborepo + pnpm monorepo with two apps:
- `apps/api` — Hono backend on Cloudflare Workers, uses Effect.js for functional error handling
- `apps/web` — React 19 + Vite frontend, deployed to Cloudflare Pages

## Commands

### Root (run from repo root)
```bash
pnpm dev              # Start all apps (API on :8787, Web on :3000)
pnpm dev:api          # API only
pnpm dev:web          # Web only
pnpm build            # Build all (turbo)
pnpm lint             # Lint all
pnpm format           # Format all
```

### API (`apps/api`)
```bash
pnpm test             # Vitest unit + integration tests
pnpm build            # TypeScript check only (tsc --noEmit)
```

### Web (`apps/web`)
```bash
pnpm test:e2e         # Playwright E2E tests (requires running app on :3002)
pnpm storybook        # Storybook dev on :6006
pnpm build-storybook  # Build static Storybook
```

### Run a single test
```bash
# API: pass a filter to vitest
pnpm -C apps/api test -- --reporter=verbose <test-name-pattern>

# E2E: pass grep to playwright
pnpm -C apps/web test:e2e -- --grep "<test-name>"
```

## Architecture

### API (`apps/api/src/`)
- `index.ts` — Hono app entry; registers routes (`POST /api/transfer`, `GET /api/health`, OTEL + PostHog proxies)
- `transfer/send-money-workflow.ts` — Main orchestration: validate → fetch rate → convert → check balance → execute → confirm
- `transfer/*.ts` — One file per step: `validate-transfer`, `fetch-rate`, `convert-currency`, `get-balance`, `execute-transfer`, `send-confirmation`, `external-client`
- `effect-layer.ts` — Provides OpenTelemetry tracer as an Effect Layer (service name: `money-transfer-effect`)
- Tests live in `tests/unit/` and `tests/integration/`; the vitest config uses `executable-stories-vitest` to generate HTML test docs

### Web (`apps/web/app/`)
- `main.tsx` — Bootstraps autotel-web (OTel), PostHog, react-grab (dev only), renders `<App>`
- `MoneyTransfer.tsx` — The entire UI: amount + currency selector, recipient IBAN, fee calculation (35 bps), live rate preview, submit to `/api/transfer`, receipt display
- Vite proxies `/api`, `/v1/traces`, and `/ingest` to the API at `http://localhost:8787`
- E2E tests in `e2e/*.story.spec.ts`; `executable-stories-playwright` generates documentation from them

### Observability stack
- **OpenTelemetry** — Traces from both API (autotel-cloudflare) and web (autotel-web), exported to `OTEL_EXPORTER_OTLP_ENDPOINT`
- **PostHog** — Analytics reverse-proxied at `/ingest` to bypass ad blockers; key events: `transfer.initiated`, `transfer.completed`, `transfer.failed`
- For local trace inspection: `docker-compose -f docker-compose-jaeger.yml up`

### Deployment
- `wrangler-deploy.config.ts` — Infrastructure-as-Code for Cloudflare environments (staging/prod)
- `scripts/wd.mjs` — Wrapper that orchestrates infra apply + API + web deploys
- `pnpm deploy:staging` / `pnpm deploy:prod` — Full deploy pipelines

## Key Conventions
- The API is pure TypeScript ESM targeting Cloudflare Workers; avoid Node.js APIs
- Effect.js is used throughout the API for typed error handling — keep new workflow steps as Effect programs
- Playwright tests run with a single worker (`workers: 1` in config) — don't assume parallelism
- E2E base URL is `:3002` (not the Vite dev server `:3000`); the playwright config starts its own server

## UI (apps/web)
When working on UI components, always use the `storybook` MCP tools to access Storybook's component and documentation knowledge before answering or taking any action.
 
- **CRITICAL: Never hallucinate component properties!** Before using ANY property on a component from a design system (including common-sounding ones like `shadow`, etc.), you MUST use the MCP tools to check if the property is actually documented for that component.
- Query `list-all-documentation` to get a list of all components
- Query `get-documentation` for that component to see all available properties and examples
- Only use properties that are explicitly documented or shown in example stories
- If a property isn't documented, do not assume properties based on naming conventions or common patterns from other libraries. Check back with the user in these cases.
- Use the `get-storybook-story-instructions` tool to fetch the latest instructions for creating or updating stories. This will ensure you follow current conventions and recommendations.
- Check your work by running `run-story-tests`.
 
Remember: A story name might not reflect the property name correctly, so always verify properties through documentation or example stories before using them.