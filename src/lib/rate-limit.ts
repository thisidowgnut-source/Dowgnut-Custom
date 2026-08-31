// Lightweight in-memory rate limiter (fixed window per key).
// Good enough for single-instance deployments (this app + Vercel hobby).
// If we ever go multi-instance, swap the Map for a shared store.

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();
const MAX_TRACKED_KEYS = 10_000;

function sweep(now: number) {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Returns { ok: false } once `limit` hits happen inside `windowMs`.
 * Not distributed, not durable — just a cheap abuse/cost guard.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  if (entry.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  entry.count += 1;
  return { ok: true, remaining: limit - entry.count, retryAfterSec: 0 };
}

/**
 * Best-effort client identity: session header first, then forwarded IP.
 * Anonymous bucket only as a last resort.
 */
export function clientKeyFrom(request: Request): string {
  const session = request.headers.get("x-session-id");
  if (session) return `s:${session.slice(0, 64)}`;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) return `ip:${ip.slice(0, 64)}`;
  return "ip:anonymous";
}
