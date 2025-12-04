# RateTheDogs - Implementation Tasks

> Use this checklist to track implementation progress.
> Mark tasks complete with `[x]` as you finish them.

---

## Phase 1: Project Setup

### 1.1 Initialize Monorepo

- [x] Create root `package.json` with Bun workspaces
- [x] Create `bunfig.toml` for Bun configuration
- [x] Create `turbo.json` for Turborepo task orchestration
- [x] Create `tsconfig.base.json` with shared TypeScript settings
- [x] Create `eslint.config.mjs` with flat config (TypeScript + React)
- [x] Create `.prettierrc` for formatting
- [x] Create `.gitignore` (node_modules, dist, .wrangler, etc.)
- [x] Create `.editorconfig` for consistent editing
- [x] Initialize git repository

### 1.2 Shared Package (`packages/shared`)

- [x] Create `packages/shared/package.json`
- [x] Create `packages/shared/tsconfig.json`
- [x] Create `packages/shared/src/index.ts` (barrel export)
- [x] Create `packages/shared/src/constants.ts` (rating values, statuses)
- [x] Create Zod schemas:
  - [x] `schemas/dog.ts` (createDog, updateDog)
  - [x] `schemas/rating.ts` (ratingValue)
  - [x] `schemas/breed.ts` (breed)
  - [x] `schemas/api.ts` (pagination, responses)
- [x] Create `types/index.ts` with inferred types
- [x] Write unit tests for all schemas

### 1.3 API Package (`apps/api`)

- [x] Create `apps/api/package.json`
- [x] Create `apps/api/tsconfig.json` with project references
- [x] Create `apps/api/wrangler.toml` with D1, R2, observability config
- [x] Create `apps/api/vitest.config.ts`
- [x] Create `.dev.vars` for local secrets (ADMIN_SECRET)

### 1.4 Web Package (`apps/web`)

- [x] Create `apps/web/package.json`
- [x] Create `apps/web/tsconfig.json` with project references
- [x] Create `apps/web/vite.config.ts` with TailwindCSS v4 plugin
- [x] Create `apps/web/vitest.config.ts`
- [x] Create `apps/web/index.html`
- [x] Create `apps/web/src/main.tsx`
- [x] Create `apps/web/src/App.tsx` with router shell
- [x] Create `apps/web/src/styles/globals.css` with Tailwind import
- [x] Create `.env` for VITE_API_URL
- [x] Initialize shadcn/ui and install base components

### 1.5 E2E Package (`e2e/`)

- [x] Create `e2e/package.json`
- [x] Create `e2e/playwright.config.ts`
- [x] Create `e2e/tests/` directory

---

## Phase 2: Database & Storage

### 2.1 D1 Schema

- [x] Create `apps/api/src/db/migrations/001_initial_schema.sql`
- [x] Verify migration runs locally with `wrangler d1 migrations apply`
- [x] Write seed script for breeds (`apps/api/scripts/seed.ts`)
- [x] Include Mixed Breed and Unknown in seed data
- [x] Write seed script for sample dogs (dev only)

### 2.2 R2 Storage

- [x] Configure R2 bucket binding in wrangler.toml
- [x] Implement presigned URL generation in `apps/api/src/lib/r2.ts`
- [ ] Test presigned upload flow manually

### 2.3 Database Utilities

- [x] Create `apps/api/src/db/queries.ts` with typed query helpers
- [x] Create dog queries (create, get, list, update status)
- [x] Create rating queries (create, get by user/dog, avg)
- [x] Create breed queries (list, get by slug)
- [x] Create skip queries (create, check)
- [x] Create anonymous user queries (upsert, ban check)
- [x] Write unit tests for all queries (with mocked D1)

---

## Phase 3: Backend API

### 3.1 Core Infrastructure

- [x] Create `apps/api/src/index.ts` with Hono app
- [x] Create typed environment bindings interface
- [x] Set up CORS middleware
- [x] Export AppType for RPC

### 3.2 Middleware

- [x] Create `middleware/anon.ts` (anonymous ID cookie management)
- [x] Create `middleware/admin.ts` (admin secret validation)
- [ ] Create `middleware/rateLimit.ts` (rate limiting)
- [x] Create `middleware/logger.ts` (structured JSON logging)
- [ ] Create `middleware/banned.ts` (check is_banned)
- [x] Write tests for each middleware

### 3.3 Utility Libraries

- [x] Create `lib/errors.ts` (HTTPException helpers)
- [x] Create `lib/hash.ts` (IP hashing)
- [x] Create `lib/response.ts` (standard response formatters)

### 3.4 Services (Business Logic)

- [x] Create `services/dogs.ts`
  - [x] getNextUnratedDog(anonId)
  - [x] getDogById(id)
  - [x] createDog(data, anonId)
  - [x] getDogImageUrl(imageKey)
- [x] Create `services/ratings.ts`
  - [x] rateDog(dogId, value, anonId, ipHash)
  - [ ] getUserRatings(anonId, pagination)
  - [x] getDogAverageRating(dogId)
- [x] Create `services/leaderboard.ts`
  - [x] getTopDogs(pagination)
  - [x] getTopBreeds(pagination)
  - [ ] getTopDogsForBreed(slug, pagination)
- [x] Create `services/breeds.ts`
  - [x] listBreeds(search?)
  - [x] getBreedBySlug(slug)
- [x] Create `services/skips.ts`
  - [x] skipDog(dogId, anonId)
  - [x] hasSkipped(dogId, anonId)
- [ ] Create `services/admin.ts`
  - [ ] getPendingDogs(pagination)
  - [ ] approveDog(dogId, adminId)
  - [ ] rejectDog(dogId, adminId)
  - [ ] banUser(anonId)
- [x] Write unit tests for all services

### 3.5 Routes

- [x] Create `routes/dogs.ts`
  - [x] GET /api/dogs/next
  - [x] GET /api/dogs/:id
  - [x] POST /api/dogs/:id/rate (with zValidator)
  - [x] POST /api/dogs/:id/skip
  - [x] POST /api/dogs (with zValidator)
- [x] Create `routes/upload.ts`
  - [x] POST /api/upload-url (with zValidator)
- [x] Create `routes/leaderboard.ts`
  - [x] GET /api/leaderboard/dogs
  - [x] GET /api/leaderboard/breeds
- [x] Create `routes/breeds.ts`
  - [x] GET /api/breeds
  - [x] GET /api/breeds/:slug
  - [ ] GET /api/breeds/:slug/top
- [ ] Create `routes/me.ts`
  - [ ] GET /api/me/ratings
- [ ] Create `routes/admin.ts`
  - [ ] GET /api/admin/pending
  - [ ] POST /api/admin/dogs/:id/approve
  - [ ] POST /api/admin/dogs/:id/reject
  - [ ] POST /api/admin/ban/:anonId
- [x] Chain all routes in index.ts for AppType export
- [x] Write integration tests for all routes

### 3.6 Global Error Handler

- [x] Create global error handler in index.ts
- [x] Format HTTPException to standard error response
- [x] Log unexpected errors with full context
- [x] Return 500 for unhandled errors

---

## Phase 4: Frontend

### 4.1 API Client

- [x] Create `apps/web/src/api/client.ts` with hc<AppType>
- [ ] Set up React Query provider in App.tsx
- [ ] Create query hooks for each endpoint

### 4.2 Core Components

- [ ] Create ErrorBoundary component
- [ ] Create Loading/Skeleton components
- [x] Create Toast provider setup

### 4.3 BoneRating Component

- [x] Create `components/BoneRating.tsx`
- [x] Implement 5 bones with half-increment states
- [x] Add hover preview (desktop)
- [ ] Add touch/drag support (mobile)
- [ ] Add keyboard navigation (arrow keys)
- [ ] Add Skip button prop
- [ ] Add Framer Motion animations
- [ ] Add ARIA labels for accessibility
- [x] Write component tests

### 4.4 DogCard Component

- [x] Create `components/DogCard.tsx`
- [x] Implement lazy image loading with blur placeholder
- [x] Show dog name (if provided)
- [x] Show breed badge
- [x] Show average rating with mini bones
- [ ] Add share button (copy link)
- [ ] Add loading skeleton state
- [x] Write component tests

### 4.5 UploadForm Component

- [x] Create `components/UploadForm.tsx`
- [x] Implement drag & drop zone
- [x] Add file validation (type, size)
- [ ] Integrate browser-image-compression
- [x] Add image preview
- [x] Add dog name input (max 50 chars)
- [x] Add BreedCombobox
- [ ] Add upload progress indicator
- [x] Handle success/error states
- [ ] Write component tests

### 4.6 BreedCombobox Component

- [x] Create `components/BreedCombobox.tsx` (using select for now)
- [ ] Use shadcn Command component
- [ ] Implement fuzzy search
- [x] Include Mixed Breed and Unknown options
- [ ] Add mobile sheet variant
- [ ] Add clear button
- [ ] Write component tests

### 4.7 Leaderboard Components

- [x] Create `components/Leaderboard.tsx`
- [x] Implement rank badges (1st, 2nd, 3rd)
- [ ] Add infinite scroll
- [ ] Add pull-to-refresh (mobile)
- [x] Create empty state component
- [ ] Write component tests

### 4.8 Page Components

- [x] Create `pages/RatePage.tsx` (main rating flow)
- [x] Create `pages/UploadPage.tsx` (upload form)
- [x] Create `pages/LeaderboardPage.tsx` (tabs: dogs/breeds)
- [ ] Create `pages/BreedsPage.tsx` (all breeds grid + search)
- [ ] Create `pages/BreedDetailPage.tsx` (breed-specific)
- [ ] Create `pages/DogDetailPage.tsx` (individual dog)
- [ ] Create `pages/MyRatingsPage.tsx` (rating history)
- [ ] Create `pages/AdminPage.tsx` (moderation queue)
- [x] Set up React Router in App.tsx

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
- [x] Create `lib/utils.ts` (cn helper, etc.)
- [ ] Create `lib/formatters.ts` (date, number formatting)

---

## Phase 5: Testing

### 5.1 Unit Tests

- [x] Test all Zod schemas (valid & invalid inputs)
- [x] Test all service functions (mocked D1)
- [ ] Test all custom hooks (mocked API)
- [x] Test utility functions
- [x] Achieve 80%+ coverage on packages/shared
- [x] Achieve 80%+ coverage on apps/api/src/services

### 5.2 Integration Tests

- [x] Test API routes with mocked bindings
- [x] Test component integration
- [ ] Test Hono RPC client/server type alignment
- [x] Achieve 80%+ coverage on apps/api/src/routes
- [x] Achieve 80%+ coverage on apps/web/src/components

### 5.3 E2E Tests (Playwright)

- [x] Create `e2e/tests/smoke.spec.ts`
  - [x] Homepage loads
  - [x] Navigation works
  - [x] API health check
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

- [x] Verify `bun run dev` starts all apps
- [x] Verify `bun run build` builds all packages
- [x] Verify `bun run test` runs all tests
- [ ] Verify `bun run test:coverage` shows coverage
- [x] Verify `bun run lint` passes
- [x] Verify `bun run format:check` passes
- [x] Verify `bun run typecheck` passes

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

- [x] Update CLAUDE.md with any pattern changes
- [x] Verify plan.md is accurate
- [ ] Create brief README.md for the project

---

## Phase 7: Deployment

### 7.1 Cloudflare Setup

- [x] Create D1 database via Cloudflare dashboard or wrangler
- [x] Create R2 bucket via Cloudflare dashboard or wrangler
- [x] Run migrations on production D1
- [x] Seed breeds on production D1
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

## Phase 8: Dog CEO Content Integration + Analytics + User Enhancements

This phase adds Dog CEO API integration, analytics fields, and user system prep.

### 8.1 Database Migration

- [x] Create `apps/api/src/db/migrations/003_dog_ceo_integration.sql`
- [x] Add `dog_ceo_path` column to breeds table
- [x] Add `image_count` column to breeds table
- [x] Add `last_synced_at` column to breeds table
- [x] Add `image_url` column to dogs table
- [x] Add `image_source` column to dogs table
- [x] Add `user_agent` column to ratings table (analytics)
- [x] Add `user_agent` column to anonymous_users table (analytics)
- [x] Add `updated_at` column to users table
- [x] Add `email_verified` column to users table
- [x] Add `provider` column to users table (OAuth provider)
- [x] Add `linked_anon_id` column to users table (merge ratings)
- [x] Create index `idx_dogs_image_source` on dogs(image_source)
- [x] Create index `idx_users_linked_anon` on users(linked_anon_id)
- [x] Create index `idx_breeds_last_synced` on breeds(last_synced_at)
- [ ] Test migration locally with `wrangler d1 migrations apply`
- [ ] Run migration on production D1

### 8.2 Breed Name Mapping

- [ ] Create `apps/api/src/lib/dogCeoBreeds.ts`
- [ ] Map all 120+ Dog CEO breed paths to human-readable names
- [ ] Create `getReadableBreedName()` function
- [ ] Create `getBreedSlug()` function
- [ ] Write unit tests for all breed mappings
- [ ] Handle edge cases (unknown breeds, special characters)

### 8.3 Dog CEO Sync Script

- [ ] Create `apps/api/scripts/syncDogCeo.ts`
- [ ] Implement `fetchBreedList()` - fetch all breeds from API
- [ ] Implement `fetchBreedImages()` - fetch images per breed
- [ ] Implement `verifyImageUrl()` - verify image URLs are valid
- [ ] Implement rate limiting (100ms between API calls)
- [ ] Implement image deduplication
- [ ] Limit to 50 images per breed (configurable)
- [ ] Auto-approve all Dog CEO dogs
- [ ] Update breed `image_count` and `last_synced_at`
- [ ] Write integration tests with mocked API
- [ ] Add npm script: `"db:sync-dog-ceo": "bun run scripts/syncDogCeo.ts"`
- [ ] Run sync locally and verify data integrity
- [ ] Run sync on production D1

### 8.4 API Updates

- [ ] Update `apps/api/src/lib/r2.ts` - refactor `getImageUrl()`
  - [ ] Handle `image_source === 'dog_ceo'` (return `image_url` directly)
  - [ ] Handle `image_source === 'user_upload'` (return R2 presigned URL)
  - [ ] Add fallback for missing images
- [ ] Create `GET /api/dogs/prefetch` endpoint
  - [ ] Accept `count` query param (default: 10, max: 20)
  - [ ] Return multiple unrated dogs
  - [ ] Exclude rated and skipped dogs
  - [ ] Return `image_url` in response
- [ ] Update `GET /api/dogs/next` to use new `getImageUrl()`
- [ ] Update `GET /api/dogs/:id` to use new `getImageUrl()`
- [ ] Update `GET /api/leaderboard/dogs` to use new `getImageUrl()`
- [ ] Write integration tests for prefetch endpoint
- [ ] Write unit tests for updated `getImageUrl()`

### 8.5 Frontend Prefetching

- [ ] Create `apps/web/src/hooks/useDogPrefetch.ts`
  - [ ] Maintain queue of prefetched dogs in React state
  - [ ] Initialize queue from localStorage on mount
  - [ ] Persist queue to localStorage on change
  - [ ] Implement `fetchMore()` - call /api/dogs/prefetch
  - [ ] Implement `popDog()` - remove current dog from queue
  - [ ] Implement `clearQueue()` - clear queue and localStorage
  - [ ] Auto-refill when queue < threshold (default: 3)
  - [ ] Dedupe dogs by ID
- [ ] Implement image preloading
  - [ ] Add `<link rel="preload">` for each image in queue
  - [ ] Use `new Image()` for browser cache priming
- [ ] Update `apps/web/src/pages/RatePage.tsx`
  - [ ] Replace current fetch logic with `useDogPrefetch`
  - [ ] Show instant transitions (no loading between dogs)
  - [ ] Add queue length indicator (optional)
  - [ ] Handle empty queue gracefully
- [ ] Write unit tests for `useDogPrefetch` hook
- [ ] Write integration tests for RatePage with prefetching

### 8.6 Testing & Verification

- [ ] Unit tests: breed name mapping (all 120+ breeds)
- [ ] Unit tests: `getImageUrl()` for both sources
- [ ] Unit tests: `useDogPrefetch` hook
- [ ] Integration tests: prefetch endpoint with mocked D1
- [ ] Integration tests: sync script with mocked Dog CEO API
- [ ] E2E tests: rating flow with prefetch queue
- [ ] E2E tests: queue refill behavior
- [ ] E2E tests: localStorage persistence
- [ ] Performance tests: image preload timing
- [ ] Verify 80%+ test coverage on new code

### 8.7 Production Rollout

- [ ] Run migration on production D1
- [ ] Run sync script on production D1
- [ ] Verify breed data integrity (120+ breeds)
- [ ] Verify dog data integrity (5,000+ dogs)
- [ ] Deploy updated API
- [ ] Deploy updated frontend
- [ ] Monitor prefetch endpoint latency
- [ ] Monitor image load failures
- [ ] Monitor queue empty rate

### 8.8 Cleanup

- [ ] Remove old hardcoded breed mappings from `apps/api/src/lib/r2.ts`
- [ ] Remove old `BREED_TO_DOG_CEO` constant
- [ ] Remove old `BREED_IMAGE_FILES` constant
- [ ] Remove old hash-based image selection logic
- [ ] Update documentation in CLAUDE.md
- [ ] Update tests to reflect new architecture

---

## Phase 9: UI/UX Improvements (Completed)

### 9.1 Research Modern UI Design

- [x] Research 2025 UI/UX best practices
- [x] Research modern rating component designs
- [x] Research mobile-first responsive design patterns

### 9.2 BoneRating Redesign

- [x] Design nicer bone icons (SVG) - Using FontAwesome bone
- [x] Add smooth animations
- [x] Improve color contrast
- [x] Add touch-friendly interactions
- [x] Write tests for new features

### 9.3 Overall UI Polish

- [x] Improve color palette for better contrast
- [x] Add subtle gradients and shadows
- [x] Implement modern card designs
- [x] Add micro-interactions
- [x] Ensure mobile responsiveness
- [x] Ensure desktop responsiveness

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
- [ ] All Phase 8 (Dog CEO Integration) tasks completed
- [x] Phase 9 (UI/UX Improvements) completed
- [x] Test coverage >80%
- [x] All tests passing (unit tests)
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] Code formatted with Prettier
- [ ] Production deployed and functional
- [x] Documentation up to date
- [ ] Dog CEO sync complete (5,000+ dogs, 100+ breeds)
- [ ] Prefetching working in production
