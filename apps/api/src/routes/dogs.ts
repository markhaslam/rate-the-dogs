import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env, Variables } from "../lib/env.js";
import { success } from "../lib/response.js";
import { generateImageKey, getImageUrl } from "../lib/r2.js";

const dogs = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /api/dogs/next - Get next unrated dog
dogs.get("/next", async (c) => {
  const anonId = c.get("anonId");

  const result = await c.env.DB.prepare(
    `
    SELECT d.id, d.name, d.image_key, d.breed_id, b.name as breed_name, b.slug as breed_slug,
           (SELECT AVG(value) FROM ratings WHERE dog_id = d.id) as avg_rating,
           (SELECT COUNT(*) FROM ratings WHERE dog_id = d.id) as rating_count
    FROM dogs d
    JOIN breeds b ON d.breed_id = b.id
    WHERE d.status = 'approved'
      AND d.id NOT IN (SELECT dog_id FROM ratings WHERE anon_id = ?)
      AND d.id NOT IN (SELECT dog_id FROM skips WHERE anon_id = ?)
    ORDER BY RANDOM()
    LIMIT 1
  `
  )
    .bind(anonId, anonId)
    .first();

  if (!result) {
    return c.json(success(null));
  }

  return c.json(
    success({
      ...result,
      image_url: getImageUrl(
        result.image_key as string,
        result.breed_slug as string
      ),
    })
  );
});

// GET /api/dogs/:id - Get dog by ID
dogs.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));

  const result = await c.env.DB.prepare(
    `
    SELECT d.id, d.name, d.image_key, d.breed_id, b.name as breed_name, b.slug as breed_slug,
           (SELECT AVG(value) FROM ratings WHERE dog_id = d.id) as avg_rating,
           (SELECT COUNT(*) FROM ratings WHERE dog_id = d.id) as rating_count
    FROM dogs d
    JOIN breeds b ON d.breed_id = b.id
    WHERE d.id = ? AND d.status = 'approved'
  `
  )
    .bind(id)
    .first();

  if (!result) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Dog not found" },
      },
      404
    );
  }

  return c.json(
    success({
      ...result,
      image_url: getImageUrl(
        result.image_key as string,
        result.breed_slug as string
      ),
    })
  );
});

// POST /api/dogs/:id/rate - Rate a dog
dogs.post(
  "/:id/rate",
  zValidator(
    "json",
    z.object({ value: z.number().min(0.5).max(5).multipleOf(0.5) })
  ),
  async (c) => {
    const id = parseInt(c.req.param("id"));
    const { value } = c.req.valid("json");
    const anonId = c.get("anonId");
    const clientIP = c.get("clientIP");
    const userAgent = c.get("userAgent");

    try {
      await c.env.DB.prepare(
        `
      INSERT INTO ratings (dog_id, value, anon_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)
    `
      )
        .bind(id, value, anonId, clientIP, userAgent)
        .run();

      return c.json(success({ rated: true }));
    } catch {
      // Likely duplicate rating
      return c.json(
        {
          success: false,
          error: { code: "ALREADY_RATED", message: "Already rated this dog" },
        },
        400
      );
    }
  }
);

// POST /api/dogs/:id/skip - Skip a dog
dogs.post("/:id/skip", async (c) => {
  const id = parseInt(c.req.param("id"));
  const anonId = c.get("anonId");

  try {
    await c.env.DB.prepare(
      `
      INSERT INTO skips (dog_id, anon_id) VALUES (?, ?)
    `
    )
      .bind(id, anonId)
      .run();

    return c.json(success({ skipped: true }));
  } catch {
    return c.json(success({ skipped: true })); // Already skipped, that's fine
  }
});

// POST /api/dogs - Create a new dog (upload)
dogs.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string().max(50).optional(),
      imageKey: z.string(),
      breedId: z.number().int().positive(),
    })
  ),
  async (c) => {
    const { name, imageKey, breedId } = c.req.valid("json");
    const anonId = c.get("anonId");

    const result = await c.env.DB.prepare(
      `
    INSERT INTO dogs (name, image_key, breed_id, uploader_anon_id, status)
    VALUES (?, ?, ?, ?, 'approved')
    RETURNING id
  `
    )
      .bind(name ?? null, imageKey, breedId, anonId)
      .first();

    return c.json(success({ id: result?.id }), 201);
  }
);

// POST /api/upload-url - Get presigned upload URL
dogs.post(
  "/upload-url",
  zValidator(
    "json",
    z.object({
      contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    })
  ),
  (c) => {
    const { contentType } = c.req.valid("json");
    const key = generateImageKey(contentType);

    // For MVP, we'll upload directly through our endpoint
    return c.json(success({ key, uploadUrl: `/api/upload/${key}` }));
  }
);

// PUT /api/upload/:key - Direct upload endpoint
dogs.put("/upload/*", async (c) => {
  const key = c.req.path.replace("/api/dogs/upload/", "");
  const body = await c.req.arrayBuffer();

  await c.env.IMAGES.put(key, body, {
    httpMetadata: { contentType: c.req.header("content-type") ?? "image/jpeg" },
  });

  return c.json(success({ key }));
});

export default dogs;
