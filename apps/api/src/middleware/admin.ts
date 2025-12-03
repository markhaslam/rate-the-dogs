import { createMiddleware } from "hono/factory";
import type { Env, Variables } from "../lib/env.js";
import { unauthorized } from "../lib/errors.js";

/**
 * Admin authentication middleware
 *
 * Validates the X-Admin-Secret header against the ADMIN_SECRET env var
 */
export const adminMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const adminSecret = c.req.header("X-Admin-Secret");

  if (!adminSecret || adminSecret !== c.env.ADMIN_SECRET) {
    throw unauthorized("Invalid admin credentials");
  }

  await next();
});
