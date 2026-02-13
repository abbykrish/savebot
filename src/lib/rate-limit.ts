/**
 * Simple in-memory sliding-window rate limiter.
 * Works on Vercel serverless (per-instance), which is sufficient
 * for basic abuse prevention. For stricter limits, use Upstash Redis.
 */

interface Entry {
  timestamps: number[];
}

const store = new Map<string, Entry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 3600_000);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 300_000);

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

/**
 * Check rate limit for a key (typically `${userId}:${action}`).
 * @param key   - unique identifier
 * @param limit - max requests in the window
 * @param windowMs - window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - oldest),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
  };
}
