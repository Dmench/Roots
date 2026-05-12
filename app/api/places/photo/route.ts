import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

// Google Places photo references are base64url-encoded strings.
// Validating format prevents SSRF — arbitrary URLs can't be injected.
const PHOTO_REF_RE = /^[A-Za-z0-9_\-+/]{20,600}$/

// Master kill-switch — set GOOGLE_PLACES_ENABLED=true in Vercel to re-enable.
const PLACES_ENABLED = process.env.GOOGLE_PLACES_ENABLED === 'true'

export async function GET(req: NextRequest) {
  if (!PLACES_ENABLED) {
    // Short-circuit: respond with a 1×1 transparent GIF cached forever.
    // Cheap, cacheable, no Google call. The <img onError> handlers in the
    // UI will pick this up and fall back to colour blocks. We use 204
    // No Content actually — onError fires on non-2xx OR on no image bytes,
    // and 204 means "intentionally empty, don't retry."
    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'public, max-age=86400' },
    })
  }

  // This endpoint must be callable from <img src=...> tags, which can't send
  // an Authorization header. We rely on three layers instead:
  //   1) photoRef regex validation (SSRF protection — only valid Google refs pass)
  //   2) Same-origin Referer check (best-effort; blocks naive cross-origin embeds)
  //   3) Rate limit per IP (caps bulk abuse of our Google quota)
  // Photos are cached for a week at the edge, so legitimate browsing barely
  // touches this route after the first visit.

  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return new NextResponse(null, { status: 400 })
  if (!PHOTO_REF_RE.test(ref)) return new NextResponse(null, { status: 400 })

  // Same-origin check — allows requests from our own pages (Referer set by the
  // browser on <img> loads), blocks the most basic hotlink abuse.
  const referer = req.headers.get('referer') ?? ''
  const host    = req.headers.get('host')    ?? ''
  if (referer && host) {
    try {
      const refHost = new URL(referer).host
      if (refHost !== host) {
        return new NextResponse(null, { status: 403 })
      }
    } catch {
      // Malformed Referer — let it through; regex + rate limit still apply.
    }
  }

  // Rate limit per IP — generous enough for a fresh page view (20–30 photos)
  // but caps bulk scraping. First-time fetches per region; after that the CDN serves.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const { ok } = await rateLimit(`places-photo:${ip}`, { max: 200, windowMs: 60_000 })
  if (!ok) return new NextResponse(null, { status: 429 })

  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return new NextResponse(null, { status: 500 })

  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=320&photo_reference=${encodeURIComponent(ref)}&key=${key}`

  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) return new NextResponse(null, { status: 404 })

    return new NextResponse(res.body, {
      headers: {
        'Content-Type':  res.headers.get('Content-Type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
