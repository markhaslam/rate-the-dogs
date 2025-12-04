/**
 * Dog CEO API Utilities
 *
 * Pure functions for working with Dog CEO API data.
 * These functions handle:
 * - Breed list flattening (nested -> flat)
 * - URL construction for breed images
 * - Duplicate image filtering
 * - Image URL validation
 * - Statistics calculation
 */

export type BreedImages = Record<string, string[]>;

export interface BreedStats {
  breed: string;
  count: number;
}

export interface Stats {
  totalBreeds: number;
  totalImages: number;
  duplicatesRemoved: number;
  emptyBreedsRemoved: number;
  breedStats: BreedStats[];
}

export interface FilterResult {
  filtered: BreedImages;
  removedCount: number;
  emptyBreeds: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Flatten nested breed structure from Dog CEO API into array
 *
 * Input: { "bulldog": ["french", "english"], "beagle": [] }
 * Output: ["bulldog", "bulldog-french", "bulldog-english", "beagle"]
 *
 * @param breeds - Nested breed structure from Dog CEO API
 * @returns Flat array of breed identifiers
 */
export function flattenBreedList(breeds: Record<string, string[]>): string[] {
  const breedList: string[] = [];

  for (const [breed, subBreeds] of Object.entries(breeds)) {
    // Validate breed name
    if (typeof breed !== "string" || breed.trim() === "") {
      continue;
    }

    // Add parent breed
    breedList.push(breed.toLowerCase());

    // Add sub-breeds with hyphen format
    if (Array.isArray(subBreeds)) {
      for (const subBreed of subBreeds) {
        if (typeof subBreed === "string" && subBreed.trim() !== "") {
          breedList.push(`${breed.toLowerCase()}-${subBreed.toLowerCase()}`);
        }
      }
    }
  }

  return breedList;
}

/**
 * Build Dog CEO API URL for fetching breed images
 *
 * "bulldog" -> https://dog.ceo/api/breed/bulldog/images
 * "bulldog-french" -> https://dog.ceo/api/breed/bulldog/french/images
 *
 * @param breed - Breed identifier (may contain hyphen for sub-breeds)
 * @param baseUrl - Base API URL (default: https://dog.ceo/api)
 * @returns Full URL for fetching breed images
 */
export function getBreedImagesUrl(
  breed: string,
  baseUrl = "https://dog.ceo/api"
): string {
  if (!breed || typeof breed !== "string") {
    throw new Error("Breed must be a non-empty string");
  }

  const normalizedBreed = breed.toLowerCase().trim();

  if (normalizedBreed.includes("-")) {
    const parts = normalizedBreed.split("-");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(
        `Invalid sub-breed format: ${breed}. Expected "parent-sub".`
      );
    }
    const [parent, sub] = parts;
    return `${baseUrl}/breed/${parent}/${sub}/images`;
  }

  return `${baseUrl}/breed/${normalizedBreed}/images`;
}

/**
 * Validate a Dog CEO image URL
 *
 * Valid format: https://images.dog.ceo/breeds/{breed-name}/{filename}
 *
 * @param url - URL to validate
 * @returns Validation result with errors
 */
export function validateImageUrl(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url || typeof url !== "string") {
    return { valid: false, errors: ["URL must be a non-empty string"] };
  }

  try {
    const parsed = new URL(url);

    // Check hostname
    if (parsed.hostname !== "images.dog.ceo") {
      errors.push(`Unexpected hostname: ${parsed.hostname}`);
    }

    // Check protocol
    if (parsed.protocol !== "https:") {
      errors.push(`Expected HTTPS, got: ${parsed.protocol}`);
    }

    // Check path structure
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts.length < 3) {
      errors.push("Path too short, expected /breeds/{breed}/{filename}");
    }
    if (pathParts[0] !== "breeds") {
      errors.push(`Expected path to start with /breeds/, got: ${pathParts[0]}`);
    }

    // Check for valid image extension
    const filename = pathParts[pathParts.length - 1];
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const hasValidExtension = validExtensions.some((ext) =>
      filename.toLowerCase().endsWith(ext)
    );
    if (!hasValidExtension) {
      errors.push(
        `Invalid or missing image extension: ${filename.split(".").pop()}`
      );
    }
  } catch {
    errors.push("Invalid URL format");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Extract breed name from a Dog CEO image URL
 *
 * URL: https://images.dog.ceo/breeds/bulldog-french/image.jpg
 * Returns: "bulldog-french"
 *
 * @param imageUrl - Dog CEO image URL
 * @returns Breed name extracted from URL, or null if invalid
 */
export function extractBreedFromUrl(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    // URL format: /breeds/{breed-name}/{filename}
    // Extract breed from path: ["", "breeds", "breed-name", "filename"]
    const pathParts = url.pathname.split("/");
    if (pathParts.length >= 3 && pathParts[1] === "breeds") {
      return pathParts[2];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Filter out duplicate/misplaced images from breed image collections
 *
 * Dog CEO API has a bug where parent breed images sometimes contain
 * sub-breed images. For example:
 * - "corgi" images contain "corgi-cardigan" images
 * - "pug" images contain "puggle" images
 * - "pointer-german" contains "pointer-germanlonghair" images
 *
 * This function filters by checking that the URL path matches the breed name.
 * It also removes breeds that end up with 0 images after filtering.
 *
 * @param breedImages - Map of breed -> image URLs
 * @returns Filtered results with counts
 */
export function filterDuplicateImages(breedImages: BreedImages): FilterResult {
  let removedCount = 0;
  const filtered: BreedImages = {};
  const emptyBreeds: string[] = [];

  for (const [breed, images] of Object.entries(breedImages)) {
    if (!Array.isArray(images)) {
      emptyBreeds.push(breed);
      continue;
    }

    const originalCount = images.length;

    const filteredImages = images.filter((imageUrl) => {
      const urlBreed = extractBreedFromUrl(imageUrl);
      // Keep image if we can't parse URL (defensive) or if breed matches
      return urlBreed === null || urlBreed === breed;
    });

    const removed = originalCount - filteredImages.length;
    removedCount += removed;

    // Only keep breeds that have at least 1 image after filtering
    if (filteredImages.length > 0) {
      filtered[breed] = filteredImages;
    } else {
      emptyBreeds.push(breed);
    }
  }

  return { filtered, removedCount, emptyBreeds };
}

export interface MergeResult {
  merged: BreedImages;
  mergedBreeds: { canonical: string; merged: string[]; imageCount: number }[];
}

/**
 * Merge breeds that have the same human-readable display name
 *
 * The Dog CEO API sometimes lists the same breed under multiple categories.
 * For example, Boston Terrier appears as both "bulldog/boston" and "terrier/boston".
 *
 * This function merges such duplicates by:
 * 1. Using a nameResolver function to get the display name for each breed
 * 2. Grouping breeds by their display name
 * 3. Merging images under the breed key that has the most images (canonical)
 *
 * @param breedImages - Map of breed -> image URLs
 * @param nameResolver - Function to get human-readable name from breed key
 * @returns Merged results with info about what was merged
 */
export function mergeDuplicateBreedNames(
  breedImages: BreedImages,
  nameResolver: (breed: string) => string
): MergeResult {
  // Group breeds by their display name
  const byDisplayName = new Map<string, { key: string; images: string[] }[]>();

  for (const [breed, images] of Object.entries(breedImages)) {
    const displayName = nameResolver(breed);
    const existing = byDisplayName.get(displayName) ?? [];
    existing.push({ key: breed, images });
    byDisplayName.set(displayName, existing);
  }

  const merged: BreedImages = {};
  const mergedBreeds: MergeResult["mergedBreeds"] = [];

  for (const [displayName, breeds] of byDisplayName) {
    if (breeds.length === 1) {
      // No duplicates, keep as-is
      merged[breeds[0].key] = breeds[0].images;
    } else {
      // Multiple breeds with same display name - merge them
      // Use the one with most images as the canonical key
      breeds.sort((a, b) => b.images.length - a.images.length);
      const canonical = breeds[0];
      const others = breeds.slice(1);

      // Combine all images, removing duplicates
      const allImages = new Set(canonical.images);
      for (const other of others) {
        for (const img of other.images) {
          allImages.add(img);
        }
      }

      merged[canonical.key] = Array.from(allImages);
      mergedBreeds.push({
        canonical: canonical.key,
        merged: others.map((o) => o.key),
        imageCount: allImages.size,
      });

      console.log(
        `  Merged "${displayName}": ${canonical.key} + ${others.map((o) => o.key).join(", ")} = ${allImages.size} images`
      );
    }
  }

  return { merged, mergedBreeds };
}

/**
 * Calculate statistics about a breed images dataset
 *
 * @param breedImages - Map of breed -> image URLs
 * @param duplicatesRemoved - Count of duplicates that were removed
 * @param emptyBreedsRemoved - Count of empty breeds that were removed
 * @returns Statistics object
 */
export function calculateStats(
  breedImages: BreedImages,
  duplicatesRemoved = 0,
  emptyBreedsRemoved = 0
): Stats {
  const breedStats: BreedStats[] = Object.entries(breedImages)
    .map(([breed, images]) => ({
      breed,
      count: Array.isArray(images) ? images.length : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const totalImages = breedStats.reduce((sum, b) => sum + b.count, 0);

  return {
    totalBreeds: Object.keys(breedImages).length,
    totalImages,
    duplicatesRemoved,
    emptyBreedsRemoved,
    breedStats,
  };
}

/**
 * Check if all images in a collection are valid Dog CEO URLs
 *
 * @param breedImages - Map of breed -> image URLs
 * @returns Object with invalid URLs grouped by breed
 */
export function findInvalidUrls(
  breedImages: BreedImages
): Record<string, string[]> {
  const invalidByBreed: Record<string, string[]> = {};

  for (const [breed, images] of Object.entries(breedImages)) {
    if (!Array.isArray(images)) {
      continue;
    }

    const invalid = images.filter((url) => !validateImageUrl(url).valid);
    if (invalid.length > 0) {
      invalidByBreed[breed] = invalid;
    }
  }

  return invalidByBreed;
}

/**
 * Get breed path format for Dog CEO API from our internal format
 *
 * Our format: "bulldog-french"
 * API path format: "bulldog/french"
 *
 * @param breed - Breed in our hyphenated format
 * @returns Breed in API path format
 */
export function breedToApiPath(breed: string): string {
  if (!breed || typeof breed !== "string") {
    throw new Error("Breed must be a non-empty string");
  }

  const normalized = breed.toLowerCase().trim();
  return normalized.includes("-") ? normalized.replace("-", "/") : normalized;
}

/**
 * Convert API path format back to our internal format
 *
 * API path format: "bulldog/french"
 * Our format: "bulldog-french"
 *
 * @param apiPath - Breed in API path format
 * @returns Breed in our hyphenated format
 */
export function apiPathToBreed(apiPath: string): string {
  if (!apiPath || typeof apiPath !== "string") {
    throw new Error("API path must be a non-empty string");
  }

  return apiPath.toLowerCase().trim().replace("/", "-");
}
