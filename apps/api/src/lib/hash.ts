/**
 * Get client IP from request headers
 * Cloudflare provides this in CF-Connecting-IP header
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
