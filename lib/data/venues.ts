import brusselsVenues from './static/brussels-venues.json'

export interface Venue {
  id:           string
  name:         string
  category:     string
  broadType:    'restaurant' | 'bar' | 'cafe' | 'other'
  neighborhood: string
  price:        '€' | '€€' | '€€€' | '€€€€'
  vibe:         string   // e.g. "Buzzing communal brasserie, chalkboard menu"
  why:          string   // e.g. "The most Brussels restaurant in Brussels"
  tags:         string[] // e.g. ['craft-beer', 'natural-wine', 'no-reservations']
  address?:     string
  openingHours?: string
  website?:     string
  featured?:    boolean
  deal?:        string
  dealTag?:     string
}

const STATIC: Record<string, Venue[]> = {
  brussels: brusselsVenues as Venue[],
}

export function getVenues(cityId: string): Promise<Venue[]> {
  return Promise.resolve(STATIC[cityId] ?? [])
}
