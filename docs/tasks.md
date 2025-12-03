# RateTheDogs - Implementation Tasks

> Use this checklist to track implementation progress.
> Mark tasks complete with `[x]` as you finish them.

---

## Phase 1: Project Setup

### 1.1 Initialize Monorepo
- [ ] Create root `package.json` with Bun workspaces
- [ ] Create `bunfig.toml` for Bun configuration
- [ ] Create `turbo.json` for Turborepo task orchestration
- [ ] Create `tsconfig.base.json` with shared TypeScript settings
- [ ] Create `eslint.config.mjs` with flat config (TypeScript + React)
- [ ] Create `.prettierrc` for formatting
- [ ] Create `.gitignore` (node_modules, dist, .wrangler, etc.)
- [ ] Create `.editorconfig` for consistent editing
- [ ] Initialize git repository

### 1.2 Shared Package (`packages/shared`)
- [ ] Create `packages/shared/package.json`
- [ ] Create `packages/shared/tsconfig.json`
- [ ] Create `packages/shared/src/index.ts` (barrel export)
- [ ] Create `packages/shared/src/constants.ts` (rating values, statuses)
- [ ] Create Zod schemas:
  - [ ] `schemas/dog.ts` (createDog, updateDog)
  - [ ] `schemas/rating.ts` (ratingValue)
  - [ ] `schemas/breed.ts` (breed)
  - [ ] `schemas/api.ts` (pagination, responses)
- [ ] Create `types/index.ts` with inferred types
- [ ] Write unit tests for all schemas

### 1.3 API Package (`apps/api`)
- [ ] Create `apps/api/package.json`
- [ ] Create `apps/api/tsconfig.json` with project references
- [ ] Create `apps/api/wrangler.toml` with D1, R2, observability config
- [ ] Create `apps/api/vitest.config.ts`
- [ ] Create `.dev.vars` for local secrets (ADMIN_SECRET)

### 1.4 Web Package (`apps/web`)
- [ ] Create `apps/web/package.json`
- [ ] Create `apps/web/tsconfig.json` with project references
- [ ] Create `apps/web/vite.config.ts` with TailwindCSS v4 plugin
- [ ] Create `apps/web/vitest.config.ts`
- [ ] Create `apps/web/index.html`
- [ ] Create `apps/web/src/main.tsx`
- [ ] Create `apps/web/src/App.tsx` with router shell
- [ ] Create `apps/web/src/styles/globals.css` with Tailwind import
- [ ] Create `.env` for VITE_API_URL
- [ ] Initialize shadcn/ui and install base components

### 1.5 E2E Package (`e2e/`)
- [ ] Create `e2e/package.json`
- [ ] Create `e2e/playwright.config.ts`
- [ ] Create `e2e/tests/` directory

---

## Phase 2: Database & Storage

### 2.1 D1 Schema
- [ ] Create `apps/api/src/db/migrations/001_initial_schema.sql`
- [ ] Verify migration runs locally with `wrangler d1 migrations apply`
- [ ] Write seed script for breeds (`apps/api/scripts/seed.ts`)
- [ ] Include Mixed Breed and Unknown in seed data
- [ ] Write seed script for sample dogs (dev only)

### 2.2 R2 Storage
- [ ] Configure R2 bucket binding in wrangler.toml
- [ ] Implement presigned URL generation in `apps/api/src/lib/r2.ts`
- [ ] Test presigned upload flow manually

### 2.3 Database Utilities
- [ ] Create `apps/api/src/db/queries.ts` with typed query helpers
- [ ] Create dog queries (create, get, list, update status)
- [ ] Create rating queries (create, get by user/dog, avg)
- [ ] Create breed queries (list, get by slug)
- [ ] Create skip queries (create, check)
- [ ] Create anonymous user queries (upsert, ban check)
- [ ] Write unit tests for all queries (with mocked D1)

---

## Phase 3: Backend API

### 3.1 Core Infrastructure
- [ ] Create `apps/api/src/index.ts` with Hono app
- [ ] Create typed environment bindings interface
- [ ] Set up CORS middleware
- [ ] Export AppType for RPC

### 3.2 Middleware
- [ ] Create `middleware/anon.ts` (anonymous ID cookie management)
- [ ] Create `middleware/admin.ts` (admin secret validation)
- [ ] Create `middleware/rateLimit.ts` (rate limiting)
- [ ] Create `middleware/logger.ts` (structured JSON logging)
- [ ] Create `middleware/banned.ts` (check is_banned)
- [ ] Write tests for each middleware

### 3.3 Utility Libraries
- [ ] Create `lib/errors.ts` (HTTPException helpers)
- [ ] Create `lib/hash.ts` (IP hashing)
- [ ] Create `lib/response.ts` (standard response formatters)

### 3.4 Services (Business Logic)
- [ ] Create `services/dogs.ts`
  - [ ] getNextUnratedDog(anonId)
  - [ ] getDogById(id)
  - [ ] createDog(data, anonId)
  - [ ] getDogImageUrl(imageKey)
- [ ] Create `services/ratings.ts`
  - [ ] rateDog(dogId, value, anonId, ipHash)
  - [ ] getUserRatings(anonId, pagination)
  - [ ] getDogAverageRating(dogId)
- [ ] Create `services/leaderboard.ts`
  - [ ] getTopDogs(pagination)
  - [ ] getTopBreeds(pagination)
  - [ ] getTopDogsForBreed(slug, pagination)
- [ ] Create `services/breeds.ts`
  - [ ] listBreeds(search?)
  - [ ] getBreedBySlug(slug)
- [ ] Create `services/skips.ts`
  - [ ] skipDog(dogId, anonId)
  - [ ] hasSkipped(dogId, anonId)
- [ ] Create `services/admin.ts`
  - [ ] getPendingDogs(pagination)
  - [ ] approveDog(dogId, adminId)
  - [ ] rejectDog(dogId, adminId)
  - [ ] banUser(anonId)
- [ ] Write unit tests for all services

### 3.5 Routes
- [ ] Create `routes/dogs.ts`
  - [ ] GET /api/dogs/next
  - [ ] GET /api/dogs/:id
  - [ ] POST /api/dogs/:id/rate (with zValidator)
  - [ ] POST /api/dogs/:id/skip
  - [ ] POST /api/dogs (with zValidator)
- [ ] Create `routes/upload.ts`
  - [ ] POST /api/upload-url (with zValidator)
- [ ] Create `routes/leaderboard.ts`
  - [ ] GET /api/leaderboard/dogs
  - [ ] GET /api/leaderboard/breeds
- [ ] Create `routes/breeds.ts`
  - [ ] GET /api/breeds
  - [ ] GET /api/breeds/:slug
  - [ ] GET /api/breeds/:slug/top
- [ ] Create `routes/me.ts`
  - [ ] GET /api/me/ratings
- [ ] Create `routes/admin.ts`
  - [ ] GET /api/admin/pending
  - [ ] POST /api/admin/dogs/:id/approve
  - [ ] POST /api/admin/dogs/:id/reject
  - [ ] POST /api/admin/ban/:anonId
- [ ] Chain all routes in index.ts for AppType export
- [ ] Write integration tests for all routes

### 3.6 Global Error Handler
- [ ] Create global error handler in index.ts
- [ ] Format HTTPException to standard error response
- [ ] Log unexpected errors with full context
- [ ] Return 500 for unhandled errors

---

## Phase 4: Frontend

### 4.1 API Client
- [ ] Create `apps/web/src/api/client.ts` with hc<AppType>
- [ ] Set up React Query provider in App.tsx
- [ ] Create query hooks for each endpoint

### 4.2 Core Components
- [ ] Create ErrorBoundary component
- [ ] Create Loading/Skeleton components
- [ ] Create Toast provider setup

### 4.3 BoneRating Component
- [ ] Create `components/BoneRating.tsx`
- [ ] Implement 5 bones with half-increment states
- [ ] Add hover preview (desktop)
- [ ] Add touch/drag support (mobile)
- [ ] Add keyboard navigation (arrow keys)
- [ ] Add Skip button prop
- [ ] Add Framer Motion animations
- [ ] Add ARIA labels for accessibility
- [ ] Write component tests

### 4.4 DogCard Component
- [ ] Create `components/DogCard.tsx`
- [ ] Implement lazy image loading with blur placeholder
- [ ] Show dog name (if provided)
- [ ] Show breed badge
- [ ] Show average rating with mini bones
- [ ] Add share button (copy link)
- [ ] Add loading skeleton state
- [ ] Write component tests

### 4.5 UploadForm Component
- [ ] Create `components/UploadForm.tsx`
- [ ] Implement drag & drop zone
- [ ] Add file validation (type, size)
- [ ] Integrate browser-image-compression
- [ ] Add image preview
- [ ] Add dog name input (max 50 chars)
- [ ] Add BreedCombobox
- [ ] Add upload progress indicator
- [ ] Handle success/error states
- [ ] Write component tests

### 4.6 BreedCombobox Component
- [ ] Create `components/BreedCombobox.tsx`
- [ ] Use shadcn Command component
- [ ] Implement fuzzy search
- [ ] Include Mixed Breed and Unknown options
- [ ] Add mobile sheet variant
- [ ] Add clear button
- [ ] Write component tests

### 4.7 Leaderboard Components
- [ ] Create `components/Leaderboard.tsx`
- [ ] Implement rank badges (1st, 2nd, 3rd)
- [ ] Add infinite scroll
- [ ] Add pull-to-refresh (mobile)
- [ ] Create empty state component
- [ ] Write component tests

### 4.8 Page Components
- [ ] Create `pages/RatePage.tsx` (main rating flow)
- [ ] Create `pages/UploadPage.tsx` (upload form)
- [ ] Create `pages/LeaderboardPage.tsx` (tabs: dogs/breeds)
- [ ] Create `pages/BreedsPage.tsx` (all breeds grid + search)
- [ ] Create `pages/BreedDetailPage.tsx` (breed-specific)
- [ ] Create `pages/DogDetailPage.tsx` (individual dog)
- [ ] Create `pages/MyRatingsPage.tsx` (rating history)
- [ ] Create `pages/AdminPage.tsx` (moderation queue)
- [ ] Set up React Router in App.tsx

### 4.9 Custom Hooks
- [ ] Create `hooks/useNextDog.ts`
- [ ] Create `hooks/useRating.ts`
- [ ] Create `hooks/useSkip.ts`
- [ ] Create `hooks/useUpload.ts`
- [ ] Create `hooks/useLeaderboard.ts`
- [ ] Create `hooks/useBreeds.ts`
- [ ] Create `hooks/useAdmin.ts`
- [ ] Write hook tests

### 4.10 Utilities
- [ ] Create `lib/imageCompression.ts`
- [ ] Create `lib/utils.ts` (cn helper, etc.)
- [ ] Create `lib/formatters.ts` (date, number formatting)

---

## Phase 5: Testing

### 5.1 Unit Tests
- [ ] Test all Zod schemas (valid & invalid inputs)
- [ ] Test all service functions (mocked D1)
- [ ] Test all custom hooks (mocked API)
- [ ] Test utility functions
- [ ] Achieve 80%+ coverage on packages/shared
- [ ] Achieve 80%+ coverage on apps/api/src/services

### 5.2 Integration Tests
- [ ] Test API routes with mocked bindings
- [ ] Test component integration
- [ ] Test Hono RPC client/server type alignment
- [ ] Achieve 80%+ coverage on apps/api/src/routes
- [ ] Achieve 80%+ coverage on apps/web/src/components

### 5.3 E2E Tests (Playwright)
- [ ] Create `e2e/tests/rating.spec.ts`
  - [ ] Rate a dog successfully
  - [ ] Skip a dog
  - [ ] Rate multiple dogs in sequence
- [ ] Create `e2e/tests/upload.spec.ts`
  - [ ] Upload dog with name and breed
  - [ ] Handle upload errors
- [ ] Create `e2e/tests/leaderboard.spec.ts`
  - [ ] Browse top dogs
  - [ ] Browse top breeds
  - [ ] Filter by breed
- [ ] Create `e2e/tests/admin.spec.ts`
  - [ ] Approve pending dog
  - [ ] Reject pending dog
- [ ] Create `e2e/tests/responsive.spec.ts`
  - [ ] Mobile viewport tests
  - [ ] Tablet viewport tests

---

## Phase 6: DevOps & Quality

### 6.1 Scripts & Tooling
- [ ] Verify `bun run dev` starts all apps
- [ ] Verify `bun run build` builds all packages
- [ ] Verify `bun run test` runs all tests
- [ ] Verify `bun run test:coverage` shows coverage
- [ ] Verify `bun run lint` passes
- [ ] Verify `bun run format:check` passes
- [ ] Verify `bun run typecheck` passes

### 6.2 Pre-commit Hooks
- [ ] Set up Husky
- [ ] Set up lint-staged
- [ ] Configure pre-commit to run lint, format, typecheck

### 6.3 CI/CD
- [ ] Create `.github/workflows/ci.yml`
- [ ] Run typecheck, lint, format:check, test on PRs
- [ ] Run build to verify compilation
- [ ] Create `.github/workflows/deploy.yml`
- [ ] Deploy to Cloudflare on main merge

### 6.4 Documentation
- [ ] Update CLAUDE.md with any pattern changes
- [ ] Verify plan.md is accurate
- [ ] Create brief README.md for the project

---

## Phase 7: Deployment

### 7.1 Cloudflare Setup
- [ ] Create D1 database via Cloudflare dashboard or wrangler
- [ ] Create R2 bucket via Cloudflare dashboard or wrangler
- [ ] Run migrations on production D1
- [ ] Seed breeds on production D1
- [ ] Set ADMIN_SECRET in Cloudflare Workers secrets

### 7.2 Production Deploy
- [ ] Deploy API worker with `wrangler deploy`
- [ ] Deploy frontend (Cloudflare Pages or similar)
- [ ] Configure custom domain (if applicable)
- [ ] Verify production functionality
- [ ] Set observability sampling rate for production (10%)

### 7.3 Smoke Testing
- [ ] Test rating flow on production
- [ ] Test upload flow on production
- [ ] Test leaderboards on production
- [ ] Test admin moderation on production
- [ ] Verify Cloudflare Workers Logs are captured

---

## Future Phases (Record for Later)

### Phase 2: User Accounts
- [ ] Implement Google OAuth flow
- [ ] Create user profile page
- [ ] Create "My uploads" page
- [ ] Implement anon-to-user rating merge
- [ ] Add user preferences (theme)

### Phase 3: Polish & SEO
- [ ] Conduct WCAG 2.2 accessibility audit
- [ ] Add meta tags to all pages
- [ ] Add Open Graph tags for sharing
- [ ] Generate sitemap.xml
- [ ] Add PWA manifest.json
- [ ] Add service worker for offline
- [ ] Optimize images (WebP, responsive srcset)
- [ ] Achieve Lighthouse 95+

### Phase 4: Legal & Compliance
- [ ] Create privacy policy page
- [ ] Implement cookie consent banner
- [ ] Create terms of service page
- [ ] Implement AI content moderation

### Phase 5: Social Features
- [ ] Add social share buttons
- [ ] Implement OG image generation
- [ ] Add optional comments feature
- [ ] Add email notifications

### Phase 6: Advanced Features
- [ ] Implement AI "Not a dog" detector
- [ ] Build similar dog recommendations
- [ ] Add breed identification helper

---

## Completion Checklist

Before considering MVP complete:

- [ ] All Phase 1-7 tasks completed
- [ ] Test coverage >80%
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code formatted with Prettier
- [ ] Production deployed and functional
- [ ] Documentation up to date
