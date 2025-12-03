import type { R2Bucket } from "@cloudflare/workers-types";

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
 * Get public URL for an image
 * For MVP, use placeholder images. In production, configure R2 with custom domain.
 */
export function getImageUrl(key: string): string {
  // Extract dog ID from key for consistent placeholder
  const match = key.match(/sample-(\d+)/);
  if (match) {
    const id = match[1];
    return `https://placedog.net/500/500?id=${id}`;
  }
  // For uploaded images, use a hash of the key
  const hash = key.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  return `https://placedog.net/500/500?id=${Math.abs(hash)}`;
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
