import type { PaginatedData, SuccessResponse, PaginatedResponse } from "@rate-the-dogs/shared";

/**
 * Create a success response
 */
export function success<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Create a paginated response
 */
export function paginated<T>(
  items: T[],
  total: number,
  limit: number,
  offset: number
): PaginatedResponse<T> {
  return {
    success: true,
    data: {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    },
  };
}

/**
 * Create pagination data object
 */
export function createPaginatedData<T>(
  items: T[],
  total: number,
  limit: number,
  offset: number
): PaginatedData<T> {
  return {
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
  };
}
