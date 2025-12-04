// Re-export API types only
// Database-specific types are now inferred from apps/api/src/db/schema (powered by Drizzle)
export type {
  // API types
  PaginationQuery,
  SearchQuery,
  PaginatedSearchQuery,
  ErrorResponse,
  IdParam,
  SlugParam,
  AnonIdParam,
  SuccessResponse,
  PaginatedData,
  PaginatedResponse,
} from "../schemas/index.js";
