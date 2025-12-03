/**
 * Rating system constants
 */
export const RATING = {
  MIN: 0.5,
  MAX: 5.0,
  INCREMENT: 0.5,
  MIN_FOR_LEADERBOARD: 3, // Minimum ratings to appear on leaderboard
} as const;

/**
 * Dog status values
 */
export const DOG_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

// Note: DogStatus type is exported from schemas/dog.ts for consistency with Zod
export type DogStatusValue = (typeof DOG_STATUS)[keyof typeof DOG_STATUS];

/**
 * File upload constraints
 */
export const UPLOAD = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_DIMENSION_PX: 4096,
  COMPRESSION_TARGET_BYTES: 1 * 1024 * 1024, // 1MB
  COMPRESSION_TARGET_DIMENSION: 1920,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

export type AllowedContentType = (typeof UPLOAD.ALLOWED_TYPES)[number];

/**
 * Rate limiting
 */
export const RATE_LIMITS = {
  RATING_PER_MINUTE: 10,
  UPLOAD_PER_HOUR: 5,
  API_PER_MINUTE: 100,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Cookie configuration
 */
export const COOKIE = {
  ANON_ID_NAME: "anon_id",
  MAX_AGE_SECONDS: 400 * 24 * 60 * 60, // 400 days (browser max)
} as const;

/**
 * Special breed IDs (set during seed)
 */
export const SPECIAL_BREEDS = {
  MIXED_BREED_SLUG: "mixed-breed",
  UNKNOWN_SLUG: "unknown",
} as const;
