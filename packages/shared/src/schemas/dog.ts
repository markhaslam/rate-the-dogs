import { z } from "zod";
import { DOG_STATUS, UPLOAD } from "../constants.js";
import { imageSourceSchema } from "./breed.js";

/**
 * Dog status enum
 */
export const dogStatusSchema = z.enum([
  DOG_STATUS.PENDING,
  DOG_STATUS.APPROVED,
  DOG_STATUS.REJECTED,
]);

/**
 * R2 image key format
 */
export const imageKeySchema = z
  .string()
  .regex(
    /^dogs\/[\w-]+\.(jpg|jpeg|png|webp)$/i,
    "Image key must be in format: dogs/{id}.{ext}"
  );

/**
 * Dog name - optional, max 50 chars
 */
export const dogNameSchema = z
  .string()
  .max(50, "Dog name must be 50 characters or less")
  .trim()
  .optional()
  .nullable();

/**
 * Schema for POST /api/dogs request body
 */
export const createDogRequestSchema = z.object({
  name: dogNameSchema,
  imageKey: imageKeySchema,
  breedId: z.number().int().positive("Breed ID must be a positive integer"),
});

/**
 * Dog database record
 */
export const dogSchema = z.object({
  id: z.number().int().positive(),
  name: dogNameSchema,
  image_key: z.string(), // R2 key for user uploads (empty for Dog CEO)
  image_url: z.string().url().nullable(), // Direct URL for Dog CEO images
  image_source: imageSourceSchema, // 'dog_ceo' or 'user_upload'
  breed_id: z.number().int().positive(),
  uploader_user_id: z.number().int().positive().nullable(),
  uploader_anon_id: z.string().uuid().nullable(),
  status: dogStatusSchema,
  moderated_by: z.string().nullable(),
  moderated_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Dog with breed info and rating stats (for display)
 */
export const dogWithDetailsSchema = dogSchema.extend({
  breed_name: z.string(),
  breed_slug: z.string(),
  avg_rating: z.number().nullable(),
  rating_count: z.number().int().nonnegative(),
  display_url: z.string().url(), // Final URL to display (from Dog CEO or R2)
});

/**
 * Schema for upload URL request
 */
export const uploadUrlRequestSchema = z.object({
  contentType: z.enum(UPLOAD.ALLOWED_TYPES, {
    errorMap: () => ({
      message: `Content type must be one of: ${UPLOAD.ALLOWED_TYPES.join(", ")}`,
    }),
  }),
});

/**
 * Response from upload URL endpoint
 */
export const uploadUrlResponseSchema = z.object({
  uploadUrl: z.string().url(),
  key: imageKeySchema,
});

// Type exports
export type DogStatus = z.infer<typeof dogStatusSchema>;
export type ImageKey = z.infer<typeof imageKeySchema>;
export type DogName = z.infer<typeof dogNameSchema>;
export type CreateDogRequest = z.infer<typeof createDogRequestSchema>;
export type Dog = z.infer<typeof dogSchema>;
export type DogWithDetails = z.infer<typeof dogWithDetailsSchema>;
export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;
export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;
