# RateTheDogs - Claude Code Instructions

## Project Overview

RateTheDogs is a dog rating web application built on Cloudflare's edge infrastructure. Users upload dog photos and rate them using a 5-bone rating system with half-point increments (0.5 to 5.0).

## Tech Stack

| Layer           | Technology                                      |
| --------------- | ----------------------------------------------- |
| Runtime         | Cloudflare Workers + Static Assets (unified)    |
| Backend         | Hono 4.10+ + D1 + R2                            |
| Frontend        | React 19 + Vite 7.x + TailwindCSS 4.x + shadcn  |
| Validation      | Zod 4.x (shared schemas)                        |
| Type Safety     | Hono RPC for end-to-end types                   |
| Testing         | Vitest 4.x + Playwright 1.57+                   |
| Package Manager | Bun                                             |
| Monorepo        | Bun workspaces + Turborepo                      |
| Observability   | Cloudflare Workers Logs                         |

> **Note**: Cloudflare Pages is in maintenance mode. This project uses the recommended Cloudflare Workers with Static Assets approach. See `docs/deployment-migration-plan.md`.

## Agentic Development Workflow

**ALWAYS follow this workflow when implementing features or fixing bugs:**

### 1. Explore & Understand

Before making any changes:

- Read all relevant files to understand current implementation
- Search for similar patterns in the codebase
- Check existing tests for expected behavior
- Review PRD (`docs/ratethedogs_PRD.md`) and plan (`docs/plan.md`) for requirements
- **For Dog CEO work**: Read `docs/dog-ceo-integration.md` for complete technical architecture

### 2. Plan

- Break down the task into small, testable units
- Use TodoWrite to track progress on multi-step tasks
- Consider edge cases and error handling
- Check if shared schemas need updates first

### 3. Implement

- Write code following existing patterns
- Keep changes minimal and focused
- Update shared types/schemas first if needed
- Ensure proper error handling

### 4. Test

- Write tests BEFORE or alongside implementation (TDD preferred)
- Aim for 80%+ coverage on new code
- Test happy path, edge cases, and error conditions
- Run the full test suite before considering complete

### 5. Validate

**Run ALL of these before completing ANY task:**

```bash
bun run typecheck    # TypeScript compilation
bun run lint         # ESLint checks
bun run format:check # Prettier formatting
bun run test         # Unit & integration tests
```

If any fail, fix them before proceeding.

## Project Structure

```
rate-the-dogs/
├── apps/
│   ├── api/                     # Cloudflare Worker (Hono)
│   │   ├── src/
│   │   │   ├── index.ts         # App entry, exports AppType
│   │   │   ├── routes/          # dogs, breeds, leaderboard, upload, me, admin
│   │   │   ├── middleware/      # anon, admin, rateLimit, logger, banned
│   │   │   ├── services/        # Business logic
│   │   │   ├── db/              # migrations, queries, seed
│   │   │   └── lib/             # r2, hash, errors, response
│   │   └── wrangler.jsonc       # Cloudflare Workers unified deployment config
│   └── web/                     # React SPA
│       └── src/
│           ├── api/             # Hono RPC client
│           ├── components/      # ui/, BoneRating, DogCard, etc.
│           ├── pages/           # Page components
│           ├── hooks/           # Custom React hooks
│           └── lib/             # Utilities
├── packages/
│   └── shared/                  # Shared Zod schemas & types
│       └── src/
│           ├── schemas/         # dog, rating, breed, api schemas
│           ├── types/           # Inferred TypeScript types
│           └── constants.ts
├── e2e/                         # Playwright E2E tests
└── docs/
    ├── ratethedogs_PRD.md       # Product requirements
    ├── plan.md                  # Implementation plan
    ├── tasks.md                 # Task checklist
    └── dog-ceo-integration.md   # Dog CEO API integration architecture (IMPORTANT)
```

## Key Conventions

### TypeScript

- Strict mode enabled (`"strict": true`)
- No `any` types - use `unknown` and narrow
- Prefer `interface` for object shapes, `type` for unions
- Export types from `packages/shared` for cross-package use

### API Routes (Hono)

All routes use Zod validation via `@hono/zod-validator`:

```typescript
import { zValidator } from "@hono/zod-validator";
import { ratingSchema } from "@rate-the-dogs/shared";

app.post("/rate", zValidator("json", ratingSchema), async (c) => {
  const { value } = c.req.valid("json"); // Typed!
  // ...
});
```

**Response format:**

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string } }

// Paginated
{ success: true, data: { items: T[], total, limit, offset, hasMore } }
```

**Chain routes for RPC type inference:**

```typescript
const route = app.post('/path', zValidator('json', schema), (c) => {...});
export type RouteType = typeof route;
```

### Database (D1)

- Use parameterized queries (never string concatenation)
- Migrations in `apps/api/src/db/migrations/`
- Naming: `XXX_description.sql` (e.g., `001_initial_schema.sql`)
- Always include timestamps

### Frontend Components

- Functional components with TypeScript props
- shadcn/ui components from `@/components/ui`
- Custom components in `@/components`
- Colocate tests: `Button.tsx` + `Button.test.tsx`

### Styling

- TailwindCSS utility classes only
- No inline styles or CSS modules
- CSS variables for theming (shadcn pattern)
- Mobile-first responsive design

### Testing

- Test files: `*.test.ts` or `*.test.tsx`
- Use `describe`/`it` blocks with clear descriptions
- Mock external dependencies (D1, R2, fetch)
- Prefer `screen` queries from Testing Library

## Common Commands

```bash
# Development
bun run dev              # Start all apps
bun run dev --filter=api # API only
bun run dev --filter=web # Frontend only

# Testing
bun run test             # All tests
bun run test:coverage    # With coverage
bun run test:e2e         # Playwright

# Quality
bun run typecheck        # TypeScript
bun run lint             # ESLint
bun run lint:fix         # ESLint + fix
bun run format           # Prettier format
bun run format:check     # Prettier check

# Database
bun run db:migrate       # Apply migrations
bun run db:seed          # Seed breeds

# Build & Deploy
bun run build            # Build all
bun run build:deploy     # Build web + API for deployment
bun run deploy           # Deploy unified Worker to Cloudflare (API + static assets)
bun run deploy:preview   # Deploy to dev environment
```

## Environment Variables

### API (`apps/api/.dev.vars`)

```
ADMIN_SECRET=your-admin-secret-here
```

### Web (`apps/web/.env`)

```
VITE_API_URL=http://localhost:8787
```

## Hono RPC Type Sharing

```typescript
// apps/api/src/index.ts
export type AppType = typeof app;

// apps/web/src/api/client.ts
import { hc } from "hono/client";
import type { AppType } from "@rate-the-dogs/api";

export const api = hc<AppType>("/");
```

When adding new routes:

1. Add Zod schema to `packages/shared/src/schemas/`
2. Create route in `apps/api/src/routes/`
3. Chain route in main app for type export
4. Frontend gets type inference automatically

## Error Handling

```typescript
import { HTTPException } from "hono/http-exception";

// In route handlers
if (!dog) {
  throw new HTTPException(404, { message: "Dog not found" });
}

// Global error handler catches and formats
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: { code: err.status.toString(), message: err.message },
      },
      err.status
    );
  }
  // Log unexpected errors, return 500
});
```

## Security Checklist

- [ ] Never log sensitive data (cookies, tokens, IPs)
- [ ] Always use parameterized DB queries
- [ ] Validate ALL user input with Zod
- [ ] Rate limit sensitive endpoints
- [ ] Hash IPs before storing
- [ ] Admin routes require `X-Admin-Secret` header
- [ ] Check `is_banned` before user actions

## Performance Reminders

- Use Cloudflare cache for leaderboard endpoints
- Lazy load images in frontend
- Compress images client-side before upload
- Use React Query for request deduplication
- Database indexes on frequently queried columns

## Deployment Architecture (COMPLETED)

The app uses **Cloudflare Workers with Static Assets** for unified deployment:

```
Single Worker deployment:
├── Worker code (Hono API) → handles /api/* routes
├── Static assets (React) → served from apps/web/dist
├── D1 binding (database)
├── R2 binding (image storage)
└── wrangler.jsonc configuration
```

### Key Configuration (`apps/api/wrangler.jsonc`)

```jsonc
{
  "assets": {
    "directory": "../web/dist",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*", "/"]
  }
}
```

### Deployment Commands

```bash
bun run deploy         # Deploy to production
bun run deploy:preview # Deploy to dev environment
bun run build:deploy   # Build web + API for deployment
```

---

## Dog CEO API Integration (Phase 1.5)

**Status**: Database migration complete, sync script pending

Read `docs/dog-ceo-integration.md` for the complete technical architecture.

### Summary

The app is being enhanced to use the Dog CEO API as a long-term content source:

- **Goal**: 5,000+ dog images from 100+ breeds (vs. current ~85 images from 17 breeds)
- **Database changes**: New columns on breeds/dogs tables for Dog CEO support
- **API changes**: New `/api/dogs/prefetch` endpoint for frontend prefetching
- **Frontend changes**: `useDogPrefetch` hook for instant image transitions

### Key Files to Create/Modify

| File                                                     | Action | Purpose                                 |
| -------------------------------------------------------- | ------ | --------------------------------------- |
| `apps/api/src/db/migrations/003_dog_ceo_integration.sql` | Done   | Schema migration                        |
| `apps/api/src/lib/dogCeoBreeds.ts`                       | Create | Breed name mapping (120+ breeds)        |
| `apps/api/scripts/syncDogCeo.ts`                         | Create | Seeding script                          |
| `apps/api/src/lib/r2.ts`                                 | Modify | Update `getImageUrl()` for dual sources |
| `apps/api/src/routes/dogs.ts`                            | Modify | Add prefetch endpoint                   |
| `apps/web/src/hooks/useDogPrefetch.ts`                   | Create | Frontend prefetch hook                  |
| `apps/web/src/pages/RatePage.tsx`                        | Modify | Use prefetching                         |

### Current Task Status

Check `docs/tasks.md` Phase 8 for detailed task checklist.

---

## Adding New Features Checklist

- [ ] Review PRD and plan for requirements
- [ ] Update Zod schemas in `packages/shared` if needed
- [ ] Implement API route with Zod validation
- [ ] Write API unit/integration tests
- [ ] Implement frontend components
- [ ] Write component tests
- [ ] Add E2E test for complete flow
- [ ] Run full validation: `typecheck`, `lint`, `format:check`, `test`
- [ ] Update this CLAUDE.md if patterns change

## Empty States to Handle

| Scenario             | User Message                                    |
| -------------------- | ----------------------------------------------- |
| No more dogs to rate | "You've rated all the dogs! Check back soon."   |
| No dogs in breed     | "No dogs in this breed yet. Upload yours!"      |
| No ratings yet       | "You haven't rated any dogs yet. Start rating!" |
| API error            | "Something went wrong. Please try again."       |
| No search results    | "No breeds match your search."                  |

## Rate Limits

| Endpoint | Limit              |
| -------- | ------------------ |
| Rating   | 10/min per anon_id |
| Upload   | 5/hour per anon_id |
| General  | 100/min per IP     |

## File Upload Constraints

- Max size: 10MB
- Types: `image/jpeg`, `image/png`, `image/webp`
- Max dimension: 4096px
- Client compression target: 1MB, 1920px

## Documentation Management

**CRITICAL: Keep these documents up-to-date as you work!**

### Reference Documents

| Document                      | Purpose                            | When to Update                                            |
| ----------------------------- | ---------------------------------- | --------------------------------------------------------- |
| `docs/tasks.md`               | Task progress checklist            | Check off items as completed, add new tasks as discovered |
| `docs/plan.md`                | Implementation plan & architecture | When architecture changes or new patterns emerge          |
| `docs/ratethedogs_PRD.md`     | Product requirements               | When requirements change or are clarified                 |
| `docs/dog-ceo-integration.md` | Dog CEO API technical architecture | **READ FIRST** for Phase 1.5 implementation               |
| `CLAUDE.md`                   | Development guidelines             | When patterns/conventions change                          |

### Task Tracking Workflow

1. **Before starting work**: Read `docs/tasks.md` to understand current progress
2. **During work**: Check off completed items immediately, add new discovered tasks
3. **After completing a feature**: Update task list and related documentation
4. **Use TodoWrite tool**: Track multi-step tasks in real-time during the session

## Development Loop (ALWAYS FOLLOW)

After implementing any feature, fixing any bug, or making any code changes:

### 1. Write Tests

- Think deeply about edge cases
- Add tests for the new/modified functionality
- Consider error conditions and boundary cases
- Test both happy path and failure scenarios

### 2. Format Code

```bash
bun run format   # Auto-fix formatting
```

### 3. Run All Quality Checks

```bash
bun run typecheck    # Must pass - no TypeScript errors
bun run lint         # Must pass - no ESLint errors
bun run test         # Must pass - all tests green
```

### 4. Fix Any Issues

- If any check fails, fix the issues immediately
- Re-run the checks until all pass
- Do NOT proceed to the next task until all checks pass

### 5. Visual Verification (For UI Changes)

**REQUIRED for any frontend/UI changes:**

```bash
# Take screenshots with Playwright CLI to verify changes look correct
bunx playwright screenshot --viewport-size=1400,900 http://localhost:3000 /tmp/screenshot-desktop.png
bunx playwright screenshot --viewport-size=375,812 http://localhost:3000 /tmp/screenshot-mobile.png
```

- Take screenshots at desktop (1400x900) and mobile (375x812) viewports
- Review screenshots to verify UI looks correct and expected
- Check all affected pages (home, leaderboard, upload, etc.)
- If anything looks wrong, fix it and re-screenshot until it's correct
- This catches issues like broken layouts, missing images, color/styling problems

### 6. Update Documentation

- Check off completed tasks in `docs/tasks.md`
- Add any new tasks discovered during implementation
- Update `docs/plan.md` if architecture/patterns changed
- Update this file if conventions changed

**This loop is MANDATORY for every change. Never skip steps!**
