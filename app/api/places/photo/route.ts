import { NextRequest, NextResponse } from 'next/server'
import { createUserClient } from '@/lib/supabase/server'

// Google Places photo references are base64url-encoded strings.
// Validating format prevents SSRF — arbitrary URLs can't be injected.
const PHOTO_REF_RE = /^[A-Za-z0-9_\-+/]{20,600}$/

export async function GET(req: NextRequest) {
  // Auth guard — protects Google API quota from unauthenticated scraping
  const authHeader = req.headers.get('Authorization') ?? ''
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return new NextResponse(null, { status: 401 })
  const { data: { user } } = await createUserClient(token).auth.getUser()
  if (!user) return new NextResponse(null, { status: 401 })

  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return new NextResponse(null, { status: 400 })

  if (!PHOTO_REF_RE.test(ref)) return new NextResponse(null, { status: 400 })

  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return new NextResponse(null, { status: 500 })

  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=320&photo_reference=${encodeURIComponent(ref)}&key=${key}`

  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) return new NextResponse(null, { status: 404 })

    return new NextResponse(res.body, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
