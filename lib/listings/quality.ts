// Zero-cost listing-quality nudges. Pure deterministic checks against the
// local composer state — no Claude call, no network. Surfaces 1–2 inline
// hints before submit so the listing reads as a real, useful post rather
// than a vague placeholder.
//
// Council (AI strategist): ship option (c) without a model — the Roots
// voice stays the user's, and the friction-cut is free.

export type HousingDraft = {
  type:     'offer' | 'wanted'
  title:    string
  hood:     string
  price:    string
  dates:    string
  photoUrl: string
  body:     string
}

export type EventDraft = {
  title:    string
  date:     string   // datetime-local
  venue:    string
  hood:     string
  url:      string
  photoUrl: string
  body:     string
}

const CONTACT_RE = /whatsapp|telegram|signal me|\+\s?32\s?4\d{2}|(?:^|\s)0\d{3}\s?\d{2}\s?\d{2}\s?\d{2}/i

export function housingNudges(d: HousingDraft): string[] {
  const out: string[] = []
  if (d.type === 'offer' && !d.photoUrl.trim()) {
    out.push('Add a photo — listings with one get far more replies.')
  }
  if (!d.price.trim()) {
    out.push(d.type === 'offer' ? 'Add a price.' : 'Add a budget — hosts skim for the number first.')
  }
  if (!d.dates.trim()) {
    out.push('Add dates — "July to May" or "1 Aug onwards".')
  }
  if (d.body.trim().length > 0 && d.body.trim().length < 60) {
    out.push('A line or two about flatmates / the building helps.')
  }
  if (CONTACT_RE.test(d.body)) {
    out.push('Keep contact in DMs — public numbers get scraped.')
  }
  return out.slice(0, 2)
}

export function eventNudges(d: EventDraft): string[] {
  const out: string[] = []
  if (!d.venue.trim()) {
    out.push('Add a venue — readers scan for the where first.')
  }
  if (!d.url.trim()) {
    out.push('Add an RSVP / tickets link if you have one.')
  }
  if (d.body.trim().length > 0 && d.body.trim().length < 40) {
    out.push('A line about who\'s playing or the door price helps.')
  }
  if (CONTACT_RE.test(d.body)) {
    out.push('Keep contact in DMs — public numbers get scraped.')
  }
  return out.slice(0, 2)
}

// URL safety — reject anything that isn't http(s). Defends against
// `javascript:`, `data:`, `vbscript:`, `file:`, and other protocol-based
// XSS vectors when these URLs are later rendered into hrefs / img srcs.
export function isSafeUrl(u: string): boolean {
  const s = u.trim()
  if (!s) return false
  try {
    const parsed = new URL(s)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
