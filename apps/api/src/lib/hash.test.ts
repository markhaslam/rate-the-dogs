import { describe, it, expect } from "vitest";
import { getClientIP } from "./hash.js";

describe("getClientIP", () => {
  it("returns CF-Connecting-IP when present", () => {
    const request = new Request("https://example.com", {
      headers: {
        "CF-Connecting-IP": "1.2.3.4",
        "X-Forwarded-For": "5.6.7.8",
      },
    });

    expect(getClientIP(request)).toBe("1.2.3.4");
  });

  it("falls back to X-Forwarded-For when CF header missing", () => {
    const request = new Request("https://example.com", {
      headers: {
        "X-Forwarded-For": "5.6.7.8",
      },
    });

    expect(getClientIP(request)).toBe("5.6.7.8");
  });

  it("takes first IP from X-Forwarded-For chain", () => {
    const request = new Request("https://example.com", {
      headers: {
        "X-Forwarded-For": "1.1.1.1, 2.2.2.2, 3.3.3.3",
      },
    });

    expect(getClientIP(request)).toBe("1.1.1.1");
  });

  it("trims whitespace from X-Forwarded-For", () => {
    const request = new Request("https://example.com", {
      headers: {
        "X-Forwarded-For": "  1.1.1.1  , 2.2.2.2",
      },
    });

    expect(getClientIP(request)).toBe("1.1.1.1");
  });

  it("returns 'unknown' when no IP headers present", () => {
    const request = new Request("https://example.com");
    expect(getClientIP(request)).toBe("unknown");
  });

  it("handles IPv6 addresses", () => {
    const request = new Request("https://example.com", {
      headers: {
        "CF-Connecting-IP": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      },
    });

    expect(getClientIP(request)).toBe(
      "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
    );
  });
});
