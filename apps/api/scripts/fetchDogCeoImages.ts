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
 * Usage:
 *   bun run apps/api/scripts/fetchDogCeoImages.ts
 *
 * Output:
 *   apps/api/src/db/breed-images.json
 *
 * Original script from 2022, modernized for current project.
 */

const DOG_CEO_API = "https://dog.ceo/api";

interface BreedsResponse {
  message: Record<string, string[]>;
  status: string;
}

interface ImagesResponse {
  message: string[];
  status: string;
}

interface BreedImages {
  [breed: string]: string[];
}

interface Stats {
  totalBreeds: number;
  totalImages: number;
  duplicatesRemoved: number;
  breedStats: Array<{ breed: string; count: number }>;
}

/**
 * Fetch all breeds from Dog CEO API
 * Returns nested structure like { "bulldog": ["french", "english"] }
 */
async function fetchBreedList(): Promise<Record<string, string[]>> {
  console.log("Fetching breed list...");
  const response = await fetch(`${DOG_CEO_API}/breeds/list/all`);
  const data = (await response.json()) as BreedsResponse;

  if (data.status !== "success" || !data.message) {
    throw new Error("Failed to fetch breed list from Dog CEO API");
  }

  return data.message;
}

/**
 * Flatten nested breed structure into array
 * Input: { "bulldog": ["french", "english"] }
 * Output: ["bulldog", "bulldog-french", "bulldog-english"]
 */
function flattenBreedList(breeds: Record<string, string[]>): string[] {
  const breedList: string[] = [];

  for (const [breed, subBreeds] of Object.entries(breeds)) {
    // Add parent breed
    breedList.push(breed);

    // Add sub-breeds with hyphen format
    for (const subBreed of subBreeds) {
      breedList.push(`${breed}-${subBreed}`);
    }
  }

  console.log(`Found ${breedList.length} breeds (including sub-breeds)`);
  return breedList;
}

/**
 * Build Dog CEO API URL for a breed
 * "bulldog" -> /breed/bulldog/images
 * "bulldog-french" -> /breed/bulldog/french/images
 */
function getBreedImagesUrl(breed: string): string {
  if (breed.includes("-")) {
    const [parent, sub] = breed.split("-");
    return `${DOG_CEO_API}/breed/${parent}/${sub}/images`;
  }
  return `${DOG_CEO_API}/breed/${breed}/images`;
}

/**
 * Fetch images for a single breed
 */
async function fetchBreedImages(breed: string): Promise<string[]> {
  const url = getBreedImagesUrl(breed);
  const response = await fetch(url);
  const data = (await response.json()) as ImagesResponse;

  if (data.status !== "success") {
    console.warn(`Failed to fetch images for ${breed}`);
    return [];
  }

  return data.message;
}

/**
 * Filter out duplicate/misplaced images
 *
 * Dog CEO API has a bug where parent breed images sometimes contain
 * sub-breed images. For example:
 * - "corgi" images contain "corgi-cardigan" images
 * - "pug" images contain "puggle" images
 * - "pointer-german" contains "pointer-germanlonghair" images
 *
 * We filter by checking that the URL path matches the breed name.
 */
function filterDuplicateImages(breedImages: BreedImages): {
  filtered: BreedImages;
  removedCount: number;
  emptyBreeds: string[];
} {
  let removedCount = 0;
  const filtered: BreedImages = {};
  const emptyBreeds: string[] = [];

  for (const [breed, images] of Object.entries(breedImages)) {
    const originalCount = images.length;

    const filteredImages = images.filter((imageUrl) => {
      try {
        const url = new URL(imageUrl);
        // URL format: /breeds/{breed-name}/{filename}
        // Extract breed from path: ["", "breeds", "breed-name", "filename"]
        const breedPath = url.pathname.split("/")[2];
        return breedPath === breed;
      } catch {
        // Invalid URL, keep it anyway
        return true;
      }
    });

    const removed = originalCount - filteredImages.length;
    if (removed > 0) {
      console.log(`  ${breed}: removed ${removed} duplicate images`);
      removedCount += removed;
    }

    // Only keep breeds that have at least 1 image after filtering
    if (filteredImages.length > 0) {
      filtered[breed] = filteredImages;
    } else {
      emptyBreeds.push(breed);
    }
  }

  return { filtered, removedCount, emptyBreeds };
}

/**
 * Fetch all images for all breeds with progress reporting
 */
async function fetchAllImages(breedList: string[]): Promise<BreedImages> {
  console.log(`\nFetching images for ${breedList.length} breeds...`);
  console.log("(This may take a minute - fetching in parallel)\n");

  // Fetch all breeds in parallel
  const imagePromises = breedList.map((breed) => fetchBreedImages(breed));
  const imageResults = await Promise.all(imagePromises);

  // Build breed -> images map
  const breedImages: BreedImages = {};
  for (let i = 0; i < breedList.length; i++) {
    breedImages[breedList[i]] = imageResults[i];
  }

  return breedImages;
}

/**
 * Calculate statistics about the image dataset
 */
function calculateStats(
  breedImages: BreedImages,
  duplicatesRemoved: number
): Stats {
  const breedStats = Object.entries(breedImages)
    .map(([breed, images]) => ({ breed, count: images.length }))
    .sort((a, b) => b.count - a.count);

  const totalImages = breedStats.reduce((sum, b) => sum + b.count, 0);

  return {
    totalBreeds: Object.keys(breedImages).length,
    totalImages,
    duplicatesRemoved,
    breedStats,
  };
}

/**
 * Print statistics to console
 */
function printStats(stats: Stats): void {
  console.log("\n" + "=".repeat(50));
  console.log("STATISTICS");
  console.log("=".repeat(50));
  console.log(`Total breeds: ${stats.totalBreeds}`);
  console.log(`Total images: ${stats.totalImages.toLocaleString()}`);
  console.log(`Duplicates removed: ${stats.duplicatesRemoved}`);
  console.log(
    `Average images per breed: ${Math.round(stats.totalImages / stats.totalBreeds)}`
  );
  console.log("\nTop 10 breeds by image count:");
  stats.breedStats.slice(0, 10).forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.breed}: ${b.count} images`);
  });
  console.log("\nBottom 5 breeds by image count:");
  stats.breedStats.slice(-5).forEach((b) => {
    console.log(`  - ${b.breed}: ${b.count} images`);
  });
}

/**
 * Main function - fetch all images and save to file
 */
async function main(): Promise<void> {
  const startTime = Date.now();

  try {
    // 1. Fetch breed list
    const breeds = await fetchBreedList();
    const breedList = flattenBreedList(breeds);

    // 2. Fetch all images
    const rawImages = await fetchAllImages(breedList);

    // 3. Filter duplicates
    console.log("\nFiltering duplicate images...");
    const { filtered: breedImages, removedCount } =
      filterDuplicateImages(rawImages);

    // 4. Calculate and print stats
    const stats = calculateStats(breedImages, removedCount);
    printStats(stats);

    // 5. Write to file
    const outputPath = new URL("../src/db/breed-images.json", import.meta.url);
    const outputFile = outputPath.pathname;

    console.log(`\nWriting to ${outputFile}...`);
    await Bun.write(outputFile, JSON.stringify(breedImages, null, 2));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nDone! Completed in ${elapsed}s`);
    console.log(
      `File size: ${(JSON.stringify(breedImages).length / 1024 / 1024).toFixed(2)} MB`
    );

    // 6. Also write stats to separate file for reference
    const statsPath = new URL("../src/db/breed-stats.json", import.meta.url);
    await Bun.write(statsPath.pathname, JSON.stringify(stats, null, 2));
    console.log(`Stats written to breed-stats.json`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the script
main();
