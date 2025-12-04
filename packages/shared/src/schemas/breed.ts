import { z } from "zod";

/**
 * Breed slug format - lowercase, hyphenated
 */
export const breedSlugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9-]+$/,
    "Slug must be lowercase letters, numbers, and hyphens"
  );

/**
 * Image source enum for Dog CEO vs user uploads
 */
export const imageSourceSchema = z.enum(["dog_ceo", "user_upload"]);

/**
 * Breed database record
 */
export const breedSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  slug: breedSlugSchema,
  dog_ceo_path: z.string().nullable(), // Dog CEO API path (e.g., "retriever/golden")
  image_count: z.number().int().nonnegative().nullable(), // Synced image count
  last_synced_at: z.string().datetime().nullable(), // Last sync timestamp
  created_at: z.string().datetime(),
});

/**
 * Breed with statistics for listings
 */
export const breedWithStatsSchema = breedSchema.extend({
  dog_count: z.number().int().nonnegative(),
  avg_rating: z.number().nullable(),
  rating_count: z.number().int().nonnegative(),
});

// Type exports
export type ImageSource = z.infer<typeof imageSourceSchema>;
export type BreedSlug = z.infer<typeof breedSlugSchema>;
export type Breed = z.infer<typeof breedSchema>;
export type BreedWithStats = z.infer<typeof breedWithStatsSchema>;
