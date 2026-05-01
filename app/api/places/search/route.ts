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

// Map Google place types → our SpotCategory
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

export async function GET(req: NextRequest) {
  const q      = req.nextUrl.searchParams.get('q')?.trim()
  const cityId = req.nextUrl.searchParams.get('cityId') ?? 'brussels'

  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return NextResponse.json({ results: [], error: 'Places not configured' })

  const coords = CITY_COORDS[cityId] ?? CITY_COORDS.brussels

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', `${q}`)
  url.searchParams.set('location', `${coords.lat},${coords.lng}`)
  url.searchParams.set('radius', '20000')
  url.searchParams.set('key', key)

  try {
    const res  = await fetch(url.toString(), { next: { revalidate: 300 } })
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
      types:    p.types ?? [],
    }))

    return NextResponse.json({ results })
  } catch (err) {
    console.error('[places/search]', err)
    return NextResponse.json({ results: [] })
  }
}
