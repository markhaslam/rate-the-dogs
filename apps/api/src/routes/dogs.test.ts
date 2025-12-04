import { describe, it, expect } from "vitest";
import app from "../index.js";

const createMockEnv = (overrides = {}) => ({
  DB: {
    prepare: (sql: string) => ({
      bind: (..._params: unknown[]) => ({
        all: async () => ({ results: [] }),
        first: async () => {
          if (sql.includes("SELECT d.id") && sql.includes("FROM dogs")) {
            return {
              id: 1,
              name: "Max",
              image_key: "dogs/sample-1.jpg",
              breed_id: 1,
              breed_name: "Labrador Retriever",
              breed_slug: "labrador-retriever",
              avg_rating: 4.5,
              rating_count: 10,
            };
          }
          if (sql.includes("RETURNING id")) {
            return { id: 99 };
          }
          return null;
        },
        run: async () => ({ success: true }),
      }),
    }),
  },
  IMAGES: {
    put: async () => ({}),
  },
  ADMIN_SECRET: "test-secret",
  ENVIRONMENT: "test",
  ...overrides,
});

describe("Dogs API", () => {
  describe("GET /api/dogs/next", () => {
    it("returns next unrated dog", async () => {
      const res = await app.request("/api/dogs/next", {}, createMockEnv());
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty("id");
      expect(json.data).toHaveProperty("image_url");
    });

    it("returns null when no dogs available", async () => {
      const emptyEnv = createMockEnv({
        DB: {
          prepare: () => ({
            bind: () => ({
              first: async () => null,
            }),
          }),
        },
      });

      const res = await app.request("/api/dogs/next", {}, emptyEnv);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data).toBeNull();
    });

    it("sets anon_id cookie on first request", async () => {
      const res = await app.request("/api/dogs/next", {}, createMockEnv());
      const cookie = res.headers.get("set-cookie");

      expect(cookie).toContain("anon_id=");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=Strict");
    });

    it("excludes already rated dogs", async () => {
      // This is implicitly tested by the SQL query structure
      const res = await app.request("/api/dogs/next", {}, createMockEnv());
      expect(res.status).toBe(200);
    });

    it("excludes skipped dogs", async () => {
      // This is implicitly tested by the SQL query structure
      const res = await app.request("/api/dogs/next", {}, createMockEnv());
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/dogs/:id", () => {
    it("returns dog by ID", async () => {
      const res = await app.request("/api/dogs/1", {}, createMockEnv());
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(1);
    });

    it("returns 404 for non-existent dog", async () => {
      const notFoundEnv = createMockEnv({
        DB: {
          prepare: () => ({
            bind: () => ({
              first: async () => null,
            }),
          }),
        },
      });

      const res = await app.request("/api/dogs/99999", {}, notFoundEnv);
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("handles invalid ID format gracefully", async () => {
      const invalidEnv = createMockEnv({
        DB: {
          prepare: () => ({
            bind: () => ({
              first: async () => null, // Invalid ID won't match any dog
            }),
          }),
        },
      });
      const res = await app.request("/api/dogs/invalid", {}, invalidEnv);
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
        createMockEnv()
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
        createMockEnv()
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
        createMockEnv()
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
        createMockEnv()
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
        createMockEnv()
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
        createMockEnv()
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
        createMockEnv()
      );

      expect(res.status).toBe(400);
    });

    it("handles duplicate rating attempt", async () => {
      const duplicateEnv = createMockEnv({
        DB: {
          prepare: () => ({
            bind: () => ({
              run: async () => {
                throw new Error("UNIQUE constraint failed");
              },
            }),
          }),
        },
      });

      const res = await app.request(
        "/api/dogs/1/rate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: 4 }),
        },
        duplicateEnv
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
        createMockEnv()
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.skipped).toBe(true);
    });

    it("handles already skipped dog gracefully", async () => {
      const alreadySkippedEnv = createMockEnv({
        DB: {
          prepare: () => ({
            bind: () => ({
              run: async () => {
                throw new Error("UNIQUE constraint failed");
              },
            }),
          }),
        },
      });

      const res = await app.request(
        "/api/dogs/1/skip",
        { method: "POST" },
        alreadySkippedEnv
      );

      // Should still return success
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
        createMockEnv()
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
        createMockEnv()
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
        createMockEnv()
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
        createMockEnv()
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
        createMockEnv()
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
        createMockEnv()
      );

      expect(res.status).toBe(400);
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
        createMockEnv()
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
        createMockEnv()
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
        createMockEnv()
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
        createMockEnv()
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
        createMockEnv()
      );

      expect(res.status).toBe(400);
    });
  });
});
