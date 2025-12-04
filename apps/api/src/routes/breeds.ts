import { Hono } from "hono";
import { eq, like, asc } from "drizzle-orm";
import type { Env, Variables } from "../lib/env.js";
import { success } from "../lib/response.js";
import { breeds as breedsTable } from "../db/schema/index.js";

const breeds = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /api/breeds - List all breeds
 * Optional query param: search (case-insensitive name search)
 */
breeds.get("/", async (c) => {
  const db = c.get("db");
  const search = c.req.query("search")?.toLowerCase();

  let result;

  if (search) {
    // Case-insensitive search using LIKE
    result = await db
      .select({
        id: breedsTable.id,
        name: breedsTable.name,
        slug: breedsTable.slug,
      })
      .from(breedsTable)
      .where(like(breedsTable.name, `%${search}%`))
      .orderBy(asc(breedsTable.name));
  } else {
    result = await db
      .select({
        id: breedsTable.id,
        name: breedsTable.name,
        slug: breedsTable.slug,
      })
      .from(breedsTable)
      .orderBy(asc(breedsTable.name));
  }

  return c.json(success(result));
});

/**
 * GET /api/breeds/:slug - Get breed by slug
 */
breeds.get("/:slug", async (c) => {
  const db = c.get("db");
  const slug = c.req.param("slug");

  const result = await db
    .select({
      id: breedsTable.id,
      name: breedsTable.name,
      slug: breedsTable.slug,
    })
    .from(breedsTable)
    .where(eq(breedsTable.slug, slug))
    .limit(1);

  if (result.length === 0) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Breed not found" },
      },
      404
    );
  }

  return c.json(success(result[0]));
});

export default breeds;
