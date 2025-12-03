import { describe, it, expect } from "vitest";
import {
  paginationQuerySchema,
  searchQuerySchema,
  idParamSchema,
  slugParamSchema,
  anonIdParamSchema,
} from "./api.js";
import { PAGINATION } from "../constants.js";

describe("paginationQuerySchema", () => {
  it("provides default values", () => {
    const result = paginationQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(PAGINATION.DEFAULT_LIMIT);
      expect(result.data.offset).toBe(0);
    }
  });

  it("coerces string values to numbers", () => {
    const result = paginationQuerySchema.safeParse({
      limit: "10",
      offset: "5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
      expect(result.data.offset).toBe(5);
    }
  });

  it("rejects limit over max", () => {
    const result = paginationQuerySchema.safeParse({
      limit: PAGINATION.MAX_LIMIT + 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative offset", () => {
    const result = paginationQuerySchema.safeParse({ offset: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects zero or negative limit", () => {
    expect(paginationQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ limit: -1 }).success).toBe(false);
  });
});

describe("searchQuerySchema", () => {
  it("accepts valid search string", () => {
    const result = searchQuerySchema.safeParse({ search: "golden" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe("golden");
    }
  });

  it("accepts empty object (search is optional)", () => {
    const result = searchQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBeUndefined();
    }
  });

  it("rejects search over 100 characters", () => {
    const result = searchQuerySchema.safeParse({ search: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("idParamSchema", () => {
  it("coerces string to number", () => {
    const result = idParamSchema.safeParse({ id: "42" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(42);
    }
  });

  it("accepts number directly", () => {
    const result = idParamSchema.safeParse({ id: 42 });
    expect(result.success).toBe(true);
  });

  it("rejects zero", () => {
    const result = idParamSchema.safeParse({ id: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative numbers", () => {
    const result = idParamSchema.safeParse({ id: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integers", () => {
    const result = idParamSchema.safeParse({ id: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe("slugParamSchema", () => {
  it("accepts valid slug", () => {
    const result = slugParamSchema.safeParse({ slug: "golden-retriever" });
    expect(result.success).toBe(true);
  });

  it("rejects empty slug", () => {
    const result = slugParamSchema.safeParse({ slug: "" });
    expect(result.success).toBe(false);
  });

  it("rejects slug over 100 characters", () => {
    const result = slugParamSchema.safeParse({ slug: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("anonIdParamSchema", () => {
  it("accepts valid UUID", () => {
    const result = anonIdParamSchema.safeParse({
      anonId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = anonIdParamSchema.safeParse({ anonId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});
