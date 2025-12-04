import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import type { Database } from "../db/drizzle.js";

/**
 * Environment bindings for Cloudflare Workers
 */
export interface Env {
  // D1 Database
  DB: D1Database;

  // R2 Bucket for images
  IMAGES: R2Bucket;

  // Secrets
  ADMIN_SECRET: string;

  // Variables
  ENVIRONMENT: "development" | "production" | "test";
}

/**
 * Context variables set by middleware
 */
export interface Variables {
  // Drizzle database client
  db: Database;

  // Anonymous user ID from cookie
  anonId: string;

  // Raw client IP for analytics
  clientIP: string;

  // User agent string for analytics
  userAgent: string | null;

  // User ID if logged in (Phase 2)
  userId?: number;
}
