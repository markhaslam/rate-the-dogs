/**
 * Test Database Utilities - Drizzle-based helpers for testing
 *
 * This module provides type-safe database utilities for tests using Drizzle ORM.
 * It wraps the test D1 binding with Drizzle, ensuring tests use the same
 * query patterns as production code.
 */

import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:test";
import * as schema from "../db/schema/index.js";

/**
 * Create a Drizzle client for tests using the test D1 binding
 */
export function getTestDb() {
  return drizzle(env.DB, { schema });
}

/**
 * Type for the test database client
 */
export type TestDb = ReturnType<typeof getTestDb>;

// Re-export schema for convenient access in tests
export { schema };
