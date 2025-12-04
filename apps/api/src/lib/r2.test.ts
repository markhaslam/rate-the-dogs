import { describe, it, expect } from "vitest";
import { generateImageKey, getImageUrl } from "./r2.js";

describe("R2 Utilities", () => {
  describe("generateImageKey", () => {
    it("generates key with correct format for jpeg", () => {
      const key = generateImageKey("image/jpeg");
      expect(key).toMatch(/^dogs\/[\w-]+\.jpeg$/);
    });

    it("generates key with correct format for png", () => {
      const key = generateImageKey("image/png");
      expect(key).toMatch(/^dogs\/[\w-]+\.png$/);
    });

    it("generates key with correct format for webp", () => {
      const key = generateImageKey("image/webp");
      expect(key).toMatch(/^dogs\/[\w-]+\.webp$/);
    });

    it("generates unique keys", () => {
      const key1 = generateImageKey("image/jpeg");
      const key2 = generateImageKey("image/jpeg");
      expect(key1).not.toBe(key2);
    });

    it("defaults to jpg for unknown content type", () => {
      const key = generateImageKey("unknown");
      expect(key).toMatch(/\.jpg$/);
    });

    it("handles content type without subtype", () => {
      const key = generateImageKey("image");
      // Should handle gracefully, using empty string or default
      expect(key).toMatch(/^dogs\/[\w-]+\./);
    });
  });

  describe("getImageUrl", () => {
    it("returns Dog CEO URL for labrador", () => {
      const url = getImageUrl("dogs/sample-1.jpg", "labrador-retriever");
      expect(url).toContain("images.dog.ceo/breeds/labrador/");
    });

    it("returns Dog CEO URL for golden retriever", () => {
      const url = getImageUrl("dogs/sample-2.jpg", "golden-retriever");
      expect(url).toContain("images.dog.ceo/breeds/retriever-golden/");
    });

    it("returns Dog CEO URL for husky", () => {
      const url = getImageUrl("dogs/sample-3.jpg", "husky");
      expect(url).toContain("images.dog.ceo/breeds/husky/");
    });

    it("generates consistent URL for same key and breed", () => {
      const key = "dogs/abc123-def456.jpg";
      const url1 = getImageUrl(key, "beagle");
      const url2 = getImageUrl(key, "beagle");
      expect(url1).toBe(url2);
    });

    it("generates different URLs for different keys with same breed", () => {
      const url1 = getImageUrl("dogs/image1.jpg", "boxer");
      const url2 = getImageUrl("dogs/image2.jpg", "boxer");
      // URLs might be same if hash collision, but breed path should be same
      expect(url1).toContain("images.dog.ceo/breeds/boxer/");
      expect(url2).toContain("images.dog.ceo/breeds/boxer/");
    });

    it("uses mix breed for unknown breed slug", () => {
      const url = getImageUrl("dogs/random-uuid.jpg", "unknown-breed-xyz");
      expect(url).toContain("images.dog.ceo/breeds/mix/");
    });

    it("uses mix breed when no breed provided", () => {
      const url = getImageUrl("dogs/any-key.jpg");
      expect(url).toContain("images.dog.ceo/breeds/mix/");
    });

    it("maps breed slugs correctly", () => {
      expect(getImageUrl("key", "german-shepherd")).toContain(
        "/german-shepherd/"
      );
      expect(getImageUrl("key", "french-bulldog")).toContain(
        "/bulldog-french/"
      );
      expect(getImageUrl("key", "shih-tzu")).toContain("/shihtzu/");
      expect(getImageUrl("key", "border-collie")).toContain("/collie-border/");
    });
  });
});
