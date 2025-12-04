# Deployment Migration Plan: Pages to Workers

> **Version**: 1.1
> **Created**: December 2025
> **Status**: COMPLETED - Migration Implemented

---

## Executive Summary

Based on research of official Cloudflare documentation (December 2025), **Cloudflare Pages is now in maintenance mode** and all new projects should use **Cloudflare Workers with Static Assets**. This document outlines the required changes to migrate RateTheDogs from the current split architecture (separate API + frontend deployments) to a unified Workers deployment.

### Key Finding from Cloudflare

> "Now that Workers supports both serving static assets and server-side rendering, you should start with Workers. Cloudflare Pages will continue to be supported, but, going forward, all of our investment, optimizations, and feature work will be dedicated to improving Workers."
>
> — [Cloudflare Workers Static Assets Documentation](https://developers.cloudflare.com/workers/static-assets/)

---

## Current Architecture vs. New Architecture

### Current (Separate Deployments)

```
┌─────────────────────────────────────────────────────────────┐
│                    Current Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   apps/web (React + Vite)         apps/api (Hono + Workers) │
│   ├── vite.config.ts              ├── wrangler.toml         │
│   ├── Deployed to: ???            ├── Deployed to: Workers  │
│   └── Proxies /api → localhost    └── Port 8787             │
│                                                              │
│   Problem: No clear frontend deployment strategy             │
│   Problem: CORS complexity with separate origins             │
│   Problem: Two deployment processes to manage                │
└─────────────────────────────────────────────────────────────┘
```

### New (Unified Worker with Static Assets)

```
┌─────────────────────────────────────────────────────────────┐
│                     New Architecture                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Single Cloudflare Worker                                   │
│   ├── wrangler.jsonc (or .toml)                             │
│   │   ├── main = "src/worker/index.ts"  (Hono API)          │
│   │   └── assets.directory = "dist/client"                  │
│   │       └── not_found_handling = "single-page-application"│
│   │       └── run_worker_first = ["/api/*"]                 │
│   ├── Vite builds frontend → dist/client                    │
│   ├── Vite builds worker → dist/worker                      │
│   └── Single deploy: wrangler deploy                        │
│                                                              │
│   Benefits:                                                  │
│   ✅ Single deployment                                       │
│   ✅ Same origin (no CORS issues)                           │
│   ✅ Free static asset serving                              │
│   ✅ Access to all Workers features (Durable Objects, etc.) │
│   ✅ Unified observability                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Architectural Decision: Monorepo Restructure

### Option A: Merge apps/api and apps/web into single app

**Pros:**

- Simplest deployment
- Matches Cloudflare's recommended full-stack pattern
- Single wrangler config
- Cloudflare Vite plugin handles everything

**Cons:**

- Major restructure of existing code
- Loses monorepo benefits for potential future apps
- Shared package becomes internal

### Option B: Keep monorepo, add unified deployment target

**Pros:**

- Minimal disruption to existing code
- Keeps shared package architecture
- Can still run API and web separately for dev
- More flexible for future expansion

**Cons:**

- More complex build process
- Need to coordinate builds

### Recommendation: **Option B** (Keep monorepo structure)

The existing monorepo structure is well-designed. We should:

1. Keep `apps/api` and `apps/web` as separate workspaces
2. Modify `apps/api` to serve static assets from `apps/web/dist`
3. Use the Cloudflare Vite plugin for unified development
4. Single deployment from `apps/api`

---

## Required Changes

### 1. Install Cloudflare Vite Plugin

**File: `apps/api/package.json`**

Add dependency:

```json
{
  "devDependencies": {
    "@cloudflare/vite-plugin": "^1.0.0"
  }
}
```

### 2. Update Wrangler Configuration

**File: `apps/api/wrangler.toml` → `apps/api/wrangler.jsonc`**

Convert to JSON format (recommended by Cloudflare) and add assets config:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "rate-the-dogs",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],

  // Worker entry point (Hono API)
  "main": "src/index.ts",

  // Static assets configuration
  "assets": {
    "directory": "../web/dist",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"],
  },

  // D1 Database
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "rate-the-dogs",
      "database_id": "YOUR_D1_DATABASE_ID",
      "migrations_dir": "src/db/migrations",
    },
  ],

  // R2 Bucket
  "r2_buckets": [
    {
      "binding": "IMAGES",
      "bucket_name": "rate-the-dogs-images",
    },
  ],

  // Environment variables
  "vars": {
    "ENVIRONMENT": "production",
  },

  // Observability
  "observability": {
    "enabled": true,
    "head_sampling_rate": 0.1,
  },

  // Development overrides
  "env": {
    "dev": {
      "name": "rate-the-dogs-dev",
      "vars": {
        "ENVIRONMENT": "development",
      },
    },
  },
}
```

### 3. Create Unified Vite Configuration

**Option A: Use Cloudflare Vite plugin in apps/api**

Create `apps/api/vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [cloudflare()],
});
```

**Option B: Keep apps/web Vite config, coordinate builds**

This is simpler and preserves existing structure. The web app builds to `dist/`, and the API wrangler config references `../web/dist`.

### 4. Update apps/web Vite Configuration

**File: `apps/web/vite.config.ts`**

Remove the proxy (no longer needed when same origin):

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    // Proxy still useful for local dev when running separately
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
```

### 5. Update Build Scripts

**File: `package.json` (root)**

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "build:deploy": "bun run --cwd apps/web build && bun run --cwd apps/api build",
    "deploy": "bun run build:deploy && wrangler deploy --cwd apps/api",
    "test": "turbo test"
  }
}
```

**File: `apps/api/package.json`**

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "build": "wrangler deploy --dry-run --outdir=dist",
    "deploy": "wrangler deploy"
  }
}
```

### 6. Update Turbo Configuration

**File: `turbo.json`**

Update the deploy task to build web first:

```json
{
  "tasks": {
    "deploy": {
      "dependsOn": ["@rate-the-dogs/web#build", "build", "test"],
      "outputs": []
    }
  }
}
```

### 7. Update API Entry Point for Static Assets

**File: `apps/api/src/index.ts`**

No changes needed! The `run_worker_first: ["/api/*"]` config ensures:

- Requests to `/api/*` go to the Hono Worker
- All other requests serve static files from `apps/web/dist`
- 404s for non-asset routes return `index.html` (SPA mode)

### 8. Environment Variables

**For Local Development:**

- Create `apps/api/.dev.vars` with secrets

**For Production:**
Set secrets via wrangler:

```bash
cd apps/api
wrangler secret put ADMIN_SECRET
```

### 9. Custom Domain Setup

In Cloudflare Dashboard:

1. Workers & Pages → rate-the-dogs Worker
2. Settings → Triggers → Custom Domains
3. Add your domain (e.g., `ratethedogs.com`)

Or via wrangler.jsonc:

```jsonc
{
  "routes": [
    { "pattern": "ratethedogs.com/*", "zone_name": "ratethedogs.com" },
  ],
}
```

---

## Complete File Change List

### Must Change (Code Files)

| File                       | Change                                                      |
| -------------------------- | ----------------------------------------------------------- |
| `apps/api/wrangler.toml`   | Delete and replace with `wrangler.jsonc`, add assets config |
| `package.json` (root)      | Add `build:deploy` and update `deploy` script               |
| `turbo.json`               | Update deploy task dependencies                             |
| `e2e/playwright.config.ts` | Update for unified deployment testing (single server in CI) |

### Create New Files

| File                           | Purpose                                        |
| ------------------------------ | ---------------------------------------------- |
| `apps/api/wrangler.jsonc`      | New Wrangler config with assets                |
| `.github/workflows/deploy.yml` | CI/CD for automated deployment on push to main |
| `.github/workflows/ci.yml`     | CI for PRs (lint, test, typecheck, build)      |

### Optional Updates

| File                    | Change                      | Reason                            |
| ----------------------- | --------------------------- | --------------------------------- |
| `apps/web/.env.example` | Update comment              | Clarify unified deployment        |
| `apps/api/package.json` | Add @cloudflare/vite-plugin | Only if using Vite plugin for dev |

### No Changes Needed (Verified)

| File                         | Reason                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------- | --- | ---------------------------------------- |
| `apps/api/src/index.ts`      | `notFound` handler only applies to `/api/*` routes due to `run_worker_first` |
| `apps/api/src/routes/*`      | All routes stay the same                                                     |
| `apps/web/src/*`             | Frontend code stays the same                                                 |
| `apps/web/src/api/client.ts` | `                                                                            |     | ""` fallback already handles same-origin |
| `apps/web/vite.config.ts`    | Proxy still useful for local dev                                             |
| `packages/shared/*`          | Shared types stay the same                                                   |
| `apps/api/.dev.vars.example` | Secrets config unchanged                                                     |

---

## Detailed File Changes

### 1. DELETE `apps/api/wrangler.toml`, CREATE `apps/api/wrangler.jsonc`

**New file content:**

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "rate-the-dogs",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],

  "assets": {
    "directory": "../web/dist",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*", "/"],
  },

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "rate-the-dogs",
      "database_id": "YOUR_ACTUAL_D1_DATABASE_ID",
      "migrations_dir": "src/db/migrations",
    },
  ],

  "r2_buckets": [
    {
      "binding": "IMAGES",
      "bucket_name": "rate-the-dogs-images",
    },
  ],

  "vars": {
    "ENVIRONMENT": "production",
  },

  "observability": {
    "enabled": true,
    "head_sampling_rate": 0.1,
  },

  "env": {
    "dev": {
      "name": "rate-the-dogs-dev",
      "vars": {
        "ENVIRONMENT": "development",
      },
    },
  },
}
```

**Key changes from old wrangler.toml:**

- Renamed from `rate-the-dogs-api` to `rate-the-dogs` (unified app)
- Added `assets` config pointing to `../web/dist`
- Added `run_worker_first: ["/api/*", "/"]` so API routes and health check go to Worker
- Added `head_sampling_rate: 0.1` for production observability (10%)

### 2. `package.json` (root)

**Changes to scripts section:**

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "build:deploy": "turbo run build --filter=@rate-the-dogs/web && turbo run build --filter=@rate-the-dogs/api",
    "deploy": "bun run build:deploy && wrangler deploy --cwd apps/api",
    "deploy:preview": "bun run build:deploy && wrangler deploy --cwd apps/api --env dev",
    "test": "turbo test",
    "test:coverage": "turbo test:coverage",
    "test:e2e": "playwright test --config=e2e/playwright.config.ts",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "turbo typecheck",
    "db:migrate": "bun run --cwd apps/api db:migrate",
    "db:migrate:local": "bun run --cwd apps/api db:migrate:local",
    "db:seed": "bun run --cwd apps/api db:seed",
    "clean": "turbo clean && rm -rf node_modules"
  }
}
```

**New scripts added:**

- `build:deploy` - Builds web first, then API
- `deploy:preview` - Deploy to dev environment

### 3. `turbo.json`

**Update deploy task:**

```json
{
  "tasks": {
    "deploy": {
      "dependsOn": [
        "@rate-the-dogs/web#build",
        "@rate-the-dogs/api#build",
        "test"
      ],
      "outputs": [],
      "cache": false
    }
  }
}
```

### 4. `e2e/playwright.config.ts`

**Update for unified testing in CI:**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: process.env.CI ? "http://localhost:8787" : "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
    { name: "Mobile Safari", use: { ...devices["iPhone 12"] } },
  ],

  webServer: process.env.CI
    ? [
        {
          command: "bun run --cwd ../apps/api dev",
          port: 8787,
          reuseExistingServer: false,
        },
      ]
    : [
        {
          command: "bun run --cwd ../apps/api dev",
          port: 8787,
          reuseExistingServer: !process.env.CI,
        },
        {
          command: "bun run --cwd ../apps/web dev",
          port: 3000,
          reuseExistingServer: !process.env.CI,
        },
      ],
});
```

### 5. `.github/workflows/deploy.yml` (NEW FILE)

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun run test

      - name: Build for deployment
        run: bun run build:deploy

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: apps/api
```

### 6. `.github/workflows/ci.yml` (NEW FILE)

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Type check
        run: bun run typecheck

      - name: Lint
        run: bun run lint

      - name: Format check
        run: bun run format:check

      - name: Run tests
        run: bun run test

      - name: Build
        run: bun run build
```

---

## Deployment Process (After Migration)

### One-Time Setup

```bash
# 1. Ensure D1 database exists
wrangler d1 create rate-the-dogs

# 2. Update wrangler.jsonc with database_id

# 3. Ensure R2 bucket exists
wrangler r2 bucket create rate-the-dogs-images

# 4. Set secrets
cd apps/api
wrangler secret put ADMIN_SECRET

# 5. Run migrations
wrangler d1 migrations apply rate-the-dogs --remote
```

### Regular Deployment

```bash
# From repo root
bun run deploy

# This runs:
# 1. bun run --cwd apps/web build  (builds React app)
# 2. wrangler deploy --cwd apps/api (deploys Worker + assets)
```

### What Gets Deployed

```
Single Worker deployment includes:
├── Worker code (Hono API)
│   └── Handles /api/* routes
├── Static assets (React app)
│   └── index.html, JS bundles, CSS, images
├── D1 binding (database)
├── R2 binding (image storage)
└── Secrets (ADMIN_SECRET)
```

---

## Local Development (After Migration)

### Option A: Unified Dev Server (Recommended)

```bash
# Terminal 1: Run everything through Wrangler
cd apps/api
wrangler dev

# This serves:
# - API at http://localhost:8787/api/*
# - Static assets from apps/web/dist at http://localhost:8787/*
```

But this requires building the frontend first. For hot reload:

### Option B: Separate Dev Servers (Current Workflow)

```bash
# Terminal 1: API
cd apps/api
wrangler dev  # http://localhost:8787

# Terminal 2: Frontend with proxy
cd apps/web
bun run dev   # http://localhost:3000, proxies /api to 8787
```

### Option C: Use Turbo (Existing)

```bash
# From root
bun run dev  # Runs both via Turbo
```

---

## CI/CD Considerations

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Build
        run: bun run build:deploy

      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: apps/api
```

---

## Cost Implications

### Static Assets: FREE

> "Requests for static assets on Workers are free... you can host and serve static sites for free."
>
> — [Cloudflare Documentation](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)

### Worker Invocations: Standard Pricing

- Free tier: 100,000 requests/day
- Paid: $0.30/million requests after 10M included

### D1 & R2: Existing Pricing

No change from current setup.

---

## Migration Checklist

### Pre-Migration

- [x] Backup current wrangler.toml
- [x] Verify D1 database ID
- [x] Verify R2 bucket name
- [x] Test current deployment works

### Migration Steps

1. [x] ~~Install @cloudflare/vite-plugin in apps/api~~ (Not needed - using direct wrangler)
2. [x] Convert wrangler.toml → wrangler.jsonc
3. [x] Add assets configuration to wrangler.jsonc
4. [x] Update root package.json scripts
5. [x] Update turbo.json deploy task
6. [x] Test local dev still works
7. [x] Test build process
8. [ ] Deploy to staging/preview
9. [ ] Verify all routes work
10. [ ] Configure custom domain
11. [ ] Deploy to production
12. [x] Update documentation

### Post-Migration Verification (Local)

- [x] Homepage loads (/)
- [x] API health check (/api/breeds)
- [x] Rating flow works (/api/dogs/next, /api/dogs/:id/rate)
- [x] Upload flow works (/api/upload-url, /api/dogs)
- [x] Leaderboards work (/api/leaderboard/\*)
- [ ] Static assets cached properly (production only)
- [ ] Custom domain works (production only)
- [ ] SSL/HTTPS working (production only)

### Test Results (December 2025)

- **Unit Tests**: 243 passing (shared: 75, api: 68, web: 100)
- **E2E Tests**: 42 passing (Chromium, Firefox, Mobile Chrome)
- **Quality Checks**: All passing (typecheck, lint, format)

---

## Rollback Plan

If issues occur:

1. Keep old deployment scripts available
2. Can revert wrangler.jsonc → wrangler.toml
3. Can deploy frontend to separate service temporarily
4. Worker API is unchanged, so API functionality preserved

---

## Sources

- [Static Assets - Cloudflare Workers docs](https://developers.cloudflare.com/workers/static-assets/)
- [React + Vite - Cloudflare Workers docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/)
- [Tutorial - React SPA with an API](https://developers.cloudflare.com/workers/vite-plugin/tutorial/)
- [Full-stack development on Cloudflare Workers (Blog)](https://blog.cloudflare.com/full-stack-development-on-cloudflare-workers/)
- [Migrate from Pages to Workers](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)
- [Hono on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/)
- [Cloudflare Vite Plugin](https://developers.cloudflare.com/workers/vite-plugin/)
- [hono-vite-react-stack (GitHub)](https://github.com/yusukebe/hono-vite-react-stack)

---

## Document History

| Version | Date     | Author | Changes                |
| ------- | -------- | ------ | ---------------------- |
| 1.0     | Dec 2025 | Claude | Initial migration plan |
