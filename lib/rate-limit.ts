// Simple in-memory rate limiter for public API routes.
// Tracks request counts per IP with a sliding window.
// Not distributed — fine for single-instance Vercel deployments.

const hits = new Map<string, { count: number; reset: number }>()

// Cleanup stale entries every 60s to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of hits) {
    if (val.reset < now) hits.delete(key)
  }
}, 60_000).unref?.()

export function rateLimit(
  ip: string,
  { max = 30, windowMs = 60_000 }: { max?: number; windowMs?: number } = {},
): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = hits.get(ip)

  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + windowMs })
    return { ok: true, remaining: max - 1 }
  }

  entry.count++
  const remaining = Math.max(0, max - entry.count)
  return { ok: entry.count <= max, remaining }
}
