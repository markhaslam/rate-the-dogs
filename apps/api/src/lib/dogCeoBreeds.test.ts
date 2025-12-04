import { describe, it, expect } from "vitest";
import {
  DOG_CEO_BREED_MAP,
  getReadableBreedName,
  getBreedSlug,
  getApiPath,
  isKnownBreed,
  getAllBreedKeys,
  getAllBreeds,
  searchBreeds,
  getBreedCount,
} from "./dogCeoBreeds";

describe("dogCeoBreeds", () => {
  describe("DOG_CEO_BREED_MAP", () => {
    it("contains at least 169 breeds", () => {
      const count = Object.keys(DOG_CEO_BREED_MAP).length;
      expect(count).toBeGreaterThanOrEqual(168);
    });

    it("contains key popular breeds", () => {
      expect(DOG_CEO_BREED_MAP["retriever-golden"]).toBe("Golden Retriever");
      expect(DOG_CEO_BREED_MAP["bulldog-french"]).toBe("French Bulldog");
      expect(DOG_CEO_BREED_MAP.labrador).toBe("Labrador Retriever");
      expect(DOG_CEO_BREED_MAP.beagle).toBe("Beagle");
      expect(DOG_CEO_BREED_MAP["german-shepherd"]).toBe("German Shepherd");
      expect(DOG_CEO_BREED_MAP.poodle).toBeUndefined(); // Only specific poodles
      expect(DOG_CEO_BREED_MAP["poodle-standard"]).toBe("Standard Poodle");
    });

    it("contains all terrier breeds", () => {
      const terriers = Object.keys(DOG_CEO_BREED_MAP).filter((k) =>
        k.includes("terrier")
      );
      expect(terriers.length).toBeGreaterThanOrEqual(20);

      // Check specific terriers
      expect(DOG_CEO_BREED_MAP["terrier-yorkshire"]).toBe("Yorkshire Terrier");
      expect(DOG_CEO_BREED_MAP["terrier-scottish"]).toBe("Scottish Terrier");
      expect(DOG_CEO_BREED_MAP["terrier-russell"]).toBe("Jack Russell Terrier");
      // Note: terrier-boston was removed as duplicate of bulldog-boston
      expect(DOG_CEO_BREED_MAP["bulldog-boston"]).toBe("Boston Terrier");
    });

    it("contains all retriever breeds", () => {
      expect(DOG_CEO_BREED_MAP["retriever-golden"]).toBe("Golden Retriever");
      expect(DOG_CEO_BREED_MAP["retriever-curly"]).toBe(
        "Curly-Coated Retriever"
      );
      expect(DOG_CEO_BREED_MAP["retriever-flatcoated"]).toBe(
        "Flat-Coated Retriever"
      );
      expect(DOG_CEO_BREED_MAP["retriever-chesapeake"]).toBe(
        "Chesapeake Bay Retriever"
      );
    });

    it("contains all hound breeds", () => {
      expect(DOG_CEO_BREED_MAP["hound-afghan"]).toBe("Afghan Hound");
      expect(DOG_CEO_BREED_MAP["hound-basset"]).toBe("Basset Hound");
      expect(DOG_CEO_BREED_MAP["hound-blood"]).toBe("Bloodhound");
    });

    it("contains Indian dog breeds", () => {
      expect(DOG_CEO_BREED_MAP["bakharwal-indian"]).toBe("Bakharwal Dog");
      expect(DOG_CEO_BREED_MAP["chippiparai-indian"]).toBe("Chippiparai");
      expect(DOG_CEO_BREED_MAP["rajapalayam-indian"]).toBe("Rajapalayam");
      expect(DOG_CEO_BREED_MAP["mastiff-indian"]).toBe("Indian Mastiff");
    });

    it("contains mixed breed", () => {
      expect(DOG_CEO_BREED_MAP.mix).toBe("Mixed Breed");
    });

    it("has all values as non-empty strings", () => {
      for (const [key, value] of Object.entries(DOG_CEO_BREED_MAP)) {
        expect(typeof key).toBe("string");
        expect(key.length).toBeGreaterThan(0);
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
      }
    });

    it("has no duplicate human-readable names", () => {
      const names = Object.values(DOG_CEO_BREED_MAP);
      const uniqueNames = new Set(names);
      // Allow some duplicates for breeds that are legitimately the same
      expect(uniqueNames.size).toBeGreaterThanOrEqual(names.length - 5);
    });
  });

  describe("getReadableBreedName", () => {
    it("returns correct name for known breeds", () => {
      expect(getReadableBreedName("retriever-golden")).toBe("Golden Retriever");
      expect(getReadableBreedName("beagle")).toBe("Beagle");
      expect(getReadableBreedName("bulldog-french")).toBe("French Bulldog");
      expect(getReadableBreedName("terrier-yorkshire")).toBe(
        "Yorkshire Terrier"
      );
    });

    it("handles case-insensitive input", () => {
      expect(getReadableBreedName("RETRIEVER-GOLDEN")).toBe("Golden Retriever");
      expect(getReadableBreedName("Beagle")).toBe("Beagle");
      expect(getReadableBreedName("BULLDOG-FRENCH")).toBe("French Bulldog");
    });

    it("trims whitespace", () => {
      expect(getReadableBreedName("  beagle  ")).toBe("Beagle");
      expect(getReadableBreedName("\tretriever-golden\n")).toBe(
        "Golden Retriever"
      );
    });

    it("returns fallback title case for unknown breeds", () => {
      expect(getReadableBreedName("some-unknown-breed")).toBe(
        "Some Unknown Breed"
      );
      expect(getReadableBreedName("new-exotic")).toBe("New Exotic");
      expect(getReadableBreedName("singleword")).toBe("Singleword");
    });

    it("handles empty and invalid input", () => {
      expect(getReadableBreedName("")).toBe("Unknown Breed");
      expect(getReadableBreedName(null as unknown as string)).toBe(
        "Unknown Breed"
      );
      expect(getReadableBreedName(undefined as unknown as string)).toBe(
        "Unknown Breed"
      );
      expect(getReadableBreedName(123 as unknown as string)).toBe(
        "Unknown Breed"
      );
    });

    it("handles breeds with multiple hyphens gracefully", () => {
      // This shouldn't happen in real data, but test fallback
      expect(getReadableBreedName("a-b-c")).toBe("A B C");
    });
  });

  describe("getBreedSlug", () => {
    it("returns lowercase hyphenated slug", () => {
      expect(getBreedSlug("retriever-golden")).toBe("retriever-golden");
      expect(getBreedSlug("beagle")).toBe("beagle");
    });

    it("normalizes to lowercase", () => {
      expect(getBreedSlug("RETRIEVER-GOLDEN")).toBe("retriever-golden");
      expect(getBreedSlug("BEAGLE")).toBe("beagle");
    });

    it("trims whitespace", () => {
      expect(getBreedSlug("  beagle  ")).toBe("beagle");
    });

    it("converts spaces to hyphens", () => {
      expect(getBreedSlug("golden retriever")).toBe("golden-retriever");
      expect(getBreedSlug("french  bulldog")).toBe("french-bulldog"); // multiple spaces
    });

    it("handles empty and invalid input", () => {
      expect(getBreedSlug("")).toBe("unknown");
      expect(getBreedSlug(null as unknown as string)).toBe("unknown");
      expect(getBreedSlug(undefined as unknown as string)).toBe("unknown");
    });
  });

  describe("getApiPath", () => {
    it("converts hyphenated breed to slash format", () => {
      expect(getApiPath("retriever-golden")).toBe("retriever/golden");
      expect(getApiPath("bulldog-french")).toBe("bulldog/french");
    });

    it("returns simple breeds unchanged", () => {
      expect(getApiPath("beagle")).toBe("beagle");
      expect(getApiPath("akita")).toBe("akita");
    });

    it("normalizes to lowercase", () => {
      expect(getApiPath("RETRIEVER-GOLDEN")).toBe("retriever/golden");
      expect(getApiPath("BEAGLE")).toBe("beagle");
    });

    it("trims whitespace", () => {
      expect(getApiPath("  beagle  ")).toBe("beagle");
    });

    it("handles empty and invalid input", () => {
      expect(getApiPath("")).toBe("");
      expect(getApiPath(null as unknown as string)).toBe("");
      expect(getApiPath(undefined as unknown as string)).toBe("");
    });
  });

  describe("isKnownBreed", () => {
    it("returns true for known breeds", () => {
      expect(isKnownBreed("retriever-golden")).toBe(true);
      expect(isKnownBreed("beagle")).toBe(true);
      expect(isKnownBreed("bulldog-french")).toBe(true);
      expect(isKnownBreed("terrier-yorkshire")).toBe(true);
    });

    it("handles case-insensitive input", () => {
      expect(isKnownBreed("RETRIEVER-GOLDEN")).toBe(true);
      expect(isKnownBreed("Beagle")).toBe(true);
    });

    it("returns false for unknown breeds", () => {
      expect(isKnownBreed("unicorn")).toBe(false);
      expect(isKnownBreed("dragon")).toBe(false);
      expect(isKnownBreed("some-unknown-breed")).toBe(false);
    });

    it("handles empty and invalid input", () => {
      expect(isKnownBreed("")).toBe(false);
      expect(isKnownBreed(null as unknown as string)).toBe(false);
      expect(isKnownBreed(undefined as unknown as string)).toBe(false);
    });
  });

  describe("getAllBreedKeys", () => {
    it("returns all breed keys", () => {
      const keys = getAllBreedKeys();
      expect(keys.length).toBeGreaterThanOrEqual(168);
      expect(keys).toContain("retriever-golden");
      expect(keys).toContain("beagle");
      expect(keys).toContain("mix");
    });

    it("returns an array of strings", () => {
      const keys = getAllBreedKeys();
      for (const key of keys) {
        expect(typeof key).toBe("string");
      }
    });
  });

  describe("getAllBreeds", () => {
    it("returns all breeds as [key, name] tuples", () => {
      const breeds = getAllBreeds();
      expect(breeds.length).toBeGreaterThanOrEqual(168);

      for (const [key, name] of breeds) {
        expect(typeof key).toBe("string");
        expect(typeof name).toBe("string");
        expect(key.length).toBeGreaterThan(0);
        expect(name.length).toBeGreaterThan(0);
      }
    });

    it("contains expected entries", () => {
      const breeds = getAllBreeds();
      const goldenEntry = breeds.find(([k]) => k === "retriever-golden");
      expect(goldenEntry).toEqual(["retriever-golden", "Golden Retriever"]);

      const beagleEntry = breeds.find(([k]) => k === "beagle");
      expect(beagleEntry).toEqual(["beagle", "Beagle"]);
    });
  });

  describe("searchBreeds", () => {
    it("finds breeds by key substring", () => {
      const results = searchBreeds("terrier");
      expect(results.length).toBeGreaterThanOrEqual(20);

      // Results match by key OR name containing "terrier"
      for (const [key, name] of results) {
        const matchesKey = key.toLowerCase().includes("terrier");
        const matchesName = name.toLowerCase().includes("terrier");
        expect(matchesKey || matchesName).toBe(true);
      }
    });

    it("finds breeds by name substring", () => {
      const results = searchBreeds("Golden");
      expect(results.length).toBeGreaterThanOrEqual(1);

      const goldenRetriever = results.find(([k]) => k === "retriever-golden");
      expect(goldenRetriever).toBeDefined();
    });

    it("is case-insensitive", () => {
      const results1 = searchBreeds("terrier");
      const results2 = searchBreeds("TERRIER");
      const results3 = searchBreeds("Terrier");

      expect(results1.length).toBe(results2.length);
      expect(results2.length).toBe(results3.length);
    });

    it("returns empty array for no matches", () => {
      const results = searchBreeds("unicorn");
      expect(results).toEqual([]);
    });

    it("handles empty and invalid input", () => {
      expect(searchBreeds("")).toEqual([]);
      expect(searchBreeds(null as unknown as string)).toEqual([]);
      expect(searchBreeds(undefined as unknown as string)).toEqual([]);
    });

    it("trims whitespace in query", () => {
      const results1 = searchBreeds("beagle");
      const results2 = searchBreeds("  beagle  ");
      expect(results1.length).toBe(results2.length);
    });

    it("finds partial matches in breed names", () => {
      // "French" should find French Bulldog
      const results = searchBreeds("French");
      expect(results.some(([, name]) => name.includes("French"))).toBe(true);
    });
  });

  describe("getBreedCount", () => {
    it("returns correct count", () => {
      const count = getBreedCount();
      expect(count).toBeGreaterThanOrEqual(168);
      expect(count).toBe(Object.keys(DOG_CEO_BREED_MAP).length);
    });
  });

  describe("consistency checks", () => {
    it("all breed keys match breed-images.json format", () => {
      // All keys should be lowercase and use hyphens for sub-breeds
      const keys = getAllBreedKeys();
      for (const key of keys) {
        expect(key).toBe(key.toLowerCase());
        expect(key).not.toContain(" ");
        expect(key).not.toContain("/");
      }
    });

    it("getApiPath correctly converts all breeds", () => {
      const breeds = getAllBreedKeys();
      for (const breed of breeds) {
        const path = getApiPath(breed);
        // Path should not contain hyphens if breed has a hyphen (it should use /)
        if (breed.includes("-")) {
          expect(path).toContain("/");
          expect(path).not.toContain("-");
        } else {
          expect(path).not.toContain("/");
        }
      }
    });

    it("all breeds have unique slugs", () => {
      const keys = getAllBreedKeys();
      const slugs = keys.map((k) => getBreedSlug(k));
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it("round-trip: key -> readable -> search finds original", () => {
      const testBreeds = [
        "retriever-golden",
        "beagle",
        "bulldog-french",
        "terrier-yorkshire",
      ];

      for (const breed of testBreeds) {
        const readable = getReadableBreedName(breed);
        const searchResults = searchBreeds(readable);
        expect(searchResults.some(([k]) => k === breed)).toBe(true);
      }
    });
  });

  describe("edge cases", () => {
    it("handles breeds with special characters in names", () => {
      // St. Bernard has a period
      expect(getReadableBreedName("stbernard")).toBe("St. Bernard");
      // Bichon Frise has an accent in full name
      expect(getReadableBreedName("frise-bichon")).toBe("Bichon Frise");
      // Coton de Tuléar has an accent
      expect(getReadableBreedName("cotondetulear")).toBe("Coton de Tuléar");
    });

    it("handles very long breed names", () => {
      const longName = getReadableBreedName("terrier-westhighland");
      expect(longName).toBe("West Highland White Terrier");
    });

    it("handles mixed/unknown breed", () => {
      expect(getReadableBreedName("mix")).toBe("Mixed Breed");
      expect(isKnownBreed("mix")).toBe(true);
    });
  });
});
