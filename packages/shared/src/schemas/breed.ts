import { z } from "zod";

/**
 * Breed slug format - lowercase, hyphenated
 */
export const breedSlugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens");

/**
 * Breed database record
 */
export const breedSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  slug: breedSlugSchema,
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
export type BreedSlug = z.infer<typeof breedSlugSchema>;
export type Breed = z.infer<typeof breedSchema>;
export type BreedWithStats = z.infer<typeof breedWithStatsSchema>;
