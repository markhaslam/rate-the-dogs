import { describe, it, expect } from "vitest";
import {
  oauthProviderSchema,
  userSchema,
  userProfileSchema,
  anonymousUserSchema,
} from "./user.js";

describe("oauthProviderSchema", () => {
  it("accepts valid providers", () => {
    const validProviders = ["google", "github", "discord"];
    for (const provider of validProviders) {
      const result = oauthProviderSchema.safeParse(provider);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid providers", () => {
    const invalidProviders = ["facebook", "twitter", "apple", ""];
    for (const provider of invalidProviders) {
      const result = oauthProviderSchema.safeParse(provider);
      expect(result.success).toBe(false);
    }
  });
});

describe("userSchema", () => {
  it("accepts valid user record with all fields", () => {
    const validUser = {
      id: 1,
      email: "user@example.com",
      name: "John Doe",
      avatar_url: "https://example.com/avatar.jpg",
      google_id: "google-oauth-id-123",
      provider: "google",
      email_verified: true,
      linked_anon_id: "550e8400-e29b-41d4-a716-446655440000",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-02T00:00:00.000Z",
    };

    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("accepts user with nullable fields as null", () => {
    const user = {
      id: 1,
      email: "user@example.com",
      name: null,
      avatar_url: null,
      google_id: null,
      provider: null,
      email_verified: false,
      linked_anon_id: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    const result = userSchema.safeParse(user);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const user = {
      id: 1,
      email: "not-an-email",
      name: "John",
      avatar_url: null,
      google_id: null,
      provider: null,
      email_verified: false,
      linked_anon_id: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    const result = userSchema.safeParse(user);
    expect(result.success).toBe(false);
  });

  it("rejects invalid avatar_url format", () => {
    const user = {
      id: 1,
      email: "user@example.com",
      name: "John",
      avatar_url: "not-a-url",
      google_id: null,
      provider: null,
      email_verified: false,
      linked_anon_id: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    const result = userSchema.safeParse(user);
    expect(result.success).toBe(false);
  });

  it("rejects invalid linked_anon_id format", () => {
    const user = {
      id: 1,
      email: "user@example.com",
      name: "John",
      avatar_url: null,
      google_id: null,
      provider: null,
      email_verified: false,
      linked_anon_id: "not-a-uuid",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    const result = userSchema.safeParse(user);
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding max length", () => {
    const user = {
      id: 1,
      email: "user@example.com",
      name: "a".repeat(101),
      avatar_url: null,
      google_id: null,
      provider: null,
      email_verified: false,
      linked_anon_id: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    const result = userSchema.safeParse(user);
    expect(result.success).toBe(false);
  });

  it("accepts different OAuth providers", () => {
    const providers = ["google", "github", "discord"];
    for (const provider of providers) {
      const user = {
        id: 1,
        email: "user@example.com",
        name: null,
        avatar_url: null,
        google_id: null,
        provider,
        email_verified: true,
        linked_anon_id: null,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      };

      const result = userSchema.safeParse(user);
      expect(result.success).toBe(true);
    }
  });
});

describe("userProfileSchema", () => {
  it("accepts valid user profile", () => {
    const profile = {
      id: 1,
      name: "John Doe",
      avatar_url: "https://example.com/avatar.jpg",
      created_at: "2024-01-01T00:00:00.000Z",
      rating_count: 42,
      upload_count: 5,
    };

    const result = userProfileSchema.safeParse(profile);
    expect(result.success).toBe(true);
  });

  it("accepts profile with null name and avatar", () => {
    const profile = {
      id: 1,
      name: null,
      avatar_url: null,
      created_at: "2024-01-01T00:00:00.000Z",
      rating_count: 0,
      upload_count: 0,
    };

    const result = userProfileSchema.safeParse(profile);
    expect(result.success).toBe(true);
  });

  it("rejects negative rating_count", () => {
    const profile = {
      id: 1,
      name: null,
      avatar_url: null,
      created_at: "2024-01-01T00:00:00.000Z",
      rating_count: -1,
      upload_count: 0,
    };

    const result = userProfileSchema.safeParse(profile);
    expect(result.success).toBe(false);
  });

  it("rejects negative upload_count", () => {
    const profile = {
      id: 1,
      name: null,
      avatar_url: null,
      created_at: "2024-01-01T00:00:00.000Z",
      rating_count: 0,
      upload_count: -1,
    };

    const result = userProfileSchema.safeParse(profile);
    expect(result.success).toBe(false);
  });
});

describe("anonymousUserSchema", () => {
  it("accepts valid anonymous user record", () => {
    const anonUser = {
      anon_id: "550e8400-e29b-41d4-a716-446655440000",
      first_seen_at: "2024-01-01T00:00:00.000Z",
      last_seen_at: "2024-01-02T00:00:00.000Z",
      is_banned: false,
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    };

    const result = anonymousUserSchema.safeParse(anonUser);
    expect(result.success).toBe(true);
  });

  it("accepts anonymous user with null user_agent", () => {
    const anonUser = {
      anon_id: "550e8400-e29b-41d4-a716-446655440000",
      first_seen_at: "2024-01-01T00:00:00.000Z",
      last_seen_at: "2024-01-01T00:00:00.000Z",
      is_banned: false,
      user_agent: null,
    };

    const result = anonymousUserSchema.safeParse(anonUser);
    expect(result.success).toBe(true);
  });

  it("accepts banned anonymous user", () => {
    const anonUser = {
      anon_id: "550e8400-e29b-41d4-a716-446655440000",
      first_seen_at: "2024-01-01T00:00:00.000Z",
      last_seen_at: "2024-01-01T00:00:00.000Z",
      is_banned: true,
      user_agent: null,
    };

    const result = anonymousUserSchema.safeParse(anonUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_banned).toBe(true);
    }
  });

  it("rejects invalid anon_id format", () => {
    const anonUser = {
      anon_id: "not-a-uuid",
      first_seen_at: "2024-01-01T00:00:00.000Z",
      last_seen_at: "2024-01-01T00:00:00.000Z",
      is_banned: false,
      user_agent: null,
    };

    const result = anonymousUserSchema.safeParse(anonUser);
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime format", () => {
    const anonUser = {
      anon_id: "550e8400-e29b-41d4-a716-446655440000",
      first_seen_at: "not-a-date",
      last_seen_at: "2024-01-01T00:00:00.000Z",
      is_banned: false,
      user_agent: null,
    };

    const result = anonymousUserSchema.safeParse(anonUser);
    expect(result.success).toBe(false);
  });
});
