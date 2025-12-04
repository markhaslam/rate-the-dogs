import { describe, it, expect } from "vitest";
import { generateImageKey, getImageUrl, getImageUrlLegacy } from "./r2.js";
import type { DogImageData } from "./r2.js";

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
    describe("Dog CEO images", () => {
      it("returns direct URL for Dog CEO images", () => {
        const dog: DogImageData = {
          imageUrl: "https://images.dog.ceo/breeds/beagle/image1.jpg",
          imageKey: null,
          imageSource: "dog_ceo",
        };
        const url = getImageUrl(dog);
        expect(url).toBe("https://images.dog.ceo/breeds/beagle/image1.jpg");
      });

      it("returns direct URL regardless of imageKey if source is dog_ceo", () => {
        const dog: DogImageData = {
          imageUrl: "https://images.dog.ceo/breeds/husky/image2.jpg",
          imageKey: "dogs/some-key.jpg", // This should be ignored for dog_ceo
          imageSource: "dog_ceo",
        };
        const url = getImageUrl(dog);
        expect(url).toBe("https://images.dog.ceo/breeds/husky/image2.jpg");
      });

      it("handles various Dog CEO URL formats", () => {
        const urls = [
          "https://images.dog.ceo/breeds/retriever-golden/image.jpg",
          "https://images.dog.ceo/breeds/bulldog-french/n02108915_10204.jpg",
          "https://images.dog.ceo/breeds/terrier-yorkshire/test.png",
        ];

        for (const imageUrl of urls) {
          const dog: DogImageData = {
            imageUrl,
            imageKey: null,
            imageSource: "dog_ceo",
          };
          expect(getImageUrl(dog)).toBe(imageUrl);
        }
      });
    });

    describe("User uploads", () => {
      it("returns R2 URL with base when provided", () => {
        const dog: DogImageData = {
          imageUrl: null,
          imageKey: "dogs/abc123.jpg",
          imageSource: "user_upload",
        };
        const url = getImageUrl(dog, "https://r2.example.com");
        expect(url).toBe("https://r2.example.com/dogs/abc123.jpg");
      });

      it("returns API proxy URL when no R2 base provided", () => {
        const dog: DogImageData = {
          imageUrl: null,
          imageKey: "dogs/def456.png",
          imageSource: "user_upload",
        };
        const url = getImageUrl(dog);
        expect(url).toBe("/api/images/dogs/def456.png");
      });

      it("handles keys with different paths", () => {
        const dog: DogImageData = {
          imageUrl: null,
          imageKey: "uploads/2024/01/image.webp",
          imageSource: "user_upload",
        };
        const url = getImageUrl(dog, "https://cdn.example.com");
        expect(url).toBe("https://cdn.example.com/uploads/2024/01/image.webp");
      });
    });

    describe("Fallback behavior", () => {
      it("uses imageUrl if source is unknown but URL exists", () => {
        const dog: DogImageData = {
          imageUrl: "https://example.com/some-image.jpg",
          imageKey: null,
          imageSource: null,
        };
        const url = getImageUrl(dog);
        expect(url).toBe("https://example.com/some-image.jpg");
      });

      it("uses imageKey if source is unknown but key exists", () => {
        const dog: DogImageData = {
          imageUrl: null,
          imageKey: "dogs/unknown-source.jpg",
          imageSource: null,
        };
        const url = getImageUrl(dog);
        expect(url).toBe("/api/images/dogs/unknown-source.jpg");
      });

      it("uses imageKey with R2 base if source is unknown", () => {
        const dog: DogImageData = {
          imageUrl: null,
          imageKey: "dogs/fallback.jpg",
          imageSource: null,
        };
        const url = getImageUrl(dog, "https://r2.example.com");
        expect(url).toBe("https://r2.example.com/dogs/fallback.jpg");
      });

      it("returns placeholder when no image data available", () => {
        const dog: DogImageData = {
          imageUrl: null,
          imageKey: null,
          imageSource: null,
        };
        const url = getImageUrl(dog);
        expect(url).toBe("https://placedog.net/500/500?random");
      });

      it("returns placeholder when both fields are empty strings", () => {
        const dog: DogImageData = {
          imageUrl: "",
          imageKey: "",
          imageSource: "user_upload",
        };
        const url = getImageUrl(dog);
        expect(url).toBe("https://placedog.net/500/500?random");
      });
    });

    describe("Edge cases", () => {
      it("prefers Dog CEO URL over fallback even with imageKey present", () => {
        const dog: DogImageData = {
          imageUrl: "https://images.dog.ceo/breeds/pug/image.jpg",
          imageKey: "dogs/should-not-use.jpg",
          imageSource: "dog_ceo",
        };
        const url = getImageUrl(dog);
        expect(url).toBe("https://images.dog.ceo/breeds/pug/image.jpg");
      });

      it("handles user_upload with empty imageKey", () => {
        const dog: DogImageData = {
          imageUrl: null,
          imageKey: "",
          imageSource: "user_upload",
        };
        const url = getImageUrl(dog);
        // Should fallback to placeholder
        expect(url).toBe("https://placedog.net/500/500?random");
      });

      it("handles dog_ceo with empty imageUrl", () => {
        const dog: DogImageData = {
          imageUrl: "",
          imageKey: "dogs/fallback.jpg",
          imageSource: "dog_ceo",
        };
        // Should use fallback logic - imageKey
        const url = getImageUrl(dog);
        expect(url).toBe("/api/images/dogs/fallback.jpg");
      });

      it("handles special characters in R2 keys", () => {
        const dog: DogImageData = {
          imageUrl: null,
          imageKey: "dogs/image with spaces.jpg",
          imageSource: "user_upload",
        };
        const url = getImageUrl(dog, "https://r2.example.com");
        expect(url).toBe("https://r2.example.com/dogs/image with spaces.jpg");
      });
    });

    describe("Type safety", () => {
      it("accepts imageSource as string type", () => {
        const dog: DogImageData = {
          imageUrl: "https://images.dog.ceo/breeds/akita/image.jpg",
          imageKey: null,
          imageSource: "dog_ceo" as string,
        };
        const url = getImageUrl(dog);
        expect(url).toBe("https://images.dog.ceo/breeds/akita/image.jpg");
      });
    });
  });

  describe("getImageUrlLegacy", () => {
    it("returns API proxy URL for backwards compatibility", () => {
      const url = getImageUrlLegacy("dogs/old-image.jpg", "beagle");
      expect(url).toBe("/api/images/dogs/old-image.jpg");
    });

    it("ignores breed slug (deprecated behavior)", () => {
      const url1 = getImageUrlLegacy("dogs/key.jpg", "beagle");
      const url2 = getImageUrlLegacy("dogs/key.jpg", "husky");
      expect(url1).toBe(url2);
    });

    it("handles keys without breed slug", () => {
      const url = getImageUrlLegacy("dogs/key.jpg");
      expect(url).toBe("/api/images/dogs/key.jpg");
    });
  });
});
