import { createMiddleware } from "hono/factory";
import type { Env, Variables } from "../lib/env.js";
import { createDb } from "../db/drizzle.js";

/**
 * Database middleware - attaches Drizzle client to context
 *
 * This middleware creates a Drizzle ORM client from the D1 binding
 * and makes it available via `c.get("db")` in route handlers.
 *
 * @example
 * ```ts
 * app.use("*", dbMiddleware);
 *
 * app.get("/users", async (c) => {
 *   const db = c.get("db");
 *   const users = await db.select().from(schema.users);
 *   return c.json(users);
 * });
 * ```
 */
export const dbMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const db = createDb(c.env.DB);
  c.set("db", db);
  await next();
});
