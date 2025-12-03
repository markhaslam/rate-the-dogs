import { describe, it, expect } from "vitest";
import {
  dogStatusSchema,
  imageKeySchema,
  dogNameSchema,
  createDogRequestSchema,
  uploadUrlRequestSchema,
} from "./dog.js";

describe("dogStatusSchema", () => {
  it("accepts valid statuses", () => {
    expect(dogStatusSchema.safeParse("pending").success).toBe(true);
    expect(dogStatusSchema.safeParse("approved").success).toBe(true);
    expect(dogStatusSchema.safeParse("rejected").success).toBe(true);
  });

  it("rejects invalid statuses", () => {
    expect(dogStatusSchema.safeParse("invalid").success).toBe(false);
    expect(dogStatusSchema.safeParse("").success).toBe(false);
    expect(dogStatusSchema.safeParse(123).success).toBe(false);
  });
});

describe("imageKeySchema", () => {
  it("accepts valid image keys", () => {
    const validKeys = [
      "dogs/abc123.jpg",
      "dogs/ABC-123_def.jpeg",
      "dogs/test.png",
      "dogs/image.webp",
    ];

    for (const key of validKeys) {
      const result = imageKeySchema.safeParse(key);
      expect(result.success).toBe(true);
    }
  });

  it("rejects keys without dogs/ prefix", () => {
    const result = imageKeySchema.safeParse("images/test.jpg");
    expect(result.success).toBe(false);
  });

  it("rejects keys with invalid extensions", () => {
    const result = imageKeySchema.safeParse("dogs/test.gif");
    expect(result.success).toBe(false);
  });

  it("rejects keys with invalid characters", () => {
    const result = imageKeySchema.safeParse("dogs/test file.jpg");
    expect(result.success).toBe(false);
  });
});

describe("dogNameSchema", () => {
  it("accepts valid dog names", () => {
    expect(dogNameSchema.safeParse("Buddy").success).toBe(true);
    expect(dogNameSchema.safeParse("Sir Barksalot III").success).toBe(true);
  });

  it("accepts null and undefined", () => {
    expect(dogNameSchema.safeParse(null).success).toBe(true);
    expect(dogNameSchema.safeParse(undefined).success).toBe(true);
  });

  it("trims whitespace", () => {
    const result = dogNameSchema.safeParse("  Buddy  ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("Buddy");
    }
  });

  it("rejects names over 50 characters", () => {
    const longName = "A".repeat(51);
    const result = dogNameSchema.safeParse(longName);
    expect(result.success).toBe(false);
  });
});

describe("createDogRequestSchema", () => {
  it("accepts valid create dog request", () => {
    const request = {
      name: "Buddy",
      imageKey: "dogs/abc123.jpg",
      breedId: 1,
    };

    const result = createDogRequestSchema.safeParse(request);
    expect(result.success).toBe(true);
  });

  it("accepts request without name", () => {
    const request = {
      imageKey: "dogs/abc123.jpg",
      breedId: 1,
    };

    const result = createDogRequestSchema.safeParse(request);
    expect(result.success).toBe(true);
  });

  it("accepts request with null name", () => {
    const request = {
      name: null,
      imageKey: "dogs/abc123.jpg",
      breedId: 1,
    };

    const result = createDogRequestSchema.safeParse(request);
    expect(result.success).toBe(true);
  });

  it("rejects missing imageKey", () => {
    const request = {
      name: "Buddy",
      breedId: 1,
    };

    const result = createDogRequestSchema.safeParse(request);
    expect(result.success).toBe(false);
  });

  it("rejects missing breedId", () => {
    const request = {
      name: "Buddy",
      imageKey: "dogs/abc123.jpg",
    };

    const result = createDogRequestSchema.safeParse(request);
    expect(result.success).toBe(false);
  });

  it("rejects invalid breedId", () => {
    const request = {
      imageKey: "dogs/abc123.jpg",
      breedId: 0,
    };

    const result = createDogRequestSchema.safeParse(request);
    expect(result.success).toBe(false);
  });
});

describe("uploadUrlRequestSchema", () => {
  it("accepts valid content types", () => {
    expect(
      uploadUrlRequestSchema.safeParse({ contentType: "image/jpeg" }).success
    ).toBe(true);
    expect(
      uploadUrlRequestSchema.safeParse({ contentType: "image/png" }).success
    ).toBe(true);
    expect(
      uploadUrlRequestSchema.safeParse({ contentType: "image/webp" }).success
    ).toBe(true);
  });

  it("rejects invalid content types", () => {
    expect(
      uploadUrlRequestSchema.safeParse({ contentType: "image/gif" }).success
    ).toBe(false);
    expect(
      uploadUrlRequestSchema.safeParse({ contentType: "text/plain" }).success
    ).toBe(false);
  });
});
