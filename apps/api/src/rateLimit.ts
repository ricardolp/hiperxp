type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Fixed-window counter. Returns remaining + whether allowed. */
export function takeToken(
  key: string,
  limit: number,
  windowMs = 60_000,
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  prune(now);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

/** Dedup window for view beacons: one increment per IP+kind+id. */
export function allowViewOnce(
  key: string,
  windowMs = 5 * 60_000,
): boolean {
  const now = Date.now();
  const current = buckets.get(key);
  if (current && current.resetAt > now) return false;
  buckets.set(key, { count: 1, resetAt: now + windowMs });
  return true;
}

export function clientIp(headers: Headers, fallback = "unknown"): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 128);
  return fallback;
}
