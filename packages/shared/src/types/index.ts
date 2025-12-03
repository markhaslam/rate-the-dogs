// Re-export types from schemas
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
  // Breed types
  BreedSlug,
  Breed,
  BreedWithStats,
  // Dog types
  ImageKey,
  DogName,
  CreateDogRequest,
  Dog,
  DogWithDetails,
  UploadUrlRequest,
  UploadUrlResponse,
  // Rating types
  RatingValue,
  RateRequest,
  Rating,
  RatingWithDog,
} from "../schemas/index.js";

// Note: DogStatus and AllowedContentType are exported from constants.ts
