import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import type { Env, Variables } from "../lib/env.js";
import { COOKIE } from "@rate-the-dogs/shared";
import { hashIP, getClientIP } from "../lib/hash.js";

/**
 * Anonymous ID middleware
 *
 * - Reads or creates an anonymous ID cookie
 * - Sets the anonId in context variables
 * - Hashes the client IP for abuse detection
 */
export const anonMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  // Get or create anonymous ID
  let anonId = getCookie(c, COOKIE.ANON_ID_NAME);

  if (!anonId) {
    anonId = crypto.randomUUID();

    // Set cookie with secure settings
    setCookie(c, COOKIE.ANON_ID_NAME, anonId, {
      path: "/",
      httpOnly: true,
      secure: c.env.ENVIRONMENT === "production",
      sameSite: "Strict",
      maxAge: COOKIE.MAX_AGE_SECONDS,
    });
  }

  // Set anon ID in context
  c.set("anonId", anonId);

  // Hash client IP for abuse detection
  const clientIP = getClientIP(c.req.raw);
  const ipHash = await hashIP(clientIP);
  c.set("ipHash", ipHash);

  await next();
});

/**
 * Get the anonymous ID from context
 */
export function getAnonId(c: { get: (key: "anonId") => string }): string {
  return c.get("anonId");
}

/**
 * Get the IP hash from context
 */
export function getIPHash(c: { get: (key: "ipHash") => string }): string {
  return c.get("ipHash");
}
