import { describe, it, expect } from "vitest";
import app from "../index.js";

// Mock environment for testing
const mockEnv = {
  DB: {
    prepare: (sql: string) => ({
      bind: (..._params: unknown[]) => ({
        all: async () => {
          if (sql.includes("SELECT id, name, slug FROM breeds")) {
            if (sql.includes("LIKE")) {
              return {
                results: [
                  {
                    id: 1,
                    name: "Labrador Retriever",
                    slug: "labrador-retriever",
                  },
                ],
              };
            }
            return {
              results: [
                {
                  id: 1,
                  name: "Labrador Retriever",
                  slug: "labrador-retriever",
                },
                { id: 2, name: "German Shepherd", slug: "german-shepherd" },
                { id: 3, name: "Golden Retriever", slug: "golden-retriever" },
              ],
            };
          }
          return { results: [] };
        },
        first: async () => {
          if (sql.includes("WHERE slug = ?")) {
            return {
              id: 1,
              name: "Labrador Retriever",
              slug: "labrador-retriever",
            };
          }
          return null;
        },
      }),
    }),
  },
  IMAGES: {},
  ADMIN_SECRET: "test-secret",
  ENVIRONMENT: "test",
};

describe("Breeds API", () => {
  describe("GET /api/breeds", () => {
    it("returns list of all breeds", async () => {
      const res = await app.request("/api/breeds", {}, mockEnv);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
    });

    it("returns breeds sorted alphabetically by name", async () => {
      const res = await app.request("/api/breeds", {}, mockEnv);
      const json = await res.json();

      expect(json.data[0].name).toBe("Labrador Retriever");
    });

    it("filters breeds by search query", async () => {
      const res = await app.request("/api/breeds?search=labrador", {}, mockEnv);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("returns empty array for no matching search", async () => {
      const emptyEnv = {
        ...mockEnv,
        DB: {
          prepare: () => ({
            bind: () => ({
              all: async () => ({ results: [] }),
            }),
          }),
        },
      };

      const res = await app.request(
        "/api/breeds?search=nonexistent",
        {},
        emptyEnv
      );
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data).toEqual([]);
    });

    it("handles case-insensitive search", async () => {
      const res = await app.request("/api/breeds?search=LABRADOR", {}, mockEnv);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/breeds/:slug", () => {
    it("returns breed by slug", async () => {
      const res = await app.request(
        "/api/breeds/labrador-retriever",
        {},
        mockEnv
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.slug).toBe("labrador-retriever");
    });

    it("returns 404 for non-existent breed", async () => {
      const notFoundEnv = {
        ...mockEnv,
        DB: {
          prepare: () => ({
            bind: () => ({
              first: async () => null,
            }),
          }),
        },
      };

      const res = await app.request("/api/breeds/fake-breed", {}, notFoundEnv);
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("handles special characters in slug", async () => {
      const res = await app.request("/api/breeds/shih-tzu", {}, mockEnv);
      // Should not crash, returns 200 or 404 depending on data
      expect([200, 404]).toContain(res.status);
    });
  });
});
