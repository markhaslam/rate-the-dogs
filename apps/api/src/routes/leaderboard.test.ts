import { describe, it, expect } from "vitest";
import app from "../index.js";

const createMockEnv = (overrides = {}) => ({
  DB: {
    prepare: (sql: string) => ({
      bind: (..._params: unknown[]) => ({
        all: async () => {
          if (sql.includes("FROM dogs") && sql.includes("AVG")) {
            return {
              results: [
                {
                  id: 1,
                  name: "Max",
                  image_key: "dogs/sample-1.jpg",
                  breed_name: "Labrador",
                  breed_slug: "labrador",
                  avg_rating: 4.75,
                  rating_count: 20,
                },
                {
                  id: 2,
                  name: "Bella",
                  image_key: "dogs/sample-2.jpg",
                  breed_name: "Golden Retriever",
                  breed_slug: "golden-retriever",
                  avg_rating: 4.5,
                  rating_count: 15,
                },
              ],
            };
          }
          if (sql.includes("FROM breeds") && sql.includes("AVG")) {
            return {
              results: [
                {
                  id: 1,
                  name: "Labrador Retriever",
                  slug: "labrador-retriever",
                  avg_rating: 4.8,
                  dog_count: 5,
                  rating_count: 50,
                },
                {
                  id: 2,
                  name: "Golden Retriever",
                  slug: "golden-retriever",
                  avg_rating: 4.6,
                  dog_count: 3,
                  rating_count: 30,
                },
              ],
            };
          }
          return { results: [] };
        },
      }),
    }),
  },
  IMAGES: {},
  ADMIN_SECRET: "test-secret",
  ENVIRONMENT: "test",
  ...overrides,
});

describe("Leaderboard API", () => {
  describe("GET /api/leaderboard/dogs", () => {
    it("returns top rated dogs", async () => {
      const res = await app.request(
        "/api/leaderboard/dogs",
        {},
        createMockEnv()
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty("items");
      expect(Array.isArray(json.data.items)).toBe(true);
    });

    it("includes image_url in response", async () => {
      const res = await app.request(
        "/api/leaderboard/dogs",
        {},
        createMockEnv()
      );
      const json = await res.json();

      expect(json.data.items[0]).toHaveProperty("image_url");
      expect(json.data.items[0].image_url).toContain("images.dog.ceo");
    });

    it("returns dogs sorted by avg_rating descending", async () => {
      const res = await app.request(
        "/api/leaderboard/dogs",
        {},
        createMockEnv()
      );
      const json = await res.json();

      if (json.data.items.length >= 2) {
        expect(json.data.items[0].avg_rating).toBeGreaterThanOrEqual(
          json.data.items[1].avg_rating
        );
      }
    });

    it("respects limit parameter", async () => {
      const res = await app.request(
        "/api/leaderboard/dogs?limit=5",
        {},
        createMockEnv()
      );
      const json = await res.json();

      expect(json.data.limit).toBe(5);
    });

    it("caps limit at 100", async () => {
      const res = await app.request(
        "/api/leaderboard/dogs?limit=500",
        {},
        createMockEnv()
      );
      const json = await res.json();

      expect(json.data.limit).toBe(100);
    });

    it("respects offset parameter", async () => {
      const res = await app.request(
        "/api/leaderboard/dogs?offset=10",
        {},
        createMockEnv()
      );
      const json = await res.json();

      expect(json.data.offset).toBe(10);
    });

    it("uses default limit of 20", async () => {
      const res = await app.request(
        "/api/leaderboard/dogs",
        {},
        createMockEnv()
      );
      const json = await res.json();

      expect(json.data.limit).toBe(20);
    });

    it("uses default offset of 0", async () => {
      const res = await app.request(
        "/api/leaderboard/dogs",
        {},
        createMockEnv()
      );
      const json = await res.json();

      expect(json.data.offset).toBe(0);
    });

    it("returns empty array when no dogs have ratings", async () => {
      const emptyEnv = createMockEnv({
        DB: {
          prepare: () => ({
            bind: () => ({
              all: async () => ({ results: [] }),
            }),
          }),
        },
      });

      const res = await app.request("/api/leaderboard/dogs", {}, emptyEnv);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data.items).toEqual([]);
    });

    it("handles invalid limit gracefully", async () => {
      const res = await app.request(
        "/api/leaderboard/dogs?limit=invalid",
        {},
        createMockEnv()
      );

      // NaN from parseInt should result in default limit
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/leaderboard/breeds", () => {
    it("returns top rated breeds", async () => {
      const res = await app.request(
        "/api/leaderboard/breeds",
        {},
        createMockEnv()
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty("items");
    });

    it("includes breed statistics", async () => {
      const res = await app.request(
        "/api/leaderboard/breeds",
        {},
        createMockEnv()
      );
      const json = await res.json();

      if (json.data.items.length > 0) {
        expect(json.data.items[0]).toHaveProperty("avg_rating");
        expect(json.data.items[0]).toHaveProperty("dog_count");
        expect(json.data.items[0]).toHaveProperty("rating_count");
      }
    });

    it("returns breeds sorted by avg_rating descending", async () => {
      const res = await app.request(
        "/api/leaderboard/breeds",
        {},
        createMockEnv()
      );
      const json = await res.json();

      if (json.data.items.length >= 2) {
        expect(json.data.items[0].avg_rating).toBeGreaterThanOrEqual(
          json.data.items[1].avg_rating
        );
      }
    });

    it("respects pagination parameters", async () => {
      const res = await app.request(
        "/api/leaderboard/breeds?limit=10&offset=5",
        {},
        createMockEnv()
      );
      const json = await res.json();

      expect(json.data.limit).toBe(10);
      expect(json.data.offset).toBe(5);
    });

    it("returns empty array when no breeds have ratings", async () => {
      const emptyEnv = createMockEnv({
        DB: {
          prepare: () => ({
            bind: () => ({
              all: async () => ({ results: [] }),
            }),
          }),
        },
      });

      const res = await app.request("/api/leaderboard/breeds", {}, emptyEnv);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data.items).toEqual([]);
    });
  });
});
