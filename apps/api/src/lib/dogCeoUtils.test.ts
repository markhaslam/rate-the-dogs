import { describe, it, expect } from "vitest";
import {
  flattenBreedList,
  getBreedImagesUrl,
  validateImageUrl,
  extractBreedFromUrl,
  filterDuplicateImages,
  mergeDuplicateBreedNames,
  calculateStats,
  findInvalidUrls,
  breedToApiPath,
  apiPathToBreed,
} from "./dogCeoUtils";

describe("dogCeoUtils", () => {
  describe("flattenBreedList", () => {
    it("returns empty array for empty input", () => {
      expect(flattenBreedList({})).toEqual([]);
    });

    it("handles breeds with no sub-breeds", () => {
      const result = flattenBreedList({
        beagle: [],
        pug: [],
      });
      expect(result).toEqual(["beagle", "pug"]);
    });

    it("flattens breeds with sub-breeds", () => {
      const result = flattenBreedList({
        bulldog: ["french", "english"],
      });
      expect(result).toContain("bulldog");
      expect(result).toContain("bulldog-french");
      expect(result).toContain("bulldog-english");
      expect(result).toHaveLength(3);
    });

    it("handles mixed breeds (some with sub-breeds, some without)", () => {
      const result = flattenBreedList({
        beagle: [],
        bulldog: ["french"],
        pug: [],
      });
      expect(result).toContain("beagle");
      expect(result).toContain("bulldog");
      expect(result).toContain("bulldog-french");
      expect(result).toContain("pug");
      expect(result).toHaveLength(4);
    });

    it("normalizes breed names to lowercase", () => {
      const result = flattenBreedList({
        BEAGLE: ["LEMON"],
      });
      expect(result).toContain("beagle");
      expect(result).toContain("beagle-lemon");
    });

    it("skips empty breed names", () => {
      const result = flattenBreedList({
        "": ["sub"],
        beagle: [],
      });
      expect(result).toEqual(["beagle"]);
    });

    it("skips empty sub-breed names", () => {
      const result = flattenBreedList({
        bulldog: ["french", "", "english"],
      });
      expect(result).toContain("bulldog");
      expect(result).toContain("bulldog-french");
      expect(result).toContain("bulldog-english");
      expect(result).not.toContain("bulldog-");
      expect(result).toHaveLength(3);
    });

    it("handles many breeds like the real Dog CEO API", () => {
      // Partial real data from Dog CEO
      const realBreeds = {
        affenpinscher: [],
        african: [],
        airedale: [],
        bulldog: ["boston", "english", "french"],
        hound: [
          "afghan",
          "basset",
          "blood",
          "english",
          "ibizan",
          "plott",
          "walker",
        ],
        terrier: ["american", "australian", "border", "yorkshire"],
      };

      const result = flattenBreedList(realBreeds);

      // Should have: 6 parent breeds + 3 bulldogs + 7 hounds + 4 terriers = 20
      expect(result).toHaveLength(20);
      expect(result).toContain("bulldog-boston");
      expect(result).toContain("hound-basset");
      expect(result).toContain("terrier-yorkshire");
    });
  });

  describe("getBreedImagesUrl", () => {
    it("builds URL for simple breed", () => {
      expect(getBreedImagesUrl("beagle")).toBe(
        "https://dog.ceo/api/breed/beagle/images"
      );
    });

    it("builds URL for sub-breed", () => {
      expect(getBreedImagesUrl("bulldog-french")).toBe(
        "https://dog.ceo/api/breed/bulldog/french/images"
      );
    });

    it("normalizes to lowercase", () => {
      expect(getBreedImagesUrl("BEAGLE")).toBe(
        "https://dog.ceo/api/breed/beagle/images"
      );
      expect(getBreedImagesUrl("BULLDOG-FRENCH")).toBe(
        "https://dog.ceo/api/breed/bulldog/french/images"
      );
    });

    it("trims whitespace", () => {
      expect(getBreedImagesUrl("  beagle  ")).toBe(
        "https://dog.ceo/api/breed/beagle/images"
      );
    });

    it("allows custom base URL", () => {
      expect(getBreedImagesUrl("beagle", "http://localhost:3000")).toBe(
        "http://localhost:3000/breed/beagle/images"
      );
    });

    it("throws for empty breed", () => {
      expect(() => getBreedImagesUrl("")).toThrow(
        "Breed must be a non-empty string"
      );
    });

    it("throws for invalid sub-breed format", () => {
      expect(() => getBreedImagesUrl("bulldog-french-mini")).toThrow(
        "Invalid sub-breed format"
      );
      expect(() => getBreedImagesUrl("-french")).toThrow(
        "Invalid sub-breed format"
      );
      expect(() => getBreedImagesUrl("bulldog-")).toThrow(
        "Invalid sub-breed format"
      );
    });
  });

  describe("validateImageUrl", () => {
    it("validates correct Dog CEO URL", () => {
      const result = validateImageUrl(
        "https://images.dog.ceo/breeds/bulldog-french/image.jpg"
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("accepts various image extensions", () => {
      const extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      for (const ext of extensions) {
        const result = validateImageUrl(
          `https://images.dog.ceo/breeds/beagle/image${ext}`
        );
        expect(result.valid).toBe(true);
      }
    });

    it("rejects wrong hostname", () => {
      const result = validateImageUrl(
        "https://wrong.domain.com/breeds/beagle/image.jpg"
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Unexpected hostname: wrong.domain.com");
    });

    it("rejects HTTP (non-HTTPS)", () => {
      const result = validateImageUrl(
        "http://images.dog.ceo/breeds/beagle/image.jpg"
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Expected HTTPS, got: http:");
    });

    it("rejects invalid path structure", () => {
      const result = validateImageUrl(
        "https://images.dog.ceo/invalid/path.jpg"
      );
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.includes("Expected path to start with /breeds/")
        )
      ).toBe(true);
    });

    it("rejects invalid extension", () => {
      const result = validateImageUrl(
        "https://images.dog.ceo/breeds/beagle/image.txt"
      );
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.includes("Invalid or missing image extension")
        )
      ).toBe(true);
    });

    it("rejects invalid URL format", () => {
      const result = validateImageUrl("not-a-url");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid URL format");
    });

    it("rejects empty input", () => {
      const result = validateImageUrl("");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("URL must be a non-empty string");
    });
  });

  describe("extractBreedFromUrl", () => {
    it("extracts breed from simple breed URL", () => {
      expect(
        extractBreedFromUrl("https://images.dog.ceo/breeds/beagle/image.jpg")
      ).toBe("beagle");
    });

    it("extracts breed from sub-breed URL", () => {
      expect(
        extractBreedFromUrl(
          "https://images.dog.ceo/breeds/bulldog-french/image.jpg"
        )
      ).toBe("bulldog-french");
    });

    it("returns null for invalid URL", () => {
      expect(extractBreedFromUrl("not-a-url")).toBeNull();
    });

    it("returns null for non-Dog CEO URL", () => {
      expect(extractBreedFromUrl("https://example.com/dog.jpg")).toBeNull();
    });

    it("returns null for malformed path", () => {
      expect(extractBreedFromUrl("https://images.dog.ceo/invalid")).toBeNull();
    });
  });

  describe("filterDuplicateImages", () => {
    it("returns unchanged data when no duplicates", () => {
      const input = {
        beagle: ["https://images.dog.ceo/breeds/beagle/image1.jpg"],
        pug: ["https://images.dog.ceo/breeds/pug/image1.jpg"],
      };

      const result = filterDuplicateImages(input);

      expect(result.filtered).toEqual(input);
      expect(result.removedCount).toBe(0);
      expect(result.emptyBreeds).toHaveLength(0);
    });

    it("removes duplicate images from parent breeds", () => {
      // This simulates the Dog CEO bug where "corgi" contains "corgi-cardigan" images
      const input = {
        corgi: [
          "https://images.dog.ceo/breeds/corgi/image1.jpg", // Valid
          "https://images.dog.ceo/breeds/corgi-cardigan/image2.jpg", // Duplicate - wrong breed
        ],
        "corgi-cardigan": [
          "https://images.dog.ceo/breeds/corgi-cardigan/image2.jpg",
        ],
      };

      const result = filterDuplicateImages(input);

      expect(result.filtered.corgi).toHaveLength(1);
      expect(result.filtered.corgi[0]).toContain("/breeds/corgi/");
      expect(result.removedCount).toBe(1);
    });

    it("handles the pug/puggle case", () => {
      const input = {
        pug: [
          "https://images.dog.ceo/breeds/pug/image1.jpg",
          "https://images.dog.ceo/breeds/puggle/image2.jpg", // Wrong - puggle in pug
        ],
        puggle: ["https://images.dog.ceo/breeds/puggle/image2.jpg"],
      };

      const result = filterDuplicateImages(input);

      expect(result.filtered.pug).toHaveLength(1);
      expect(result.filtered.puggle).toHaveLength(1);
      expect(result.removedCount).toBe(1);
    });

    it("removes breeds that become empty after filtering", () => {
      const input = {
        bulldog: [
          // All images are actually sub-breed images
          "https://images.dog.ceo/breeds/bulldog-french/image1.jpg",
          "https://images.dog.ceo/breeds/bulldog-english/image2.jpg",
        ],
        "bulldog-french": [
          "https://images.dog.ceo/breeds/bulldog-french/image1.jpg",
        ],
      };

      const result = filterDuplicateImages(input);

      expect(result.filtered.bulldog).toBeUndefined();
      expect(result.emptyBreeds).toContain("bulldog");
    });

    it("handles non-array values gracefully", () => {
      const input = {
        beagle: ["https://images.dog.ceo/breeds/beagle/image1.jpg"],
        broken: null as unknown as string[],
      };

      const result = filterDuplicateImages(input);

      expect(result.filtered.beagle).toHaveLength(1);
      expect(result.filtered.broken).toBeUndefined();
      expect(result.emptyBreeds).toContain("broken");
    });
  });

  describe("mergeDuplicateBreedNames", () => {
    // Simple name resolver for testing - just capitalizes the key
    const simpleResolver = (key: string) => key.toUpperCase();

    // Resolver that maps multiple keys to same name (simulating Boston Terrier case)
    const bostonResolver = (key: string): string => {
      if (key === "bulldog-boston" || key === "terrier-boston") {
        return "Boston Terrier";
      }
      return key;
    };

    it("returns unchanged data when no duplicate names", () => {
      const input = {
        beagle: ["img1.jpg", "img2.jpg"],
        pug: ["img3.jpg"],
      };

      const result = mergeDuplicateBreedNames(input, simpleResolver);

      expect(result.merged).toEqual(input);
      expect(result.mergedBreeds).toHaveLength(0);
    });

    it("merges breeds with same display name", () => {
      const input = {
        "bulldog-boston": ["img1.jpg", "img2.jpg", "img3.jpg"],
        "terrier-boston": ["img4.jpg", "img5.jpg"],
      };

      const result = mergeDuplicateBreedNames(input, bostonResolver);

      // Should merge under the breed with more images (bulldog-boston)
      expect(Object.keys(result.merged)).toHaveLength(1);
      expect(result.merged["bulldog-boston"]).toBeDefined();
      expect(result.merged["terrier-boston"]).toBeUndefined();
      expect(result.merged["bulldog-boston"]).toHaveLength(5);
      expect(result.mergedBreeds).toHaveLength(1);
      expect(result.mergedBreeds[0].canonical).toBe("bulldog-boston");
      expect(result.mergedBreeds[0].merged).toContain("terrier-boston");
    });

    it("uses breed with most images as canonical", () => {
      const input = {
        "terrier-boston": ["img1.jpg", "img2.jpg", "img3.jpg", "img4.jpg"],
        "bulldog-boston": ["img5.jpg", "img6.jpg"],
      };

      const result = mergeDuplicateBreedNames(input, bostonResolver);

      // terrier-boston has more images, so it should be canonical
      expect(result.merged["terrier-boston"]).toBeDefined();
      expect(result.merged["bulldog-boston"]).toBeUndefined();
      expect(result.mergedBreeds[0].canonical).toBe("terrier-boston");
    });

    it("deduplicates images when merging", () => {
      const input = {
        "bulldog-boston": ["img1.jpg", "img2.jpg", "shared.jpg"],
        "terrier-boston": ["img3.jpg", "shared.jpg"], // shared.jpg is duplicate
      };

      const result = mergeDuplicateBreedNames(input, bostonResolver);

      // Should have 4 unique images, not 5
      expect(result.merged["bulldog-boston"]).toHaveLength(4);
      expect(result.mergedBreeds[0].imageCount).toBe(4);
    });

    it("handles multiple different merge groups", () => {
      // Two pairs of breeds that each merge into one
      const resolver = (key: string): string => {
        if (key === "a1" || key === "a2") return "GroupA";
        if (key === "b1" || key === "b2") return "GroupB";
        return key;
      };

      const input = {
        a1: ["img1.jpg", "img2.jpg"],
        a2: ["img3.jpg"],
        b1: ["img4.jpg"],
        b2: ["img5.jpg", "img6.jpg"],
        other: ["img7.jpg"],
      };

      const result = mergeDuplicateBreedNames(input, resolver);

      // Should have 3 breeds: a1 (merged), b2 (merged), other
      expect(Object.keys(result.merged)).toHaveLength(3);
      expect(result.merged.a1).toBeDefined(); // a1 has more images
      expect(result.merged.b2).toBeDefined(); // b2 has more images
      expect(result.merged.other).toBeDefined();
      expect(result.mergedBreeds).toHaveLength(2);
    });

    it("handles empty breed images gracefully", () => {
      const input = {
        "bulldog-boston": [],
        "terrier-boston": ["img1.jpg"],
      };

      const result = mergeDuplicateBreedNames(input, bostonResolver);

      // terrier-boston should be canonical (has more images)
      expect(result.merged["terrier-boston"]).toHaveLength(1);
      expect(result.mergedBreeds[0].canonical).toBe("terrier-boston");
    });

    it("preserves breeds that are not duplicates", () => {
      const input = {
        beagle: ["img1.jpg"],
        "bulldog-boston": ["img2.jpg", "img3.jpg"],
        "terrier-boston": ["img4.jpg"],
        pug: ["img5.jpg"],
      };

      const result = mergeDuplicateBreedNames(input, bostonResolver);

      expect(result.merged.beagle).toEqual(["img1.jpg"]);
      expect(result.merged.pug).toEqual(["img5.jpg"]);
      expect(result.merged["bulldog-boston"]).toBeDefined();
      expect(Object.keys(result.merged)).toHaveLength(3);
    });
  });

  describe("calculateStats", () => {
    it("calculates basic statistics", () => {
      const input = {
        beagle: ["img1.jpg", "img2.jpg", "img3.jpg"],
        pug: ["img1.jpg", "img2.jpg"],
      };

      const stats = calculateStats(input);

      expect(stats.totalBreeds).toBe(2);
      expect(stats.totalImages).toBe(5);
      expect(stats.duplicatesRemoved).toBe(0);
      expect(stats.emptyBreedsRemoved).toBe(0);
    });

    it("sorts breeds by image count descending", () => {
      const input = {
        beagle: ["img1.jpg", "img2.jpg"],
        pug: ["img1.jpg", "img2.jpg", "img3.jpg"],
        husky: ["img1.jpg"],
      };

      const stats = calculateStats(input);

      expect(stats.breedStats[0].breed).toBe("pug");
      expect(stats.breedStats[0].count).toBe(3);
      expect(stats.breedStats[1].breed).toBe("beagle");
      expect(stats.breedStats[2].breed).toBe("husky");
    });

    it("includes duplicates and empty breed counts", () => {
      const stats = calculateStats({}, 100, 10);

      expect(stats.duplicatesRemoved).toBe(100);
      expect(stats.emptyBreedsRemoved).toBe(10);
    });

    it("handles empty input", () => {
      const stats = calculateStats({});

      expect(stats.totalBreeds).toBe(0);
      expect(stats.totalImages).toBe(0);
      expect(stats.breedStats).toHaveLength(0);
    });
  });

  describe("findInvalidUrls", () => {
    it("returns empty object when all URLs valid", () => {
      const input = {
        beagle: ["https://images.dog.ceo/breeds/beagle/image.jpg"],
      };

      expect(findInvalidUrls(input)).toEqual({});
    });

    it("identifies invalid URLs", () => {
      const input = {
        beagle: [
          "https://images.dog.ceo/breeds/beagle/image.jpg",
          "invalid-url",
          "http://wrong.domain/image.jpg",
        ],
      };

      const result = findInvalidUrls(input);

      expect(result.beagle).toHaveLength(2);
      expect(result.beagle).toContain("invalid-url");
      expect(result.beagle).toContain("http://wrong.domain/image.jpg");
    });

    it("groups invalid URLs by breed", () => {
      const input = {
        beagle: ["invalid1"],
        pug: ["https://images.dog.ceo/breeds/pug/image.jpg"],
        husky: ["invalid2"],
      };

      const result = findInvalidUrls(input);

      expect(Object.keys(result)).toEqual(["beagle", "husky"]);
    });
  });

  describe("breedToApiPath", () => {
    it("returns simple breed unchanged", () => {
      expect(breedToApiPath("beagle")).toBe("beagle");
    });

    it("converts hyphenated breed to path format", () => {
      expect(breedToApiPath("bulldog-french")).toBe("bulldog/french");
    });

    it("normalizes to lowercase", () => {
      expect(breedToApiPath("BULLDOG-FRENCH")).toBe("bulldog/french");
    });

    it("trims whitespace", () => {
      expect(breedToApiPath("  beagle  ")).toBe("beagle");
    });

    it("throws for empty input", () => {
      expect(() => breedToApiPath("")).toThrow();
    });
  });

  describe("apiPathToBreed", () => {
    it("returns simple breed unchanged", () => {
      expect(apiPathToBreed("beagle")).toBe("beagle");
    });

    it("converts path format to hyphenated breed", () => {
      expect(apiPathToBreed("bulldog/french")).toBe("bulldog-french");
    });

    it("normalizes to lowercase", () => {
      expect(apiPathToBreed("BULLDOG/FRENCH")).toBe("bulldog-french");
    });

    it("throws for empty input", () => {
      expect(() => apiPathToBreed("")).toThrow();
    });
  });

  describe("round-trip conversion", () => {
    it("breed -> apiPath -> breed is identity", () => {
      const breeds = [
        "beagle",
        "bulldog-french",
        "hound-afghan",
        "terrier-yorkshire",
      ];
      for (const breed of breeds) {
        expect(apiPathToBreed(breedToApiPath(breed))).toBe(breed);
      }
    });

    it("apiPath -> breed -> apiPath is identity", () => {
      const paths = ["beagle", "bulldog/french", "hound/afghan"];
      for (const path of paths) {
        expect(breedToApiPath(apiPathToBreed(path))).toBe(path);
      }
    });
  });
});
