import { hc } from "hono/client";
import type { AppType } from "@rate-the-dogs/api";

/**
 * Type-safe API client using Hono RPC
 *
 * This client provides full type inference from the backend API,
 * including request/response types and available endpoints.
 */
export const api = hc<AppType>(import.meta.env.VITE_API_URL || "");

/**
 * Helper to extract error message from API response
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}
