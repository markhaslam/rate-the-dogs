import { z } from "zod";
import { PAGINATION } from "../constants.js";

/**
 * Pagination query parameters
 */
export const paginationQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
  offset: z.coerce.number().int().nonnegative().default(0),
});

/**
 * Search query parameter
 */
export const searchQuerySchema = z.object({
  search: z.string().max(100).optional(),
});

/**
 * Combined pagination + search
 */
export const paginatedSearchQuerySchema =
  paginationQuerySchema.merge(searchQuerySchema);

/**
 * Standard success response wrapper
 */
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

/**
 * Standard error response
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

/**
 * Paginated data wrapper
 */
export const paginatedDataSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    hasMore: z.boolean(),
  });

/**
 * Paginated success response
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    success: z.literal(true),
    data: paginatedDataSchema(itemSchema),
  });

/**
 * ID parameter (for route params)
 */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Slug parameter (for route params)
 */
export const slugParamSchema = z.object({
  slug: z.string().min(1).max(100),
});

/**
 * Anonymous ID parameter (for admin ban route)
 */
export const anonIdParamSchema = z.object({
  anonId: z.string().uuid(),
});

// Type exports
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type PaginatedSearchQuery = z.infer<typeof paginatedSearchQuerySchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type SlugParam = z.infer<typeof slugParamSchema>;
export type AnonIdParam = z.infer<typeof anonIdParamSchema>;

// Generic types
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  success: true;
  data: PaginatedData<T>;
}
