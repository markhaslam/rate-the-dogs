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
 * Dog CEO API breed paths
 * Maps our breed slugs to Dog CEO API breed folder names
 */
const BREED_TO_DOG_CEO: Record<string, string> = {
  "labrador-retriever": "labrador",
  "german-shepherd": "german-shepherd",
  "golden-retriever": "retriever-golden",
  "french-bulldog": "bulldog-french",
  bulldog: "bulldog-english",
  poodle: "poodle-standard",
  beagle: "beagle",
  rottweiler: "rottweiler",
  dachshund: "dachshund",
  corgi: "corgi-cardigan",
  husky: "husky",
  boxer: "boxer",
  "shih-tzu": "shihtzu",
  pomeranian: "pomeranian",
  "border-collie": "collie-border",
  "mixed-breed": "mix",
  unknown: "mix",
};

/**
 * Known working image filenames from Dog CEO API per breed
 * These are real images that exist in the Dog CEO API
 */
const BREED_IMAGES: Record<string, string[]> = {
  labrador: [
    "Fury_01.jpg",
    "Fury_02.jpg",
    "IMG_2397.jpg",
    "IMG_2752.jpg",
    "IMG_4708.jpg",
  ],
  "german-shepherd": [
    "Bagira_site.jpg",
    "Hannah.jpg",
    "IMG_20200801_005825_408.jpg",
    "IMG_20200801_005827_704.jpg",
    "IMG_20200801_005830_387.jpg",
  ],
  "retriever-golden": [
    "20200731_180910_200731.jpg",
    "20200801_174527_200801.jpg",
    "20200814_113907_200814.jpg",
    "20200814_163629_200814.jpg",
    "20200816_163418_200816.jpg",
  ],
  "bulldog-french": [
    "IMG_0846.jpg",
    "IMG_1657.jpg",
    "hunghung.jpg",
    "n02108915_10204.jpg",
    "n02108915_10564.jpg",
  ],
  "bulldog-english": [
    "bunz.jpg",
    "jager-1.jpg",
    "jager-2.jpg",
    "mami.jpg",
    "murphy.jpg",
  ],
  "poodle-standard": [
    "n02113799_1057.jpg",
    "n02113799_1121.jpg",
    "n02113799_1140.jpg",
    "n02113799_1144.jpg",
    "n02113799_1155.jpg",
  ],
  beagle: [
    "01-12Brady.jpg.jpg",
    "1271553739_Milo.jpg",
    "1374053345_Milo.jpg",
    "166407056_Milo.jpg",
    "184369380_Milo.jpg",
  ],
  rottweiler: [
    "n02106550_10048.jpg",
    "n02106550_10222.jpg",
    "n02106550_1033.jpg",
    "n02106550_10375.jpg",
    "n02106550_10478.jpg",
  ],
  dachshund: [
    "Daschund-2.jpg",
    "Daschund_Wirehair.jpg",
    "Dash_Dachshund_With_Hat.jpg",
    "Miniature_Daschund.jpg",
    "Standard_Wire-hair_Dachshund.jpg",
  ],
  "corgi-cardigan": [
    "miss-muffin.jpg",
    "n02113186_10077.jpg",
    "n02113186_1016.jpg",
    "n02113186_1030.jpg",
    "n02113186_10361.jpg",
  ],
  husky: [
    "20180901_150234.jpg",
    "20180904_185604.jpg",
    "20180924_193829.jpg",
    "20250113_192336.jpg",
    "MsMilo_Husky1.jpg",
  ],
  boxer: [
    "28082007167-min.jpg",
    "IMG_0002.jpg",
    "IMG_3394.jpg",
    "n02108089_1.jpg",
    "n02108089_1003.jpg",
  ],
  shihtzu: [
    "Rudy_Small.jpg",
    "n02086240_1011.jpg",
    "n02086240_1016.jpg",
    "n02086240_1059.jpg",
    "n02086240_1078.jpg",
  ],
  pomeranian: [
    "Rockette_2025.jpg",
    "n02112018_10129.jpg",
    "n02112018_10158.jpg",
    "n02112018_10174.jpg",
    "n02112018_10243.jpg",
  ],
  "collie-border": [
    "Jake.jpg",
    "Zoe.jpg",
    "brodie.jpg",
    "caesar.jpg",
    "lyra.jpg",
  ],
  mix: [
    "Annabelle0.jpg",
    "Annabelle1.jpg",
    "Annabelle10.jpg",
    "Annabelle11.jpg",
    "Annabelle2.jpg",
  ],
};

/**
 * Get a deterministic hash from a string
 */
function hashString(str: string): number {
  return Math.abs(
    str.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
  );
}

/**
 * Get public URL for an image
 * For MVP, use Dog CEO API images with deterministic selection.
 * In production, configure R2 with custom domain.
 */
export function getImageUrl(key: string, breedSlug?: string): string {
  const breed = breedSlug ?? "mixed-breed";
  const dogCeoBreed = BREED_TO_DOG_CEO[breed] ?? "mix";
  const images = BREED_IMAGES[dogCeoBreed] ?? BREED_IMAGES.mix;

  // Use a deterministic index based on the image key for consistent images
  const index = hashString(key) % images.length;
  const filename = images[index];

  return `https://images.dog.ceo/breeds/${dogCeoBreed}/${filename}`;
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
