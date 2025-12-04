# RateTheDogs — Full Product Requirements Document (PRD)

### Version 1.1 — Updated December 2025

_(Markdown version optimized for code-generation agents such as Claude Code)_

---

# 1. Product Overview

## 1.1 Product Name

**RateTheDogs.com**

## 1.2 Summary

RateTheDogs is a modern web app where visitors upload pictures of their dogs and the community rates them using a unique **five-bone rating system** with **half-point increments**.

- Anonymous users can fully participate and have persistent behavior via a long-lived cookie identity.
- Logged-in users (future feature) can track rating history and manage dog uploads.
- Leaderboards show **Top Dogs**, **Top Breeds**, and **Breed-specific rankings**.

The app must be built on **Cloudflare Workers**, **D1**, **R2**, and modern TypeScript best practices.

## 1.3 Target Audience

- Dog owners
- Dog enthusiasts
- Casual visitors
- Social media users

## 1.4 Primary Goals

- Fast, simple, addictive rating flow
- Zero-friction anonymous usage
- Modern responsive UI
- Extremely low hosting cost
- Globally fast using edge infrastructure

---

# 2. Objectives & Metrics

## 2.1 Objectives

- Deliver delightful dog-rating UX
- Support anon + logged-in flows
- Provide a fast dog upload experience
- Auto-scale via Cloudflare
- Maintain high-quality moderated content

## 2.2 Metrics

- <200ms global page load
- <150ms API latency
- > 10,000 ratings in first 3 months
- > 1,000 dog uploads
- > 30% return engagement

---

# 3. User Types & Stories

## 3.1 User Types

1. **Anonymous Visitor**
2. **Logged-In User**
3. **Dog Owner / Uploader**
4. **Admin Moderator**

## 3.2 User Stories

### Rating

- As an anonymous visitor, I can rate dogs without creating an account.
- As a returning visitor, I avoid seeing dogs I've already rated.
- As any user, I get a clean, animated bone-rating UI.

### Uploading

- As a user, I upload my dog quickly via presigned R2 URL.
- As an uploader, I specify breed.

### Browsing

- As any user, I browse top dogs, top breeds, and breed leaderboards.

### Moderation

- As an admin, I review and approve/reject pending uploads.
- As admin, I can ban abusive anonymous IDs.

---

# 4. Feature Requirements

## 4.1 Bone Rating System

- 5 bones, each supporting **0.5 increments** (0.5 → 5.0).
- Hover preview on desktop.
- Tap/drag support on mobile.
- Sends rating data to backend.
- Prevent multiple ratings for same dog by same anon/user.

## 4.2 Anonymous Identity System

- On first visit: generate `anon_id` (UUID).
- Store in secure HTTP-only cookie.
- Long expiration (2 years).
- All rating API calls include anon_id automatically.

## 4.3 Logged-In Authentication (Phase 2)

- Email magic link OR Google OAuth.
- JWT stored in secure HTTP-only cookie.
- On login, merge anon ratings into user account.

## 4.4 Dog Upload Flow

- User invokes `/api/upload-url`.
- Worker returns presigned R2 upload URL.
- Browser uploads file directly to R2.
- Frontend then calls backend to create DB record with:
  - image key
  - breed_id
  - uploader_anon_id or user_id
- Status defaults to `pending`.

## 4.5 Leaderboards

- **Top Dogs:** highest avg rating, minimum rating count threshold.
- **Top Breeds:** average rating of all dogs within the breed.
- **Breed Pages:** ranked dogs for each breed.

## 4.6 Moderation System

- All uploads default to `pending`.
- Admin UI for reviewing pending uploads.
- Admin can approve or reject.
- Admin can ban `anon_id` or `user_id`.
- Store hashed IP address to detect abuse.

## 4.7 Light/Dark Mode Theme

- Default to user's system preference via `prefers-color-scheme` media query.
- Support three theme options: "light", "dark", and "system".
- Persist user's theme choice to localStorage.
- Sun/moon toggle button in navbar with smooth animations.
- Semantic CSS variables for all colors (background, foreground, card, muted, etc.).
- OKLCH color space for perceptually uniform colors.
- Smooth transitions when switching themes.

## 4.8 My Stats Page

Personal statistics page (`/stats`) showing users their rating activity, preferences, and fun engagement metrics.

### Core Statistics

- **Dogs Rated**: Total number of dogs the user has rated
- **Average Rating**: User's average rating given (0.5-5.0)
- **vs Global**: Comparison to global average (+/- difference)
- **Dogs Skipped**: Number of dogs the user has skipped

### Rater Personality System

Fun, dog-themed personality badges based on rating patterns:

| Personality      | Criteria     | Icon | Tagline                           |
| ---------------- | ------------ | ---- | --------------------------------- |
| Puppy Trainee    | < 10 ratings | 🐾   | "Still learning the ropes!"       |
| Treat Dispenser  | avg > 4.2    | 🦴   | "Every pup deserves a treat!"     |
| Belly Rub Expert | avg 3.5-4.2  | 🐕   | "Knows exactly where to scratch"  |
| Bark Inspector   | avg 2.5-3.5  | 🔍   | "Investigating all the good boys" |
| Picky Pup Parent | avg < 2.5    | 👑   | "Only the finest floofs allowed"  |
| Top Dog          | 100+ ratings | 🏆   | "A true dog rating champion!"     |

### Milestones

Progress tracking with celebration at key milestones:

- 1 rating: "Your dog rating journey begins!"
- 10 ratings: "You're officially a dog rater!"
- 50 ratings: "50 dogs rated! You're on fire!"
- 100 ratings: "100 ratings! Legendary status!"
- 250 ratings: "250 dogs! You speak fluent woof!"
- 500 ratings: "500 ratings! Bow before the king/queen!"

### Achievements

Unlockable badges for special accomplishments:

| Achievement    | Criteria                        | Icon |
| -------------- | ------------------------------- | ---- |
| Perfect Score  | Give a 5.0 rating               | ⭐   |
| Breed Explorer | Rate dogs from 10+ breeds       | 🗺️   |
| Variety Pack   | Use all rating values (0.5-5.0) | 🎨   |
| Streak Master  | Rate 7 days in a row            | 🔥   |
| All-Star Rater | Rate 20+ dogs with 4.0+         | 💖   |
| Tough Crowd    | Give a rating below 2.0         | 😬   |
| Early Bird     | Rate 5 dogs within 30 minutes   | 🐦   |

### Additional Features

- **Rating Distribution**: Visual bar chart of rating patterns (0.5-5.0)
- **Top Breeds**: User's 3 highest-rated breeds with images
- **Recent Ratings**: Last 10 rated dogs with thumbnails
- **Empty State**: Friendly prompt for new users to start rating

---

# 5. Technical Requirements & Architecture

## 5.1 Platform Stack

- **Cloudflare Workers** → Unified deployment (API + static assets)
- **Cloudflare D1** → Relational SQL database
- **Cloudflare R2** → Object storage for dog images
- Optional: **Cloudflare KV** for caching frequently accessed data

> **Note**: As of December 2025, Cloudflare Pages is in maintenance mode. All deployments now use the unified Cloudflare Workers with Static Assets approach. See `docs/deployment-migration-plan.md` for details.

## 5.2 Backend

- Language: **TypeScript 5.9+**
- Framework: **Hono 4.10+**
- Validation: **Zod 4.x**
- Shared TypeScript schema package
- Anonymous identity: cookie-based UUID
- Logged-in users: JWT in secure cookies (future)
- Uploads: presigned R2 URL approach

## 5.3 Frontend

- Framework: **React 19**
- Build system: **Vite 7.x**
- Styling: **TailwindCSS 4.x**
- Component library: **shadcn-style components**
- Testing: **Vitest 4.x** + **@testing-library/react 16.x**
- Mobile-first UI

### Frontend Pages

- `/` → Rate Next Dog
- `/upload` → Upload flow
- `/leaderboard` → Top Dogs + Top Breeds
- `/breeds` → List of breeds
- `/breeds/:breedSlug` → Breed-specific rankings
- `/stats` → Personal rating statistics and achievements
- `/my/ratings` → (future logged-in users)
- `/admin/moderation` → Admin-only moderation panel

---

# 6. Database Schema (Cloudflare D1)

## 6.1 Table: breeds

| Column         | Type        | Notes                                     |
| -------------- | ----------- | ----------------------------------------- |
| id             | integer PK  |                                           |
| name           | text unique | e.g. "Golden Retriever"                   |
| slug           | text unique | e.g. "golden-retriever"                   |
| dog_ceo_path   | text        | Dog CEO API path, e.g. "retriever/golden" |
| image_count    | integer     | Number of images synced from Dog CEO      |
| last_synced_at | text        | Last Dog CEO sync timestamp               |
| created_at     | text        | ISO timestamp                             |

## 6.2 Table: dogs

| Column           | Type                | Notes                            |
| ---------------- | ------------------- | -------------------------------- |
| id               | integer PK          |                                  |
| name             | text nullable       | Optional dog name                |
| image_key        | text nullable       | R2 object key (for user uploads) |
| image_url        | text nullable       | Direct URL (for Dog CEO images)  |
| image_source     | text                | 'dog_ceo' or 'user_upload'       |
| breed_id         | integer FK          |                                  |
| uploader_user_id | integer nullable FK |                                  |
| uploader_anon_id | text nullable       |                                  |
| status           | text enum           | pending, approved, rejected      |
| moderated_by     | text nullable       | Admin who reviewed               |
| moderated_at     | text nullable       | Review timestamp                 |
| created_at       | text                | ISO timestamp                    |
| updated_at       | text                | ISO timestamp                    |

## 6.3 Table: ratings

| Column     | Type             | Notes         |
| ---------- | ---------------- | ------------- |
| id         | integer PK       |               |
| dog_id     | integer FK       |               |
| value      | real             | 0.5–5.0       |
| user_id    | integer nullable |               |
| anon_id    | text nullable    |               |
| created_at | text             | ISO timestamp |

## 6.4 Table: users (future)

| Column     | Type        | Notes         |
| ---------- | ----------- | ------------- |
| id         | integer PK  |               |
| email      | text unique |               |
| created_at | text        | ISO timestamp |

## 6.5 Table: anonymous_users (optional)

| Column        | Type    | Notes |
| ------------- | ------- | ----- |
| anon_id       | text PK |       |
| first_seen_at | text    |       |
| last_seen_at  | text    |       |

---

# 7. API Specification

All responses: **JSON**  
All validation: **Zod**  
All requests include anon_id via cookie if no user logged in.

## 7.1 GET /api/dogs/next

Returns next unrated dog for this anon_id/user_id.

## 7.1.1 GET /api/dogs/prefetch

Returns multiple unrated dogs for prefetching (instant transitions).

**Query params:**

- `count`: Number of dogs to return (default: 10, max: 20)

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 123,
        "name": "Buddy",
        "image_url": "https://images.dog.ceo/breeds/...",
        "breed_name": "Golden Retriever",
        "avg_rating": 4.5,
        "rating_count": 12
      }
    ]
  }
}
```

## 7.2 POST /api/dogs/:id/rate

**Request:**

```json
{
  "value": 4.5
}
```

## 7.3 POST /api/upload-url

**Request:**

```json
{
  "contentType": "image/jpeg"
}
```

**Response:**

```json
{
  "uploadUrl": "https://r2-presigned-url",
  "key": "dogs/abc123.jpg"
}
```

## 7.4 POST /api/dogs

**Request:**

```json
{
  "imageKey": "dogs/abc123.jpg",
  "breedId": 14
}
```

## 7.5 GET /api/leaderboard/dogs

Returns ranked list of dogs.

## 7.6 GET /api/leaderboard/breeds

Returns ranked list of breeds.

## 7.7 GET /api/breeds/:slug/top

Top dogs for given breed.

## 7.8 GET /api/me/ratings

Rating history for current anon_id/user.

## 7.9 My Stats Endpoints

### GET /api/me/stats

Enhanced user statistics including ratings count, skips count, average rating, and comparison to global average.

### GET /api/me/top-breeds

User's top 3 highest-rated breeds with average ratings and images.

### GET /api/me/rating-distribution

Breakdown of user's ratings by value (0.5 to 5.0) with counts and percentages.

### GET /api/me/recent

Last 10 dogs rated by the user with thumbnails and timestamps.

### GET /api/me/achievements

User's milestone progress and unlocked achievement badges.

## Admin Endpoints

- GET /api/admin/pending-dogs
- POST /api/admin/dogs/:id/approve
- POST /api/admin/dogs/:id/reject

---

# 8. Frontend Components

## 8.1 BoneRating Component

- Five bones
- Supports half increments
- Hover + tap + drag
- Emits rating value
- Uses accessible semantics

## 8.2 DogCard Component

- Dog image
- Loading skeleton
- Bone rating widget

## 8.3 UploadForm Component

- Image selection
- Preview
- Breed selection
- Upload → presigned URL flow
- Submit metadata

## 8.4 Leaderboard Components

- Ranked dog list
- Breed rankings
- Breed detail pages

---

# 9. Moderation Requirements

- New uploads default to `pending`
- Admin-only UI for moderation
- Approve or reject dogs
- Ability to ban anon/user IDs
- Store hashed IP for abuse detection

---

# 10. Performance Requirements

- Cloudflare Workers API <150ms
- Cloudflare cache for leaderboard pages
- R2 image CDN caching
- Client-side image compression before upload
- Optimize images for mobile

---

# 11. Security Requirements

- All cookies: Secure, HTTP-only, SameSite=Strict
- Rate limit rating submissions
- Hash IP addresses
- Validate images:
  - content-type check
  - file size limit
- Zod validation for all API requests

---

# 12. Constraints

- Must run entirely on Cloudflare infrastructure
- Must minimize ongoing cost (prefer free tiers)
- Must be API-first to support future mobile app
- Must use TypeScript end-to-end

---

# 13. Roadmap

## MVP

- Anonymous rating
- Anonymous uploads
- Moderation (pending → approved/rejected)
- Top Dogs leaderboard
- Top Breeds leaderboard
- Rating UI
- Cloudflare deployment
- **Dog CEO API Integration** (see below)

## Phase 1.5: Dog CEO Content Integration

This phase adds thousands of dog images from the Dog CEO API as long-term content, ensuring the app has engaging content even before user uploads reach critical mass.

### Goals

- Support 100+ breeds with thousands of images (vs. manual seeding)
- Human-readable breed names
- Frontend prefetching for instant image loading
- Production-quality with verified image URLs

### Features

- **Comprehensive Breed Support**: All 120+ Dog CEO breeds mapped to human-readable names
- **Image Prefetching**: Queue of 10+ dogs loaded ahead, instant transitions
- **localStorage Persistence**: Prefetch queue survives page refreshes
- **Dual Source Support**: Seamless handling of both Dog CEO and user-uploaded images

### Technical Details

See `docs/dog-ceo-integration.md` for complete technical architecture.

## Phase 1.6: My Stats Page (Completed)

Personal statistics page showing users their rating journey with fun, gamified elements.

### Features Delivered

- **Personal Statistics**: Dogs rated, average rating, vs global comparison, dogs skipped
- **Rater Personality**: 6 dog-themed personality types based on rating patterns
- **Milestone Progress**: Visual progress bar with 6 milestone tiers (1 to 500 ratings)
- **Achievement Badges**: 7 unlockable achievements with locked/unlocked states
- **Rating Distribution**: Visual bar chart of rating patterns
- **Top Breeds**: User's 3 favorite breeds with images and ratings
- **Recent Ratings**: Last 10 rated dogs with thumbnails
- **Empty State**: Friendly onboarding for new users
- **Responsive Design**: Optimized for mobile and desktop

### Technical Details

- 5 new API endpoints (`/api/me/stats`, `/api/me/top-breeds`, `/api/me/rating-distribution`, `/api/me/recent`, `/api/me/achievements`)
- 8 new React components with loading skeletons
- Shared types and constants in `packages/shared`
- Full test coverage (API and E2E tests)

## Phase 2

- Login (email or OAuth)
- My Ratings page
- User profile
- Social sharing

## Phase 3

- Automatic moderation (machine learning)
- “Not a dog” detector
- Push/email notifications

---

# ✔️ END OF PRD

This document is ready to be given directly to **Claude Code** or any code-generation AI to scaffold the entire project.
