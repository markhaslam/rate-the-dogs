import { describe, it, expect } from "vitest";
import {
  dogStatusSchema,
  imageKeySchema,
  dogNameSchema,
  createDogRequestSchema,
  uploadUrlRequestSchema,
  dogSchema,
  dogWithDetailsSchema,
} from "./dog.js";
import { imageSourceSchema } from "./breed.js";

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

describe("imageSourceSchema", () => {
  it("accepts dog_ceo source", () => {
    expect(imageSourceSchema.safeParse("dog_ceo").success).toBe(true);
  });

  it("accepts user_upload source", () => {
    expect(imageSourceSchema.safeParse("user_upload").success).toBe(true);
  });

  it("rejects invalid sources", () => {
    expect(imageSourceSchema.safeParse("external").success).toBe(false);
    expect(imageSourceSchema.safeParse("").success).toBe(false);
    expect(imageSourceSchema.safeParse("api").success).toBe(false);
  });
});

describe("dogSchema", () => {
  it("accepts valid user_upload dog record", () => {
    const dog = {
      id: 1,
      name: "Buddy",
      image_key: "dogs/abc123.jpg",
      image_url: null,
      image_source: "user_upload",
      breed_id: 1,
      uploader_user_id: null,
      uploader_anon_id: "550e8400-e29b-41d4-a716-446655440000",
      status: "approved",
      moderated_by: "admin@example.com",
      moderated_at: "2024-01-01T00:00:00.000Z",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    const result = dogSchema.safeParse(dog);
    expect(result.success).toBe(true);
  });

  it("accepts valid dog_ceo dog record", () => {
    const dog = {
      id: 1,
      name: null,
      image_key: "",
      image_url:
        "https://images.dog.ceo/breeds/retriever-golden/n02099601_1234.jpg",
      image_source: "dog_ceo",
      breed_id: 5,
      uploader_user_id: null,
      uploader_anon_id: null,
      status: "approved",
      moderated_by: null,
      moderated_at: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    const result = dogSchema.safeParse(dog);
    expect(result.success).toBe(true);
  });

  it("rejects invalid image_source", () => {
    const dog = {
      id: 1,
      name: null,
      image_key: "dogs/test.jpg",
      image_url: null,
      image_source: "invalid",
      breed_id: 1,
      uploader_user_id: null,
      uploader_anon_id: null,
      status: "pending",
      moderated_by: null,
      moderated_at: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    const result = dogSchema.safeParse(dog);
    expect(result.success).toBe(false);
  });
});

describe("dogWithDetailsSchema", () => {
  it("accepts valid dog with details", () => {
    const dog = {
      id: 1,
      name: "Buddy",
      image_key: "dogs/abc123.jpg",
      image_url: null,
      image_source: "user_upload",
      breed_id: 1,
      uploader_user_id: null,
      uploader_anon_id: "550e8400-e29b-41d4-a716-446655440000",
      status: "approved",
      moderated_by: null,
      moderated_at: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      breed_name: "Golden Retriever",
      breed_slug: "golden-retriever",
      avg_rating: 4.5,
      rating_count: 10,
      display_url: "https://example.com/images/abc123.jpg",
    };

    const result = dogWithDetailsSchema.safeParse(dog);
    expect(result.success).toBe(true);
  });

  it("accepts dog_ceo dog with details", () => {
    const dog = {
      id: 2,
      name: null,
      image_key: "",
      image_url: "https://images.dog.ceo/breeds/husky/n02110185_5678.jpg",
      image_source: "dog_ceo",
      breed_id: 3,
      uploader_user_id: null,
      uploader_anon_id: null,
      status: "approved",
      moderated_by: null,
      moderated_at: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      breed_name: "Siberian Husky",
      breed_slug: "siberian-husky",
      avg_rating: null,
      rating_count: 0,
      display_url: "https://images.dog.ceo/breeds/husky/n02110185_5678.jpg",
    };

    const result = dogWithDetailsSchema.safeParse(dog);
    expect(result.success).toBe(true);
  });

  it("rejects invalid display_url", () => {
    const dog = {
      id: 1,
      name: "Buddy",
      image_key: "dogs/abc123.jpg",
      image_url: null,
      image_source: "user_upload",
      breed_id: 1,
      uploader_user_id: null,
      uploader_anon_id: null,
      status: "approved",
      moderated_by: null,
      moderated_at: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      breed_name: "Golden Retriever",
      breed_slug: "golden-retriever",
      avg_rating: 4.5,
      rating_count: 10,
      display_url: "not-a-url",
    };

    const result = dogWithDetailsSchema.safeParse(dog);
    expect(result.success).toBe(false);
  });
});
