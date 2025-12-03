import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import type { Env, Variables } from "./env.js";

/**
 * Error codes used in API responses
 */
export const ErrorCode = {
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  RATE_LIMITED: "RATE_LIMITED",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Create a 404 Not Found error
 */
export function notFound(message: string): HTTPException {
  return new HTTPException(404, { message });
}

/**
 * Create a 400 Bad Request error
 */
export function badRequest(message: string): HTTPException {
  return new HTTPException(400, { message });
}

/**
 * Create a 401 Unauthorized error
 */
export function unauthorized(message = "Unauthorized"): HTTPException {
  return new HTTPException(401, { message });
}

/**
 * Create a 403 Forbidden error
 */
export function forbidden(message = "Forbidden"): HTTPException {
  return new HTTPException(403, { message });
}

/**
 * Create a 409 Conflict error
 */
export function conflict(message: string): HTTPException {
  return new HTTPException(409, { message });
}

/**
 * Create a 429 Rate Limited error
 */
export function rateLimited(message = "Too many requests"): HTTPException {
  return new HTTPException(429, { message });
}

/**
 * Format error response
 */
export function formatError(
  code: ErrorCode,
  message: string,
  details?: unknown
) {
  return {
    success: false as const,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
}

/**
 * Global error handler for Hono
 */
export function errorHandler(
  err: Error,
  c: Context<{ Bindings: Env; Variables: Variables }>
) {
  // Log the error
  const logData = {
    level: "error",
    event: "unhandled_error",
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(logData));

  if (err instanceof HTTPException) {
    const status = err.status;
    let code: ErrorCode = ErrorCode.INTERNAL_ERROR;

    switch (status) {
      case 400:
        code = ErrorCode.BAD_REQUEST;
        break;
      case 401:
        code = ErrorCode.UNAUTHORIZED;
        break;
      case 403:
        code = ErrorCode.FORBIDDEN;
        break;
      case 404:
        code = ErrorCode.NOT_FOUND;
        break;
      case 409:
        code = ErrorCode.CONFLICT;
        break;
      case 429:
        code = ErrorCode.RATE_LIMITED;
        break;
    }

    return c.json(formatError(code, err.message), status);
  }

  // Unknown error - return 500
  return c.json(
    formatError(ErrorCode.INTERNAL_ERROR, "Internal server error"),
    500
  );
}
