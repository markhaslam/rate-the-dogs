import { Hono } from "hono";
import type { Env, Variables } from "../lib/env.js";
import { success } from "../lib/response.js";

const breeds = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /api/breeds - List all breeds
breeds.get("/", async (c) => {
  const search = c.req.query("search")?.toLowerCase();

  let query = "SELECT id, name, slug FROM breeds ORDER BY name ASC";
  const params: string[] = [];

  if (search) {
    query = "SELECT id, name, slug FROM breeds WHERE LOWER(name) LIKE ? ORDER BY name ASC";
    params.push(`%${search}%`);
  }

  const result = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(success(result.results));
});

// GET /api/breeds/:slug - Get breed by slug
breeds.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const result = await c.env.DB.prepare(
    "SELECT id, name, slug FROM breeds WHERE slug = ?"
  ).bind(slug).first();

  if (!result) {
    return c.json({ success: false, error: { code: "NOT_FOUND", message: "Breed not found" } }, 404);
  }

  return c.json(success(result));
});

export default breeds;
