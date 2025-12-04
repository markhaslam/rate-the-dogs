import { z } from "zod";

/**
 * OAuth provider enum
 */
export const oauthProviderSchema = z.enum(["google", "github", "discord"]);

/**
 * User database record
 */
export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  name: z.string().min(1).max(100).nullable(),
  avatar_url: z.string().url().nullable(),
  google_id: z.string().nullable(), // Google OAuth ID
  provider: oauthProviderSchema.nullable(), // OAuth provider used
  email_verified: z.boolean(), // Whether email is verified
  linked_anon_id: z.string().uuid().nullable(), // Anonymous ID to merge ratings
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * User profile for display (without sensitive fields)
 */
export const userProfileSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  created_at: z.string().datetime(),
  // Stats
  rating_count: z.number().int().nonnegative(),
  upload_count: z.number().int().nonnegative(),
});

/**
 * Anonymous user tracking record
 */
export const anonymousUserSchema = z.object({
  anon_id: z.string().uuid(),
  first_seen_at: z.string().datetime(),
  last_seen_at: z.string().datetime(),
  is_banned: z.boolean(),
  user_agent: z.string().nullable(),
});

// Type exports
export type OAuthProvider = z.infer<typeof oauthProviderSchema>;
export type User = z.infer<typeof userSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type AnonymousUser = z.infer<typeof anonymousUserSchema>;
