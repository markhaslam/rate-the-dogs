# Analysis of Legacy RateTheDogs Repositories

> **Date**: December 2025
> **Purpose**: Extract learnings, features, and ideas from the original 2022 RateTheDogs prototypes
> **Repositories Analyzed**:
>
> - `rate-the-dogs-api` (Node/Express API, last updated May 2022)
> - `rate-the-dogs-client-prototype` (Vanilla JS client, last updated January 2022)

---

## Executive Summary

The original RateTheDogs project from 2022 had several interesting features and architectural decisions that we should consider incorporating into the current modern implementation. Key findings include:

1. **Massive pre-fetched image dataset** - 21,025 images across 174 breeds
2. **Client-side prefetching** - Downloaded 10 images ahead of time
3. **Image proxy endpoint** - Server fetched and served images as blobs
4. **Exclusion-based random selection** - Excluded already-rated and prefetched images
5. **User agent tracking** - Stored in ratings for analytics
6. **Lookup by URL or ID** - Flexible API design

---

## Repository 1: rate-the-dogs-api

### Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: PostgreSQL
- **Auth**: Signed cookies with session UUID

### Database Schema

```sql
-- Images table (simpler than current dogs table)
CREATE TABLE images (
    id      serial PRIMARY KEY,
    url     text UNIQUE NOT NULL,
    breed   text NOT NULL
);

-- Ratings table (more tracking than current)
CREATE TABLE ratings (
    id            serial PRIMARY KEY,
    image_id      integer REFERENCES images(id) NOT NULL,
    rating        smallint NOT NULL,        -- Integer, not float
    session_id    uuid NULL,                -- Anonymous user ID
    ip_address    inet NULL,                -- Full IP (not hashed)
    user_agent    text NULL,                -- Browser/device info
    created_at    timestamptz NOT NULL
);
```

### Key Features

#### 1. Pre-fetched Dog CEO Images (breed-images.json)

The old API had a script that fetched ALL images from the Dog CEO API and saved them to a JSON file:

| Metric              | Value       |
| ------------------- | ----------- |
| Total breeds        | 174         |
| Total images        | 21,025      |
| Average per breed   | ~121 images |
| Top breed (maltese) | 253 images  |

**Recommendation**: We should consider using this pre-fetched approach OR at least limit to ~50 images per breed to keep database manageable (~8,700 images).

#### 2. Duplicate Image Filtering

The `images-retrieval.ts` script had smart filtering to remove duplicate images:

- Sub-breed images appearing in parent breed (e.g., "corgi" containing "corgi-cardigan" images)
- Incorrectly categorized images (e.g., "pug" containing "puggle" images)

```typescript
// Filter duplicates by comparing URL path to breed name
breedImages[breed] = breedImages[breed].filter((image) => {
  const imageUrl = new URL(image);
  const breedPath = imageUrl.pathname.split("/")[2];
  return breedPath === breed;
});
```

**Recommendation**: Implement this filtering in our sync script.

#### 3. Image Proxy Endpoint

The old API had endpoints that proxied images through the server:

```typescript
// GET /images/file/:id - Fetch image and serve as blob
const response = await axios.get(url, { responseType: "arraybuffer" });
res.set("Content-Type", "image/jpeg");
res.send(response.data);
```

**Benefits**:

- Bypass CORS issues
- Could cache images server-side
- Hide origin from client

**Recommendation**: Not necessary for our current architecture since Dog CEO images are served with proper CORS headers. However, could be useful for R2 caching in the future.

#### 4. Advanced Random Selection with Exclusions

The `/images/random` endpoint had sophisticated exclusion logic:

```sql
SELECT i.id, i.url, i.breed, AVG(r.rating), COUNT(r.rating)
FROM images i
LEFT JOIN ratings r ON r.image_id = i.id
WHERE i.id NOT IN (SELECT DISTINCT image_id FROM ratings WHERE session_id = $1)
  AND i.id != ALL ($2)  -- Additional exclusions from query param
GROUP BY i.id, i.url, i.breed
OFFSET floor(random() * ...)
LIMIT 1
```

The `?exclude=1,2,3` query param allowed the client to exclude images that were already prefetched, preventing duplicates in the queue.

**Recommendation**: Add `?exclude=` param to our `/api/dogs/prefetch` endpoint for smarter prefetching.

#### 5. Flexible Lookup by URL or ID

The API supported looking up images by either numeric ID or URL:

```typescript
// GET /images/:id where :id can be:
//   - Numeric: /images/123
//   - URL: /images/url=https%3A%2F%2Fimages.dog.ceo%2F...

if (req.params.id.substring(0, 4) === "url=") {
  _getByUrl(req, res);
} else {
  _getById(req, res);
}
```

**Recommendation**: Could be useful for deduplication - check if image URL already exists before creating.

#### 6. Include Unrated Filter

The `/images` endpoint had an `?include-unrated=true` param:

```sql
-- Default: Only rated images
SELECT ... FROM images i JOIN ratings r ON ...

-- With include-unrated=true: All images
SELECT ... FROM images i LEFT JOIN ratings r ON ...
```

**Recommendation**: Consider for admin/debug purposes.

### API Routes Summary

| Method | Path                  | Description                                          |
| ------ | --------------------- | ---------------------------------------------------- |
| GET    | `/images`             | All images with ratings (optionally include unrated) |
| GET    | `/images/random`      | Random unrated image (with exclusions)               |
| GET    | `/images/file/random` | Random image as blob                                 |
| GET    | `/images/file/:id`    | Image by ID/URL as blob                              |
| GET    | `/images/:id`         | Image metadata by ID/URL                             |
| GET    | `/images/:id/ratings` | All ratings for an image                             |
| POST   | `/images/ratings`     | Submit rating                                        |

---

## Repository 2: rate-the-dogs-client-prototype

### Tech Stack

- **Framework**: Vanilla JavaScript (ES6 modules)
- **Styling**: CSS Grid, CSS Custom Properties
- **Build**: None (static files)

### Key Features

#### 1. Client-Side Prefetching

The client implemented a sophisticated prefetching system:

```javascript
let downloadedImages = [];

// Initial prefetch of 10 images
(async () => {
  for (let i = 0; i < 10; i++) {
    await getRandomImageFile();
  }
})();

// Refill when queue drops below 5
const changeImageFromDownloaded = () => {
  // ... rate current image
  currentImage = downloadedImages.shift();
  if (downloadedImages.length < 5) {
    getRandomImageFile(); // Background refill
  }
};
```

**This is exactly what we designed!** The old prototype already had:

- Initial prefetch of 10 images
- Refill threshold of 5
- Background fetching while rating

**Recommendation**: Our `useDogPrefetch` hook design is validated by this prototype.

#### 2. Blob URL Creation for Images

Images were converted to blob URLs for local caching:

```javascript
const getRandomImageFile = async () => {
  const image = await getRandomImage();
  const response = await fetch(`/images/file/${image.id}`);
  const data = await response.blob();
  const objectURL = URL.createObjectURL(data);
  image.file = objectURL;
  downloadedImages.push(image);
};
```

**Benefits**:

- Images cached in browser memory
- No re-fetch if image shown again
- Works offline once loaded

**Recommendation**: Consider blob URL approach for more aggressive caching, though our `<link rel="preload">` approach should work fine.

#### 3. Exclusion Parameter for Prefetching

The client sent already-prefetched image IDs to avoid duplicates:

```javascript
let exclusions = downloadedImages.map((image) => image.id);
const response = await fetch(`/images/random?exclude=${exclusions.toString()}`);
```

**Recommendation**: Add this to our prefetch endpoint.

#### 4. UI Components

**Bone Rating System**:

- Used Unicode bone emoji (&#129460; = 🦴)
- 5 bones with hover/selected states
- CSS classes: `.hovering`, `.selected`
- Rate button disabled until bone selected

**Responsive Grid Layout**:

- Mobile: Single column
- Desktop (1300px+): Two columns (image | rating panel)
- CSS Grid with minmax for fluid sizing

**Color Scheme**:

- Bones: Gold (#ffdd00) when selected, Orange (#ffc000) on hover
- Background: Blue gradient (#88cefc → #8fadff) with dog pattern SVG
- Panel: Dark gray (#494949)

**Recommendation**: Our current UI is more modern, but the gold/orange bone colors are nice.

#### 5. SVG Assets

The prototype included:

- `rtd-dog-logo.svg` - Dog logo SVG
- `dog-bg.svg` - Background pattern

**Recommendation**: Check if these assets could be reused or provide inspiration.

---

## Features to Consider Adding

### High Priority (Align with Dog CEO Integration)

| Feature                      | Source     | Implementation Effort | Value |
| ---------------------------- | ---------- | --------------------- | ----- |
| Exclusion param for prefetch | Old API    | Low                   | High  |
| Duplicate image filtering    | Old API    | Low                   | High  |
| Use pre-fetched 21K images   | Old API    | Medium                | High  |
| Validated prefetch pattern   | Old Client | Already planned       | High  |

### Medium Priority (Nice to Have)

| Feature                 | Source     | Implementation Effort | Value  |
| ----------------------- | ---------- | --------------------- | ------ |
| User agent tracking     | Old API    | Low                   | Medium |
| Lookup by URL           | Old API    | Low                   | Medium |
| Blob URL caching        | Old Client | Medium                | Medium |
| Gold/orange bone colors | Old Client | Low                   | Low    |

### Low Priority (Future Consideration)

| Feature                | Source     | Implementation Effort | Value |
| ---------------------- | ---------- | --------------------- | ----- |
| Image proxy endpoint   | Old API    | Medium                | Low   |
| Include-unrated filter | Old API    | Low                   | Low   |
| SVG background pattern | Old Client | Low                   | Low   |

---

## Recommended Changes to Current Design

Based on this analysis, here are specific changes to make:

### 1. Update Prefetch Endpoint

Add exclusion parameter to avoid fetching images already in queue:

```typescript
// GET /api/dogs/prefetch?count=10&exclude=1,2,3

const exclude = c.req.query("exclude")?.split(",").map(Number) ?? [];

const dogs = await db.prepare(`
  SELECT ...
  WHERE d.id NOT IN (...)
    AND d.id NOT IN (${exclude.join(",")})  -- Exclude prefetched
  ...
`);
```

### 2. Add Duplicate Filtering to Sync Script

When syncing Dog CEO images, filter out duplicates:

```typescript
// In syncDogCeo.ts
const filteredImages = images.filter((url) => {
  const urlPath = new URL(url).pathname.split("/")[2];
  return urlPath === breedPath.replace("/", "-");
});
```

### 3. Consider Using Existing breed-images.json

The old repo has 21,025 verified, deduplicated images. We could:

- Copy `breed-images.json` to our repo
- Use it as the seed source instead of live API calls
- Faster, no rate limiting, guaranteed working URLs

### 4. Track User Agent (Optional)

Add to ratings table for analytics:

```sql
ALTER TABLE ratings ADD COLUMN user_agent TEXT;
```

Useful for understanding device distribution.

---

## Files to Potentially Copy/Adapt

| Old File                  | Purpose              | Recommendation              |
| ------------------------- | -------------------- | --------------------------- |
| `breed-images.json`       | Pre-fetched images   | Copy and use as seed source |
| `images-retrieval.ts`     | Image fetching logic | Adapt filtering logic       |
| `assets/dog-bg.svg`       | Background pattern   | Consider for UI             |
| `assets/rtd-dog-logo.svg` | Original logo        | Compare with current        |

---

## Conclusion

The original 2022 RateTheDogs prototypes validate many of our current design decisions:

1. **Prefetching works** - The old client had the same 10-image queue with threshold refill
2. **Dog CEO has tons of content** - 21,025 images across 174 breeds
3. **Exclusion params are useful** - Prevents duplicate fetching
4. **Duplicate filtering is needed** - Dog CEO has overlapping images

The main improvements in our current implementation:

- Modern React/TypeScript stack
- Edge deployment (Cloudflare Workers)
- Better UI/UX with shadcn/ui
- Half-increment bone ratings
- User uploads support
- Comprehensive testing

**Next Steps**:

1. Add `?exclude=` param to prefetch endpoint
2. ~~Add duplicate filtering to sync script~~ (Done - `fetchDogCeoImages.ts` handles this)
3. ~~Consider using `breed-images.json` as seed source~~ (Adopted - two-step pipeline uses JSON file)
4. ~~Optionally add user_agent tracking~~ (Done - ip_address and user_agent now stored in ratings)

**Implementation Status** (Updated December 2025):

- **Two-step pipeline adopted**: `fetchDogCeoImages.ts` (exists) → `seedDogCeoImages.ts` (to be created)
- **`breed-images.json` exists**: 21,000+ images, 174 breeds, ~2MB
- **Duplicate filtering implemented**: In `fetchDogCeoImages.ts` via `dogCeoUtils.ts`
- See `docs/dog-ceo-integration.md` for complete technical architecture
