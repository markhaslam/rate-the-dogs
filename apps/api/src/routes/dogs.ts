import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, notInArray, sql } from "drizzle-orm";
import type { Env, Variables } from "../lib/env.js";
import { success } from "../lib/response.js";
import { generateImageKey, getImageUrl } from "../lib/r2.js";
import {
  dogs as dogsTable,
  breeds as breedsTable,
  ratings as ratingsTable,
  skips as skipsTable,
} from "../db/schema/index.js";
import {
  rateRequestSchema,
  createDogRequestSchema,
  uploadUrlRequestSchema,
} from "../db/zodSchemas.js";

const dogs = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /api/dogs/next - Get next unrated dog
 * Returns a random approved dog that the user hasn't rated or skipped
 */
dogs.get("/next", async (c) => {
  const db = c.get("db");
  const anonId = c.get("anonId");

  // Subquery for dogs already rated by this user
  const ratedDogIds = db
    .select({ dogId: ratingsTable.dogId })
    .from(ratingsTable)
    .where(eq(ratingsTable.anonId, anonId));

  // Subquery for dogs already skipped by this user
  const skippedDogIds = db
    .select({ dogId: skipsTable.dogId })
    .from(skipsTable)
    .where(eq(skipsTable.anonId, anonId));

  // Main query - get random unrated/unskipped approved dog
  const result = await db
    .select({
      id: dogsTable.id,
      name: dogsTable.name,
      image_key: dogsTable.imageKey,
      breed_id: dogsTable.breedId,
      breed_name: breedsTable.name,
      breed_slug: breedsTable.slug,
      avg_rating: sql<
        number | null
      >`(SELECT AVG(value) FROM ratings WHERE dog_id = ${dogsTable.id})`,
      rating_count: sql<number>`(SELECT COUNT(*) FROM ratings WHERE dog_id = ${dogsTable.id})`,
    })
    .from(dogsTable)
    .innerJoin(breedsTable, eq(dogsTable.breedId, breedsTable.id))
    .where(
      and(
        eq(dogsTable.status, "approved"),
        notInArray(dogsTable.id, ratedDogIds),
        notInArray(dogsTable.id, skippedDogIds)
      )
    )
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (result.length === 0) {
    return c.json(success(null));
  }

  const dog = result[0];
  return c.json(
    success({
      ...dog,
      image_url: getImageUrl(dog.image_key, dog.breed_slug),
    })
  );
});

/**
 * GET /api/dogs/:id - Get dog by ID
 */
dogs.get("/:id", async (c) => {
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  const result = await db
    .select({
      id: dogsTable.id,
      name: dogsTable.name,
      image_key: dogsTable.imageKey,
      breed_id: dogsTable.breedId,
      breed_name: breedsTable.name,
      breed_slug: breedsTable.slug,
      avg_rating: sql<
        number | null
      >`(SELECT AVG(value) FROM ratings WHERE dog_id = ${dogsTable.id})`,
      rating_count: sql<number>`(SELECT COUNT(*) FROM ratings WHERE dog_id = ${dogsTable.id})`,
    })
    .from(dogsTable)
    .innerJoin(breedsTable, eq(dogsTable.breedId, breedsTable.id))
    .where(and(eq(dogsTable.id, id), eq(dogsTable.status, "approved")))
    .limit(1);

  if (result.length === 0) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Dog not found" },
      },
      404
    );
  }

  const dog = result[0];
  return c.json(
    success({
      ...dog,
      image_url: getImageUrl(dog.image_key, dog.breed_slug),
    })
  );
});

/**
 * POST /api/dogs/:id/rate - Rate a dog
 */
dogs.post("/:id/rate", zValidator("json", rateRequestSchema), async (c) => {
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const { value } = c.req.valid("json");
  const anonId = c.get("anonId");
  const clientIP = c.get("clientIP");
  const userAgent = c.get("userAgent");

  try {
    await db.insert(ratingsTable).values({
      dogId: id,
      value,
      anonId,
      ipAddress: clientIP,
      userAgent,
    });

    return c.json(success({ rated: true }));
  } catch {
    // Likely duplicate rating (unique constraint violation)
    return c.json(
      {
        success: false,
        error: { code: "ALREADY_RATED", message: "Already rated this dog" },
      },
      400
    );
  }
});

/**
 * POST /api/dogs/:id/skip - Skip a dog
 */
dogs.post("/:id/skip", async (c) => {
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const anonId = c.get("anonId");

  try {
    await db.insert(skipsTable).values({
      dogId: id,
      anonId,
    });

    return c.json(success({ skipped: true }));
  } catch {
    // Already skipped (unique constraint violation), that's fine
    return c.json(success({ skipped: true }));
  }
});

/**
 * POST /api/dogs - Create a new dog (upload)
 */
dogs.post("/", zValidator("json", createDogRequestSchema), async (c) => {
  const db = c.get("db");
  const { name, imageKey, breedId } = c.req.valid("json");
  const anonId = c.get("anonId");

  const result = await db
    .insert(dogsTable)
    .values({
      name: name ?? null,
      imageKey,
      breedId,
      uploaderAnonId: anonId,
      status: "approved",
    })
    .returning({ id: dogsTable.id });

  return c.json(success({ id: result[0]?.id }), 201);
});

/**
 * POST /api/dogs/upload-url - Get presigned upload URL
 */
dogs.post("/upload-url", zValidator("json", uploadUrlRequestSchema), (c) => {
  const { contentType } = c.req.valid("json");
  const key = generateImageKey(contentType);

  // For MVP, we'll upload directly through our endpoint
  return c.json(success({ key, uploadUrl: `/api/upload/${key}` }));
});

/**
 * PUT /api/dogs/upload/* - Direct upload endpoint
 */
dogs.put("/upload/*", async (c) => {
  const key = c.req.path.replace("/api/dogs/upload/", "");
  const body = await c.req.arrayBuffer();

  await c.env.IMAGES.put(key, body, {
    httpMetadata: { contentType: c.req.header("content-type") ?? "image/jpeg" },
  });

  return c.json(success({ key }));
});

export default dogs;
