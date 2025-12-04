/**
 * Zod Schemas - Generated from Drizzle ORM Schema
 *
 * This file provides Zod validation schemas derived from our Drizzle schema.
 * Use these for API request/response validation with @hono/zod-validator.
 *
 * IMPORTANT: This is the single source of truth for validation.
 * The Drizzle schema defines the database structure, and drizzle-zod
 * generates type-safe Zod schemas from it.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  breeds,
  dogs,
  ratings,
  skips,
  users,
  anonymousUsers,
} from "./schema/index.js";
import { RATING, UPLOAD } from "@rate-the-dogs/shared";

// =============================================================================
// AUTO-GENERATED SCHEMAS FROM DRIZZLE
// =============================================================================

// Breed schemas
export const breedSelectSchema = createSelectSchema(breeds);
export const breedInsertSchema = createInsertSchema(breeds);

// Dog schemas
export const dogSelectSchema = createSelectSchema(dogs);
export const dogInsertSchema = createInsertSchema(dogs);

// Rating schemas
export const ratingSelectSchema = createSelectSchema(ratings);
export const ratingInsertSchema = createInsertSchema(ratings);

// Skip schemas
export const skipSelectSchema = createSelectSchema(skips);
export const skipInsertSchema = createInsertSchema(skips);

// User schemas
export const userSelectSchema = createSelectSchema(users);
export const userInsertSchema = createInsertSchema(users);

// Anonymous user schemas
export const anonymousUserSelectSchema = createSelectSchema(anonymousUsers);
export const anonymousUserInsertSchema = createInsertSchema(anonymousUsers);

// =============================================================================
// CUSTOM REQUEST SCHEMAS (API Validation)
// =============================================================================

/**
 * Rating value schema - validates half-point increments from 0.5 to 5.0
 */
export const ratingValueSchema = z
  .number()
  .min(RATING.MIN, `Rating must be at least ${RATING.MIN}`)
  .max(RATING.MAX, `Rating must be at most ${RATING.MAX}`)
  .multipleOf(
    RATING.INCREMENT,
    `Rating must be in ${RATING.INCREMENT} increments`
  );

/**
 * POST /api/dogs/:id/rate request body
 */
export const rateRequestSchema = z.object({
  value: ratingValueSchema,
});

/**
 * POST /api/dogs request body - create a new dog
 */
export const createDogRequestSchema = z.object({
  name: z
    .string()
    .max(50, "Dog name must be 50 characters or less")
    .trim()
    .optional()
    .nullable(),
  imageKey: z
    .string()
    .regex(
      /^dogs\/[\w-]+\.(jpg|jpeg|png|webp)$/i,
      "Image key must be in format: dogs/{id}.{ext}"
    ),
  breedId: z.number().int().positive("Breed ID must be a positive integer"),
});

/**
 * POST /api/dogs/upload-url request body
 */
export const uploadUrlRequestSchema = z.object({
  contentType: z.enum(UPLOAD.ALLOWED_TYPES, {
    message: `Content type must be one of: ${UPLOAD.ALLOWED_TYPES.join(", ")}`,
  }),
});

/**
 * Leaderboard query params
 */
export const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Breed search query params
 */
export const breedSearchQuerySchema = z.object({
  q: z.string().optional(),
});

// =============================================================================
// RESPONSE TYPES (for documentation/type inference)
// =============================================================================

/**
 * Dog with breed info and rating stats (for display)
 */
export const dogWithDetailsSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  image_key: z.string(),
  image_url: z.string().nullable(),
  breed_id: z.number(),
  breed_name: z.string(),
  breed_slug: z.string(),
  avg_rating: z.number().nullable(),
  rating_count: z.number(),
  display_url: z.string().optional(),
});

/**
 * Leaderboard dog entry
 */
export const leaderboardDogSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  image_key: z.string(),
  image_url: z.string().nullable(),
  breed_name: z.string(),
  breed_slug: z.string(),
  avg_rating: z.number(),
  rating_count: z.number(),
  rank: z.number(),
});

/**
 * Leaderboard breed entry
 */
export const leaderboardBreedSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  avg_rating: z.number(),
  dog_count: z.number(),
  rating_count: z.number(),
  rank: z.number(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type RatingValue = z.infer<typeof ratingValueSchema>;
export type RateRequest = z.infer<typeof rateRequestSchema>;
export type CreateDogRequest = z.infer<typeof createDogRequestSchema>;
export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
export type BreedSearchQuery = z.infer<typeof breedSearchQuerySchema>;
export type DogWithDetails = z.infer<typeof dogWithDetailsSchema>;
export type LeaderboardDog = z.infer<typeof leaderboardDogSchema>;
export type LeaderboardBreed = z.infer<typeof leaderboardBreedSchema>;
