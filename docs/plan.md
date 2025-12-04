# RateTheDogs - Implementation Plan

> **Version**: 1.1
> **Last Updated**: December 2025
> **Status**: MVP In Progress - Deployment Migration Complete

---

## Executive Summary

RateTheDogs is a dog rating web application where users upload dog photos and rate them on a 5-bone scale with half-point increments. Built entirely on Cloudflare's edge infrastructure for global low-latency performance and minimal hosting costs.

## Tech Stack

| Layer           | Technology                        | Rationale                                          |
| --------------- | --------------------------------- | -------------------------------------------------- |
| Runtime         | Cloudflare Workers + Static Assets | Unified deployment (API + frontend), global CDN    |
| Backend         | Hono ^4.10                        | Lightweight, TypeScript-first, built-in RPC        |
| Database        | Cloudflare D1                     | Serverless SQLite, automatic replication           |
| Storage         | Cloudflare R2                     | S3-compatible, zero egress fees                    |
| Validation      | Zod ^4.1                          | TypeScript inference, runtime validation           |
| Frontend        | React ^19                         | Latest stable, improved performance                |
| Build           | Vite ^7.2                         | Fast HMR, native ESM, TailwindCSS v4 plugin        |
| CSS             | TailwindCSS ^4.1                  | Utility-first, new Vite plugin                     |
| Components      | shadcn/ui                         | Accessible, customizable, owned code               |
| Package Manager | Bun ^1.1                          | Fast installs, native TypeScript                   |
| Monorepo        | Turborepo ^2.6                    | Task orchestration, caching                        |
| Testing         | Vitest ^4 + Playwright ^1.57     | Vite-native, comprehensive coverage                |
| Observability   | Cloudflare Workers Logs           | Structured logging, dashboard queries              |

> **Note**: Cloudflare Pages is now in maintenance mode. This project uses the recommended Cloudflare Workers with Static Assets approach for unified deployment.

---

## PRD Improvements

The original PRD had gaps. Here are the additions/corrections made:

### Schema Additions

1. **Dog name field** - Users can name their dogs
2. **ip_address in ratings** - Raw IP for analytics and abuse detection
3. **is_banned in anonymous_users** - Table is now required, not optional
4. **Unique constraints on ratings** - Prevent duplicate ratings
5. **image_key not image_url** - We store R2 keys, construct URLs at runtime
6. **created_at on breeds** - All tables need timestamps
7. **Enhanced users table** - google_id, name, avatar_url for OAuth
8. **Skips table** - Track dogs users chose not to rate
9. **Moderation audit fields** - moderated_by, moderated_at

### API Additions

1. **Pagination parameters** - `?limit=`, `?offset=` on all list endpoints
2. **Skip endpoint** - `POST /api/dogs/:id/skip` to skip without rating
3. **Dog detail endpoint** - `GET /api/dogs/:id` for shareable dog pages
4. **Admin ban endpoint** - `POST /api/admin/ban/:anonId`
5. **Response schemas** - Standard success/error/paginated formats
6. **Rate limits specified** - 10 ratings/min, 5 uploads/hour

### Feature Additions

1. **Dog detail page** - `/dogs/:id` for sharing individual dogs
2. **Mixed Breed option** - Include "Mixed Breed" and "Unknown" in breed list
3. **Skip button** - Users can skip dogs they don't want to rate
4. **Empty states** - Defined for all no-content scenarios
5. **Minimum rating threshold** - 3 ratings required for leaderboard
6. **File specifications** - Max 10MB, JPEG/PNG/WebP, max 4096px dimension

### UX Additions

1. **Loading skeletons** - All async components
2. **Error boundaries** - Graceful error handling
3. **Toast notifications** - User feedback for actions
4. **Moderation history** - Track who approved/rejected and when

---

## Monorepo Structure

```
rate-the-dogs/
├── package.json                 # Root workspace config
├── turbo.json                   # Turborepo task orchestration
├── tsconfig.base.json           # Shared TS config
├── eslint.config.mjs            # Flat ESLint config
├── .prettierrc                  # Prettier config
├── CLAUDE.md                    # AI assistant instructions
├── docs/
│   ├── ratethedogs_PRD.md       # Original PRD
│   ├── plan.md                  # This file
│   └── tasks.md                 # Task checklist
├── apps/
│   ├── api/                     # Cloudflare Worker (Hono)
│   │   ├── package.json
│   │   ├── wrangler.jsonc       # Cloudflare Workers config (unified deployment)
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts         # Main entry, exports AppType
│   │       ├── routes/          # dogs, breeds, leaderboard, upload, me, admin
│   │       ├── middleware/      # anon, admin, rateLimit, logger
│   │       ├── services/        # Business logic
│   │       ├── db/              # migrations, queries, seed
│   │       └── lib/             # r2, hash, errors utilities
│   └── web/                     # React SPA
│       ├── package.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── api/             # Hono RPC client
│           ├── components/      # ui/, BoneRating, DogCard, etc.
│           ├── pages/           # All page components
│           ├── hooks/           # useNextDog, useRating, etc.
│           └── lib/             # Utilities
├── packages/
│   └── shared/                  # Shared Zod schemas & types
│       └── src/
│           ├── schemas/         # dog, rating, breed, api schemas
│           ├── types/           # Inferred TypeScript types
│           └── constants.ts     # Shared constants
└── e2e/                         # Playwright E2E tests
    └── tests/                   # rating, upload, leaderboard, admin specs
```

---

## Dog CEO Content Integration

This section covers the integration of Dog CEO API as a long-term content source.

### Goals

- Scale from ~85 images to 5,000+ images
- Support 100+ breeds (vs. current 17)
- Instant image loading via prefetching
- Human-readable breed names

### Database Changes

New columns added to existing tables:

**breeds table:**

- `dog_ceo_path TEXT` - API path (e.g., "retriever/golden")
- `image_count INTEGER` - Number of synced images
- `last_synced_at TEXT` - Sync timestamp

**dogs table:**

- `image_url TEXT` - Direct URL for Dog CEO images
- `image_source TEXT` - 'dog_ceo' or 'user_upload'

### New Files

| File                                                     | Purpose                          |
| -------------------------------------------------------- | -------------------------------- |
| `apps/api/src/lib/dogCeoBreeds.ts`                       | Breed name mapping (120+ breeds) |
| `apps/api/scripts/syncDogCeo.ts`                         | Seeding script                   |
| `apps/web/src/hooks/useDogPrefetch.ts`                   | Frontend prefetch hook           |
| `apps/api/src/db/migrations/002_dog_ceo_integration.sql` | Schema migration                 |

### API Changes

New endpoint:

- `GET /api/dogs/prefetch?count=10` - Returns multiple unrated dogs for prefetching

Updated function:

- `getImageUrl()` - Now handles both Dog CEO URLs and R2 keys

### Frontend Changes

New hook: `useDogPrefetch`

- Maintains queue of prefetched dogs in React state
- Persists queue to localStorage
- Preloads images using `<link rel="preload">`
- Auto-refills when queue runs low

### Testing Requirements

- Unit tests for breed name mapping
- Integration tests for prefetch endpoint
- E2E tests for prefetch queue behavior
- Performance tests for image loading

---

## Database Schema

```sql
-- breeds: Dog breed catalog (includes Mixed Breed, Unknown)
CREATE TABLE breeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  dog_ceo_path TEXT,                          -- Dog CEO API path
  image_count INTEGER DEFAULT 0,              -- Synced image count
  last_synced_at TEXT,                        -- Last sync timestamp
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- dogs: Dog photos (from Dog CEO or user uploads)
CREATE TABLE dogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,                                  -- Optional dog name
  image_key TEXT,                             -- R2 object key (user uploads)
  image_url TEXT,                             -- Direct URL (Dog CEO)
  image_source TEXT DEFAULT 'user_upload',    -- 'dog_ceo' or 'user_upload'
  breed_id INTEGER NOT NULL REFERENCES breeds(id),
  uploader_user_id INTEGER REFERENCES users(id),
  uploader_anon_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'approved', 'rejected')),
  moderated_by TEXT,                          -- Admin who reviewed
  moderated_at TEXT,                          -- When reviewed
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ratings: User ratings with unique constraints
CREATE TABLE ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dog_id INTEGER NOT NULL REFERENCES dogs(id),
  value REAL NOT NULL CHECK(value >= 0.5 AND value <= 5.0),
  user_id INTEGER REFERENCES users(id),
  anon_id TEXT,
  ip_address TEXT,                            -- Raw IP for analytics
  user_agent TEXT,                            -- Browser/device info
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(dog_id, anon_id),
  UNIQUE(dog_id, user_id)
);

-- skips: Dogs user chose not to rate
CREATE TABLE skips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dog_id INTEGER NOT NULL REFERENCES dogs(id),
  user_id INTEGER REFERENCES users(id),
  anon_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(dog_id, anon_id),
  UNIQUE(dog_id, user_id)
);

-- users: Registered users (OAuth ready)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  google_id TEXT UNIQUE,                      -- Google OAuth ID
  provider TEXT DEFAULT 'google',             -- OAuth provider
  email_verified INTEGER DEFAULT 0,           -- Email verification flag
  linked_anon_id TEXT,                        -- Anonymous ID to merge
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))   -- Profile update tracking
);

-- anonymous_users: Track anonymous visitors (REQUIRED)
CREATE TABLE anonymous_users (
  anon_id TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_banned INTEGER NOT NULL DEFAULT 0,
  user_agent TEXT                             -- Browser/device info
);

-- Indexes
CREATE INDEX idx_dogs_status ON dogs(status);
CREATE INDEX idx_dogs_breed ON dogs(breed_id);
CREATE INDEX idx_dogs_created ON dogs(created_at DESC);
CREATE INDEX idx_dogs_image_source ON dogs(image_source);
CREATE INDEX idx_ratings_dog ON ratings(dog_id);
CREATE INDEX idx_ratings_anon ON ratings(anon_id);
CREATE INDEX idx_skips_anon ON skips(anon_id);
CREATE INDEX idx_users_google ON users(google_id);
CREATE INDEX idx_users_linked_anon ON users(linked_anon_id);
CREATE INDEX idx_breeds_last_synced ON breeds(last_synced_at);
```

---

## API Specification

### Response Formats

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string, details?: unknown } }

// Paginated
{ success: true, data: { items: T[], total: number, limit: number, offset: number, hasMore: boolean } }
```

### Endpoints

| Method | Path                          | Params                         | Description              |
| ------ | ----------------------------- | ------------------------------ | ------------------------ |
| GET    | `/api/dogs/next`              | -                              | Next unrated dog         |
| GET    | `/api/dogs/prefetch`          | `?count=10`                    | Prefetch multiple dogs   |
| GET    | `/api/dogs/:id`               | -                              | Dog details              |
| POST   | `/api/dogs/:id/rate`          | `{ value }`                    | Submit rating            |
| POST   | `/api/dogs/:id/skip`          | -                              | Skip dog                 |
| POST   | `/api/dogs`                   | `{ name?, imageKey, breedId }` | Create dog               |
| POST   | `/api/upload-url`             | `{ contentType }`              | Presigned URL            |
| GET    | `/api/leaderboard/dogs`       | `?limit=20&offset=0`           | Top dogs (min 3 ratings) |
| GET    | `/api/leaderboard/breeds`     | `?limit=20&offset=0`           | Top breeds               |
| GET    | `/api/breeds`                 | `?search=`                     | List/search breeds       |
| GET    | `/api/breeds/:slug`           | -                              | Breed details            |
| GET    | `/api/breeds/:slug/top`       | `?limit=20&offset=0`           | Top dogs in breed        |
| GET    | `/api/me/ratings`             | `?limit=20&offset=0`           | Rating history           |
| GET    | `/api/admin/pending`          | `?limit=20&offset=0`           | Pending dogs             |
| POST   | `/api/admin/dogs/:id/approve` | -                              | Approve                  |
| POST   | `/api/admin/dogs/:id/reject`  | -                              | Reject                   |
| POST   | `/api/admin/ban/:anonId`      | -                              | Ban user                 |

### Rate Limits

- Rating: 10/min per anon_id
- Upload: 5/hour per anon_id
- General: 100/min per IP

### File Constraints

- Max size: 10MB
- Types: `image/jpeg`, `image/png`, `image/webp`
- Max dimension: 4096px
- Client compression: 1MB, 1920px target

---

## Frontend Pages

| Route           | Component       | Description                |
| --------------- | --------------- | -------------------------- |
| `/`             | RatePage        | Main rating flow + Skip    |
| `/upload`       | UploadPage      | Upload with name & breed   |
| `/leaderboard`  | LeaderboardPage | Top Dogs / Top Breeds tabs |
| `/breeds`       | BreedsPage      | All breeds with search     |
| `/breeds/:slug` | BreedDetailPage | Breed rankings             |
| `/dogs/:id`     | DogDetailPage   | Individual dog (shareable) |
| `/my/ratings`   | MyRatingsPage   | Rating history             |
| `/admin`        | AdminPage       | Moderation queue           |

---

## Key Components

### BoneRating

- 5 bones, half-increment states
- Hover preview, touch/drag
- Keyboard accessible
- Skip button when interactive
- Framer Motion animations

### UploadForm

- Drag & drop zone
- Client compression
- Dog name input (optional)
- Breed combobox (searchable)
- Progress indicator

### BreedCombobox

- shadcn Command component
- Fuzzy search
- Mixed Breed/Unknown options
- Mobile sheet variant

### DogCard

- Lazy image + blur placeholder
- Name & breed display
- Rating widget
- Share button

### ThemeToggle

- Sun/moon icons with smooth transitions
- Toggles between light and dark mode
- Persists preference to localStorage
- Respects system preference (`prefers-color-scheme`)

---

## Empty States

| Scenario          | Message                                         |
| ----------------- | ----------------------------------------------- |
| No more dogs      | "You've rated all the dogs! Check back soon."   |
| No dogs in breed  | "No dogs in this breed yet. Upload yours!"      |
| No ratings        | "You haven't rated any dogs yet. Start rating!" |
| API error         | "Something went wrong. Please try again."       |
| No search results | "No breeds match your search."                  |

---

## Security

| Measure         | Implementation                     |
| --------------- | ---------------------------------- |
| Cookies         | HTTP-only, Secure, SameSite=Strict |
| Validation      | Zod on all endpoints               |
| Rate limiting   | Per-endpoint limits                |
| File validation | Type, size, dimension              |
| SQL             | Parameterized queries              |
| XSS             | React escaping                     |
| Admin           | X-Admin-Secret header              |
| Abuse           | IP hashing                         |

---

## Testing (80%+ Coverage)

| Type        | Tool       | Focus                    |
| ----------- | ---------- | ------------------------ |
| Unit        | Vitest     | Schemas, services, hooks |
| Integration | Vitest     | Routes, components       |
| E2E         | Playwright | User flows               |

---

## Phase Roadmap

### Phase 1: MVP (Current)

- Anonymous rating + skip
- Dog upload with name & breed
- Leaderboards
- Admin moderation
- Light/dark mode theme with system preference detection
- 80%+ test coverage

### Phase 1.5: Dog CEO Content Integration (NEW)

- Comprehensive Dog CEO API integration
- 100+ breeds with 5,000+ images
- Frontend prefetching with localStorage
- Instant image transitions
- Production-quality content

See `docs/dog-ceo-integration.md` for complete technical specification.

### Phase 2: User Accounts

- Google OAuth
- User profiles
- Merge anon ratings
- User theme preferences

### Phase 3: Polish & SEO

- WCAG 2.2 audit
- Meta tags, Open Graph
- PWA support
- Ensure theme contrast meets WCAG standards

### Phase 4: Legal

- Privacy policy
- Cookie consent
- Terms of service

### Phase 5: Social

- Share buttons
- OG images
- Notifications

### Phase 6: Advanced

- AI content moderation
- Breed identification

---

## Success Metrics

| Metric         | Target  |
| -------------- | ------- |
| Page load      | <200ms  |
| API latency    | <150ms  |
| Ratings (3 mo) | >10,000 |
| Uploads (3 mo) | >1,000  |
| Return rate    | >30%    |
| Test coverage  | >80%    |
| Lighthouse     | >90     |

---

## Sources & References

- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
- [Hono Documentation](https://hono.dev/)
- [Hono RPC Guide](https://hono.dev/docs/guides/rpc)
- [Hono Zod Validator](https://github.com/honojs/middleware/tree/main/packages/zod-validator)
- [shadcn/ui Installation](https://ui.shadcn.com/docs/installation)
- [TailwindCSS v4 Vite](https://tailkits.com/blog/install-tailwind-css-with-vite/)
- [Vitest Testing](https://vitest.dev/)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)
- [Zod Documentation](https://zod.dev/)
