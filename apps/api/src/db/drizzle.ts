import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "./schema/index.js";

/**
 * Create a Drizzle ORM client for D1
 *
 * @param d1 - The D1 database binding from Cloudflare Workers
 * @returns A typed Drizzle client with all schema relations
 *
 * @example
 * ```ts
 * const db = createDb(c.env.DB);
 * const users = await db.select().from(schema.users);
 * ```
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

/**
 * Database type for use in middleware and route handlers
 */
export type Database = ReturnType<typeof createDb>;
