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
  it("accepts valid rating record with all fields", () => {
    const validRating = {
      id: 1,
      dog_id: 42,
      value: 4.5,
      user_id: null,
      anon_id: "550e8400-e29b-41d4-a716-446655440000",
      ip_address: "192.168.1.100",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      created_at: "2024-01-01T00:00:00.000Z",
    };

    const result = ratingSchema.safeParse(validRating);
    expect(result.success).toBe(true);
  });

  it("accepts null user_id, anon_id, ip_address, and user_agent", () => {
    const rating = {
      id: 1,
      dog_id: 42,
      value: 3.0,
      user_id: null,
      anon_id: null,
      ip_address: null,
      user_agent: null,
      created_at: "2024-01-01T00:00:00.000Z",
    };

    const result = ratingSchema.safeParse(rating);
    expect(result.success).toBe(true);
  });

  it("accepts valid user_agent string", () => {
    const rating = {
      id: 1,
      dog_id: 42,
      value: 4.0,
      user_id: null,
      anon_id: "550e8400-e29b-41d4-a716-446655440000",
      ip_address: "1.2.3.4",
      user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
      created_at: "2024-01-01T00:00:00.000Z",
    };

    const result = ratingSchema.safeParse(rating);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user_agent).toBe(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"
      );
    }
  });

  it("rejects invalid anon_id format", () => {
    const rating = {
      id: 1,
      dog_id: 42,
      value: 3.0,
      user_id: null,
      anon_id: "not-a-uuid",
      ip_address: null,
      user_agent: null,
      created_at: "2024-01-01T00:00:00.000Z",
    };

    const result = ratingSchema.safeParse(rating);
    expect(result.success).toBe(false);
  });
});
