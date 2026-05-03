import brusselsVenues from './static/brussels-venues.json'

export interface Venue {
  id:            string
  name:          string
  category:      string
  broadType:     'restaurant' | 'bar' | 'cafe' | 'other'
  neighborhood:  string
  price:         '€' | '€€' | '€€€' | '€€€€'
  vibe:          string
  why:           string
  tags:          string[]
  address?:      string
  lat?:          number
  lng?:          number
  openingHours?: string
  openNow?:      boolean
  website?:      string
  featured?:     boolean
  deal?:         string
  dealTag?:      string
  photoRef?:     string | null   // Google Places photo_reference
  rating?:       number | null   // Google Places rating (0–5)
  reviewCount?:  number | null   // Google user_ratings_total
  source?:       'curated' | 'osm' | 'google'
}

const STATIC: Record<string, Venue[]> = {
  brussels: (brusselsVenues as Venue[]).map(v => ({ ...v, source: 'curated' as const })),
}

// ── Google Places Nearby Search ───────────────────────────────────────────────
// Runs server-side with 24h ISR cache. Pulls top venues per neighbourhood
// with photos, ratings, and price level baked in — no client-side fetches needed.

const BRUSSELS_HOODS: { name: string; lat: number; lng: number; radius: number }[] = [
  { name: 'Ixelles',      lat: 50.8280, lng: 4.3710, radius: 700 },
  { name: 'Saint-Gilles', lat: 50.8247, lng: 4.3464, radius: 600 },
  { name: 'Dansaert',     lat: 50.8489, lng: 4.3402, radius: 500 },
  { name: 'Châtelain',    lat: 50.8310, lng: 4.3561, radius: 450 },
  { name: 'Flagey',       lat: 50.8275, lng: 4.3787, radius: 450 },
  { name: 'EU Quarter',   lat: 50.8444, lng: 4.3839, radius: 550 },
  { name: 'Marolles',     lat: 50.8380, lng: 4.3461, radius: 450 },
  { name: 'City Centre',  lat: 50.8467, lng: 4.3525, radius: 550 },
  { name: 'Schaerbeek',   lat: 50.8671, lng: 4.3781, radius: 600 },
  { name: 'Molenbeek',    lat: 50.8528, lng: 4.3287, radius: 550 },
]

const FOOD_TYPES = new Set([
  'restaurant', 'bar', 'cafe', 'food', 'bakery',
  'meal_delivery', 'meal_takeaway', 'night_club', 'pub',
])

const PRICE_MAP: Record<number, Venue['price']> = {
  1: '€', 2: '€€', 3: '€€€', 4: '€€€€',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function googleToBroadType(types: string[]): Venue['broadType'] {
  if (types.some(t => ['bar', 'night_club', 'pub'].includes(t))) return 'bar'
  if (types.some(t => ['cafe', 'bakery'].includes(t)))           return 'cafe'
  if (types.some(t => ['restaurant', 'food', 'meal_delivery', 'meal_takeaway'].includes(t))) return 'restaurant'
  return 'other'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function googleToCategory(types: string[], broadType: Venue['broadType']): string {
  if (types.includes('bakery'))    return 'Bakery'
  if (types.includes('night_club')) return 'Club'
  if (types.includes('pub'))       return 'Pub'
  if (broadType === 'cafe')        return 'Café'
  if (broadType === 'bar')         return 'Bar'
  return 'Restaurant'
}

async function fetchGoogleNearbyVenues(): Promise<Venue[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return []

  const all: Venue[] = []
  const seen = new Set<string>() // deduplicate by place_id

  for (const hood of BRUSSELS_HOODS) {
    // Two passes: restaurants + bars/cafes
    for (const type of ['restaurant', 'bar'] as const) {
      try {
        const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
        url.searchParams.set('location', `${hood.lat},${hood.lng}`)
        url.searchParams.set('radius',   String(hood.radius))
        url.searchParams.set('type',     type)
        url.searchParams.set('key',      key)

        const res = await fetch(url.toString(), {
          next:   { revalidate: 86400 }, // 24h ISR cache
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) continue

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json: any = await res.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const places: any[] = json.results ?? []

        for (const p of places) {
          if (!p.name || !p.place_id) continue
          if (seen.has(p.place_id)) continue

          const types: string[] = p.types ?? []
          if (!types.some(t => FOOD_TYPES.has(t))) continue

          // Skip places with very few reviews (likely new/inaccurate data)
          if (p.user_ratings_total != null && p.user_ratings_total < 10) continue

          seen.add(p.place_id)

          const lat       = p.geometry?.location?.lat
          const lng       = p.geometry?.location?.lng
          const broadType = googleToBroadType(types)
          const category  = googleToCategory(types, broadType)
          const price     = PRICE_MAP[p.price_level as number] ?? '€€'
          const photoRef  = p.photos?.[0]?.photo_reference ?? null
          const rating    = typeof p.rating === 'number' ? p.rating : null
          const reviews   = typeof p.user_ratings_total === 'number' ? p.user_ratings_total : null

          all.push({
            id:          `gpl-${p.place_id}`,
            name:        p.name,
            category,
            broadType,
            neighborhood: hood.name,
            price,
            vibe:        `${category} in ${hood.name}`,
            why:         p.vicinity ?? hood.name,
            tags:        [],
            address:     p.vicinity ?? undefined,
            lat,
            lng,
            openNow:     p.opening_hours?.open_now,
            photoRef,
            rating,
            reviewCount: reviews,
            source:      'google' as const,
          })
        }
      } catch (err) {
        console.warn(`[venues] Google Nearby Search failed for ${hood.name}/${type}:`, err)
      }
    }
  }

  return all
}

// ── OpenStreetMap fallback ────────────────────────────────────────────────────
// Supplements with additional venues. Lower data quality than Google.

const OVERPASS_QUERY = `
[out:json][timeout:25];
(
  node["amenity"~"^(restaurant|bar|cafe|pub|fast_food)$"]["name"]["opening_hours"]
    (50.81,4.28,50.90,4.44);
  way["amenity"~"^(restaurant|bar|cafe|pub|fast_food)$"]["name"]["opening_hours"]
    (50.81,4.28,50.90,4.44);
);
out center tags 200;
`.trim()

function guessNeighborhood(lat: number, lon: number): string {
  if (lat > 50.875 && lon < 4.32)  return 'Laeken'
  if (lat > 50.875)                 return 'Schaerbeek'
  if (lat > 50.865 && lon < 4.35)  return 'Molenbeek'
  if (lat > 50.865)                 return 'Saint-Josse'
  if (lat < 50.83  && lon < 4.34)  return 'Forest'
  if (lat < 50.83  && lon > 4.40)  return 'Etterbeek'
  if (lat < 50.83)                  return 'Ixelles'
  if (lon < 4.33)                   return 'Anderlecht'
  if (lon > 4.42)                   return 'Woluwe'
  if (lon > 4.38)                   return 'Ixelles'
  if (lat > 50.85 && lon > 4.36)   return 'Saint-Gilles'
  if (lat > 50.855)                 return 'Brussels Centre'
  return 'Ixelles'
}

function osmToBroadType(amenity: string): Venue['broadType'] {
  if (amenity === 'bar' || amenity === 'pub') return 'bar'
  if (amenity === 'cafe')                     return 'cafe'
  if (amenity === 'restaurant' || amenity === 'fast_food') return 'restaurant'
  return 'other'
}

function osmToCategory(amenity: string, tags: Record<string, string>): string {
  const cuisine = tags.cuisine
  if (amenity === 'bar' || amenity === 'pub') return 'Bar'
  if (amenity === 'cafe')                     return 'Café'
  if (cuisine) {
    const c = cuisine.split(';')[0].trim()
    return c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ')
  }
  return 'Restaurant'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchOverpassVenues(): Promise<Venue[]> {
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:   `data=${encodeURIComponent(OVERPASS_QUERY)}`,
      next:   { revalidate: 86400 },
    })
    if (!res.ok) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elements: any[] = json.elements ?? []
    const out: Venue[] = []

    for (const el of elements) {
      const tags  = el.tags ?? {}
      const name  = tags.name
      if (!name) continue
      const lat  = el.lat ?? el.center?.lat
      const lon  = el.lon ?? el.center?.lon
      if (!lat || !lon) continue

      const amenity   = tags.amenity ?? 'restaurant'
      const broadType = osmToBroadType(amenity)
      const category  = osmToCategory(amenity, tags)
      const neighborhood = guessNeighborhood(lat, lon)

      out.push({
        id:          `osm-${el.type}-${el.id}`,
        name,
        category,
        broadType,
        neighborhood,
        price:       '€€',
        vibe:        `${category} in ${neighborhood}`,
        why:         tags['description:en'] ?? tags.description ?? `${category} near ${neighborhood}`,
        tags:        tags.cuisine ? [tags.cuisine.split(';')[0].trim()] : [],
        address:     [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ') || undefined,
        lat,
        lng:         lon,
        website:     tags.website || tags['contact:website'] || undefined,
        openingHours: tags.opening_hours || undefined,
        source:      'osm' as const,
      })
    }
    return out
  } catch {
    return []
  }
}

// ── Merge: curated > google > osm ─────────────────────────────────────────────
// Curated venues are always shown. Google and OSM fill remaining slots,
// deduplicated against curated by normalised name.

function normName(n: string): string {
  return n.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function mergeVenues(curated: Venue[], google: Venue[], osm: Venue[]): Venue[] {
  const curatedNames = new Set(curated.map(v => normName(v.name)))

  const freshGoogle = google.filter(v => !curatedNames.has(normName(v.name)))
  const allNames    = new Set([...curatedNames, ...freshGoogle.map(v => normName(v.name))])
  const freshOsm    = osm.filter(v => !allNames.has(normName(v.name)))

  return [...curated, ...freshGoogle, ...freshOsm]
}

// ── Google Places enrichment for curated venues ───────────────────────────────
// Gets open_now + photoRef + rating for curated venues that don't have them yet.
// Caps at 15 to stay within quota. Revalidates every 30 min.

async function enrichCurated(venues: Venue[], cityId: string): Promise<Venue[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return venues

  const cityName  = cityId.charAt(0).toUpperCase() + cityId.slice(1)
  const toEnrich  = venues.filter(v => v.source === 'curated').slice(0, 15)

  const enriched = await Promise.all(
    toEnrich.map(async v => {
      try {
        const params = new URLSearchParams({
          query:  `${v.name} ${cityName}`,
          fields: 'place_id,photos,rating,user_ratings_total,opening_hours',
          key,
        })
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
          { next: { revalidate: 1800 } } // 30 min — open_now changes
        )
        if (!res.ok) return v
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json: any = await res.json()
        const result = json.results?.[0]
        if (!result) return v

        return {
          ...v,
          openNow:     result.opening_hours?.open_now ?? v.openNow,
          photoRef:    result.photos?.[0]?.photo_reference ?? v.photoRef ?? null,
          rating:      typeof result.rating === 'number' ? result.rating : v.rating,
          reviewCount: typeof result.user_ratings_total === 'number' ? result.user_ratings_total : v.reviewCount,
        }
      } catch {
        return v
      }
    })
  )

  const enrichedMap = new Map(enriched.map(v => [v.id, v]))
  return venues.map(v => enrichedMap.get(v.id) ?? v)
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getVenues(cityId: string): Promise<Venue[]> {
  const curated = STATIC[cityId] ?? []

  if (cityId !== 'brussels') {
    return enrichCurated(curated, cityId)
  }

  // Ship with curated list only — Google Nearby augmentation available but
  // disabled until curated quality is high enough across all neighbourhoods.
  // To re-enable: const [google, osm] = await Promise.all([fetchGoogleNearbyVenues(), fetchOverpassVenues()])
  //               return enrichCurated(mergeVenues(curated, google, osm), cityId)

  return enrichCurated(curated, cityId)
}
