import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import app from "../index.js";
import { applyMigrations, clearTestData } from "../test/setup.js";
import { getTestDb } from "../test/db.js";
import {
  seedBreeds,
  seedDogs,
  seedRating,
  seedSkip,
} from "../test/seedHelpers";
import * as schema from "../db/schema/index.js";

/**
 * Me API Tests
 *
 * These tests verify the /api/me/* endpoints that return user-specific data
 * like rating counts and skip counts for anonymous users.
 */

// Apply migrations before all tests
beforeAll(async () => {
  await applyMigrations();
});

describe("me routes", () => {
  beforeEach(async () => {
    await clearTestData();

    // Seed base data
    await seedBreeds([{ name: "Labrador", slug: "labrador" }]);
    const db = getTestDb();
    const [breed] = await db.select().from(schema.breeds).limit(1);
    await seedDogs([
      { name: "Max", breedId: breed.id, status: "approved" },
      { name: "Luna", breedId: breed.id, status: "approved" },
      { name: "Charlie", breedId: breed.id, status: "approved" },
    ]);
  });

  describe("GET /api/me/stats", () => {
    it("returns zero counts for new user", async () => {
      const res = await app.request(
        "/api/me/stats",
        {
          headers: { Cookie: "anon_id=new-user-123" },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.ratings_count).toBe(0);
      expect(json.data.skips_count).toBe(0);
    });

    it("returns correct rating count", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);
      const anonId = "test-user-ratings";

      // Rate 2 dogs
      await seedRating({ dogId: dogs[0].id, anonId, value: 4.5 });
      await seedRating({ dogId: dogs[1].id, anonId, value: 3.0 });

      const res = await app.request(
        "/api/me/stats",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.ratings_count).toBe(2);
      expect(json.data.skips_count).toBe(0);
    });

    it("returns correct skip count", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);
      const anonId = "test-user-skips";

      // Skip 3 dogs
      await seedSkip({ dogId: dogs[0].id, anonId });
      await seedSkip({ dogId: dogs[1].id, anonId });
      await seedSkip({ dogId: dogs[2].id, anonId });

      const res = await app.request(
        "/api/me/stats",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.ratings_count).toBe(0);
      expect(json.data.skips_count).toBe(3);
    });

    it("returns correct mixed counts", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);
      const anonId = "test-user-mixed";

      // Rate 1 dog, skip 2
      await seedRating({ dogId: dogs[0].id, anonId, value: 5.0 });
      await seedSkip({ dogId: dogs[1].id, anonId });
      await seedSkip({ dogId: dogs[2].id, anonId });

      const res = await app.request(
        "/api/me/stats",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.ratings_count).toBe(1);
      expect(json.data.skips_count).toBe(2);
    });

    it("only counts ratings for the specific user", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);

      // User A rates 2 dogs
      await seedRating({ dogId: dogs[0].id, anonId: "user-a", value: 4.0 });
      await seedRating({ dogId: dogs[1].id, anonId: "user-a", value: 4.0 });

      // User B rates 1 dog
      await seedRating({ dogId: dogs[0].id, anonId: "user-b", value: 3.0 });

      // Check user A
      const resA = await app.request(
        "/api/me/stats",
        {
          headers: { Cookie: "anon_id=user-a" },
        },
        env
      );
      const jsonA = await resA.json();
      expect(jsonA.data.ratings_count).toBe(2);

      // Check user B
      const resB = await app.request(
        "/api/me/stats",
        {
          headers: { Cookie: "anon_id=user-b" },
        },
        env
      );
      const jsonB = await resB.json();
      expect(jsonB.data.ratings_count).toBe(1);
    });

    it("creates new anon_id if none provided", async () => {
      const res = await app.request("/api/me/stats", {}, env);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.ratings_count).toBe(0);
      expect(json.data.skips_count).toBe(0);

      // Should have set-cookie header
      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toContain("anon_id=");
    });
  });
});
