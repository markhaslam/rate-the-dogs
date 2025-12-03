# RateTheDogs - Claude Code Instructions

## Project Overview

RateTheDogs is a dog rating web application built on Cloudflare's edge infrastructure. Users upload dog photos and rate them using a 5-bone rating system with half-point increments (0.5 to 5.0).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Cloudflare Workers + Hono + D1 + R2 |
| Frontend | React + Vite + TailwindCSS v4 + shadcn/ui |
| Validation | Zod (shared schemas) |
| Type Safety | Hono RPC for end-to-end types |
| Testing | Vitest + Playwright |
| Package Manager | Bun |
| Monorepo | Bun workspaces + Turborepo |
| Observability | Cloudflare Workers Logs |

## Agentic Development Workflow

**ALWAYS follow this workflow when implementing features or fixing bugs:**

### 1. Explore & Understand
Before making any changes:
- Read all relevant files to understand current implementation
- Search for similar patterns in the codebase
- Check existing tests for expected behavior
- Review PRD (`docs/ratethedogs_PRD.md`) and plan (`docs/plan.md`) for requirements

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
│   │   └── wrangler.toml
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
    └── tasks.md                 # Task checklist
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
import { zValidator } from '@hono/zod-validator';
import { ratingSchema } from '@rate-the-dogs/shared';

app.post('/rate', zValidator('json', ratingSchema), async (c) => {
  const { value } = c.req.valid('json'); // Typed!
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
bun run deploy           # Deploy to Cloudflare
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
import { hc } from 'hono/client';
import type { AppType } from '@rate-the-dogs/api';

export const api = hc<AppType>('/');
```

When adding new routes:
1. Add Zod schema to `packages/shared/src/schemas/`
2. Create route in `apps/api/src/routes/`
3. Chain route in main app for type export
4. Frontend gets type inference automatically

## Error Handling

```typescript
import { HTTPException } from 'hono/http-exception';

// In route handlers
if (!dog) {
  throw new HTTPException(404, { message: 'Dog not found' });
}

// Global error handler catches and formats
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      error: { code: err.status.toString(), message: err.message }
    }, err.status);
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

| Scenario | User Message |
|----------|--------------|
| No more dogs to rate | "You've rated all the dogs! Check back soon." |
| No dogs in breed | "No dogs in this breed yet. Upload yours!" |
| No ratings yet | "You haven't rated any dogs yet. Start rating!" |
| API error | "Something went wrong. Please try again." |
| No search results | "No breeds match your search." |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Rating | 10/min per anon_id |
| Upload | 5/hour per anon_id |
| General | 100/min per IP |

## File Upload Constraints

- Max size: 10MB
- Types: `image/jpeg`, `image/png`, `image/webp`
- Max dimension: 4096px
- Client compression target: 1MB, 1920px
