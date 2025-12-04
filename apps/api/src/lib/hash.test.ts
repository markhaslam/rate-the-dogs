import { describe, it, expect } from "vitest";
import { hashIP, getClientIP } from "./hash.js";

describe("Hash Utilities", () => {
  describe("hashIP", () => {
    it("returns a SHA-256 hex string", async () => {
      const hash = await hashIP("192.168.1.1");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("returns consistent hash for same IP", async () => {
      const hash1 = await hashIP("192.168.1.1");
      const hash2 = await hashIP("192.168.1.1");
      expect(hash1).toBe(hash2);
    });

    it("returns different hash for different IPs", async () => {
      const hash1 = await hashIP("192.168.1.1");
      const hash2 = await hashIP("192.168.1.2");
      expect(hash1).not.toBe(hash2);
    });

    it("handles IPv6 addresses", async () => {
      const hash = await hashIP("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("handles empty string", async () => {
      const hash = await hashIP("");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

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
  });
});
