import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env, Variables } from "./lib/env.js";
import { errorHandler } from "./lib/errors.js";
import { anonMiddleware } from "./middleware/anon.js";
import { loggerMiddleware } from "./middleware/logger.js";

// Create the Hono app with typed bindings
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Global middleware
app.use("*", cors());
app.use("*", loggerMiddleware);
app.use("/api/*", anonMiddleware);

// Global error handler
app.onError(errorHandler);

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    name: "RateTheDogs API",
    version: "0.1.0",
    status: "healthy",
  });
});

// API routes will be added here
// app.route("/api/dogs", dogsRoute);
// app.route("/api/breeds", breedsRoute);
// app.route("/api/leaderboard", leaderboardRoute);
// app.route("/api/me", meRoute);
// app.route("/api/admin", adminRoute);

// 404 handler for unmatched routes
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404
  );
});

// Export the app type for RPC client
export type AppType = typeof app;

// Export the app for Cloudflare Workers
export default app;
