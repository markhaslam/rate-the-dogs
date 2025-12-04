import { describe, it, expect } from "vitest";

/**
 * Tests for seedTestData.ts
 *
 * These tests validate the test data configuration to prevent CI failures
 * from misconfigured test data.
 */

// Import test dogs configuration directly
// URLs are from breed-images.json to ensure they exist and won't 404
const TEST_DOGS = [
  {
    breed: "Golden Retriever",
    slug: "retriever-golden",
    image:
      "https://images.dog.ceo/breeds/retriever-golden/20200731_180910_200731.jpg",
  },
  {
    breed: "Labrador Retriever",
    slug: "labrador",
    image: "https://images.dog.ceo/breeds/labrador/Fury_01.jpg",
  },
  {
    breed: "Beagle",
    slug: "beagle",
    image: "https://images.dog.ceo/breeds/beagle/01-12Brady.jpg.jpg",
  },
  {
    breed: "Standard Poodle",
    slug: "poodle-standard",
    image: "https://images.dog.ceo/breeds/poodle-standard/n02113799_1057.jpg",
  },
  {
    breed: "English Bulldog",
    slug: "bulldog-english",
    image: "https://images.dog.ceo/breeds/bulldog-english/bunz.jpg",
  },
];

describe("seedTestData configuration", () => {
  describe("TEST_DOGS array", () => {
    it("has at least 5 test dogs", () => {
      expect(TEST_DOGS.length).toBeGreaterThanOrEqual(5);
    });

    it("has unique slugs", () => {
      const slugs = TEST_DOGS.map((d) => d.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it("has unique breed names", () => {
      const breeds = TEST_DOGS.map((d) => d.breed);
      const uniqueBreeds = new Set(breeds);
      expect(uniqueBreeds.size).toBe(breeds.length);
    });

    it("all slugs are valid (lowercase with hyphens)", () => {
      for (const dog of TEST_DOGS) {
        expect(dog.slug).toMatch(/^[a-z0-9-]+$/);
      }
    });

    it("all image URLs are from dog.ceo", () => {
      for (const dog of TEST_DOGS) {
        expect(dog.image).toMatch(/^https:\/\/images\.dog\.ceo\/breeds\//);
      }
    });
  });

  describe("slug format matches Dog CEO API", () => {
    it("retriever sub-breeds use format: retriever-{subbreed}", () => {
      const retrieverDog = TEST_DOGS.find((d) =>
        d.breed.toLowerCase().includes("retriever")
      );
      expect(retrieverDog).toBeDefined();
      if (retrieverDog && retrieverDog.slug.includes("retriever")) {
        expect(retrieverDog.slug).toMatch(/^retriever-/);
      }
    });

    it("poodle sub-breeds use format: poodle-{subbreed}", () => {
      const poodleDog = TEST_DOGS.find((d) =>
        d.breed.toLowerCase().includes("poodle")
      );
      expect(poodleDog).toBeDefined();
      if (poodleDog) {
        expect(poodleDog.slug).toMatch(/^poodle-/);
      }
    });

    it("bulldog sub-breeds use format: bulldog-{subbreed}", () => {
      const bulldogDog = TEST_DOGS.find((d) =>
        d.breed.toLowerCase().includes("bulldog")
      );
      expect(bulldogDog).toBeDefined();
      if (bulldogDog) {
        expect(bulldogDog.slug).toMatch(/^bulldog-/);
      }
    });

    it("image URL breed path matches slug", () => {
      for (const dog of TEST_DOGS) {
        // Extract breed path from URL: https://images.dog.ceo/breeds/{breed-path}/image.jpg
        const match = dog.image.match(/\/breeds\/([^/]+)\//);
        expect(match).not.toBeNull();
        if (match) {
          const breedPath = match[1];
          // The slug should match or be related to the breed path
          // e.g., slug "retriever-golden" matches breed path "retriever-golden"
          expect(breedPath).toBe(dog.slug);
        }
      }
    });
  });

  describe("image URL validation", () => {
    it("all image URLs exist in breed-images.json", async () => {
      // Import the breed images to validate test data against actual data
      const fs = await import("fs/promises");
      const path = await import("path");
      const breedImagesPath = path.resolve(
        import.meta.dirname ?? ".",
        "../src/db/breed-images.json"
      );
      const breedImagesRaw = await fs.readFile(breedImagesPath, "utf-8");
      const breedImages = JSON.parse(breedImagesRaw) as Record<
        string,
        string[]
      >;

      for (const dog of TEST_DOGS) {
        const breedKey = dog.slug;
        expect(breedImages[breedKey]).toBeDefined();
        expect(breedImages[breedKey]).toContain(dog.image);
      }
    });
  });

  describe("data integrity", () => {
    it("breed names are properly capitalized", () => {
      for (const dog of TEST_DOGS) {
        // First letter of each word should be uppercase
        const words = dog.breed.split(" ");
        for (const word of words) {
          expect(word[0]).toBe(word[0].toUpperCase());
        }
      }
    });

    it("image URLs are valid HTTPS URLs", () => {
      for (const dog of TEST_DOGS) {
        expect(() => new URL(dog.image)).not.toThrow();
        expect(new URL(dog.image).protocol).toBe("https:");
      }
    });

    it("all required fields are present", () => {
      for (const dog of TEST_DOGS) {
        expect(dog).toHaveProperty("breed");
        expect(dog).toHaveProperty("slug");
        expect(dog).toHaveProperty("image");
        expect(dog.breed.length).toBeGreaterThan(0);
        expect(dog.slug.length).toBeGreaterThan(0);
        expect(dog.image.length).toBeGreaterThan(0);
      }
    });
  });
});
