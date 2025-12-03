import { createMiddleware } from "hono/factory";
import type { Env, Variables } from "../lib/env.js";

interface LogData {
  level: "info" | "warn" | "error";
  event: string;
  method: string;
  path: string;
  status?: number;
  duration_ms?: number;
  anon_id?: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Request logging middleware
 *
 * Logs requests in structured JSON format for Cloudflare Workers Logs
 */
export const loggerMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  const logData: LogData = {
    level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
    event: "http_request",
    method,
    path,
    status,
    duration_ms: duration,
    anon_id: c.get("anonId"),
    timestamp: new Date().toISOString(),
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(logData));
});

/**
 * Log a custom event
 */
export function logEvent(
  event: string,
  data: Record<string, unknown> = {},
  level: "info" | "warn" | "error" = "info"
): void {
  const logData: LogData = {
    level,
    event,
    method: "",
    path: "",
    timestamp: new Date().toISOString(),
    ...data,
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(logData));
}
