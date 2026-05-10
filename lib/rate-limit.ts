// Rate limiter for public API routes.
//
// Two implementations:
//   - rateLimit()         — async, Supabase-backed, distributed across Vercel instances
//   - rateLimitInMemory() — sync, per-instance, fallback when Supabase is unavailable
//
// Use rateLimit() in API routes. The in-memory version stays only as a fallback.

import { createAdminClient } from '@/lib/supabase/server'

/* ── In-memory fallback ────────────────────────────────────────────────────── */

const hits = new Map<string, { count: number; reset: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, val] of hits) {
    if (val.reset < now) hits.delete(key)
  }
}, 60_000).unref?.()

export function rateLimitInMemory(
  key: string,
  { max = 30, windowMs = 60_000 }: { max?: number; windowMs?: number } = {},
): { ok: boolean; remaining: number } {
  const now   = Date.now()
  const entry = hits.get(key)

  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs })
    return { ok: true, remaining: max - 1 }
  }

  entry.count++
  const remaining = Math.max(0, max - entry.count)
  return { ok: entry.count <= max, remaining }
}

/* ── Distributed (Supabase) ───────────────────────────────────────────────── */

let migrationMissingWarned = false

export async function rateLimit(
  key: string,
  { max = 30, windowMs = 60_000 }: { max?: number; windowMs?: number } = {},
): Promise<{ ok: boolean; remaining: number }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('check_ip_rate_limit', {
      p_key:            key,
      p_max:            max,
      p_window_seconds: Math.ceil(windowMs / 1000),
    })

    if (error) {
      // Migration not run yet — warn once, fall back to in-memory
      if (error.code === '42P01' || error.code === 'PGRST202') {
        if (!migrationMissingWarned) {
          console.warn('[rate-limit] check_ip_rate_limit missing — run supabase/migration_ip_rate_limits.sql')
          migrationMissingWarned = true
        }
      } else {
        console.error('[rate-limit] supabase error:', error.code, error.message)
      }
      return rateLimitInMemory(key, { max, windowMs })
    }

    return { ok: data === true, remaining: -1 }
  } catch (err) {
    console.error('[rate-limit] threw, falling back to in-memory:', err)
    return rateLimitInMemory(key, { max, windowMs })
  }
}
