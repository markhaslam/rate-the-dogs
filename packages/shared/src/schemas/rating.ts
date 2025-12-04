import { z } from "zod";
import { RATING } from "../constants.js";

/**
 * Rating value schema - validates 0.5 to 5.0 in 0.5 increments
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
 * Schema for POST /api/dogs/:id/rate request body
 */
export const rateRequestSchema = z.object({
  value: ratingValueSchema,
});

/**
 * Rating database record
 */
export const ratingSchema = z.object({
  id: z.number().int().positive(),
  dog_id: z.number().int().positive(),
  value: ratingValueSchema,
  user_id: z.number().int().positive().nullable(),
  anon_id: z.string().uuid().nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(), // Browser/device info for analytics
  created_at: z.string().datetime(),
});

/**
 * Rating with dog info for user's rating history
 */
export const ratingWithDogSchema = ratingSchema.extend({
  dog_name: z.string().nullable(),
  dog_image_key: z.string(),
  breed_name: z.string(),
  breed_slug: z.string(),
});

// Type exports
export type RatingValue = z.infer<typeof ratingValueSchema>;
export type RateRequest = z.infer<typeof rateRequestSchema>;
export type Rating = z.infer<typeof ratingSchema>;
export type RatingWithDog = z.infer<typeof ratingWithDogSchema>;
