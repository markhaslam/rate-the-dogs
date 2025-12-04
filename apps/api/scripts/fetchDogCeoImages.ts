/**
 * Dog CEO Image Fetcher
 *
 * Fetches ALL images from the Dog CEO API and saves them to a JSON file.
 * This script handles several quirks of the Dog CEO API:
 *
 * 1. Nested breed structure (e.g., "bulldog" has sub-breeds "french", "english")
 * 2. Duplicate images where parent breeds contain sub-breed images
 * 3. Misplaced images (e.g., "pug" containing "puggle" images)
 *
 * Features:
 * - Retry logic with exponential backoff
 * - Rate limiting to avoid overwhelming the API
 * - Progress reporting
 * - Validation of fetched data
 * - Detailed statistics
 *
 * Usage:
 *   bun run apps/api/scripts/fetchDogCeoImages.ts
 *
 * Options:
 *   --validate-only   Only validate existing breed-images.json
 *   --dry-run         Fetch but don't write to file
 *
 * Output:
 *   apps/api/src/db/breed-images.json
 *   apps/api/src/db/breed-stats.json
 */

import {
  flattenBreedList,
  getBreedImagesUrl,
  filterDuplicateImages,
  mergeDuplicateBreedNames,
  calculateStats,
  findInvalidUrls,
  type BreedImages,
  type Stats,
} from "../src/lib/dogCeoUtils";
import { getReadableBreedName } from "../src/lib/dogCeoBreeds";

const DOG_CEO_API = "https://dog.ceo/api";

// Configuration
const CONFIG = {
  maxRetries: 3,
  retryDelayMs: 1000,
  concurrentRequests: 10, // Limit concurrent requests to be nice to the API
  requestDelayMs: 50, // Small delay between batches
};

interface BreedsResponse {
  message: Record<string, string[]>;
  status: string;
}

interface ImagesResponse {
  message: string[];
  status: string;
}

interface FetchResult {
  breed: string;
  images: string[];
  error?: string;
  retries: number;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic and exponential backoff
 */
async function fetchWithRetry<T>(
  url: string,
  maxRetries = CONFIG.maxRetries
): Promise<{ data: T | null; error?: string; retries: number }> {
  let lastError: Error | null = null;
  let retries = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as T;
      return { data, retries };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retries = attempt + 1;

      if (attempt < maxRetries) {
        const delay = CONFIG.retryDelayMs * Math.pow(2, attempt);
        console.warn(
          `  Retry ${attempt + 1}/${maxRetries} for ${url} in ${delay}ms...`
        );
        await sleep(delay);
      }
    }
  }

  return {
    data: null,
    error: lastError?.message ?? "Unknown error",
    retries,
  };
}

/**
 * Fetch all breeds from Dog CEO API
 */
async function fetchBreedList(): Promise<Record<string, string[]>> {
  console.log("Fetching breed list...");

  const { data, error } = await fetchWithRetry<BreedsResponse>(
    `${DOG_CEO_API}/breeds/list/all`
  );

  if (!data || data.status !== "success" || !data.message) {
    throw new Error(
      `Failed to fetch breed list: ${error ?? "Invalid response"}`
    );
  }

  return data.message;
}

/**
 * Fetch images for a single breed
 */
async function fetchBreedImages(breed: string): Promise<FetchResult> {
  const url = getBreedImagesUrl(breed, DOG_CEO_API);
  const { data, error, retries } = await fetchWithRetry<ImagesResponse>(url);

  if (!data || data.status !== "success") {
    return { breed, images: [], error: error ?? "Invalid response", retries };
  }

  return { breed, images: data.message ?? [], retries };
}

/**
 * Fetch images in batches to limit concurrent requests
 */
async function fetchAllImagesInBatches(
  breedList: string[]
): Promise<FetchResult[]> {
  const results: FetchResult[] = [];
  const total = breedList.length;
  let completed = 0;
  let totalRetries = 0;
  let errors = 0;

  console.log(`\nFetching images for ${total} breeds...`);
  console.log(
    `(Batch size: ${CONFIG.concurrentRequests}, with ${CONFIG.requestDelayMs}ms delay)\n`
  );

  // Process in batches
  for (let i = 0; i < total; i += CONFIG.concurrentRequests) {
    const batch = breedList.slice(i, i + CONFIG.concurrentRequests);
    const batchResults = await Promise.all(batch.map(fetchBreedImages));

    for (const result of batchResults) {
      results.push(result);
      completed++;
      totalRetries += result.retries;

      if (result.error) {
        errors++;
        console.warn(`  ✗ ${result.breed}: ${result.error}`);
      }
    }

    // Progress update every 20 breeds
    if (completed % 20 === 0 || completed === total) {
      const percent = Math.round((completed / total) * 100);
      const imageCount = results.reduce((sum, r) => sum + r.images.length, 0);
      console.log(
        `  Progress: ${completed}/${total} breeds (${percent}%), ${imageCount.toLocaleString()} images`
      );
    }

    // Small delay between batches
    if (i + CONFIG.concurrentRequests < total) {
      await sleep(CONFIG.requestDelayMs);
    }
  }

  console.log(
    `\nFetch complete: ${errors} errors, ${totalRetries} total retries`
  );

  return results;
}

/**
 * Convert fetch results to breed images map
 */
function resultsToBreedImages(results: FetchResult[]): BreedImages {
  const breedImages: BreedImages = {};
  for (const result of results) {
    breedImages[result.breed] = result.images;
  }
  return breedImages;
}

/**
 * Print statistics to console
 */
function printStats(stats: Stats, emptyBreeds: string[]): void {
  console.log("\n" + "=".repeat(50));
  console.log("STATISTICS");
  console.log("=".repeat(50));
  console.log(`Total breeds with images: ${stats.totalBreeds}`);
  console.log(`Total images: ${stats.totalImages.toLocaleString()}`);
  console.log(`Duplicates removed: ${stats.duplicatesRemoved}`);
  console.log(`Empty breeds removed: ${emptyBreeds.length}`);

  if (stats.totalBreeds > 0) {
    console.log(
      `Average images per breed: ${Math.round(stats.totalImages / stats.totalBreeds)}`
    );
  }

  console.log("\nTop 10 breeds by image count:");
  stats.breedStats.slice(0, 10).forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.breed}: ${b.count} images`);
  });

  console.log("\nBottom 5 breeds by image count:");
  stats.breedStats.slice(-5).forEach((b) => {
    console.log(`  - ${b.breed}: ${b.count} images`);
  });

  if (emptyBreeds.length > 0) {
    console.log(
      `\nEmpty breeds (no images after filtering): ${emptyBreeds.join(", ")}`
    );
  }
}

/**
 * Validate existing breed-images.json file
 */
async function validateExisting(): Promise<void> {
  console.log("Validating existing breed-images.json...\n");

  const inputPath = new URL("../src/db/breed-images.json", import.meta.url);
  const file = Bun.file(inputPath.pathname);

  if (!(await file.exists())) {
    console.error("Error: breed-images.json not found");
    process.exit(1);
  }

  const breedImages = (await file.json()) as BreedImages;
  const stats = calculateStats(breedImages);
  const invalidUrls = findInvalidUrls(breedImages);

  console.log("=".repeat(50));
  console.log("VALIDATION RESULTS");
  console.log("=".repeat(50));
  console.log(`Total breeds: ${stats.totalBreeds}`);
  console.log(`Total images: ${stats.totalImages.toLocaleString()}`);

  const invalidCount = Object.values(invalidUrls).flat().length;
  if (invalidCount > 0) {
    console.log(`\n⚠ Found ${invalidCount} invalid URLs:`);
    for (const [breed, urls] of Object.entries(invalidUrls)) {
      console.log(`  ${breed}: ${urls.length} invalid`);
      urls.slice(0, 3).forEach((url) => console.log(`    - ${url}`));
      if (urls.length > 3) {
        console.log(`    ... and ${urls.length - 3} more`);
      }
    }
  } else {
    console.log("\n✓ All URLs are valid");
  }

  printStats(stats, []);
}

/**
 * Main function - fetch all images and save to file
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const validateOnly = args.includes("--validate-only");
  const dryRun = args.includes("--dry-run");

  if (validateOnly) {
    await validateExisting();
    return;
  }

  const startTime = Date.now();

  try {
    // 1. Fetch breed list
    const breeds = await fetchBreedList();
    const breedList = flattenBreedList(breeds);
    console.log(`Found ${breedList.length} breeds (including sub-breeds)`);

    // 2. Fetch all images
    const results = await fetchAllImagesInBatches(breedList);
    const rawImages = resultsToBreedImages(results);

    // 3. Filter duplicates
    console.log("\nFiltering duplicate images...");
    const {
      filtered: filteredImages,
      removedCount,
      emptyBreeds,
    } = filterDuplicateImages(rawImages);

    // 4. Merge breeds with same display name (e.g., bulldog-boston + terrier-boston = Boston Terrier)
    console.log("\nMerging breeds with same display name...");
    const { merged: breedImages, mergedBreeds } = mergeDuplicateBreedNames(
      filteredImages,
      getReadableBreedName
    );
    if (mergedBreeds.length === 0) {
      console.log("  No duplicates found to merge");
    }

    // 5. Validate URLs
    const invalidUrls = findInvalidUrls(breedImages);
    const invalidCount = Object.values(invalidUrls).flat().length;
    if (invalidCount > 0) {
      console.warn(`\n⚠ Warning: ${invalidCount} invalid URLs found`);
    }

    // 5. Calculate and print stats
    const stats = calculateStats(breedImages, removedCount, emptyBreeds.length);
    printStats(stats, emptyBreeds);

    // 6. Write to files (unless dry run)
    if (dryRun) {
      console.log("\n[DRY RUN] Skipping file write");
    } else {
      const outputPath = new URL(
        "../src/db/breed-images.json",
        import.meta.url
      );
      const statsPath = new URL("../src/db/breed-stats.json", import.meta.url);

      console.log(`\nWriting to ${outputPath.pathname}...`);
      await Bun.write(
        outputPath.pathname,
        JSON.stringify(breedImages, null, 2)
      );

      await Bun.write(statsPath.pathname, JSON.stringify(stats, null, 2));
      console.log(`Stats written to breed-stats.json`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nDone! Completed in ${elapsed}s`);
    console.log(
      `File size: ${(JSON.stringify(breedImages).length / 1024 / 1024).toFixed(2)} MB`
    );
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the script
main();
