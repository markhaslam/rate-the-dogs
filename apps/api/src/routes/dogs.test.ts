import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import app from "../index.js";
import { applyMigrations, clearTestData } from "../test/setup.js";

/**
 * Dogs API Tests
 *
 * These tests use the real D1 database provided by vitest-pool-workers/miniflare.
 * Each test starts with a fresh database state.
 */

// Apply migrations before all tests
beforeAll(async () => {
  await applyMigrations();
});

// Helper to seed test data using prepare().run()
async function seedTestData() {
  // Insert test breed
  await env.DB.prepare(
    `INSERT OR IGNORE INTO breeds (id, name, slug) VALUES (1, 'Labrador Retriever', 'labrador-retriever')`
  ).run();

  // Insert test dog
  await env.DB.prepare(
    `INSERT OR IGNORE INTO dogs (id, name, image_key, breed_id, status) VALUES (1, 'Max', 'dogs/sample-1.jpg', 1, 'approved')`
  ).run();
}

describe("Dogs API", () => {
  beforeEach(async () => {
    await clearTestData();
    await seedTestData();
  });

  describe("GET /api/dogs/next", () => {
    it("returns next unrated dog", async () => {
      const res = await app.request("/api/dogs/next", {}, env);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty("id");
      expect(json.data).toHaveProperty("image_url");
    });

    it("returns null when no dogs available", async () => {
      await env.DB.prepare(`DELETE FROM dogs`).run();

      const res = await app.request("/api/dogs/next", {}, env);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data).toBeNull();
    });

    it("sets anon_id cookie on first request", async () => {
      const res = await app.request("/api/dogs/next", {}, env);
      const cookie = res.headers.get("set-cookie");

      expect(cookie).toContain("anon_id=");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=Strict");
    });

    it("excludes already rated dogs", async () => {
      // First, rate the only dog
      const anonId = "test-anon-exclude-rated";
      await env.DB.prepare(
        `INSERT INTO ratings (dog_id, value, anon_id) VALUES (1, 4.5, ?)`
      )
        .bind(anonId)
        .run();

      // Request next dog with same anon_id
      const res = await app.request(
        "/api/dogs/next",
        {
          headers: {
            Cookie: `anon_id=${anonId}`,
          },
        },
        env
      );

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toBeNull(); // No dogs left to rate
    });

    it("excludes skipped dogs", async () => {
      // First, skip the only dog
      const anonId = "test-anon-exclude-skipped";
      await env.DB.prepare(`INSERT INTO skips (dog_id, anon_id) VALUES (1, ?)`)
        .bind(anonId)
        .run();

      // Request next dog with same anon_id
      const res = await app.request(
        "/api/dogs/next",
        {
          headers: {
            Cookie: `anon_id=${anonId}`,
          },
        },
        env
      );

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toBeNull(); // No dogs left
    });
  });

  describe("GET /api/dogs/:id", () => {
    it("returns dog by ID", async () => {
      const res = await app.request("/api/dogs/1", {}, env);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(1);
    });

    it("returns 404 for non-existent dog", async () => {
      const res = await app.request("/api/dogs/99999", {}, env);
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("handles invalid ID format gracefully", async () => {
      const res = await app.request("/api/dogs/invalid", {}, env);
      // Should return 404 since NaN won't match any dog
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/dogs/:id/rate", () => {
    it("accepts valid rating (1-5)", async () => {
      const res = await app.request(
        "/api/dogs/1/rate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: 4.5 }),
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.rated).toBe(true);
    });

    it("accepts minimum rating (0.5)", async () => {
      const res = await app.request(
        "/api/dogs/1/rate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: 0.5 }),
        },
        env
      );

      expect(res.status).toBe(200);
    });

    it("accepts maximum rating (5.0)", async () => {
      const res = await app.request(
        "/api/dogs/1/rate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: 5.0 }),
        },
        env
      );

      expect(res.status).toBe(200);
    });

    it("rejects rating below minimum", async () => {
      const res = await app.request(
        "/api/dogs/1/rate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: 0 }),
        },
        env
      );

      expect(res.status).toBe(400);
    });

    it("rejects rating above maximum", async () => {
      const res = await app.request(
        "/api/dogs/1/rate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: 6 }),
        },
        env
      );

      expect(res.status).toBe(400);
    });

    it("rejects non-0.5 increment ratings", async () => {
      const res = await app.request(
        "/api/dogs/1/rate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: 3.3 }),
        },
        env
      );

      expect(res.status).toBe(400);
    });

    it("rejects missing value", async () => {
      const res = await app.request(
        "/api/dogs/1/rate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
        env
      );

      expect(res.status).toBe(400);
    });

    it("handles duplicate rating attempt", async () => {
      const anonId = "test-anon-duplicate-rating";

      // First rating
      await app.request(
        "/api/dogs/1/rate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `anon_id=${anonId}`,
          },
          body: JSON.stringify({ value: 4 }),
        },
        env
      );

      // Second rating should fail
      const res = await app.request(
        "/api/dogs/1/rate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `anon_id=${anonId}`,
          },
          body: JSON.stringify({ value: 5 }),
        },
        env
      );

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("ALREADY_RATED");
    });
  });

  describe("POST /api/dogs/:id/skip", () => {
    it("successfully skips a dog", async () => {
      const res = await app.request(
        "/api/dogs/1/skip",
        { method: "POST" },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.skipped).toBe(true);
    });

    it("handles already skipped dog gracefully", async () => {
      const anonId = "test-anon-already-skipped";

      // First skip
      await app.request(
        "/api/dogs/1/skip",
        {
          method: "POST",
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      // Second skip should still return success
      const res = await app.request(
        "/api/dogs/1/skip",
        {
          method: "POST",
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.skipped).toBe(true);
    });
  });

  describe("POST /api/dogs", () => {
    it("creates new dog with all fields", async () => {
      const res = await app.request(
        "/api/dogs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Buddy",
            imageKey: "dogs/abc123.jpg",
            breedId: 1,
          }),
        },
        env
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty("id");
    });

    it("creates dog without name (optional)", async () => {
      const res = await app.request(
        "/api/dogs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageKey: "dogs/abc123.jpg",
            breedId: 1,
          }),
        },
        env
      );

      expect(res.status).toBe(201);
    });

    it("rejects missing imageKey", async () => {
      const res = await app.request(
        "/api/dogs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Buddy",
            breedId: 1,
          }),
        },
        env
      );

      expect(res.status).toBe(400);
    });

    it("rejects missing breedId", async () => {
      const res = await app.request(
        "/api/dogs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Buddy",
            imageKey: "dogs/abc123.jpg",
          }),
        },
        env
      );

      expect(res.status).toBe(400);
    });

    it("rejects invalid breedId (negative)", async () => {
      const res = await app.request(
        "/api/dogs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageKey: "dogs/abc123.jpg",
            breedId: -1,
          }),
        },
        env
      );

      expect(res.status).toBe(400);
    });

    it("rejects name exceeding max length", async () => {
      const res = await app.request(
        "/api/dogs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "A".repeat(51), // 51 chars, max is 50
            imageKey: "dogs/abc123.jpg",
            breedId: 1,
          }),
        },
        env
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/dogs/prefetch", () => {
    it("returns multiple dogs by default", async () => {
      // Add more dogs for prefetch testing
      await env.DB.prepare(
        `INSERT INTO dogs (id, name, image_key, breed_id, status) VALUES
          (2, 'Bella', 'dogs/sample-2.jpg', 1, 'approved'),
          (3, 'Charlie', 'dogs/sample-3.jpg', 1, 'approved'),
          (4, 'Luna', 'dogs/sample-4.jpg', 1, 'approved')`
      ).run();

      const res = await app.request("/api/dogs/prefetch", {}, env);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.items).toBeInstanceOf(Array);
      expect(json.data.items.length).toBe(4); // All 4 dogs
    });

    it("respects count parameter", async () => {
      // Add more dogs
      await env.DB.prepare(
        `INSERT INTO dogs (id, name, image_key, breed_id, status) VALUES
          (2, 'Bella', 'dogs/sample-2.jpg', 1, 'approved'),
          (3, 'Charlie', 'dogs/sample-3.jpg', 1, 'approved')`
      ).run();

      const res = await app.request("/api/dogs/prefetch?count=2", {}, env);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.items.length).toBe(2);
    });

    it("excludes specified dog IDs", async () => {
      // Add more dogs
      await env.DB.prepare(
        `INSERT INTO dogs (id, name, image_key, breed_id, status) VALUES
          (2, 'Bella', 'dogs/sample-2.jpg', 1, 'approved'),
          (3, 'Charlie', 'dogs/sample-3.jpg', 1, 'approved')`
      ).run();

      const res = await app.request("/api/dogs/prefetch?exclude=1,2", {}, env);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.items.length).toBe(1);
      expect(json.data.items[0].id).toBe(3);
    });

    it("excludes already rated dogs", async () => {
      const anonId = "test-prefetch-rated";
      await env.DB.prepare(
        `INSERT INTO ratings (dog_id, value, anon_id) VALUES (1, 4.5, ?)`
      )
        .bind(anonId)
        .run();

      const res = await app.request(
        "/api/dogs/prefetch",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      const json = await res.json();
      expect(json.data.items).toEqual([]);
    });

    it("excludes already skipped dogs", async () => {
      const anonId = "test-prefetch-skipped";
      await env.DB.prepare(`INSERT INTO skips (dog_id, anon_id) VALUES (1, ?)`)
        .bind(anonId)
        .run();

      const res = await app.request(
        "/api/dogs/prefetch",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      const json = await res.json();
      expect(json.data.items).toEqual([]);
    });

    it("returns empty array when no dogs available", async () => {
      await env.DB.prepare(`DELETE FROM dogs`).run();

      const res = await app.request("/api/dogs/prefetch", {}, env);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data.items).toEqual([]);
    });

    it("returns dogs with correct properties", async () => {
      const res = await app.request("/api/dogs/prefetch?count=1", {}, env);
      const json = await res.json();

      expect(json.data.items.length).toBe(1);
      const dog = json.data.items[0];

      expect(dog).toHaveProperty("id");
      expect(dog).toHaveProperty("name");
      expect(dog).toHaveProperty("breed_id");
      expect(dog).toHaveProperty("breed_name");
      expect(dog).toHaveProperty("breed_slug");
      expect(dog).toHaveProperty("avg_rating");
      expect(dog).toHaveProperty("rating_count");
      expect(dog).toHaveProperty("image_url");
    });

    it("rejects count below minimum", async () => {
      const res = await app.request("/api/dogs/prefetch?count=0", {}, env);
      expect(res.status).toBe(400);
    });

    it("rejects count above maximum", async () => {
      const res = await app.request("/api/dogs/prefetch?count=21", {}, env);
      expect(res.status).toBe(400);
    });

    it("handles invalid exclude parameter gracefully", async () => {
      const res = await app.request(
        "/api/dogs/prefetch?exclude=invalid,abc",
        {},
        env
      );
      // Should handle gracefully, filtering out NaN values
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/dogs/upload-url", () => {
    it("returns upload URL for valid content type", async () => {
      const res = await app.request(
        "/api/dogs/upload-url",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: "image/jpeg" }),
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty("key");
      expect(json.data).toHaveProperty("uploadUrl");
    });

    it("accepts image/png", async () => {
      const res = await app.request(
        "/api/dogs/upload-url",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: "image/png" }),
        },
        env
      );

      expect(res.status).toBe(200);
    });

    it("accepts image/webp", async () => {
      const res = await app.request(
        "/api/dogs/upload-url",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: "image/webp" }),
        },
        env
      );

      expect(res.status).toBe(200);
    });

    it("rejects invalid content type", async () => {
      const res = await app.request(
        "/api/dogs/upload-url",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: "image/gif" }),
        },
        env
      );

      expect(res.status).toBe(400);
    });

    it("rejects non-image content type", async () => {
      const res = await app.request(
        "/api/dogs/upload-url",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: "application/pdf" }),
        },
        env
      );

      expect(res.status).toBe(400);
    });
  });
});
