import brusselsVenues from './static/brussels-venues.json'

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
