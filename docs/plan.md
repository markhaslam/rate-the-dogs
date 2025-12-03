# RateTheDogs - Implementation Plan

> **Version**: 1.0
> **Last Updated**: December 2025
> **Status**: Ready for Implementation

---

## Executive Summary

RateTheDogs is a dog rating web application where users upload dog photos and rate them on a 5-bone scale with half-point increments. Built entirely on Cloudflare's edge infrastructure for global low-latency performance and minimal hosting costs.

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Runtime | Cloudflare Workers | Edge deployment, global CDN, generous free tier |
| Backend | Hono ^4.6 | Lightweight, TypeScript-first, built-in RPC |
| Database | Cloudflare D1 | Serverless SQLite, automatic replication |
| Storage | Cloudflare R2 | S3-compatible, zero egress fees |
| Validation | Zod ^3.23 | TypeScript inference, runtime validation |
| Frontend | React ^18.3 | Component ecosystem, React Query |
| Build | Vite ^6.0 | Fast HMR, native ESM, TailwindCSS v4 plugin |
| CSS | TailwindCSS ^4.0 | Utility-first, new Vite plugin |
| Components | shadcn/ui | Accessible, customizable, owned code |
| Package Manager | Bun ^1.1 | Fast installs, native TypeScript |
| Monorepo | Turborepo ^2.3 | Task orchestration, caching |
| Testing | Vitest + Playwright | Vite-native, comprehensive coverage |
| Observability | Cloudflare Workers Logs | Structured logging, dashboard queries |

---

## PRD Improvements

The original PRD had gaps. Here are the additions/corrections made:

### Schema Additions
1. **Dog name field** - Users can name their dogs
2. **ip_hash in ratings** - For abuse detection (mentioned but not in schema)
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
│   │   ├── wrangler.toml
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

## Database Schema

```sql
-- breeds: Dog breed catalog (includes Mixed Breed, Unknown)
CREATE TABLE breeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- dogs: Uploaded dog photos
CREATE TABLE dogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,                                  -- Optional dog name
  image_key TEXT NOT NULL,                    -- R2 object key
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
  ip_hash TEXT,                               -- Abuse detection
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

-- users: Registered users (Phase 2 ready)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  google_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- anonymous_users: Track anonymous visitors (REQUIRED)
CREATE TABLE anonymous_users (
  anon_id TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_banned INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX idx_dogs_status ON dogs(status);
CREATE INDEX idx_dogs_breed ON dogs(breed_id);
CREATE INDEX idx_dogs_created ON dogs(created_at DESC);
CREATE INDEX idx_ratings_dog ON ratings(dog_id);
CREATE INDEX idx_ratings_anon ON ratings(anon_id);
CREATE INDEX idx_skips_anon ON skips(anon_id);
CREATE INDEX idx_users_google ON users(google_id);
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

| Method | Path | Params | Description |
|--------|------|--------|-------------|
| GET | `/api/dogs/next` | - | Next unrated dog |
| GET | `/api/dogs/:id` | - | Dog details |
| POST | `/api/dogs/:id/rate` | `{ value }` | Submit rating |
| POST | `/api/dogs/:id/skip` | - | Skip dog |
| POST | `/api/dogs` | `{ name?, imageKey, breedId }` | Create dog |
| POST | `/api/upload-url` | `{ contentType }` | Presigned URL |
| GET | `/api/leaderboard/dogs` | `?limit=20&offset=0` | Top dogs (min 3 ratings) |
| GET | `/api/leaderboard/breeds` | `?limit=20&offset=0` | Top breeds |
| GET | `/api/breeds` | `?search=` | List/search breeds |
| GET | `/api/breeds/:slug` | - | Breed details |
| GET | `/api/breeds/:slug/top` | `?limit=20&offset=0` | Top dogs in breed |
| GET | `/api/me/ratings` | `?limit=20&offset=0` | Rating history |
| GET | `/api/admin/pending` | `?limit=20&offset=0` | Pending dogs |
| POST | `/api/admin/dogs/:id/approve` | - | Approve |
| POST | `/api/admin/dogs/:id/reject` | - | Reject |
| POST | `/api/admin/ban/:anonId` | - | Ban user |

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

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | RatePage | Main rating flow + Skip |
| `/upload` | UploadPage | Upload with name & breed |
| `/leaderboard` | LeaderboardPage | Top Dogs / Top Breeds tabs |
| `/breeds` | BreedsPage | All breeds with search |
| `/breeds/:slug` | BreedDetailPage | Breed rankings |
| `/dogs/:id` | DogDetailPage | Individual dog (shareable) |
| `/my/ratings` | MyRatingsPage | Rating history |
| `/admin` | AdminPage | Moderation queue |

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

---

## Empty States

| Scenario | Message |
|----------|---------|
| No more dogs | "You've rated all the dogs! Check back soon." |
| No dogs in breed | "No dogs in this breed yet. Upload yours!" |
| No ratings | "You haven't rated any dogs yet. Start rating!" |
| API error | "Something went wrong. Please try again." |
| No search results | "No breeds match your search." |

---

## Security

| Measure | Implementation |
|---------|----------------|
| Cookies | HTTP-only, Secure, SameSite=Strict |
| Validation | Zod on all endpoints |
| Rate limiting | Per-endpoint limits |
| File validation | Type, size, dimension |
| SQL | Parameterized queries |
| XSS | React escaping |
| Admin | X-Admin-Secret header |
| Abuse | IP hashing |

---

## Testing (80%+ Coverage)

| Type | Tool | Focus |
|------|------|-------|
| Unit | Vitest | Schemas, services, hooks |
| Integration | Vitest | Routes, components |
| E2E | Playwright | User flows |

---

## Phase Roadmap

### Phase 1: MVP (Current)
- Anonymous rating + skip
- Dog upload with name & breed
- Leaderboards
- Admin moderation
- 80%+ test coverage

### Phase 2: User Accounts
- Google OAuth
- User profiles
- Merge anon ratings

### Phase 3: Polish & SEO
- WCAG 2.2 audit
- Meta tags, Open Graph
- PWA support

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

| Metric | Target |
|--------|--------|
| Page load | <200ms |
| API latency | <150ms |
| Ratings (3 mo) | >10,000 |
| Uploads (3 mo) | >1,000 |
| Return rate | >30% |
| Test coverage | >80% |
| Lighthouse | >90 |

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
