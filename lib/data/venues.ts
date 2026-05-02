import brusselsVenues from './static/brussels-venues.json'

export interface Venue {
  id:           string
  name:         string
  category:     string
  broadType:    'restaurant' | 'bar' | 'cafe' | 'other'
  neighborhood: string
  price:        '€' | '€€' | '€€€' | '€€€€'
  vibe:         string
  why:          string
  tags:         string[]
  address?:     string
  lat?:         number
  lng?:         number
  openingHours?: string
  openNow?:     boolean
  website?:     string
  featured?:    boolean
  deal?:        string
  dealTag?:     string
  source?:      'curated' | 'osm'
}

const STATIC: Record<string, Venue[]> = {
  brussels: (brusselsVenues as Venue[]).map(v => ({ ...v, source: 'curated' as const })),
}

// Overpass QL query — restaurant, bar, cafe, pub in Brussels area
// Bounding box: approx Brussels + inner suburbs
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

// Brussels neighborhood from lat/lon — rough bounding boxes
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
      body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
      next: { revalidate: 86400 }, // 24h — OSM data changes slowly
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

      const id = `osm-${el.type}-${el.id}`
      out.push({
        id,
        name,
        category,
        broadType,
        neighborhood,
        price:   '€€',
        vibe:    `${category} in ${neighborhood}`,
        why:     tags['description:en'] ?? tags.description ?? `${category} near ${neighborhood}`,
        tags:    tags.cuisine ? [tags.cuisine.split(';')[0].trim()] : [],
        address: [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ') || undefined,
        lat,
        lng:     lon,
        website: tags.website || tags['contact:website'] || undefined,
        openingHours: tags.opening_hours || undefined,
        source:  'osm' as const,
      })
    }

    return out
  } catch {
    return []
  }
}

// Merge curated + OSM, deduplicate by name proximity
function mergeVenues(curated: Venue[], osm: Venue[]): Venue[] {
  const curatedNames = new Set(curated.map(v => v.name.toLowerCase().replace(/[^a-z0-9]/g, '')))
  const fresh = osm.filter(v => {
    const key = v.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    return !curatedNames.has(key)
  })
  // curated always first (editorial quality), OSM fills remaining slots
  return [...curated, ...fresh]
}

// ── Google Places open_now enrichment ────────────────────────────────────
// Runs at build/ISR time for curated venues only — saves API quota
const CITY_NAME: Record<string, string> = {
  brussels: 'Brussels', lisbon: 'Lisbon', berlin: 'Berlin',
  barcelona: 'Barcelona', amsterdam: 'Amsterdam', prague: 'Prague',
}

async function fetchPlaceId(name: string, cityName: string, key: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      query: `${name} ${cityName}`,
      fields: 'place_id',
      key,
    })
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
      { next: { revalidate: 86400 } } // place IDs don't change
    )
    if (!res.ok) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json()
    return json.results?.[0]?.place_id ?? null
  } catch { return null }
}

async function fetchOpenNow(placeId: string, key: string): Promise<boolean | undefined> {
  try {
    const params = new URLSearchParams({
      place_id: placeId,
      fields:   'opening_hours',
      key,
    })
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
      { next: { revalidate: 1800 } } // ISR-aligned
    )
    if (!res.ok) return undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json()
    const openNow = json.result?.opening_hours?.open_now
    return typeof openNow === 'boolean' ? openNow : undefined
  } catch { return undefined }
}

async function enrichWithOpenNow(venues: Venue[], cityId: string): Promise<Venue[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return venues

  const cityName = CITY_NAME[cityId] ?? 'Brussels'
  // Only enrich curated venues — cap at 12 to stay well under quota
  const toEnrich = venues.filter(v => v.source === 'curated').slice(0, 12)

  const enriched = await Promise.all(
    toEnrich.map(async v => {
      const placeId = await fetchPlaceId(v.name, cityName, key)
      if (!placeId) return v
      const openNow = await fetchOpenNow(placeId, key)
      if (openNow === undefined) return v
      return { ...v, openNow }
    })
  )

  const enrichedMap = new Map(enriched.map(v => [v.id, v]))
  return venues.map(v => enrichedMap.get(v.id) ?? v)
}

export async function getVenues(cityId: string): Promise<Venue[]> {
  const curated = STATIC[cityId] ?? []

  let merged: Venue[]
  if (cityId === 'brussels') {
    const osm = await fetchOverpassVenues()
    merged = mergeVenues(curated, osm)
  } else {
    merged = curated
  }

  return enrichWithOpenNow(merged, cityId)
}
