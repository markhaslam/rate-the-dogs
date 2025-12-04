# Dog CEO API Integration - Technical Architecture

> **Version**: 1.0
> **Created**: December 2025
> **Status**: Design Complete - Ready for Implementation

---

## Executive Summary

This document outlines the architecture for integrating the Dog CEO API as a long-term content source for RateTheDogs. The goal is to populate the application with thousands of high-quality dog images that users can rate, ensuring the app has engaging content even before user uploads reach critical mass.

### Key Objectives

1. **Scale**: Support 100+ breeds with thousands of images (vs. current 17 breeds, ~85 images)
2. **Reliability**: Store verified image URLs, handle broken links gracefully
3. **Performance**: Prefetch images for instant loading
4. **User Experience**: Human-readable breed names, no broken images
5. **Maintainability**: Clean separation between Dog CEO content and user uploads

---

## Current State Analysis

### What Exists Today

| Aspect         | Current Implementation                   | Limitation                       |
| -------------- | ---------------------------------------- | -------------------------------- |
| Breeds         | 17 hardcoded breeds                      | Dog CEO has 120+ breeds          |
| Images         | 5 images per breed (hardcoded filenames) | Only ~85 total images            |
| URL Generation | Hash-based deterministic selection       | Same dog always shows same image |
| Storage        | `image_key` field, converted at runtime  | Complex, hard to debug           |
| User Uploads   | Go to R2, but getImageUrl() ignores them | User uploads not displayed       |

### Files Affected

- `apps/api/src/lib/r2.ts` - Current Dog CEO mapping (to be refactored)
- `apps/api/src/db/migrations/001_initial_schema.sql` - Needs migration
- `apps/api/src/db/seed.sql` - Needs major expansion
- `apps/api/src/routes/dogs.ts` - Needs prefetch endpoint
- `apps/web/src/pages/RatePage.tsx` - Needs prefetch integration

---

## Database Schema Changes

### Migration: `002_dog_ceo_integration.sql`

```sql
-- =============================================================================
-- Migration: Dog CEO Integration
-- Purpose: Support Dog CEO API images as primary content source
-- =============================================================================

-- 1. Add dog_ceo_path to breeds for API mapping
ALTER TABLE breeds ADD COLUMN dog_ceo_path TEXT;
-- Example: "retriever/golden" maps to https://dog.ceo/api/breed/retriever/golden/images

-- 2. Track sync status for breeds
ALTER TABLE breeds ADD COLUMN image_count INTEGER DEFAULT 0;
ALTER TABLE breeds ADD COLUMN last_synced_at TEXT;

-- 3. Add image_url to dogs (direct URL storage)
ALTER TABLE dogs ADD COLUMN image_url TEXT;

-- 4. Add image_source to distinguish content origin
ALTER TABLE dogs ADD COLUMN image_source TEXT DEFAULT 'user_upload'
  CHECK(image_source IN ('dog_ceo', 'user_upload'));

-- 5. Index for efficient querying by source
CREATE INDEX idx_dogs_source ON dogs(image_source);

-- 6. Index for breed-based queries
CREATE INDEX idx_dogs_breed_status ON dogs(breed_id, status);
```

### Updated Schema Overview

```sql
-- breeds table (enhanced)
CREATE TABLE breeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,           -- "Golden Retriever" (human-readable)
  slug TEXT NOT NULL UNIQUE,           -- "golden-retriever" (URL-safe)
  dog_ceo_path TEXT,                   -- "retriever/golden" (API path)
  image_count INTEGER DEFAULT 0,       -- Number of images synced
  last_synced_at TEXT,                 -- Last sync timestamp
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- dogs table (enhanced)
CREATE TABLE dogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,                           -- Optional dog name
  image_key TEXT,                      -- R2 key (for user uploads)
  image_url TEXT,                      -- Direct URL (for Dog CEO)
  image_source TEXT NOT NULL DEFAULT 'user_upload'
    CHECK(image_source IN ('dog_ceo', 'user_upload')),
  breed_id INTEGER NOT NULL REFERENCES breeds(id),
  uploader_user_id INTEGER REFERENCES users(id),
  uploader_anon_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'approved', 'rejected')),
  moderated_by TEXT,
  moderated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Data Flow

```
User Upload:
  image_key = "dogs/abc123.jpg"
  image_url = NULL
  image_source = "user_upload"
  → getImageUrl() returns R2 presigned URL

Dog CEO Image:
  image_key = NULL
  image_url = "https://images.dog.ceo/breeds/retriever-golden/n02099601_1234.jpg"
  image_source = "dog_ceo"
  → getImageUrl() returns image_url directly
```

---

## Breed Name Mapping

### The Challenge

Dog CEO uses path-based naming that isn't human-readable:

- `retriever/golden` → "Golden Retriever"
- `bulldog/french` → "French Bulldog"
- `hound/basset` → "Basset Hound"
- `terrier/yorkshire` → "Yorkshire Terrier"
- `african` → "African Wild Dog"

### Mapping Strategy

Create a comprehensive mapping in `apps/api/src/lib/dogCeoBreeds.ts`:

```typescript
/**
 * Dog CEO API breed path to human-readable name mapping
 *
 * Dog CEO format: "{type}/{subtype}" or "{breed}"
 * Our format: "Readable Breed Name"
 *
 * @see https://dog.ceo/dog-api/breeds-list
 */
export const DOG_CEO_BREED_MAP: Record<string, string> = {
  // A
  affenpinscher: "Affenpinscher",
  african: "African Wild Dog",
  airedale: "Airedale Terrier",
  akita: "Akita",
  appenzeller: "Appenzeller Sennenhund",
  "australian/shepherd": "Australian Shepherd",

  // B
  basenji: "Basenji",
  beagle: "Beagle",
  bluetick: "Bluetick Coonhound",
  borzoi: "Borzoi",
  bouvier: "Bouvier des Flandres",
  boxer: "Boxer",
  brabancon: "Petit Brabancon",
  briard: "Briard",
  "buhund/norwegian": "Norwegian Buhund",
  "bulldog/boston": "Boston Terrier",
  "bulldog/english": "English Bulldog",
  "bulldog/french": "French Bulldog",
  "bullterrier/staffordshire": "Staffordshire Bull Terrier",

  // C
  "cattledog/australian": "Australian Cattle Dog",
  chihuahua: "Chihuahua",
  chow: "Chow Chow",
  clumber: "Clumber Spaniel",
  cockapoo: "Cockapoo",
  "collie/border": "Border Collie",
  coonhound: "Coonhound",
  "corgi/cardigan": "Cardigan Welsh Corgi",
  cotondetulear: "Coton de Tulear",

  // D
  dachshund: "Dachshund",
  dalmatian: "Dalmatian",
  "dane/great": "Great Dane",
  "deerhound/scottish": "Scottish Deerhound",
  dhole: "Dhole",
  dingo: "Dingo",
  doberman: "Doberman Pinscher",

  // E-F
  "elkhound/norwegian": "Norwegian Elkhound",
  entlebucher: "Entlebucher Mountain Dog",
  eskimo: "American Eskimo Dog",
  "finnish/lapphund": "Finnish Lapphund",
  "frise/bichon": "Bichon Frise",

  // G
  germanshepherd: "German Shepherd",
  "greyhound/italian": "Italian Greyhound",
  groenendael: "Belgian Groenendael",

  // H
  havanese: "Havanese",
  "hound/afghan": "Afghan Hound",
  "hound/basset": "Basset Hound",
  "hound/blood": "Bloodhound",
  "hound/english": "English Foxhound",
  "hound/ibizan": "Ibizan Hound",
  "hound/plott": "Plott Hound",
  "hound/walker": "Treeing Walker Coonhound",
  husky: "Siberian Husky",

  // I-K
  keeshond: "Keeshond",
  kelpie: "Australian Kelpie",
  komondor: "Komondor",
  kuvasz: "Kuvasz",

  // L
  labradoodle: "Labradoodle",
  labrador: "Labrador Retriever",
  leonberg: "Leonberger",
  lhasa: "Lhasa Apso",

  // M
  malamute: "Alaskan Malamute",
  malinois: "Belgian Malinois",
  maltese: "Maltese",
  "mastiff/bull": "Bullmastiff",
  "mastiff/english": "English Mastiff",
  "mastiff/tibetan": "Tibetan Mastiff",
  mexicanhairless: "Xoloitzcuintli",
  mix: "Mixed Breed",
  "mountain/bernese": "Bernese Mountain Dog",
  "mountain/swiss": "Greater Swiss Mountain Dog",

  // N-O
  newfoundland: "Newfoundland",
  otterhound: "Otterhound",

  // P
  papillon: "Papillon",
  pekinese: "Pekingese",
  pembroke: "Pembroke Welsh Corgi",
  "pinscher/miniature": "Miniature Pinscher",
  pitbull: "American Pit Bull Terrier",
  "pointer/german": "German Shorthaired Pointer",
  "pointer/germanlonghair": "German Longhaired Pointer",
  pomeranian: "Pomeranian",
  "poodle/miniature": "Miniature Poodle",
  "poodle/standard": "Standard Poodle",
  "poodle/toy": "Toy Poodle",
  pug: "Pug",
  puggle: "Puggle",
  pyrenees: "Great Pyrenees",

  // R
  redbone: "Redbone Coonhound",
  "retriever/chesapeake": "Chesapeake Bay Retriever",
  "retriever/curly": "Curly-Coated Retriever",
  "retriever/flatcoated": "Flat-Coated Retriever",
  "retriever/golden": "Golden Retriever",
  "ridgeback/rhodesian": "Rhodesian Ridgeback",
  rottweiler: "Rottweiler",

  // S
  saluki: "Saluki",
  samoyed: "Samoyed",
  schipperke: "Schipperke",
  "schnauzer/giant": "Giant Schnauzer",
  "schnauzer/miniature": "Miniature Schnauzer",
  "setter/english": "English Setter",
  "setter/gordon": "Gordon Setter",
  "setter/irish": "Irish Setter",
  "sheepdog/english": "Old English Sheepdog",
  "sheepdog/shetland": "Shetland Sheepdog",
  shiba: "Shiba Inu",
  shihtzu: "Shih Tzu",
  "spaniel/blenheim": "Blenheim Spaniel",
  "spaniel/brittany": "Brittany Spaniel",
  "spaniel/cocker": "Cocker Spaniel",
  "spaniel/irish": "Irish Water Spaniel",
  "spaniel/japanese": "Japanese Chin",
  "spaniel/sussex": "Sussex Spaniel",
  "spaniel/welsh": "Welsh Springer Spaniel",
  "springer/english": "English Springer Spaniel",
  stbernard: "Saint Bernard",

  // T
  "terrier/american": "American Staffordshire Terrier",
  "terrier/australian": "Australian Terrier",
  "terrier/bedlington": "Bedlington Terrier",
  "terrier/border": "Border Terrier",
  "terrier/cairn": "Cairn Terrier",
  "terrier/dandie": "Dandie Dinmont Terrier",
  "terrier/fox": "Fox Terrier",
  "terrier/irish": "Irish Terrier",
  "terrier/kerryblue": "Kerry Blue Terrier",
  "terrier/lakeland": "Lakeland Terrier",
  "terrier/norfolk": "Norfolk Terrier",
  "terrier/norwich": "Norwich Terrier",
  "terrier/patterdale": "Patterdale Terrier",
  "terrier/russell": "Jack Russell Terrier",
  "terrier/scottish": "Scottish Terrier",
  "terrier/sealyham": "Sealyham Terrier",
  "terrier/silky": "Silky Terrier",
  "terrier/tibetan": "Tibetan Terrier",
  "terrier/toy": "Toy Fox Terrier",
  "terrier/welsh": "Welsh Terrier",
  "terrier/westhighland": "West Highland White Terrier",
  "terrier/wheaten": "Soft Coated Wheaten Terrier",
  "terrier/yorkshire": "Yorkshire Terrier",
  tervuren: "Belgian Tervuren",

  // V-W
  vizsla: "Vizsla",
  "waterdog/spanish": "Spanish Water Dog",
  weimaraner: "Weimaraner",
  whippet: "Whippet",
  "wolfhound/irish": "Irish Wolfhound",
};

/**
 * Convert Dog CEO breed path to human-readable name
 */
export function getReadableBreedName(dogCeoPath: string): string {
  const normalized = dogCeoPath.toLowerCase().replace(/\//g, "/");
  return (
    DOG_CEO_BREED_MAP[normalized] ?? titleCase(dogCeoPath.replace(/\//g, " "))
  );
}

/**
 * Convert Dog CEO path to URL-safe slug
 */
export function getBreedSlug(dogCeoPath: string): string {
  return dogCeoPath.toLowerCase().replace(/\//g, "-");
}

/**
 * Helper to title case a string
 */
function titleCase(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
```

---

## Dog CEO API Integration

### API Endpoints Used

| Endpoint                               | Purpose                    | Example                                                       |
| -------------------------------------- | -------------------------- | ------------------------------------------------------------- |
| `GET /breeds/list/all`                 | Get all breeds             | Returns `{ "message": { "retriever": ["golden", "curly"] } }` |
| `GET /breed/{breed}/images`            | Get all images for a breed | Returns array of image URLs                                   |
| `GET /breed/{breed}/{subbreed}/images` | Get images for sub-breed   | Returns array of image URLs                                   |

### Seeding Script: `apps/api/scripts/syncDogCeo.ts`

```typescript
/**
 * Dog CEO API Sync Script
 *
 * Fetches all breeds and images from Dog CEO API and populates the database.
 *
 * Usage:
 *   bun run apps/api/scripts/syncDogCeo.ts
 *
 * Environment:
 *   - Uses local D1 database via Wrangler
 *   - Rate-limited to respect Dog CEO API
 */

import {
  DOG_CEO_BREED_MAP,
  getReadableBreedName,
  getBreedSlug,
} from "../src/lib/dogCeoBreeds";

const DOG_CEO_BASE = "https://dog.ceo/api";
const IMAGES_PER_BREED = 50; // Limit images per breed for manageable size
const RATE_LIMIT_MS = 100; // 100ms between API calls

interface DogCeoListResponse {
  message: Record<string, string[]>;
  status: string;
}

interface DogCeoImagesResponse {
  message: string[];
  status: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBreedList(): Promise<string[]> {
  const res = await fetch(`${DOG_CEO_BASE}/breeds/list/all`);
  const data = (await res.json()) as DogCeoListResponse;

  if (data.status !== "success") {
    throw new Error("Failed to fetch breed list");
  }

  const paths: string[] = [];

  for (const [breed, subBreeds] of Object.entries(data.message)) {
    if (subBreeds.length === 0) {
      paths.push(breed);
    } else {
      for (const sub of subBreeds) {
        paths.push(`${breed}/${sub}`);
      }
    }
  }

  return paths;
}

async function fetchBreedImages(path: string): Promise<string[]> {
  const url = path.includes("/")
    ? `${DOG_CEO_BASE}/breed/${path}/images`
    : `${DOG_CEO_BASE}/breed/${path}/images`;

  const res = await fetch(url);
  const data = (await res.json()) as DogCeoImagesResponse;

  if (data.status !== "success") {
    console.warn(`Failed to fetch images for ${path}`);
    return [];
  }

  // Limit and shuffle images
  const shuffled = data.message.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, IMAGES_PER_BREED);
}

async function verifyImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok && res.headers.get("content-type")?.startsWith("image/");
  } catch {
    return false;
  }
}

async function syncDogCeo(db: D1Database): Promise<void> {
  console.log("Starting Dog CEO sync...");

  // 1. Fetch all breed paths
  const paths = await fetchBreedList();
  console.log(`Found ${paths.length} breeds`);

  let totalImages = 0;
  let totalDogs = 0;

  // 2. Process each breed
  for (const path of paths) {
    const name = getReadableBreedName(path);
    const slug = getBreedSlug(path);

    console.log(`Processing ${name} (${path})...`);

    // 2a. Upsert breed
    await db
      .prepare(
        `
      INSERT INTO breeds (name, slug, dog_ceo_path, created_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(slug) DO UPDATE SET
        dog_ceo_path = excluded.dog_ceo_path
    `
      )
      .bind(name, slug, path)
      .run();

    // Get breed ID
    const breed = await db
      .prepare("SELECT id FROM breeds WHERE slug = ?")
      .bind(slug)
      .first<{ id: number }>();

    if (!breed) continue;

    // 2b. Fetch images
    await sleep(RATE_LIMIT_MS);
    const images = await fetchBreedImages(path);

    console.log(`  Found ${images.length} images`);

    // 2c. Create dog records for each image
    let validImages = 0;
    for (const imageUrl of images) {
      // Verify image exists (sample 10% to avoid rate limiting)
      const shouldVerify = Math.random() < 0.1;
      if (shouldVerify) {
        const isValid = await verifyImageUrl(imageUrl);
        if (!isValid) {
          console.log(`  Skipping broken image: ${imageUrl}`);
          continue;
        }
      }

      // Create dog record
      try {
        await db
          .prepare(
            `
          INSERT INTO dogs (
            image_url,
            image_source,
            breed_id,
            status,
            created_at,
            updated_at
          )
          VALUES (?, 'dog_ceo', ?, 'approved', datetime('now'), datetime('now'))
        `
          )
          .bind(imageUrl, breed.id)
          .run();

        validImages++;
        totalDogs++;
      } catch (e) {
        // Ignore duplicates
        if (!(e instanceof Error && e.message.includes("UNIQUE"))) {
          throw e;
        }
      }
    }

    // 2d. Update breed stats
    await db
      .prepare(
        `
      UPDATE breeds
      SET image_count = ?, last_synced_at = datetime('now')
      WHERE id = ?
    `
      )
      .bind(validImages, breed.id)
      .run();

    totalImages += validImages;
    console.log(`  Added ${validImages} dogs`);
  }

  console.log(`\nSync complete!`);
  console.log(`  Breeds: ${paths.length}`);
  console.log(`  Dogs: ${totalDogs}`);
}

// Export for use with Wrangler
export { syncDogCeo };
```

### Expected Data Volume

| Metric           | Estimate     |
| ---------------- | ------------ |
| Total breeds     | ~120         |
| Images per breed | 50 (limited) |
| Total dogs       | ~6,000       |
| Database size    | ~1-2 MB      |

---

## API Changes

### Updated `getImageUrl()` Function

```typescript
// apps/api/src/lib/r2.ts

/**
 * Get the display URL for a dog image
 *
 * For Dog CEO images: Returns the image_url directly
 * For User uploads: Generates R2 presigned URL
 */
export function getImageUrl(
  dog: {
    image_url: string | null;
    image_key: string | null;
    image_source: string;
  },
  env?: { R2_BUCKET: R2Bucket }
): string {
  // Dog CEO images have direct URLs
  if (dog.image_source === "dog_ceo" && dog.image_url) {
    return dog.image_url;
  }

  // User uploads need R2 presigned URL
  if (dog.image_key && env?.R2_BUCKET) {
    return getR2PublicUrl(dog.image_key, env.R2_BUCKET);
  }

  // Fallback placeholder
  return `https://placedog.net/500/500?id=${Date.now()}`;
}
```

### New Prefetch Endpoint

```typescript
// apps/api/src/routes/dogs.ts

/**
 * GET /api/dogs/prefetch
 *
 * Returns multiple unrated dogs for prefetching
 *
 * Query params:
 *   - count: Number of dogs to return (default: 10, max: 20)
 */
app.get("/prefetch", async (c) => {
  const anonId = c.get("anonId");
  const count = Math.min(parseInt(c.req.query("count") ?? "10"), 20);

  const dogs = await c.env.DB.prepare(
    `
    SELECT
      d.id,
      d.name,
      d.image_key,
      d.image_url,
      d.image_source,
      d.breed_id,
      b.name as breed_name,
      b.slug as breed_slug,
      COALESCE(AVG(r.value), 0) as avg_rating,
      COUNT(r.id) as rating_count
    FROM dogs d
    JOIN breeds b ON d.breed_id = b.id
    LEFT JOIN ratings r ON d.id = r.dog_id
    WHERE d.status = 'approved'
      AND d.id NOT IN (SELECT dog_id FROM ratings WHERE anon_id = ?)
      AND d.id NOT IN (SELECT dog_id FROM skips WHERE anon_id = ?)
    GROUP BY d.id
    ORDER BY RANDOM()
    LIMIT ?
  `
  )
    .bind(anonId, anonId, count)
    .all();

  const items = dogs.results.map((dog) => ({
    ...dog,
    image_url: getImageUrl(dog, c.env),
    avg_rating: dog.avg_rating ? Number(dog.avg_rating) : null,
    rating_count: Number(dog.rating_count),
  }));

  return c.json({
    success: true,
    data: { items },
  });
});
```

---

## Frontend Prefetching System

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         React App                                │
├─────────────────────────────────────────────────────────────────┤
│  useDogPrefetch Hook                                            │
│  ├── Queue (React State): [Dog1, Dog2, Dog3, ...]              │
│  ├── LocalStorage: Backup of queue for persistence              │
│  └── Image Preloader: <link rel="preload"> for each image      │
├─────────────────────────────────────────────────────────────────┤
│  When user rates/skips:                                         │
│  1. Pop current dog from queue                                  │
│  2. Show next dog instantly (already in queue)                  │
│  3. If queue < threshold, fetch more from API                   │
│  4. Preload images for new dogs                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation: `useDogPrefetch` Hook

```typescript
// apps/web/src/hooks/useDogPrefetch.ts

import { useState, useEffect, useCallback } from "react";

interface Dog {
  id: number;
  name: string | null;
  image_url: string;
  breed_name: string;
  avg_rating: number | null;
  rating_count: number;
}

interface UseDogPrefetchOptions {
  prefetchCount?: number; // How many dogs to fetch at once (default: 10)
  refillThreshold?: number; // Refill when queue drops below this (default: 3)
}

const STORAGE_KEY = "rtd_dog_queue";

export function useDogPrefetch(options: UseDogPrefetchOptions = {}) {
  const { prefetchCount = 10, refillThreshold = 3 } = options;

  const [queue, setQueue] = useState<Dog[]>(() => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [noDogs, setNoDogs] = useState(false);

  // Persist queue to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch {
      // localStorage full or unavailable
    }
  }, [queue]);

  // Preload images for dogs in queue
  useEffect(() => {
    queue.forEach((dog) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = dog.image_url;
      document.head.appendChild(link);

      // Also preload via Image object for browser cache
      const img = new Image();
      img.src = dog.image_url;
    });
  }, [queue]);

  // Fetch more dogs
  const fetchMore = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/dogs/prefetch?count=${prefetchCount}`);
      const json = await res.json();

      if (json.success && json.data.items.length > 0) {
        setQueue((prev) => {
          // Dedupe by ID
          const existingIds = new Set(prev.map((d) => d.id));
          const newDogs = json.data.items.filter(
            (d: Dog) => !existingIds.has(d.id)
          );
          return [...prev, ...newDogs];
        });
        setNoDogs(false);
      } else {
        setNoDogs(queue.length === 0);
      }
    } catch (e) {
      console.error("Failed to prefetch dogs:", e);
    } finally {
      setLoading(false);
    }
  }, [loading, prefetchCount, queue.length]);

  // Initial fetch
  useEffect(() => {
    if (queue.length === 0 && !loading && !noDogs) {
      fetchMore();
    }
  }, []);

  // Refill when low
  useEffect(() => {
    if (queue.length < refillThreshold && !loading && !noDogs) {
      fetchMore();
    }
  }, [queue.length, refillThreshold, loading, noDogs, fetchMore]);

  // Get current dog
  const currentDog = queue[0] ?? null;

  // Pop current dog (after rating/skipping)
  const popDog = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  // Clear queue (e.g., on logout)
  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    currentDog,
    queue,
    queueLength: queue.length,
    loading,
    noDogs,
    popDog,
    clearQueue,
    refetch: fetchMore,
  };
}
```

### Updated RatePage Component

```typescript
// apps/web/src/pages/RatePage.tsx

import { useDogPrefetch } from "@/hooks/useDogPrefetch";

export function RatePage() {
  const {
    currentDog,
    queueLength,
    loading,
    noDogs,
    popDog
  } = useDogPrefetch({
    prefetchCount: 10,
    refillThreshold: 3,
  });

  const [isRating, setIsRating] = useState(false);
  const [ratedCount, setRatedCount] = useState(0);

  const handleRate = async (value: number) => {
    if (!currentDog || isRating) return;

    setIsRating(true);
    try {
      await fetch(`/api/dogs/${currentDog.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });

      setRatedCount(c => c + 1);
      popDog(); // Instantly show next dog
    } catch (e) {
      console.error("Failed to rate:", e);
    } finally {
      setIsRating(false);
    }
  };

  const handleSkip = async () => {
    if (!currentDog || isRating) return;

    setIsRating(true);
    try {
      await fetch(`/api/dogs/${currentDog.id}/skip`, { method: "POST" });
      popDog(); // Instantly show next dog
    } catch (e) {
      console.error("Failed to skip:", e);
    } finally {
      setIsRating(false);
    }
  };

  // Loading state (only on initial load)
  if (loading && !currentDog) {
    return <LoadingState />;
  }

  // No more dogs
  if (noDogs) {
    return <AllRatedState />;
  }

  return (
    <div>
      {/* Queue indicator */}
      <div className="text-xs text-slate-500">
        {queueLength} dogs queued
      </div>

      {currentDog && (
        <DogCard
          dog={currentDog}
          onRate={handleRate}
          onSkip={handleSkip}
          isRating={isRating}
        />
      )}
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests

| Test               | File                     | Coverage                       |
| ------------------ | ------------------------ | ------------------------------ |
| Breed name mapping | `dogCeoBreeds.test.ts`   | All 120+ mappings              |
| getImageUrl logic  | `r2.test.ts`             | Both sources                   |
| Prefetch hook      | `useDogPrefetch.test.ts` | Queue operations, localStorage |

### Integration Tests

| Test              | File                 | Coverage                   |
| ----------------- | -------------------- | -------------------------- |
| Prefetch endpoint | `dogs.test.ts`       | Query params, pagination   |
| Sync script       | `syncDogCeo.test.ts` | API mocking, DB operations |

### E2E Tests

| Test                      | File             | Coverage                 |
| ------------------------- | ---------------- | ------------------------ |
| Rating flow with prefetch | `rating.spec.ts` | Queue exhaustion, refill |
| Image loading             | `images.spec.ts` | Preload verification     |

---

## Rollout Plan

### Phase 1: Database Migration

1. Run migration `002_dog_ceo_integration.sql`
2. Add new columns without breaking existing functionality
3. Test migration on local D1

### Phase 2: Backend Updates

1. Deploy new `dogCeoBreeds.ts` mapping
2. Update `getImageUrl()` to handle both sources
3. Add `/api/dogs/prefetch` endpoint
4. Update existing routes to use new schema

### Phase 3: Seeding

1. Run `syncDogCeo.ts` script locally
2. Verify data integrity
3. Run on production D1

### Phase 4: Frontend Updates

1. Deploy `useDogPrefetch` hook
2. Update RatePage to use prefetching
3. Test image preloading

### Phase 5: Cleanup

1. Remove old hardcoded breed mappings
2. Remove old `getImageUrl()` hash logic
3. Update documentation

---

## Monitoring & Observability

### Metrics to Track

| Metric               | Description          | Alert Threshold   |
| -------------------- | -------------------- | ----------------- |
| Prefetch queue empty | User hit empty queue | > 1% of sessions  |
| Image load failures  | Dog CEO images 404   | > 5% failure rate |
| API latency          | Prefetch endpoint    | > 200ms p95       |
| Database size        | D1 storage           | > 100MB           |

### Logging

```typescript
// Log prefetch requests
console.log(
  JSON.stringify({
    level: "info",
    event: "dogs_prefetch",
    anonId,
    count: items.length,
    timestamp: new Date().toISOString(),
  })
);

// Log image failures
console.log(
  JSON.stringify({
    level: "warn",
    event: "image_verify_failed",
    url: imageUrl,
    timestamp: new Date().toISOString(),
  })
);
```

---

## Success Criteria

| Criterion             | Target  | Measurement     |
| --------------------- | ------- | --------------- |
| Total dogs available  | > 5,000 | Database count  |
| Breeds covered        | > 100   | Database count  |
| Image preload success | > 95%   | Browser console |
| Queue empty rate      | < 1%    | Analytics       |
| Time to next dog      | < 100ms | User experience |

---

## Appendix: Dog CEO API Reference

### List All Breeds

```bash
curl https://dog.ceo/api/breeds/list/all
```

Response:

```json
{
  "message": {
    "affenpinscher": [],
    "african": [],
    "bulldog": ["boston", "english", "french"],
    "retriever": ["chesapeake", "curly", "flatcoated", "golden"]
  },
  "status": "success"
}
```

### Get Breed Images

```bash
curl https://dog.ceo/api/breed/retriever/golden/images
```

Response:

```json
{
  "message": [
    "https://images.dog.ceo/breeds/retriever-golden/n02099601_1001.jpg",
    "https://images.dog.ceo/breeds/retriever-golden/n02099601_1003.jpg"
  ],
  "status": "success"
}
```

### Image URL Format

```
https://images.dog.ceo/breeds/{breed-subbreed}/{filename}.jpg
```

---

## Document History

| Version | Date     | Author | Changes                       |
| ------- | -------- | ------ | ----------------------------- |
| 1.0     | Dec 2025 | Claude | Initial architecture document |
