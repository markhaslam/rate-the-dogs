import { Hono } from "hono";
import { eq, sql, desc, avg, count, countDistinct } from "drizzle-orm";
import type { Env, Variables } from "../lib/env.js";
import { success } from "../lib/response.js";
import { getImageUrl } from "../lib/r2.js";
import {
  dogs as dogsTable,
  breeds as breedsTable,
  ratings as ratingsTable,
} from "../db/schema/index.js";

const leaderboard = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /api/leaderboard/dogs - Top rated dogs
 * Returns dogs sorted by average rating (descending)
 */
leaderboard.get("/dogs", async (c) => {
  const db = c.get("db");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20"), 100);
  const offset = parseInt(c.req.query("offset") ?? "0");

  const result = await db
    .select({
      id: dogsTable.id,
      name: dogsTable.name,
      image_key: dogsTable.imageKey,
      image_url: dogsTable.imageUrl,
      image_source: dogsTable.imageSource,
      breed_name: breedsTable.name,
      breed_slug: breedsTable.slug,
      avg_rating: avg(ratingsTable.value),
      rating_count: count(ratingsTable.id),
    })
    .from(dogsTable)
    .innerJoin(breedsTable, eq(dogsTable.breedId, breedsTable.id))
    .innerJoin(ratingsTable, eq(dogsTable.id, ratingsTable.dogId))
    .where(eq(dogsTable.status, "approved"))
    .groupBy(dogsTable.id)
    .having(sql`COUNT(${ratingsTable.id}) >= 1`)
    .orderBy(desc(avg(ratingsTable.value)), desc(count(ratingsTable.id)))
    .limit(limit)
    .offset(offset);

  const dogs = result.map((dog, index) => ({
    id: dog.id,
    name: dog.name,
    breed_name: dog.breed_name,
    breed_slug: dog.breed_slug,
    avg_rating: dog.avg_rating ? parseFloat(String(dog.avg_rating)) : null,
    rating_count: dog.rating_count,
    image_url: getImageUrl({
      imageUrl: dog.image_url,
      imageKey: dog.image_key,
      imageSource: dog.image_source,
    }),
    rank: offset + index + 1,
  }));

  return c.json(success({ items: dogs, limit, offset }));
});

/**
 * GET /api/leaderboard/breeds - Top rated breeds
 * Returns breeds sorted by average rating (descending)
 */
leaderboard.get("/breeds", async (c) => {
  const db = c.get("db");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20"), 100);
  const offset = parseInt(c.req.query("offset") ?? "0");

  const result = await db
    .select({
      id: breedsTable.id,
      name: breedsTable.name,
      slug: breedsTable.slug,
      avg_rating: avg(ratingsTable.value),
      dog_count: countDistinct(dogsTable.id),
      rating_count: count(ratingsTable.id),
    })
    .from(breedsTable)
    .innerJoin(
      dogsTable,
      sql`${breedsTable.id} = ${dogsTable.breedId} AND ${dogsTable.status} = 'approved'`
    )
    .innerJoin(ratingsTable, eq(dogsTable.id, ratingsTable.dogId))
    .groupBy(breedsTable.id)
    .having(sql`COUNT(${ratingsTable.id}) >= 1`)
    .orderBy(desc(avg(ratingsTable.value)), desc(count(ratingsTable.id)))
    .limit(limit)
    .offset(offset);

  const breeds = result.map((breed, index) => ({
    ...breed,
    avg_rating: breed.avg_rating ? parseFloat(String(breed.avg_rating)) : null,
    rank: offset + index + 1,
  }));

  return c.json(success({ items: breeds, limit, offset }));
});

export default leaderboard;
