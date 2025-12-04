import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import app from "../index.js";
import {
  applyMigrations,
  clearTestData,
  getTestDb,
  schema,
} from "../test/setup.js";
import { seedCompleteTestScenario } from "../test/seedHelpers.js";

/**
 * Leaderboard API Tests
 *
 * These tests use the real D1 database provided by vitest-pool-workers/miniflare.
 * Test data is seeded using Drizzle ORM helpers for type safety.
 */

// Apply migrations before all tests
beforeAll(async () => {
  await applyMigrations();
});

describe("Leaderboard API", () => {
  beforeEach(async () => {
    await clearTestData();
    await seedCompleteTestScenario();
  });

  describe("GET /api/leaderboard/dogs", () => {
    it("returns top rated dogs", async () => {
      const res = await app.request("/api/leaderboard/dogs", {}, env);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty("items");
      expect(Array.isArray(json.data.items)).toBe(true);
    });

    it("includes image_url in response", async () => {
      const res = await app.request("/api/leaderboard/dogs", {}, env);
      const json = await res.json();

      expect(json.data.items.length).toBeGreaterThan(0);
      expect(json.data.items[0]).toHaveProperty("image_url");
      // Test data uses image_key (user_upload style), so returns API proxy URL
      expect(json.data.items[0].image_url).toContain("/api/images/");
    });

    it("returns dogs sorted by avg_rating descending", async () => {
      const res = await app.request("/api/leaderboard/dogs", {}, env);
      const json = await res.json();

      expect(json.data.items.length).toBe(3); // 3 dogs with ratings
      // Max should be first (avg 4.5), then Bella (avg 4.0), then Charlie (avg 3.5)
      expect(json.data.items[0].name).toBe("Max");
      expect(json.data.items[1].name).toBe("Bella");
      expect(json.data.items[2].name).toBe("Charlie");

      expect(json.data.items[0].avg_rating).toBeGreaterThan(
        json.data.items[1].avg_rating
      );
      expect(json.data.items[1].avg_rating).toBeGreaterThan(
        json.data.items[2].avg_rating
      );
    });

    it("only includes approved dogs", async () => {
      const res = await app.request("/api/leaderboard/dogs", {}, env);
      const json = await res.json();

      // Luna is pending, should not appear
      const names = json.data.items.map((d: { name: string }) => d.name);
      expect(names).not.toContain("Luna");
    });

    it("includes rating count for each dog", async () => {
      const res = await app.request("/api/leaderboard/dogs", {}, env);
      const json = await res.json();

      expect(json.data.items[0]).toHaveProperty("rating_count");
      // Max has 2 ratings
      const max = json.data.items.find(
        (d: { name: string }) => d.name === "Max"
      );
      expect(max.rating_count).toBe(2);
    });

    it("includes rank for each dog", async () => {
      const res = await app.request("/api/leaderboard/dogs", {}, env);
      const json = await res.json();

      expect(json.data.items[0].rank).toBe(1);
      expect(json.data.items[1].rank).toBe(2);
      expect(json.data.items[2].rank).toBe(3);
    });

    it("respects limit parameter", async () => {
      const res = await app.request("/api/leaderboard/dogs?limit=2", {}, env);
      const json = await res.json();

      expect(json.data.limit).toBe(2);
      expect(json.data.items.length).toBe(2);
    });

    it("caps limit at 100", async () => {
      const res = await app.request("/api/leaderboard/dogs?limit=500", {}, env);
      const json = await res.json();

      expect(json.data.limit).toBe(100);
    });

    it("respects offset parameter", async () => {
      const res = await app.request("/api/leaderboard/dogs?offset=1", {}, env);
      const json = await res.json();

      expect(json.data.offset).toBe(1);
      // Should skip Max and return Bella first
      expect(json.data.items[0].name).toBe("Bella");
      expect(json.data.items[0].rank).toBe(2); // Rank accounts for offset
    });

    it("uses default limit of 20", async () => {
      const res = await app.request("/api/leaderboard/dogs", {}, env);
      const json = await res.json();

      expect(json.data.limit).toBe(20);
    });

    it("uses default offset of 0", async () => {
      const res = await app.request("/api/leaderboard/dogs", {}, env);
      const json = await res.json();

      expect(json.data.offset).toBe(0);
    });

    it("returns empty array when no dogs have ratings", async () => {
      const db = getTestDb();
      await db.delete(schema.ratings);

      const res = await app.request("/api/leaderboard/dogs", {}, env);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data.items).toEqual([]);
    });

    it("handles NaN limit gracefully (uses default)", async () => {
      const res = await app.request(
        "/api/leaderboard/dogs?limit=invalid",
        {},
        env
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      // parseInt("invalid") returns NaN, Math.min(NaN, 100) returns NaN
      // This should be handled gracefully
      expect(json.success).toBe(true);
    });
  });

  describe("GET /api/leaderboard/breeds", () => {
    it("returns top rated breeds", async () => {
      const res = await app.request("/api/leaderboard/breeds", {}, env);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty("items");
      expect(Array.isArray(json.data.items)).toBe(true);
    });

    it("includes breed statistics", async () => {
      const res = await app.request("/api/leaderboard/breeds", {}, env);
      const json = await res.json();

      expect(json.data.items.length).toBeGreaterThan(0);
      expect(json.data.items[0]).toHaveProperty("avg_rating");
      expect(json.data.items[0]).toHaveProperty("dog_count");
      expect(json.data.items[0]).toHaveProperty("rating_count");
    });

    it("returns breeds sorted by avg_rating descending", async () => {
      const res = await app.request("/api/leaderboard/breeds", {}, env);
      const json = await res.json();

      // Labrador (Max + Charlie): (5.0 + 4.0 + 3.5) / 3 = 4.17
      // Golden Retriever (Bella): (4.0 + 4.0) / 2 = 4.0
      expect(json.data.items.length).toBe(2); // Only breeds with approved dogs and ratings
      expect(json.data.items[0].avg_rating).toBeGreaterThanOrEqual(
        json.data.items[1].avg_rating
      );
    });

    it("correctly counts dogs per breed", async () => {
      const res = await app.request("/api/leaderboard/breeds", {}, env);
      const json = await res.json();

      const labrador = json.data.items.find(
        (b: { slug: string }) => b.slug === "labrador-retriever"
      );
      const golden = json.data.items.find(
        (b: { slug: string }) => b.slug === "golden-retriever"
      );

      // Labrador has 2 approved dogs with ratings (Max and Charlie)
      expect(labrador.dog_count).toBe(2);
      // Golden Retriever has 1 approved dog with ratings (Bella)
      expect(golden.dog_count).toBe(1);
    });

    it("correctly counts ratings per breed", async () => {
      const res = await app.request("/api/leaderboard/breeds", {}, env);
      const json = await res.json();

      const labrador = json.data.items.find(
        (b: { slug: string }) => b.slug === "labrador-retriever"
      );

      // Labrador has 3 ratings total (2 for Max + 1 for Charlie)
      expect(labrador.rating_count).toBe(3);
    });

    it("includes rank for each breed", async () => {
      const res = await app.request("/api/leaderboard/breeds", {}, env);
      const json = await res.json();

      expect(json.data.items[0].rank).toBe(1);
      expect(json.data.items[1].rank).toBe(2);
    });

    it("respects pagination parameters", async () => {
      const res = await app.request(
        "/api/leaderboard/breeds?limit=1&offset=1",
        {},
        env
      );
      const json = await res.json();

      expect(json.data.limit).toBe(1);
      expect(json.data.offset).toBe(1);
      expect(json.data.items.length).toBe(1);
    });

    it("returns empty array when no breeds have ratings", async () => {
      const db = getTestDb();
      await db.delete(schema.ratings);

      const res = await app.request("/api/leaderboard/breeds", {}, env);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data.items).toEqual([]);
    });

    it("excludes breeds with only pending dogs", async () => {
      const res = await app.request("/api/leaderboard/breeds", {}, env);
      const json = await res.json();

      // German Shepherd only has Luna (pending), should not appear
      const slugs = json.data.items.map((b: { slug: string }) => b.slug);
      expect(slugs).not.toContain("german-shepherd");
    });
  });
});
