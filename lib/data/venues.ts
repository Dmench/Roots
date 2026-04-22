export interface Venue {
  id:           string
  name:         string
  category:     string
  broadType:    'restaurant' | 'bar' | 'cafe' | 'other'
  neighborhood: string
  address:      string
  cuisine?:     string
  openingHours?: string
  website?:     string
}

// Brussels bounding box
const CITY_BBOX: Record<string, string> = {
  brussels:  '50.7950,4.2860,50.9100,4.4300',
  lisbon:    '38.6910,-9.2300,38.7970,-9.0900',
  berlin:    '52.4000,13.2000,52.6200,13.6000',
  barcelona: '41.3200,2.0500,41.4700,2.2900',
  amsterdam: '52.3200,4.7600,52.4500,5.0700',
  prague:    '49.9700,14.2200,50.1800,14.7000',
}

function broadType(amenity: string, cuisine?: string): Venue['broadType'] {
  if (amenity === 'bar' || amenity === 'pub' || amenity === 'biergarten' || amenity === 'wine_bar' || amenity === 'cocktail_bar') return 'bar'
  if (amenity === 'cafe' || amenity === 'coffee_shop' || cuisine?.includes('coffee') || cuisine?.includes('tea')) return 'cafe'
  if (amenity === 'restaurant' || amenity === 'fast_food' || amenity === 'food_court' || amenity === 'brasserie') return 'restaurant'
  return 'other'
}

function categoryLabel(amenity: string, cuisine?: string): string {
  if (cuisine) {
    const c = cuisine.replace(/_/g, ' ')
    return c.charAt(0).toUpperCase() + c.slice(1)
  }
  const MAP: Record<string, string> = {
    restaurant: 'Restaurant', cafe: 'Café', bar: 'Bar', pub: 'Pub',
    biergarten: 'Beer garden', wine_bar: 'Wine bar', cocktail_bar: 'Cocktail bar',
    fast_food: 'Fast food', brasserie: 'Brasserie', coffee_shop: 'Coffee shop',
  }
  return MAP[amenity] ?? 'Venue'
}

export async function getVenues(cityId: string, limit = 24): Promise<Venue[]> {
  const bbox = CITY_BBOX[cityId] ?? CITY_BBOX.brussels

  // Overpass QL — fetch named restaurants, bars, cafés with all useful tags
  // [timeout:25] tells the Overpass server to give up after 25s
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"^(restaurant|bar|pub|cafe|biergarten|wine_bar|cocktail_bar|brasserie)$"]["name"](${bbox});
      way["amenity"~"^(restaurant|bar|pub|cafe|biergarten|wine_bar|cocktail_bar|brasserie)$"]["name"](${bbox});
    );
    out body ${limit * 3};
  `.trim()

  // Two Overpass mirrors — fall back if primary is slow
  const ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ]

  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    `data=${encodeURIComponent(query)}`,
        next:    { revalidate: 3600 },
        signal:  AbortSignal.timeout(28000),
      })
      if (!res.ok) continue

      const json = await res.json()
      const elements: Record<string, unknown>[] = json.elements ?? []

      const results: Venue[] = elements
        .filter(el => {
          const tags = el.tags as Record<string, string> | undefined
          return tags?.name && tags?.amenity
        })
        .map(el => {
          const tags    = el.tags as Record<string, string>
          const amenity = tags.amenity ?? ''
          const cuisine = tags.cuisine?.split(';')[0]?.trim()
          const street  = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ')
          const suburb  = tags['addr:suburb'] ?? tags['addr:neighbourhood'] ?? ''

          return {
            id:           `osm-${el.id as string}`,
            name:         tags.name,
            category:     categoryLabel(amenity, cuisine),
            broadType:    broadType(amenity, cuisine),
            neighborhood: suburb,
            address:      street,
            cuisine,
            openingHours: tags.opening_hours,
            website:      tags.website ?? tags['contact:website'],
          }
        })
        .filter((v, i, arr) => arr.findIndex(x => x.name === v.name) === i)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, limit)

      if (results.length > 0) return results
    } catch { continue }
  }

  return []
}
