/**
 * Minimal in-memory rate limiter for auth endpoints.
 *
 * Intentionally dependency-free (no Redis) to match this project's
 * no-paid-infra philosophy (see lib/auth.ts). Caveat: state lives in
 * process memory, so on a multi-instance or cold-start-heavy
 * deployment (e.g. serverless with several concurrent instances) each
 * instance keeps its own counters, which weakens - but doesn't
 * eliminate - the protection. Sufficient for a self-hosted
 * single-instance deployment; swap in a Redis- or DB-backed limiter if
 * you run this behind multiple concurrent instances.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically clear expired buckets so this map doesn't grow forever
// on a long-running process. unref() so this timer never keeps the
// process alive by itself (relevant for the CLI sync script, which
// doesn't use this module but shares the process model).
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 10 * 60 * 1000);
cleanupInterval.unref?.();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * Fixed-window rate limiter. Returns whether the request identified by
 * `key` is allowed under `limit` requests per `windowMs`.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count++;
  return { allowed: true };
}

/** Best-effort client IP extraction from standard proxy headers. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
