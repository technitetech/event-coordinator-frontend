

const _buckets = new Map();

/**
 * @param {string}  key         - Unique key per (action, identifier) pair
 * @param {number}  maxRequests - Maximum requests allowed in the window
 * @param {number}  windowMs    - Window duration in milliseconds
 * @returns {{ ok: boolean, retryAfter?: number }}
 */
export function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const bucket = _buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    _buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= maxRequests) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count++;
  return { ok: true };
}

// Periodic cleanup so the Map doesn't grow unbounded on long-running servers.
// Runs every 10 minutes; removes expired buckets.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of _buckets) {
      if (now > bucket.resetAt) _buckets.delete(key);
    }
  }, 10 * 60 * 1000);
}

/**
 * Clears all rate-limit state. Exported only for test teardown.
 * Do NOT call this in production code.
 */
export function _clearBuckets() {
  _buckets.clear();
}
