import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import type { Env, Variables } from "../lib/env.js";
import { COOKIE } from "@rate-the-dogs/shared";
import { getClientIP } from "../lib/hash.js";

/**
 * Anonymous ID middleware
 *
 * - Reads or creates an anonymous ID cookie
 * - Sets the anonId in context variables
 * - Stores the raw client IP for analytics
 * - Stores the user agent for analytics
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

  // Store raw client IP for analytics
  const clientIP = getClientIP(c.req.raw);
  c.set("clientIP", clientIP);

  // Store user agent for analytics
  const userAgent = c.req.header("User-Agent") ?? null;
  c.set("userAgent", userAgent);

  await next();
});

/**
 * Get the anonymous ID from context
 */
export function getAnonId(c: { get: (key: "anonId") => string }): string {
  return c.get("anonId");
}

/**
 * Get the client IP from context
 */
export function getClientIPFromContext(c: {
  get: (key: "clientIP") => string;
}): string {
  return c.get("clientIP");
}

/**
 * Get the user agent from context
 */
export function getUserAgentFromContext(c: {
  get: (key: "userAgent") => string | null;
}): string | null {
  return c.get("userAgent");
}
