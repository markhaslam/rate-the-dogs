import { describe, it, expect } from "vitest";
import {
  ratingValueSchema,
  rateRequestSchema,
  ratingSchema,
} from "./rating.js";

describe("ratingValueSchema", () => {
  it("accepts valid ratings from 0.5 to 5.0", () => {
    const validValues = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    for (const value of validValues) {
      expect(ratingValueSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects values below 0.5", () => {
    const result = ratingValueSchema.safeParse(0);
    expect(result.success).toBe(false);
  });

  it("rejects values above 5.0", () => {
    const result = ratingValueSchema.safeParse(5.5);
    expect(result.success).toBe(false);
  });

  it("rejects non-half increments", () => {
    const invalidValues = [0.3, 0.7, 1.1, 2.3, 4.9];
    for (const value of invalidValues) {
      const result = ratingValueSchema.safeParse(value);
      expect(result.success).toBe(false);
    }
  });

  it("rejects non-numbers", () => {
    const result = ratingValueSchema.safeParse("5");
    expect(result.success).toBe(false);
  });
});

describe("rateRequestSchema", () => {
  it("accepts valid rate request", () => {
    const result = rateRequestSchema.safeParse({ value: 4.5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(4.5);
    }
  });

  it("rejects missing value", () => {
    const result = rateRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects extra fields but keeps valid data", () => {
    const result = rateRequestSchema.safeParse({ value: 3, extra: "field" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ value: 3 });
    }
  });
});

describe("ratingSchema", () => {
  it("accepts valid rating record", () => {
    const validRating = {
      id: 1,
      dog_id: 42,
      value: 4.5,
      user_id: null,
      anon_id: "550e8400-e29b-41d4-a716-446655440000",
      ip_hash: "abc123",
      created_at: "2024-01-01T00:00:00.000Z",
    };

    const result = ratingSchema.safeParse(validRating);
    expect(result.success).toBe(true);
  });

  it("accepts null user_id and anon_id", () => {
    const rating = {
      id: 1,
      dog_id: 42,
      value: 3.0,
      user_id: null,
      anon_id: null,
      ip_hash: null,
      created_at: "2024-01-01T00:00:00.000Z",
    };

    const result = ratingSchema.safeParse(rating);
    expect(result.success).toBe(true);
  });

  it("rejects invalid anon_id format", () => {
    const rating = {
      id: 1,
      dog_id: 42,
      value: 3.0,
      user_id: null,
      anon_id: "not-a-uuid",
      ip_hash: null,
      created_at: "2024-01-01T00:00:00.000Z",
    };

    const result = ratingSchema.safeParse(rating);
    expect(result.success).toBe(false);
  });
});
