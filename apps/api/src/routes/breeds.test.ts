import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import app from "../index.js";
import { applyMigrations, clearTestData } from "../test/setup.js";
import { seedBreeds, TEST_BREEDS } from "../test/seedHelpers.js";

/**
 * Breeds API Tests
 *
 * These tests use the real D1 database provided by vitest-pool-workers/miniflare.
 * Test data is seeded using Drizzle ORM helpers for type safety.
 */

// Apply migrations before all tests
beforeAll(async () => {
  await applyMigrations();
});

// Helper to seed test data using Drizzle
async function seedTestData() {
  await seedBreeds([
    TEST_BREEDS.labrador,
    TEST_BREEDS.germanShepherd,
    TEST_BREEDS.golden,
    TEST_BREEDS.shihTzu,
  ]);
}

describe("Breeds API", () => {
  beforeEach(async () => {
    await clearTestData();
    await seedTestData();
  });

  describe("GET /api/breeds", () => {
    it("returns list of all breeds", async () => {
      const res = await app.request("/api/breeds", {}, env);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBe(4);
    });

    it("returns breeds sorted alphabetically by name", async () => {
      const res = await app.request("/api/breeds", {}, env);
      const json = await res.json();

      // Should be sorted: German Shepherd, Golden Retriever, Labrador Retriever, Shih Tzu
      expect(json.data[0].name).toBe("German Shepherd");
      expect(json.data[1].name).toBe("Golden Retriever");
      expect(json.data[2].name).toBe("Labrador Retriever");
      expect(json.data[3].name).toBe("Shih Tzu");
    });

    it("filters breeds by search query", async () => {
      const res = await app.request("/api/breeds?search=labrador", {}, env);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.data[0].name).toBe("Labrador Retriever");
    });

    it("returns empty array for no matching search", async () => {
      const res = await app.request("/api/breeds?search=nonexistent", {}, env);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data).toEqual([]);
    });

    it("handles case-insensitive search", async () => {
      const res = await app.request("/api/breeds?search=LABRADOR", {}, env);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.length).toBe(1);
    });

    it("returns multiple matches for partial search", async () => {
      const res = await app.request("/api/breeds?search=retriever", {}, env);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.length).toBe(2); // Golden Retriever and Labrador Retriever
    });
  });

  describe("GET /api/breeds/:slug", () => {
    it("returns breed by slug", async () => {
      const res = await app.request("/api/breeds/labrador-retriever", {}, env);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.slug).toBe("labrador-retriever");
      expect(json.data.name).toBe("Labrador Retriever");
    });

    it("returns 404 for non-existent breed", async () => {
      const res = await app.request("/api/breeds/fake-breed", {}, env);
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("handles special characters in slug", async () => {
      const res = await app.request("/api/breeds/shih-tzu", {}, env);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.name).toBe("Shih Tzu");
    });

    it("includes all breed fields in response", async () => {
      const res = await app.request("/api/breeds/german-shepherd", {}, env);
      const json = await res.json();

      expect(json.data).toHaveProperty("id");
      expect(json.data).toHaveProperty("name");
      expect(json.data).toHaveProperty("slug");
    });
  });
});
