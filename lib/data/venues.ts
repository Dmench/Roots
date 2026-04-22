export interface Venue {
  id:           string
  name:         string
  category:     string   // Foursquare category name e.g. "Belgian Restaurant"
  broadType:    'restaurant' | 'bar' | 'cafe' | 'other'
  neighborhood: string
  address:      string
  rating:       number | null  // 0–10 Foursquare scale
  price:        number | null  // 1–4
  photo?:       string         // CDN URL, no hotlink block
  tip?:         string         // first community tip
}

const FSQ_KEY = process.env.FOURSQUARE_API_KEY

const CITY_LL: Record<string, string> = {
  brussels: '50.8503,4.3517',
  lisbon:   '38.7169,-9.1399',
  berlin:   '52.5200,13.4050',
  barcelona:'41.3851,2.1734',
  amsterdam:'52.3676,4.9041',
  prague:   '50.0755,14.4378',
}

function broadType(catName: string): Venue['broadType'] {
  const n = catName.toLowerCase()
  if (n.includes('coffee') || n.includes('café') || n.includes('cafe') || n.includes('bakery') || n.includes('tea room')) return 'cafe'
  if (n.includes('bar') || n.includes('pub') || n.includes('cocktail') || n.includes('brewery') || n.includes('wine') || n.includes('nightclub') || n.includes('beer')) return 'bar'
  if (n.includes('restaurant') || n.includes('brasserie') || n.includes('bistro') || n.includes('kitchen') || n.includes('eatery') || n.includes('diner')) return 'restaurant'
  return 'other'
}

export async function getVenues(cityId: string, limit = 24): Promise<Venue[]> {
  if (!FSQ_KEY) return []

  const ll = CITY_LL[cityId] ?? CITY_LL.brussels

  try {
    const params = new URLSearchParams({
      ll,
      categories: '13000',   // Dining and Drinking (restaurants + bars + cafes)
      sort:       'POPULARITY',
      limit:      String(limit),
      fields:     'fsq_id,name,categories,location,rating,price,photos,tips',
    })

    const res = await fetch(
      `https://api.foursquare.com/v3/places/search?${params}`,
      {
        headers: { Authorization: `Bearer ${FSQ_KEY}`, Accept: 'application/json' },
        next: { revalidate: 3600 },
      },
    )
    if (!res.ok) return []

    const json = await res.json()

    return (json.results ?? []).map((p: Record<string, unknown>): Venue => {
      const cats   = (p.categories as { name: string }[] | undefined) ?? []
      const loc    = (p.location   as Record<string, unknown> | undefined) ?? {}
      const hoods  = (loc.neighborhood as string[] | undefined) ?? []
      const photos = (p.photos as { prefix: string; suffix: string }[] | undefined) ?? []
      const tips   = (p.tips   as { text:   string }[] | undefined) ?? []
      const catName = cats[0]?.name ?? 'Venue'

      return {
        id:           p.fsq_id as string,
        name:         p.name as string,
        category:     catName,
        broadType:    broadType(catName),
        neighborhood: hoods[0] ?? '',
        address:      (loc.address as string | undefined) ?? '',
        rating:       typeof p.rating === 'number' ? Math.round(p.rating * 10) / 10 : null,
        price:        typeof p.price  === 'number' ? p.price  : null,
        photo:        photos[0] ? `${photos[0].prefix}500x300${photos[0].suffix}` : undefined,
        tip:          tips[0]?.text,
      }
    })
  } catch {
    return []
  }
}
