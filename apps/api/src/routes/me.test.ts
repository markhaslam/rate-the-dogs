import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import app from "../index.js";
import { applyMigrations, clearTestData } from "../test/setup.js";
import { getTestDb } from "../test/db.js";
import {
  seedBreeds,
  seedDogs,
  seedRating,
  seedRatings,
  seedSkip,
} from "../test/seedHelpers";
import * as schema from "../db/schema/index.js";

/**
 * Me API Tests
 *
 * These tests verify the /api/me/* endpoints that return user-specific data
 * including stats, top breeds, rating distribution, recent ratings, and achievements.
 */

// Apply migrations before all tests
beforeAll(async () => {
  await applyMigrations();
});

describe("me routes", () => {
  beforeEach(async () => {
    await clearTestData();
  });

  describe("GET /api/me/stats", () => {
    beforeEach(async () => {
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
      expect(json.data.ratingsCount).toBe(0);
      expect(json.data.skipsCount).toBe(0);
      expect(json.data.avgRatingGiven).toBeNull();
      expect(json.data.firstRatingAt).toBeNull();
      expect(json.data.lastRatingAt).toBeNull();
    });

    it("returns correct rating count and average", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);
      const anonId = "test-user-ratings";

      // Rate 2 dogs
      await seedRating({ dogId: dogs[0].id, anonId, value: 4.5 });
      await seedRating({ dogId: dogs[1].id, anonId, value: 3.5 });

      const res = await app.request(
        "/api/me/stats",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.ratingsCount).toBe(2);
      expect(json.data.skipsCount).toBe(0);
      expect(json.data.avgRatingGiven).toBe(4.0); // (4.5 + 3.5) / 2
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
      expect(json.data.ratingsCount).toBe(0);
      expect(json.data.skipsCount).toBe(3);
    });

    it("calculates global comparison correctly", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);

      // User A rates high (avg 4.5)
      await seedRating({ dogId: dogs[0].id, anonId: "user-a", value: 4.5 });
      await seedRating({ dogId: dogs[1].id, anonId: "user-a", value: 4.5 });

      // User B rates low (avg 2.0)
      await seedRating({ dogId: dogs[0].id, anonId: "user-b", value: 2.0 });
      await seedRating({ dogId: dogs[1].id, anonId: "user-b", value: 2.0 });

      // Global average = (4.5 + 4.5 + 2.0 + 2.0) / 4 = 3.25

      const resA = await app.request(
        "/api/me/stats",
        {
          headers: { Cookie: "anon_id=user-a" },
        },
        env
      );
      const jsonA = await resA.json();

      // User A: 4.5 - 3.25 = 1.25
      expect(jsonA.data.avgRatingGiven).toBe(4.5);
      expect(jsonA.data.globalAvgRating).toBe(3.25);
      expect(jsonA.data.ratingDiffFromGlobal).toBe(1.25);
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
      expect(jsonA.data.ratingsCount).toBe(2);

      // Check user B
      const resB = await app.request(
        "/api/me/stats",
        {
          headers: { Cookie: "anon_id=user-b" },
        },
        env
      );
      const jsonB = await resB.json();
      expect(jsonB.data.ratingsCount).toBe(1);
    });

    it("creates new anon_id if none provided", async () => {
      const res = await app.request("/api/me/stats", {}, env);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.ratingsCount).toBe(0);
      expect(json.data.skipsCount).toBe(0);

      // Should have set-cookie header
      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toContain("anon_id=");
    });
  });

  describe("GET /api/me/top-breeds", () => {
    beforeEach(async () => {
      // Seed multiple breeds
      await seedBreeds([
        { name: "Labrador", slug: "labrador" },
        { name: "Golden Retriever", slug: "golden-retriever" },
        { name: "Poodle", slug: "poodle" },
        { name: "Beagle", slug: "beagle" },
      ]);
      const db = getTestDb();
      const breeds = await db.select().from(schema.breeds);

      // Seed dogs for each breed
      await seedDogs([
        { name: "Max", breedId: breeds[0].id, status: "approved" },
        { name: "Buddy", breedId: breeds[0].id, status: "approved" },
        { name: "Luna", breedId: breeds[1].id, status: "approved" },
        { name: "Daisy", breedId: breeds[2].id, status: "approved" },
        { name: "Rocky", breedId: breeds[3].id, status: "approved" },
      ]);
    });

    it("returns empty for new user", async () => {
      const res = await app.request(
        "/api/me/top-breeds",
        {
          headers: { Cookie: "anon_id=new-user" },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.items).toHaveLength(0);
      expect(json.data.totalBreedsRated).toBe(0);
    });

    it("returns top breeds sorted by average rating", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);
      const anonId = "test-user";

      // Rate dogs with different averages per breed
      // Labrador dogs (Max, Buddy): 5.0, 4.5 -> avg 4.75
      await seedRating({ dogId: dogs[0].id, anonId, value: 5.0 });
      await seedRating({ dogId: dogs[1].id, anonId, value: 4.5 });

      // Golden (Luna): 4.0
      await seedRating({ dogId: dogs[2].id, anonId, value: 4.0 });

      // Poodle (Daisy): 3.0
      await seedRating({ dogId: dogs[3].id, anonId, value: 3.0 });

      // Beagle (Rocky): 2.5
      await seedRating({ dogId: dogs[4].id, anonId, value: 2.5 });

      const res = await app.request(
        "/api/me/top-breeds",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.items).toHaveLength(3); // Top 3 only
      expect(json.data.items[0].name).toBe("Labrador");
      expect(json.data.items[0].avgRating).toBe(4.75);
      expect(json.data.items[1].name).toBe("Golden Retriever");
      expect(json.data.items[2].name).toBe("Poodle");
      expect(json.data.totalBreedsRated).toBe(4);
    });
  });

  describe("GET /api/me/rating-distribution", () => {
    beforeEach(async () => {
      await seedBreeds([{ name: "Labrador", slug: "labrador" }]);
      const db = getTestDb();
      const [breed] = await db.select().from(schema.breeds).limit(1);
      await seedDogs(
        Array.from({ length: 15 }, (_, i) => ({
          name: `Dog ${i}`,
          breedId: breed.id,
          status: "approved" as const,
        }))
      );
    });

    it("returns empty distribution for new user", async () => {
      const res = await app.request(
        "/api/me/rating-distribution",
        {
          headers: { Cookie: "anon_id=new-user" },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.distribution).toEqual({});
      expect(json.data.modeRating).toBeNull();
      expect(json.data.totalRatings).toBe(0);
    });

    it("returns correct distribution and mode", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);
      const anonId = "test-user";

      // Create ratings with known distribution
      // 5.0: 5 times (mode)
      // 4.5: 3 times
      // 4.0: 2 times
      await seedRatings([
        { dogId: dogs[0].id, anonId, value: 5.0 },
        { dogId: dogs[1].id, anonId, value: 5.0 },
        { dogId: dogs[2].id, anonId, value: 5.0 },
        { dogId: dogs[3].id, anonId, value: 5.0 },
        { dogId: dogs[4].id, anonId, value: 5.0 },
        { dogId: dogs[5].id, anonId, value: 4.5 },
        { dogId: dogs[6].id, anonId, value: 4.5 },
        { dogId: dogs[7].id, anonId, value: 4.5 },
        { dogId: dogs[8].id, anonId, value: 4.0 },
        { dogId: dogs[9].id, anonId, value: 4.0 },
      ]);

      const res = await app.request(
        "/api/me/rating-distribution",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.distribution["5"]).toBe(5);
      expect(json.data.distribution["4.5"]).toBe(3);
      expect(json.data.distribution["4"]).toBe(2);
      expect(json.data.modeRating).toBe(5);
      expect(json.data.totalRatings).toBe(10);
    });
  });

  describe("GET /api/me/recent", () => {
    beforeEach(async () => {
      await seedBreeds([
        { name: "Labrador", slug: "labrador" },
        { name: "Golden", slug: "golden" },
      ]);
      const db = getTestDb();
      const breeds = await db.select().from(schema.breeds);
      await seedDogs([
        { name: "Max", breedId: breeds[0].id, status: "approved" },
        { name: "Luna", breedId: breeds[0].id, status: "approved" },
        { name: "Buddy", breedId: breeds[1].id, status: "approved" },
      ]);
    });

    it("returns empty for new user", async () => {
      const res = await app.request(
        "/api/me/recent",
        {
          headers: { Cookie: "anon_id=new-user" },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.items).toHaveLength(0);
    });

    it("returns recent ratings in correct order", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);
      const anonId = "test-user";

      // Seed ratings with different timestamps
      await seedRating({ dogId: dogs[0].id, anonId, value: 3.0 });
      await seedRating({ dogId: dogs[1].id, anonId, value: 4.0 });
      await seedRating({ dogId: dogs[2].id, anonId, value: 5.0 });

      const res = await app.request(
        "/api/me/recent",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.items).toHaveLength(3);
      // Most recent first (Buddy was rated last)
      expect(json.data.items[0].dogName).toBe("Buddy");
      expect(json.data.items[0].rating).toBe(5.0);
      expect(json.data.items[0].breedName).toBe("Golden");
    });

    it("respects limit parameter", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);
      const anonId = "test-user";

      await seedRating({ dogId: dogs[0].id, anonId, value: 3.0 });
      await seedRating({ dogId: dogs[1].id, anonId, value: 4.0 });
      await seedRating({ dogId: dogs[2].id, anonId, value: 5.0 });

      const res = await app.request(
        "/api/me/recent?limit=2",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.items).toHaveLength(2);
    });
  });

  describe("GET /api/me/achievements", () => {
    beforeEach(async () => {
      // Seed many breeds for breed explorer achievement
      await seedBreeds([
        { name: "Labrador", slug: "labrador" },
        { name: "Golden", slug: "golden" },
        { name: "Poodle", slug: "poodle" },
        { name: "Beagle", slug: "beagle" },
        { name: "Bulldog", slug: "bulldog" },
        { name: "Rottweiler", slug: "rottweiler" },
        { name: "Dachshund", slug: "dachshund" },
        { name: "Boxer", slug: "boxer" },
        { name: "Husky", slug: "husky" },
        { name: "Corgi", slug: "corgi" },
        { name: "Pug", slug: "pug" },
      ]);
      const db = getTestDb();
      const breeds = await db.select().from(schema.breeds);

      // Seed one dog per breed
      await seedDogs(
        breeds.map((breed, i) => ({
          name: `Dog ${i}`,
          breedId: breed.id,
          status: "approved" as const,
        }))
      );
    });

    it("returns no unlocked achievements for new user", async () => {
      const res = await app.request(
        "/api/me/achievements",
        {
          headers: { Cookie: "anon_id=new-user" },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.unlockedCount).toBe(0);
      expect(json.data.totalAchievements).toBe(7);
      expect(json.data.milestones.current).toBe(0);
    });

    it("unlocks perfect_score when rating 5.0", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);
      const anonId = "test-user";

      await seedRating({ dogId: dogs[0].id, anonId, value: 5.0 });

      const res = await app.request(
        "/api/me/achievements",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      const json = await res.json();
      const perfectScore = json.data.achievements.find(
        (a: { id: string }) => a.id === "perfect_score"
      );
      expect(perfectScore?.unlocked).toBe(true);
    });

    it("unlocks tough_crowd when rating below 2.0", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);
      const anonId = "test-user";

      await seedRating({ dogId: dogs[0].id, anonId, value: 1.5 });

      const res = await app.request(
        "/api/me/achievements",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      const json = await res.json();
      const toughCrowd = json.data.achievements.find(
        (a: { id: string }) => a.id === "tough_crowd"
      );
      expect(toughCrowd?.unlocked).toBe(true);
    });

    it("unlocks breed_explorer when rating 10+ breeds", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);
      const anonId = "test-user";

      // Rate dogs from 10 different breeds
      await seedRatings(
        dogs.slice(0, 10).map((dog) => ({
          dogId: dog.id,
          anonId,
          value: 4.0,
        }))
      );

      const res = await app.request(
        "/api/me/achievements",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      const json = await res.json();
      const breedExplorer = json.data.achievements.find(
        (a: { id: string }) => a.id === "breed_explorer"
      );
      expect(breedExplorer?.unlocked).toBe(true);
    });

    it("calculates milestone progress correctly", async () => {
      const db = getTestDb();
      const dogs = await db.select().from(schema.dogs);
      const anonId = "test-user";

      // Rate 5 dogs (between 1 and 10 milestone)
      await seedRatings(
        dogs.slice(0, 5).map((dog) => ({
          dogId: dog.id,
          anonId,
          value: 4.0,
        }))
      );

      const res = await app.request(
        "/api/me/achievements",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      const json = await res.json();
      expect(json.data.milestones.current).toBe(5);
      expect(json.data.milestones.nextMilestone).toBe(10);
      expect(json.data.milestones.progressPercent).toBe(44); // (5-1)/(10-1) rounded
      expect(json.data.milestones.completedMilestones).toContain(1);
    });

    it("unlocks all_star_rater when 20+ ratings are 4.0+", async () => {
      // Seed more dogs in batches to avoid D1's SQL variable limit
      const db = getTestDb();
      const breeds = await db.select().from(schema.breeds);

      // Seed dogs in smaller batches (10 at a time)
      for (let batch = 0; batch < 2; batch++) {
        await seedDogs(
          Array.from({ length: 10 }, (_, i) => ({
            name: `Extra Dog ${batch * 10 + i}`,
            breedId: breeds[batch % breeds.length].id,
            status: "approved" as const,
          }))
        );
      }

      const allDogs = await db.select().from(schema.dogs);
      const anonId = "test-user";

      // Rate 20 dogs with 4.0+ in batches
      for (let batch = 0; batch < 2; batch++) {
        await seedRatings(
          allDogs.slice(batch * 10, (batch + 1) * 10).map((dog) => ({
            dogId: dog.id,
            anonId,
            value: 4.5,
          }))
        );
      }

      const res = await app.request(
        "/api/me/achievements",
        {
          headers: { Cookie: `anon_id=${anonId}` },
        },
        env
      );

      const json = await res.json();
      const allStar = json.data.achievements.find(
        (a: { id: string }) => a.id === "all_star_rater"
      );
      expect(allStar?.unlocked).toBe(true);
    });
  });
});
