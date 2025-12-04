import type { R2Bucket } from "@cloudflare/workers-types";
import type { ImageSource } from "../db/schema/dogs.js";

/**
 * Generate a unique image key for R2
 */
export function generateImageKey(contentType: string): string {
  const id = crypto.randomUUID();
  const ext = contentType.split("/")[1] || "jpg";
  return `dogs/${id}.${ext}`;
}

/**
 * Generate a presigned URL for uploading to R2
 * Note: R2 doesn't support presigned URLs the same way S3 does.
 * We'll use a different approach - the client uploads through our API
 * and we forward to R2.
 *
 * For true presigned URLs, you'd need to use R2's S3-compatible API
 * with custom domain and signed URLs.
 */
export function createPresignedUploadUrl(
  bucket: R2Bucket,
  key: string,
  contentType: string,
  expiresIn = 3600
): string {
  // For now, we'll return a URL that points to our upload endpoint
  // In production, you'd configure R2 with a custom domain and use
  // the S3-compatible API for presigned URLs

  // This is a placeholder - actual presigned URL generation
  // requires R2 S3-compatible API setup
  void bucket;
  void contentType;
  void expiresIn;

  // Return the key - client will upload through our proxy endpoint
  return key;
}

/**
 * Dog image data for URL resolution
 */
export interface DogImageData {
  imageUrl: string | null;
  imageKey: string | null;
  imageSource: ImageSource | null;
}

/**
 * Placeholder image URL for missing images
 */
const PLACEHOLDER_IMAGE = "https://placedog.net/500/500?random";

/**
 * Get public URL for a dog image
 *
 * This function handles both image sources:
 * - Dog CEO images: Returns the stored `image_url` directly
 * - User uploads: Returns R2 public URL based on `image_key`
 *
 * @param dog - Dog image data containing imageUrl, imageKey, and imageSource
 * @param r2PublicUrl - Optional R2 public URL base for user uploads
 * @returns Public image URL
 *
 * @example
 * // Dog CEO image
 * getImageUrl({ imageUrl: "https://images.dog.ceo/...", imageKey: null, imageSource: "dog_ceo" })
 * // Returns: "https://images.dog.ceo/..."
 *
 * @example
 * // User upload
 * getImageUrl({ imageUrl: null, imageKey: "dogs/abc.jpg", imageSource: "user_upload" }, "https://r2.example.com")
 * // Returns: "https://r2.example.com/dogs/abc.jpg"
 */
export function getImageUrl(dog: DogImageData, r2PublicUrl?: string): string {
  // Handle Dog CEO images - return direct URL
  if (dog.imageSource === "dog_ceo" && dog.imageUrl) {
    return dog.imageUrl;
  }

  // Handle user uploads - construct R2 URL from key
  if (dog.imageSource === "user_upload" && dog.imageKey) {
    if (r2PublicUrl) {
      // Use configured R2 public URL
      return `${r2PublicUrl}/${dog.imageKey}`;
    }
    // Fallback: return key as relative path (requires proxy endpoint)
    return `/api/images/${dog.imageKey}`;
  }

  // If we have an image URL regardless of source, use it
  if (dog.imageUrl) {
    return dog.imageUrl;
  }

  // If we have an image key regardless of source, try to construct URL
  if (dog.imageKey) {
    if (r2PublicUrl) {
      return `${r2PublicUrl}/${dog.imageKey}`;
    }
    return `/api/images/${dog.imageKey}`;
  }

  // Fallback placeholder
  return PLACEHOLDER_IMAGE;
}

/**
 * Legacy getImageUrl for backwards compatibility
 * @deprecated Use the new getImageUrl with DogImageData interface
 */
export function getImageUrlLegacy(key: string, breedSlug?: string): string {
  // For legacy calls, construct a placeholder URL
  // This is only used during the transition period
  void breedSlug;
  return `/api/images/${key}`;
}

/**
 * Delete an image from R2
 */
export async function deleteImage(
  bucket: R2Bucket,
  key: string
): Promise<void> {
  await bucket.delete(key);
}

/**
 * Check if an image exists in R2
 */
export async function imageExists(
  bucket: R2Bucket,
  key: string
): Promise<boolean> {
  const object = await bucket.head(key);
  return object !== null;
}
