import { Hono } from "hono";
import { count } from "drizzle-orm";
import { eq } from "drizzle-orm";
import type { Env, Variables } from "../lib/env.js";
import * as schema from "../db/schema/index.js";

const me = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /api/me/stats - Get current user's rating statistics
 * Returns the count of ratings and skips for the anonymous user
 */
me.get("/stats", async (c) => {
  const db = c.get("db");
  const anonId = c.get("anonId");

  // Get rating count for this user
  const [ratingResult] = await db
    .select({ count: count() })
    .from(schema.ratings)
    .where(eq(schema.ratings.anonId, anonId));

  // Get skip count for this user
  const [skipResult] = await db
    .select({ count: count() })
    .from(schema.skips)
    .where(eq(schema.skips.anonId, anonId));

  return c.json({
    success: true,
    data: {
      ratings_count: ratingResult?.count ?? 0,
      skips_count: skipResult?.count ?? 0,
    },
  });
});

export default me;
