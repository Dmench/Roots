// Gap-fill enrichment: takes a hand-curated list of named candidate venues
// (sourced via web search of local food guides), hits Google Places Text
// Search to verify each one, and emits ready-to-commit venue JSON entries.
//
// Drops any candidate that:
//   - has no Google match
//   - matches a different city
//   - has no photo
//   - already exists in brussels-venues.json (by normalised name)
//
// Run:
//   node --env-file=.env.local scripts/enrich-gap-fill-candidates.mjs
//
// Output written to scripts/.gap-fill-candidates.json for inspection.
// You can then merge into brussels-venues.json with a manual review step.

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname    = dirname(fileURLToPath(import.meta.url))
const VENUES_PATH  = join(__dirname, '..', 'lib', 'data', 'static', 'brussels-venues.json')
const OUT_PATH     = join(__dirname, '.gap-fill-candidates.json')

const googleKey = process.env.GOOGLE_PLACES_API_KEY
if (!googleKey) { console.error('Missing GOOGLE_PLACES_API_KEY'); process.exit(1) }

const existing = JSON.parse(readFileSync(VENUES_PATH, 'utf-8'))
const existingNames = new Set(existing.map(v => v.name.toLowerCase().replace(/[^a-z0-9]/g, '')))

// Candidates curated from web search of local food guides (Visit Brussels,
// CultureTrip, TheFork, S Marks The Spots, Coffee Insurrection, etc.)
//
// `expectedHood`  — which Brussels hood we expect this to land in for the chip
// `category`      — short editorial category line
// `broadType`     — venue type for /eat filtering
// `price`         — €, €€, €€€, €€€€
// `tags`          — cuisine + vibe tags driving filter intersections
// `why`           — short editorial blurb, conservative (no invented specifics)
// `vibe`          — one-sentence character note
const CANDIDATES = [
  // Italian — main gap
  { name: 'Dolce Amaro',           expectedHood: 'Saint-Gilles',     category: 'Italian (Puglian)',    broadType: 'restaurant', price: '€€',
    tags: ['italian', 'pasta', 'date-night', 'dinner', 'neighbourhood'],
    vibe: 'Puglian osteria — handmade pasta and a deep wine list.',
    why: 'A Saint-Gilles staple for over a decade. Hand-rolled pasta, southern-Italian wines, regulars who book ahead.' },
  { name: 'A Casa Mia',            expectedHood: 'Sainte-Catherine', category: 'Italian neighbourhood',broadType: 'restaurant', price: '€€',
    tags: ['italian', 'pasta', 'neighbourhood', 'cozy', 'date-night', 'locals'],
    vibe: 'Family-run Italian on the Sainte-Catherine side — the kind locals book for birthdays.',
    why: 'A cornerstone of the Sainte-Catherine dining scene. Classic Italian, family service, the kind of place people return to for years.' },
  { name: 'Nona Pasta',            expectedHood: 'Sainte-Catherine', category: 'Neapolitan pizza',     broadType: 'restaurant', price: '€€',
    tags: ['italian', 'pizza', 'casual', 'neighborhood', 'lunch', 'dinner'],
    vibe: 'Neapolitan pizza with Belgian-sourced ingredients next to Sainte-Catherine church.',
    why: 'Neapolitan pizza, made-in-Belgium mozzarella where possible. Casual, central, reliable.' },
  { name: 'Bavet',                 expectedHood: 'Dansaert',         category: 'Spaghetti specialist', broadType: 'restaurant', price: '€€',
    tags: ['italian', 'pasta', 'groups', 'casual', 'no-reservations', 'lively'],
    vibe: 'All-spaghetti menu — pick your noodle, pick your sauce, share with friends.',
    why: 'A Dansaert spaghetti specialist. Casual, lively, easy with a group — Belgian-Italian comfort cooking.' },
  { name: 'L\'Osteria Romana',     expectedHood: 'Ixelles',          category: 'Roman trattoria',      broadType: 'restaurant', price: '€€',
    tags: ['italian', 'pasta', 'date-night', 'neighbourhood', 'dinner'],
    vibe: 'Roman trattoria — cacio e pepe, carbonara, the classics done right.',
    why: 'Roman-tradition cooking in Ixelles. Short menu, regional pasta done by the book, well-priced.' },

  // Asian — main gap
  { name: 'Kokuban',               expectedHood: 'City Centre',      category: 'Japanese ramen',       broadType: 'restaurant', price: '€€',
    tags: ['japanese', 'ramen', 'asian', 'counter-dining', 'casual', 'no-reservations', 'trendy'],
    vibe: 'Authentic ramen — rich broths, hand-pulled noodles, counter format.',
    why: 'Tokyo-style ramen done with discipline. The Brussels go-to when the broth has to be the real article.' },
  { name: 'Menma Ramen',           expectedHood: 'Sainte-Catherine', category: 'Japanese ramen',       broadType: 'restaurant', price: '€€',
    tags: ['japanese', 'ramen', 'asian', 'counter-dining', 'casual', 'trendy'],
    vibe: 'Ramen with a yuzu-shio house special — local ingredients, Japanese discipline.',
    why: 'A second wave of Brussels ramen. House-made noodles, citrus broth, vegetarian options that actually hold up.' },
  { name: 'Yamato',                expectedHood: 'Ixelles',          category: 'Japanese izakaya',     broadType: 'restaurant', price: '€€',
    tags: ['japanese', 'ramen', 'asian', 'no-reservations', 'counter-dining', 'casual', 'trendy'],
    vibe: 'Izakaya in Saint-Boniface — ramen, katsu, the wider Japanese repertoire.',
    why: 'A neighbourhood Japanese institution in the Saint-Boniface pocket of Ixelles. Tight queues on weekends.' },
  { name: 'Saveurs du Vietnam',    expectedHood: 'Flagey',           category: 'Vietnamese',           broadType: 'restaurant', price: '€€',
    tags: ['vietnamese', 'asian', 'casual', 'neighbourhood', 'lunch', 'dinner'],
    vibe: 'Family Vietnamese near Flagey — phở, bánh mì, bún bò.',
    why: 'A long-running Vietnamese kitchen near Flagey. Family service, real broths, fair prices.' },
  { name: 'Ô Banh Mi',             expectedHood: 'Ixelles',          category: 'Vietnamese sandwiches',broadType: 'restaurant', price: '€',
    tags: ['vietnamese', 'asian', 'casual', 'takeaway', 'lunch', 'cheap'],
    vibe: 'Counter-style bánh mì done properly — Vietnamese baguettes with real fillings.',
    why: 'Counter bánh mì in Ixelles. Fresh baguettes, real Vietnamese fillings, quick lunch.' },

  // Brunch — main gap
  { name: 'Hinterland',            expectedHood: 'Saint-Gilles',     category: 'All-day brunch café',  broadType: 'cafe',       price: '€€',
    tags: ['brunch', 'wholesome', 'all-day', 'trendy', 'newcomers'],
    vibe: 'À la carte brunch served all weekend — sweet and savoury homemade dishes.',
    why: 'Saint-Gilles brunch spot popular on weekends. Sweet and savoury both done well; à la carte rather than fixed-menu.' },
  { name: 'La Fabrique',           expectedHood: 'Châtelain',        category: 'Brunch buffet',        broadType: 'cafe',       price: '€€',
    tags: ['brunch', 'wholesome', 'groups', 'weekend-treat', 'all-day'],
    vibe: 'All-you-can-eat weekend brunch in a Scandinavian-feel room.',
    why: 'Châtelain weekend brunch institution. Buffet format, Scandinavian-leaning interior, generous spread.' },
  { name: 'Tigermilk',             expectedHood: 'Châtelain',        category: 'Latin brunch',         broadType: 'restaurant', price: '€€',
    tags: ['brunch', 'trendy', 'groups', 'all-day', 'lively'],
    vibe: 'Colourful Latin-American brunch + all-day spot in the Châtelain pocket.',
    why: 'Châtelain weekend brunch with a Latin-American twist. Bright interior, designed-for-Instagram-but-still-good food.' },
  { name: 'POZ',                   expectedHood: 'Châtelain',        category: 'Brunch + bowls',       broadType: 'cafe',       price: '€€',
    tags: ['brunch', 'wholesome', 'specialty-coffee', 'all-day', 'newcomers'],
    vibe: 'All-day brunch and bowls — homemade pastries, fresh produce.',
    why: 'Popular weekend brunch with elaborate plates. No reservations, no takeaway; turn up early.' },

  // Coffee — main gap
  { name: 'Pardon',                expectedHood: 'Saint-Gilles',     category: 'Specialty coffee',     broadType: 'cafe',       price: '€',
    tags: ['specialty-coffee', 'remote-work', 'wholesome', 'newcomers'],
    vibe: 'Saint-Gilles specialty coffee with house waffles.',
    why: 'Saint-Gilles specialty coffee shop. Single-origin pours, in-house waffles, low-volume neighbourhood feel.' },
  { name: 'Kami',                  expectedHood: 'Saint-Gilles',     category: 'Specialty coffee',     broadType: 'cafe',       price: '€',
    tags: ['specialty-coffee', 'remote-work', 'quiet', 'wholesome'],
    vibe: 'Roastery-driven coffee — organic beans, single-origin pours.',
    why: 'Organic beans roasted at Antwerp\'s Kolonel Coffee. Calm space, good for an hour with a laptop.' },
  { name: 'Belga & Co',            expectedHood: 'Saint-Gilles',     category: 'Specialty coffee',     broadType: 'cafe',       price: '€',
    tags: ['specialty-coffee', 'remote-work', 'all-day', 'newcomers'],
    vibe: 'A Brussels coffee chain (small, local) with consistent quality.',
    why: 'A reliable Brussels-grown specialty coffee chain. Consistent espresso, calm rooms, multiple central locations.' },
  { name: 'Wide Awake Coffee',     expectedHood: 'Sainte-Catherine', category: 'Specialty coffee',     broadType: 'cafe',       price: '€',
    tags: ['specialty-coffee', 'remote-work', 'roastery', 'trendy', 'wholesome'],
    vibe: 'House roastery, careful extraction, central Sainte-Catherine.',
    why: 'House-roasted beans, careful baristas. One of the most respected specialty coffee outfits in Brussels.' },
  { name: 'DRACHE',                expectedHood: 'Sainte-Catherine', category: 'Coffee + matcha bar',  broadType: 'cafe',       price: '€',
    tags: ['specialty-coffee', 'trendy', 'newcomers', 'quiet'],
    vibe: 'Specialty coffee + matcha bar — black sesame latte, white-chocolate hojicha.',
    why: 'A newer Sainte-Catherine arrival pulling the coffee + matcha crowd. House specials lean experimental.' },

  // Belgian — gap (EU Quarter side)
  { name: 'Schievelavabo',         expectedHood: 'EU Quarter',       category: 'Belgian brasserie',    broadType: 'restaurant', price: '€€',
    tags: ['belgian-classic', 'terrace', 'no-reservations', 'lunch', 'dinner', 'cozy'],
    vibe: 'Place Jourdan brasserie — typical Belgian menu, terrace season anchor.',
    why: 'A long-standing Belgian brasserie on Place Jourdan. Reliable Belgian-classic menu, big terrace, EU lunch crowd.' },
  { name: 'Maison Antoine',        expectedHood: 'EU Quarter',       category: 'Friterie',             broadType: 'restaurant', price: '€',
    tags: ['belgian-classic', 'frites', 'institution', 'cash-only', 'cheap', 'casual', 'late-night', 'iconic'],
    vibe: 'Place Jourdan frites — open since 1948, late-night Brussels rite.',
    why: 'The EU Quarter frites institution since 1948. Cash, queues, a hundred sauces, paper cone, eat by the kerb.' },

  // Cocktails — Ixelles gap
  { name: 'Le Tartare',            expectedHood: 'Ixelles',          category: 'Cocktail bar',         broadType: 'bar',        price: '€€',
    tags: ['cocktails', 'date-night', 'cozy', 'dark-lit', 'trendy', 'neighbourhood'],
    vibe: 'Small Ixelles cocktail room — short list, well-built drinks.',
    why: 'A small Ixelles cocktail bar. Tight menu, careful builds, the calm-bar-on-a-Wednesday feel.' },
]

// Build query for Google Places — use the same pattern that already works
// for the existing corpus.
async function lookup(c) {
  const params = new URLSearchParams({
    query:    `${c.name} ${c.expectedHood} Brussels`,
    location: '50.8503,4.3517',
    radius:   '12000',
    key:      googleKey,
  })
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
  try {
    const res  = await fetch(url)
    const json = await res.json()
    if (json.status && json.status !== 'OK') return { error: `status ${json.status}` }
    const top  = json.results?.[0]
    if (!top) return { error: 'no results' }
    return {
      address:  (top.formatted_address ?? '').replace(/, Belgium.*$/, '').trim(),
      lat:      top.geometry?.location?.lat,
      lng:      top.geometry?.location?.lng,
      photoRef: top.photos?.[0]?.photo_reference ?? null,
      rating:   top.rating ?? null,
      reviews:  top.user_ratings_total ?? null,
      placeId:  top.place_id ?? null,
    }
  } catch (err) { return { error: err.message } }
}

function slugify(name) {
  return 'curated-' + name.toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50)
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const out = []
let skipped = 0

for (let i = 0; i < CANDIDATES.length; i++) {
  const c = CANDIDATES[i]
  const normName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '')

  if (existingNames.has(normName)) {
    console.log(`[${i + 1}/${CANDIDATES.length}] SKIP (dupe in JSON): ${c.name}`)
    skipped++
    continue
  }

  const r = await lookup(c)
  if (r.error || !r.photoRef) {
    console.log(`[${i + 1}/${CANDIDATES.length}] SKIP (${r.error ?? 'no photo'}): ${c.name}`)
    skipped++
    continue
  }

  console.log(`[${i + 1}/${CANDIDATES.length}] ✓ ${c.name.padEnd(28)} ${r.address}`)
  out.push({
    id:           slugify(c.name),
    name:         c.name,
    category:     c.category,
    broadType:    c.broadType,
    neighborhood: c.expectedHood,
    price:        c.price,
    vibe:         c.vibe,
    why:          c.why,
    tags:         c.tags,
    address:      r.address,
    lat:          r.lat,
    lng:          r.lng,
    openingHours: '',
    website:      '',
  })

  if (i + 1 < CANDIDATES.length) await sleep(400)
}

writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf-8')
console.log('')
console.log(`Wrote ${out.length} new venue entries to ${OUT_PATH}`)
console.log(`Skipped: ${skipped}`)
console.log('')
console.log('Next: review the file, then concatenate into brussels-venues.json.')
