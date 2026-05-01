import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://roots-mu.vercel.app',
  ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
]

function originAllowed(req: NextRequest): boolean {
  const origin  = req.headers.get('origin')
  const referer = req.headers.get('referer')
  if (!origin && !referer) return true
  const check = origin ?? referer ?? ''
  return ALLOWED_ORIGINS.some(o => check.startsWith(o))
}

export async function GET(req: NextRequest) {
  if (!originAllowed(req)) {
    return new NextResponse(null, { status: 403 })
  }

  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return new NextResponse(null, { status: 400 })

  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return new NextResponse(null, { status: 500 })

  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=320&photo_reference=${encodeURIComponent(ref)}&key=${key}`

  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) return new NextResponse(null, { status: 404 })

    return new NextResponse(res.body, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
        // 7-day browser cache + immutable — photo refs don't change for a given place
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
