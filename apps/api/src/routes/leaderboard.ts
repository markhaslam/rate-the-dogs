import { Hono } from "hono";
import type { Env, Variables } from "../lib/env.js";
import { success } from "../lib/response.js";
import { getImageUrl } from "../lib/r2.js";

const leaderboard = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /api/leaderboard/dogs - Top rated dogs
leaderboard.get("/dogs", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20"), 100);
  const offset = parseInt(c.req.query("offset") ?? "0");

  const result = await c.env.DB.prepare(
    `
    SELECT d.id, d.name, d.image_key, b.name as breed_name, b.slug as breed_slug,
           AVG(r.value) as avg_rating, COUNT(r.id) as rating_count
    FROM dogs d
    JOIN breeds b ON d.breed_id = b.id
    JOIN ratings r ON d.id = r.dog_id
    WHERE d.status = 'approved'
    GROUP BY d.id
    HAVING COUNT(r.id) >= 1
    ORDER BY avg_rating DESC, rating_count DESC
    LIMIT ? OFFSET ?
  `
  )
    .bind(limit, offset)
    .all();

  const dogs = result.results.map((dog: Record<string, unknown>) => ({
    ...dog,
    image_url: getImageUrl(dog.image_key as string, dog.breed_slug as string),
  }));

  return c.json(success({ items: dogs, limit, offset }));
});

// GET /api/leaderboard/breeds - Top rated breeds
leaderboard.get("/breeds", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20"), 100);
  const offset = parseInt(c.req.query("offset") ?? "0");

  const result = await c.env.DB.prepare(
    `
    SELECT b.id, b.name, b.slug,
           AVG(r.value) as avg_rating,
           COUNT(DISTINCT d.id) as dog_count,
           COUNT(r.id) as rating_count
    FROM breeds b
    JOIN dogs d ON b.id = d.breed_id AND d.status = 'approved'
    JOIN ratings r ON d.id = r.dog_id
    GROUP BY b.id
    HAVING COUNT(r.id) >= 1
    ORDER BY avg_rating DESC, rating_count DESC
    LIMIT ? OFFSET ?
  `
  )
    .bind(limit, offset)
    .all();

  return c.json(success({ items: result.results, limit, offset }));
});

export default leaderboard;
