// Brussels venue scouting — finds trendy, recent, locally-loved spots
// Strategy: targeted Google Places Text Searches using queries that surface
// what locals and food writers are currently recommending, not tourist lists.
// All data comes back structured (photos, ratings, addresses) — no HTML parsing.
// Runs server-side with 24h ISR cache. No new API keys needed.

import type { Venue } from './venues'

// Queries designed to find places that are:
// - Recent (2024/2025 openings and trending spots)
// - Local-facing (not on Tripadvisor top 10)
// - Specific to the neighbourhoods Roots covers
const BRUSSELS_SCOUT_QUERIES = [
  'new restaurant Brussels 2025',
  'trending bar Brussels Ixelles locals',
  'best new wine bar Brussels',
  'hidden gem café Brussels specialty coffee',
  'new opening restaurant Saint-Gilles Brussels',
  'best natural wine Brussels 2024 2025',
  'trendy brunch Brussels Châtelain Flagey',
  'new bar Dansaert Brussels',
  'best ramen noodles Brussels',
  'best pizza Brussels locals',
  'craft cocktail bar Brussels',
  'new café remote work Brussels',
]

const PRICE_MAP: Record<number, Venue['price']> = {
  1: '€', 2: '€€', 3: '€€€', 4: '€€€€',
}

const FOOD_TYPES = new Set([
  'restaurant', 'bar', 'cafe', 'food', 'bakery',
  'meal_delivery', 'meal_takeaway', 'night_club', 'pub',
])

function inferBroadType(types: string[]): Venue['broadType'] {
  if (types.some(t => ['bar', 'night_club', 'pub'].includes(t))) return 'bar'
  if (types.some(t => ['cafe', 'bakery'].includes(t)))           return 'cafe'
  if (types.some(t => ['restaurant', 'food', 'meal_delivery', 'meal_takeaway'].includes(t))) return 'restaurant'
  return 'other'
}

function inferCategory(types: string[], broadType: Venue['broadType']): string {
  if (types.includes('bakery'))     return 'Bakery'
  if (types.includes('night_club')) return 'Club'
  if (types.includes('pub'))        return 'Pub'
  if (broadType === 'cafe')         return 'Café'
  if (broadType === 'bar')          return 'Bar'
  return 'Restaurant'
}

// Rough neighbourhood inference for Brussels from lat/lon
function guessNeighborhood(lat: number, lng: number): string {
  if (lat > 50.875 && lng < 4.32)  return 'Laeken'
  if (lat > 50.875)                 return 'Schaerbeek'
  if (lat > 50.865 && lng < 4.35)  return 'Molenbeek'
  if (lat > 50.865)                 return 'Saint-Josse'
  if (lat < 50.820 && lng < 4.34)  return 'Forest'
  if (lat < 50.820 && lng > 4.40)  return 'Etterbeek'
  if (lat < 50.822)                 return 'Uccle'
  if (lng < 4.33)                   return 'Anderlecht'
  if (lng > 4.42)                   return 'Woluwe'
  if (lat > 50.851 && lng > 4.36)  return 'EU Quarter'
  if (lat > 50.848)                 return 'City Centre'
  if (lat > 50.840 && lng < 4.348) return 'Marolles'
  if (lat > 50.836 && lng < 4.355) return 'Dansaert'
  if (lat > 50.833 && lng < 4.358) return 'Saint-Géry'
  if (lng < 4.348 && lat < 50.833) return 'Saint-Gilles'
  if (lat > 50.828 && lng > 4.372) return 'Flagey'
  if (lat > 50.832 && lng > 4.358) return 'Châtelain'
  return 'Ixelles'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function searchPlaces(query: string, key: string): Promise<any[]> {
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    url.searchParams.set('query',    query)
    url.searchParams.set('location', '50.8503,4.3517') // Brussels centre
    url.searchParams.set('radius',   '8000')
    // No opening_hours — that's the Contact Data SKU and costs ~€2.80/1000.
    // Text Search returns rating/user_ratings_total/price_level by default.
    url.searchParams.set('fields',   'place_id,name,formatted_address,rating,user_ratings_total,price_level,photos,types,geometry')
    url.searchParams.set('key',      key)

    const res = await fetch(url.toString(), {
      next:   { revalidate: 86400 }, // 24h — scout results are stable
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json()
    return json.results ?? []
  } catch (err) {
    console.warn(`[scout] Places search failed for "${query}":`, err)
    return []
  }
}

export async function scoutVenues(
  cityId: string,
  existingNames: Set<string>,
): Promise<Venue[]> {
  if (cityId !== 'brussels') return []

  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return []

  const seen     = new Set<string>()  // place_id dedup within scout results
  const all: Venue[] = []

  for (const query of BRUSSELS_SCOUT_QUERIES) {
    const results = await searchPlaces(query, key)

    for (const p of results) {
      if (!p.name || !p.place_id) continue
      if (seen.has(p.place_id)) continue

      // Skip if already in curated/OSM list
      const normName = (p.name as string).toLowerCase().replace(/[^a-z0-9]/g, '')
      if (existingNames.has(normName)) continue

      const types: string[] = p.types ?? []
      if (!types.some((t: string) => FOOD_TYPES.has(t))) continue

      // Quality threshold — only include places with real review volume
      const reviewCount = p.user_ratings_total as number | undefined
      const rating      = p.rating as number | undefined
      if (!reviewCount || reviewCount < 30) continue
      if (!rating || rating < 3.8) continue

      seen.add(p.place_id)

      const lat       = p.geometry?.location?.lat as number | undefined
      const lng       = p.geometry?.location?.lng as number | undefined
      const broadType = inferBroadType(types)
      const category  = inferCategory(types, broadType)
      const price     = PRICE_MAP[(p.price_level as number)] ?? '€€'
      const photoRef  = p.photos?.[0]?.photo_reference as string | null ?? null
      const hood      = lat && lng ? guessNeighborhood(lat, lng) : 'Brussels'

      // Strip country suffix from address for display
      const address = (p.formatted_address as string ?? '')
        .replace(/, (Belgium|Brussels|Bruxelles).*$/, '')
        .trim()

      all.push({
        id:          `scout-${p.place_id}`,
        name:        p.name as string,
        category,
        broadType,
        neighborhood: hood,
        price,
        vibe:        `${category} in ${hood}`,
        why:         address || hood,
        tags:        [],
        address:     address || undefined,
        lat,
        lng,
        openNow:     p.opening_hours?.open_now,
        photoRef,
        rating:      typeof rating === 'number' ? rating : null,
        reviewCount: typeof reviewCount === 'number' ? reviewCount : null,
        source:      'scouted' as const,
      })
    }
  }

  return all
}
