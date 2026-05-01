import { NextRequest, NextResponse } from 'next/server'
import type { SpotCategory } from '@/lib/types'

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  brussels:  { lat: 50.8503, lng: 4.3517  },
  lisbon:    { lat: 38.7169, lng: -9.1395 },
  berlin:    { lat: 52.5200, lng: 13.4050 },
  barcelona: { lat: 41.3851, lng: 2.1734  },
  amsterdam: { lat: 52.3676, lng: 4.9041  },
  prague:    { lat: 50.0755, lng: 14.4378 },
}

function inferCategory(types: string[]): SpotCategory {
  if (types.some(t => ['bar', 'night_club', 'pub'].includes(t))) return 'bar'
  if (types.some(t => ['cafe', 'coffee_shop', 'bakery'].includes(t))) return 'cafe'
  if (types.some(t => ['restaurant', 'food', 'meal_delivery', 'meal_takeaway'].includes(t))) return 'restaurant'
  if (types.some(t => ['book_store'].includes(t))) return 'bookstore'
  if (types.some(t => ['grocery_or_supermarket', 'supermarket', 'market'].includes(t))) return 'market'
  if (types.some(t => ['clothing_store', 'shopping_mall', 'store', 'shoe_store'].includes(t))) return 'shop'
  return 'cafe'
}

const COUNTRY_SUFFIX = /, (Belgium|Portugal|Germany|Spain|Netherlands|Czech Republic)$/

// ── Allowed origins — only our own domain can call this ───────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://roots-mu.vercel.app',
  ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
]

function originAllowed(req: NextRequest): boolean {
  const origin  = req.headers.get('origin')
  const referer = req.headers.get('referer')
  // In development (no origin header from same-origin fetch) always allow
  if (!origin && !referer) return true
  const check = origin ?? referer ?? ''
  return ALLOWED_ORIGINS.some(o => check.startsWith(o))
}

export async function GET(req: NextRequest) {
  // Block external callers
  if (!originAllowed(req)) {
    return NextResponse.json({ results: [], error: 'Forbidden' }, { status: 403 })
  }

  const q      = req.nextUrl.searchParams.get('q')?.trim()
  const cityId = req.nextUrl.searchParams.get('cityId') ?? 'brussels'

  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return NextResponse.json({ results: [], error: 'Places not configured' })

  const coords = CITY_COORDS[cityId] ?? CITY_COORDS.brussels

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', q)
  url.searchParams.set('location', `${coords.lat},${coords.lng}`)
  url.searchParams.set('radius', '20000')
  url.searchParams.set('key', key)

  try {
    // Cache identical queries for 10 minutes — a user typing "malo" gets the
    // same result for 10 min without another API call
    const res  = await fetch(url.toString(), { next: { revalidate: 600 } })
    const json = await res.json() as {
      results: Array<{
        place_id: string
        name: string
        formatted_address: string
        rating?: number
        types: string[]
        photos?: Array<{ photo_reference: string }>
      }>
    }

    const results = (json.results ?? []).slice(0, 6).map(p => ({
      placeId:  p.place_id,
      name:     p.name,
      address:  (p.formatted_address ?? '').replace(COUNTRY_SUFFIX, ''),
      rating:   p.rating ?? null,
      photoRef: p.photos?.[0]?.photo_reference ?? null,
      category: inferCategory(p.types ?? []),
    }))

    return NextResponse.json(
      { results },
      { headers: { 'Cache-Control': 'private, max-age=600' } },
    )
  } catch (err) {
    console.error('[places/search]', err)
    return NextResponse.json({ results: [] })
  }
}
