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

> **Status**: Upload feature disabled with "Coming Soon" overlay until these items are complete.

- [x] Configure R2 bucket binding in wrangler.toml
- [x] Implement presigned URL generation in `apps/api/src/lib/r2.ts`
- [ ] Test presigned upload flow manually
- [ ] **BLOCKER**: Add image serving endpoint (`GET /api/images/*`) to proxy R2 images
- [ ] **BLOCKER**: Configure R2 public URL or add proxy route for user-uploaded images
- [ ] Add server-side file size validation (currently client-only)
- [ ] Add rate limiting for uploads (constants defined: 5/hour, not enforced)
- [ ] Consider moderation queue (currently auto-approved)

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
- [x] Create `routes/me.ts`
  - [x] GET /api/me/stats (returns ratings_count and skips_count)
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

> **Status**: Disabled with "Coming Soon" overlay until backend is complete.
> **Feature Flag**: `UPLOAD_ENABLED` in `apps/web/src/pages/UploadPage.tsx`

- [x] Create `components/UploadForm.tsx`
- [x] Implement drag & drop zone
- [x] Add file validation (type, size)
- [ ] Integrate browser-image-compression
- [x] Add image preview
- [x] Add dog name input (max 50 chars)
- [x] Add BreedCombobox
- [ ] Add upload progress indicator
- [x] Handle success/error states
- [x] Add "Coming Soon" overlay when disabled
- [x] Write component tests (11 passing, 3 skipped for disabled state)

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
- [x] Create `e2e/tests/deployment.spec.ts`
  - [x] Static assets load (CSS, JS, images)
  - [x] SPA routing works (direct navigation)
  - [x] API routes work (same origin)
  - [x] Cookie handling (anonymous ID)
- [x] Create `e2e/tests/rating.spec.ts`
  - [x] Rate a dog successfully
  - [x] Skip a dog
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
- [x] Verify `bun run test:coverage` shows coverage
- [x] Verify `bun run lint` passes
- [x] Verify `bun run format:check` passes
- [x] Verify `bun run typecheck` passes

### 6.2 Pre-commit Hooks

- [ ] Set up Husky
- [ ] Set up lint-staged
- [ ] Configure pre-commit to run lint, format, typecheck

### 6.3 CI/CD

- [x] Create `.github/workflows/ci.yml`
- [x] Run typecheck, lint, format:check, test on PRs
- [x] Run build to verify compilation
- [x] Create `.github/workflows/deploy.yml`
- [x] Deploy to Cloudflare on main merge

### 6.4 Documentation

- [x] Update CLAUDE.md with any pattern changes
- [x] Verify plan.md is accurate
- [ ] Create brief README.md for the project

---

## Phase 6.5: Cloudflare Workers Unified Deployment Migration (COMPLETED)

> **Status**: Completed December 2025
> **Reference**: `docs/deployment-migration-plan.md`

### 6.5.1 Configuration Migration

- [x] Delete `apps/api/wrangler.toml`
- [x] Create `apps/api/wrangler.jsonc` with unified deployment config
- [x] Add `assets` configuration pointing to `../web/dist`
- [x] Add `run_worker_first: ["/api/*", "/"]` for API routing
- [x] Add observability config with 10% sampling rate
- [x] Add dev environment configuration

### 6.5.2 Build Scripts

- [x] Add `build:deploy` script to root package.json
- [x] Add `deploy` script for unified deployment
- [x] Add `deploy:preview` script for dev environment
- [x] Update turbo.json for deployment tasks

### 6.5.3 GitHub Workflows

- [x] Create `.github/workflows/ci.yml` for PR checks
- [x] Create `.github/workflows/deploy.yml` for production deployment
- [x] Configure Cloudflare API token secret requirement

### 6.5.4 E2E Test Updates

- [x] Update `e2e/playwright.config.ts` for unified server testing
- [x] Create `e2e/tests/deployment.spec.ts` for deployment verification
- [x] Add static asset loading tests
- [x] Add SPA routing tests
- [x] Add API route tests (same origin)
- [x] Add cookie handling tests
- [x] Skip webkit tests on WSL (missing system dependencies)

### 6.5.5 Package Updates (React 19 Migration)

- [x] Update React to 19.2.1
- [x] Update Vite to 7.2.6
- [x] Update Vitest to 4.0.15 (web) / 3.2.x (api)
- [x] Update @testing-library/react to 16.3.0
- [x] Update Zod to 4.1.13
- [x] Update Hono to 4.10.7
- [x] Update TailwindCSS to 4.1.17
- [x] Update TypeScript to 5.9.3
- [x] Fix Zod 4 breaking changes (errorMap → message)
- [x] Fix jest-dom matchers for Vitest 4
- [x] Fix React 19 act() warnings in tests

### 6.5.6 Test Results

- [x] Unit tests: 339+ passing (shared: 18, api: 168, web: 153)
- [x] E2E tests: 51 passing (Chromium, Firefox, Mobile Chrome)
- [x] All quality checks passing (typecheck, lint, format)

---

## Phase 7: Deployment

### 7.1 Cloudflare Setup

- [x] Create D1 database via Cloudflare dashboard or wrangler
- [x] Create R2 bucket via Cloudflare dashboard or wrangler
- [x] Run migrations on production D1
- [x] Seed breeds on production D1
- [ ] Set ADMIN_SECRET in Cloudflare Workers secrets

### 7.2 Production Deploy

- [ ] Deploy unified Worker with `bun run deploy` (API + static assets)
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
- [x] Store `ip_address` and `user_agent` in ratings INSERT (was missing)
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

- [x] Create `apps/api/src/lib/dogCeoBreeds.ts`
- [x] Map all 120+ Dog CEO breed paths to human-readable names
- [x] Create `getReadableBreedName()` function
- [x] Create `getBreedSlug()` function
- [x] Write unit tests for all breed mappings
- [x] Handle edge cases (unknown breeds, special characters)

### 8.3 Dog CEO Data Pipeline (Two-Step Approach)

> **Architecture**: Separated fetch/seed scripts for faster iteration and offline capability.
> See `docs/dog-ceo-integration.md` for full details.

#### Step 1: Fetch Script (Already Exists)

- [x] Create `apps/api/scripts/fetchDogCeoImages.ts`
- [x] Implement `fetchBreedList()` - fetch all breeds from API
- [x] Implement `fetchBreedImages()` - fetch images per breed
- [x] Implement retry logic with exponential backoff
- [x] Implement rate limiting (10 concurrent, 50ms delay)
- [x] Implement duplicate image filtering (sub-breed deduplication)
- [x] Create `apps/api/src/lib/dogCeoUtils.ts` utility functions
- [x] Generate `apps/api/src/db/breed-images.json` (~21,000 images, 174 breeds)
- [x] Add `--validate-only` and `--dry-run` options
- [ ] Add npm script: `"db:fetch-dog-ceo": "bun run scripts/fetchDogCeoImages.ts"`

#### Step 2: Seed Script

- [x] Create `apps/api/scripts/seedDogCeoImages.ts`
- [x] Read `breed-images.json` file
- [x] Use `dogCeoBreeds.ts` for human-readable breed names
- [x] Upsert breeds into D1 with `dog_ceo_path`
- [x] Insert dogs with `image_source = 'dog_ceo'` and `status = 'approved'`
- [x] Limit images per breed (configurable, default: 50)
- [x] Update breed `image_count` and `last_synced_at`
- [x] Skip duplicate images (UNIQUE constraint handling)
- [x] Add `--dry-run`, `--limit=N`, `--local`, `--remote` options
- [ ] Write integration tests for seed script
- [ ] Add npm script: `"db:seed-dog-ceo": "bun run scripts/seedDogCeoImages.ts"`
- [ ] Run seed locally and verify data integrity
- [ ] Run seed on production D1 with `--remote`

### 8.4 API Updates

- [x] Update `apps/api/src/lib/r2.ts` - refactor `getImageUrl()`
  - [x] Handle `image_source === 'dog_ceo'` (return `image_url` directly)
  - [x] Handle `image_source === 'user_upload'` (return R2 presigned URL)
  - [x] Add fallback for missing images
- [x] Create `GET /api/dogs/prefetch` endpoint
  - [x] Accept `count` query param (default: 10, max: 20)
  - [x] Return multiple unrated dogs
  - [x] Exclude rated and skipped dogs
  - [x] Return `image_url` in response
- [x] Update `GET /api/dogs/next` to use new `getImageUrl()`
- [x] Update `GET /api/dogs/:id` to use new `getImageUrl()`
- [x] Update `GET /api/leaderboard/dogs` to use new `getImageUrl()`
- [x] Write integration tests for prefetch endpoint
- [x] Write unit tests for updated `getImageUrl()`

### 8.5 Frontend Prefetching

- [x] Create `apps/web/src/hooks/useDogPrefetch.ts`
  - [x] Maintain queue of prefetched dogs in React state
  - [x] Initialize queue from localStorage on mount
  - [x] Persist queue to localStorage on change
  - [x] Implement `fetchMore()` - call /api/dogs/prefetch
  - [x] Implement `popDog()` - remove current dog from queue
  - [x] Implement `clearQueue()` - clear queue and localStorage
  - [x] Auto-refill when queue < threshold (default: 3)
  - [x] Dedupe dogs by ID
- [x] Implement image preloading
  - [x] Add `<link rel="preload">` for each image in queue
  - [x] Use `new Image()` for browser cache priming
- [x] Update `apps/web/src/pages/RatePage.tsx`
  - [x] Replace current fetch logic with `useDogPrefetch`
  - [x] Show instant transitions (no loading between dogs)
  - [ ] Add queue length indicator (optional)
  - [x] Handle empty queue gracefully
- [x] Write unit tests for `useDogPrefetch` hook
- [x] Write integration tests for RatePage with prefetching

### 8.6 Testing & Verification

- [x] Unit tests: breed name mapping (all 170+ breeds)
- [x] Unit tests: `getImageUrl()` for both sources
- [x] Unit tests: `useDogPrefetch` hook
- [x] Integration tests: prefetch endpoint with mocked D1
- [ ] Integration tests: seed script (`seedDogCeoImages.ts`)
- [x] Integration tests: fetch script (`fetchDogCeoImages.ts`) with mocked API
- [x] E2E tests: rating flow with prefetch queue
- [ ] E2E tests: queue refill behavior
- [ ] E2E tests: localStorage persistence
- [ ] Performance tests: image preload timing
- [x] Verify 80%+ test coverage on new code

### 8.7 Production Rollout

- [ ] Run migration on production D1
- [ ] Run seed script on production D1 (`seedDogCeoImages.ts --remote`)
- [ ] Verify breed data integrity (170+ breeds)
- [ ] Verify dog data integrity (8,000+ dogs with default limit)
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

## Phase 10: Light/Dark Mode Theme (Completed)

### 10.1 Theme System Architecture

- [x] Create ThemeContext with provider and useTheme hook
- [x] Support "light", "dark", and "system" theme options
- [x] Default to user's system preference via `prefers-color-scheme`
- [x] Persist theme choice to localStorage
- [x] Listen for system preference changes in real-time

### 10.2 Theme Toggle Component

- [x] Create ThemeToggle component with sun/moon icons
- [x] Add smooth icon transitions (rotation/scale animations)
- [x] Dynamic aria-label based on current theme
- [x] Add to navbar (both desktop and mobile)

### 10.3 CSS Theme Variables

- [x] Define light theme variables in `:root`
- [x] Define dark theme variables in `.dark` class
- [x] Use OKLCH color space for perceptually uniform colors
- [x] Add smooth theme transition animations
- [x] Include semantic variables (background, foreground, card, muted, etc.)

### 10.4 Component Updates

- [x] Update BoneRating.tsx to use CSS variables instead of hardcoded colors
- [x] Update DogCard.tsx to use theme-aware classes
- [x] Update RatePage.tsx to use theme classes
- [x] Update LeaderboardPage.tsx to use theme classes
- [x] Update UploadPage.tsx to use theme classes
- [x] Update navbar logo to conditionally invert based on theme

### 10.5 Testing

- [x] Write unit tests for ThemeContext (13 tests)
- [x] Write unit tests for ThemeToggle (14 tests)
- [x] Test localStorage persistence
- [x] Test system preference detection
- [x] Test theme toggle behavior

---

## Phase 11: Drizzle ORM Migration (Completed)

> **Status**: Completed December 2025
> **Purpose**: Migrate from raw D1 SQL to Drizzle ORM with drizzle-zod integration

### 11.1 Setup & Dependencies

- [x] Install `drizzle-orm` package
- [x] Install `drizzle-kit` dev dependency
- [x] Install `drizzle-zod` dev dependency
- [x] Create `apps/api/drizzle.config.ts` for Drizzle Kit

### 11.2 Schema Definition

- [x] Create `apps/api/src/db/schema/breeds.ts` - breeds table with indexes
- [x] Create `apps/api/src/db/schema/dogs.ts` - dogs table with status enum
- [x] Create `apps/api/src/db/schema/ratings.ts` - ratings table with constraints
- [x] Create `apps/api/src/db/schema/skips.ts` - skips table
- [x] Create `apps/api/src/db/schema/users.ts` - users table with OAuth fields
- [x] Create `apps/api/src/db/schema/anonymousUsers.ts` - anonymous_users table
- [x] Create `apps/api/src/db/schema/relations.ts` - Drizzle relations
- [x] Create `apps/api/src/db/schema/index.ts` - Re-exports all tables

### 11.3 Client & Middleware

- [x] Create `apps/api/src/db/drizzle.ts` - Database client factory
- [x] Create `apps/api/src/db/zodSchemas.ts` - drizzle-zod generated schemas
- [x] Create `apps/api/src/middleware/db.ts` - DB middleware
- [x] Update `apps/api/src/lib/env.ts` - Add db to Variables type
- [x] Update `apps/api/src/index.ts` - Add db middleware

### 11.4 Route Conversion

- [x] Convert `apps/api/src/routes/breeds.ts` to use Drizzle
- [x] Convert `apps/api/src/routes/dogs.ts` to use Drizzle
- [x] Convert `apps/api/src/routes/leaderboard.ts` to use Drizzle
- [x] Preserve snake_case field names in API responses

### 11.5 Testing

- [x] Create `apps/api/src/test/setup.ts` - Test setup with migrations
- [x] Update `apps/api/src/routes/breeds.test.ts` - Use real D1 via miniflare
- [x] Update `apps/api/src/routes/dogs.test.ts` - Use real D1 via miniflare
- [x] Update `apps/api/src/routes/leaderboard.test.ts` - Use real D1 via miniflare
- [x] All 132 tests passing

### 11.6 Cleanup

- [x] Delete `packages/shared/src/schemas/dog.ts`
- [x] Delete `packages/shared/src/schemas/dog.test.ts`
- [x] Delete `packages/shared/src/schemas/breed.ts`
- [x] Delete `packages/shared/src/schemas/rating.ts`
- [x] Delete `packages/shared/src/schemas/rating.test.ts`
- [x] Delete `packages/shared/src/schemas/user.ts`
- [x] Delete `packages/shared/src/schemas/user.test.ts`
- [x] Update `packages/shared/src/schemas/index.ts` - Only export api.js
- [x] Update `packages/shared/src/types/index.ts` - Only export API types
- [x] Delete unused `apps/api/src/test/mockDb.ts`

### 11.7 Configuration & Documentation

- [x] Update `apps/api/tsconfig.json` - Exclude src/test/\*\*
- [x] Update `eslint.config.mjs` - Disable type checking for test files
- [x] Update `CLAUDE.md` with Drizzle ORM patterns section
- [x] Update `docs/plan.md` with Database Layer section
- [x] Update `docs/tasks.md` with Phase 11 (this section)

### 11.8 Validation

- [x] `bun run typecheck` - All passing
- [x] `bun run lint` - All passing
- [x] `bun run format:check` - All passing
- [x] `bun run test` - 132 tests passing

---

## Phase 12: My Stats Page (Completed)

> **Status**: Completed December 2025
> **Purpose**: Personal statistics page showing user's rating activity, achievements, and personality

### 12.1 Shared Types & Constants

- [x] Create `packages/shared/src/types/stats.ts` - TypeScript interfaces for stats data
- [x] Add `MILESTONES` constant array (6 milestones)
- [x] Add `ACHIEVEMENTS` constant array (7 achievements)
- [x] Add `PERSONALITIES` constant array (5 personality types)
- [x] Add `TOP_DOG_PERSONALITY` constant
- [x] Add `STATS_THRESHOLDS` constant
- [x] Export all stats types from `packages/shared/src/types/index.ts`

### 12.2 API Endpoints

- [x] Enhance `GET /api/me/stats` - Add avg rating, timestamps, global comparison
- [x] Create `GET /api/me/top-breeds` - User's top 3 highest-rated breeds
- [x] Create `GET /api/me/rating-distribution` - Breakdown by rating value
- [x] Create `GET /api/me/recent` - Last 10 rated dogs
- [x] Create `GET /api/me/achievements` - Milestone progress + achievement badges
- [x] Create `apps/api/src/services/achievements.ts` - Achievement checking logic
- [x] Write comprehensive API tests for all new endpoints

### 12.3 Frontend Components

- [x] Create `apps/web/src/components/stats/` directory
- [x] Create `StatCard.tsx` - Reusable stat card with icon, value, label
- [x] Create `RaterPersonality.tsx` - Personality badge based on rating patterns
- [x] Create `RatingDistribution.tsx` - Horizontal bar chart of ratings
- [x] Create `TopBreedsList.tsx` - Top 3 breeds with medal badges
- [x] Create `RecentRatings.tsx` - Responsive grid of recent ratings
- [x] Create `AchievementsBadges.tsx` - Grid of achievement badges
- [x] Create `MilestoneProgress.tsx` - Progress bar with milestone markers
- [x] Create `index.ts` - Barrel export file

### 12.4 Stats Page

- [x] Create `apps/web/src/pages/StatsPage.tsx`
- [x] Implement parallel data fetching from all 5 endpoints
- [x] Add loading skeleton states for all sections
- [x] Add empty state for new users (0 ratings)
- [x] Add error state with retry button
- [x] Make layout responsive (mobile/desktop)

### 12.5 Navigation & Routing

- [x] Add `/stats` route in `apps/web/src/App.tsx`
- [x] Add "My Stats" link to navigation (desktop and mobile)
- [x] Add chart icon for stats nav link

### 12.6 Testing

- [x] Write API tests for all 5 endpoints (19 tests)
- [x] Write E2E tests for stats page (`e2e/tests/stats.spec.ts`)
- [x] Run full test suite (227 tests passing)
- [x] Run typecheck, lint, format:check - all passing

### 12.7 Features Implemented

- **Basic Stats**: Ratings count, skips count, avg rating given
- **Global Comparison**: Shows how user rates vs global average
- **Rater Personality**: 5 fun dog-themed personalities based on rating patterns
  - Puppy Trainee (< 10 ratings)
  - Treat Dispenser (avg > 4.2)
  - Belly Rub Expert (avg 3.5-4.2)
  - Bark Inspector (avg 2.5-3.5)
  - Picky Pup Parent (avg < 2.5)
  - Top Dog bonus badge (100+ ratings)
- **Milestones**: 6 milestone celebrations (1, 10, 50, 100, 250, 500 ratings)
- **Achievements**: 7 unlockable badges
  - Perfect Score (5.0 rating)
  - Breed Explorer (10+ breeds)
  - Variety Pack (all rating values)
  - Early Bird (5 ratings in 30 min)
  - Streak Master (7 day streak)
  - All-Star Rater (20+ ratings >= 4.0)
  - Tough Crowd (rating < 2.0)
- **Rating Distribution**: Bar chart showing rating pattern
- **Top Breeds**: User's 3 highest-rated breeds with images
- **Recent Ratings**: Grid of last 10 rated dogs

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
- [x] Phase 10 (Light/Dark Mode Theme) completed
- [x] Phase 11 (Drizzle ORM Migration) completed
- [x] Phase 12 (My Stats Page) completed
- [x] Test coverage >80%
- [x] All tests passing (227 unit/integration tests)
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] Code formatted with Prettier
- [ ] Production deployed and functional
- [x] Documentation up to date
- [ ] Dog CEO seed complete (8,000+ dogs, 170+ breeds)
- [x] Prefetching working locally (needs production deployment)
