// One-off enrichment: for any venue in brussels-venues.json with a
// placeholder address ("verify"), missing lat/lng, or unknown neighborhood,
// hit Google Places Text Search and fill those fields in.
//
// Mirrors backfill-photo-cache.mjs in style and Google quota usage —
// one Text Search call per venue (~€16/1000).
//
// Run:
//   DRY=1 node --env-file=.env.local scripts/enrich-new-venues.mjs   (preview)
//   node --env-file=.env.local scripts/enrich-new-venues.mjs         (writes)
//
// Optional flag:
//   IDS=curated-nom-pow,curated-kafei   only enrich these specific ids

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname    = dirname(fileURLToPath(import.meta.url))
const VENUES_PATH  = join(__dirname, '..', 'lib', 'data', 'static', 'brussels-venues.json')
const CITY_NAME    = 'Brussels'
const DRY          = process.env.DRY === '1'
const ID_FILTER    = (process.env.IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)
const DELAY_MS     = 400  // gentle pacing — same as backfill-photo-cache

const googleKey = process.env.GOOGLE_PLACES_API_KEY
if (!googleKey) {
  console.error('Missing GOOGLE_PLACES_API_KEY in .env.local.')
  process.exit(1)
}

// Same rough Brussels neighbourhood inference as lib/data/scout.ts.
// Kept inline so this script is self-contained.
function guessNeighborhood(lat, lng) {
  if (lat > 50.875 && lng < 4.32)  return 'Laeken'
  if (lat > 50.875)                return 'Schaerbeek'
  if (lat > 50.865 && lng < 4.35)  return 'Molenbeek'
  if (lat > 50.865)                return 'Saint-Josse'
  if (lat < 50.820 && lng < 4.34)  return 'Forest'
  if (lat < 50.820 && lng > 4.40)  return 'Etterbeek'
  if (lat < 50.822)                return 'Uccle'
  if (lng < 4.33)                  return 'Anderlecht'
  if (lng > 4.42)                  return 'Woluwe'
  if (lat > 50.851 && lng > 4.36)  return 'EU Quarter'
  if (lat > 50.848)                return 'City Centre'
  if (lat > 50.840 && lng < 4.348) return 'Marolles'
  if (lat > 50.836 && lng < 4.355) return 'Dansaert'
  if (lat > 50.833 && lng < 4.358) return 'Saint-Géry'
  if (lng < 4.348 && lat < 50.833) return 'Saint-Gilles'
  if (lat > 50.828 && lng > 4.372) return 'Flagey'
  if (lat > 50.832 && lng > 4.358) return 'Châtelain'
  return 'Ixelles'
}

const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf-8'))

function needsEnrichment(v) {
  if (ID_FILTER.length > 0) return ID_FILTER.includes(v.id)
  if (typeof v.lat !== 'number' || typeof v.lng !== 'number') return true
  if (!v.address || /verify|tbd/i.test(v.address))            return true
  return false
}

const targets = venues.filter(needsEnrichment)

console.log(`Targets: ${targets.length} venues`)
console.log(`Mode: ${DRY ? 'DRY RUN' : 'LIVE'}`)
console.log('')

if (targets.length === 0) {
  console.log('Nothing to enrich.')
  process.exit(0)
}

async function lookup(v) {
  // Strongest query we can build: name + city. The Brussels-only fallback
  // bias is in the location/radius params.
  const params = new URLSearchParams({
    query:    `${v.name} ${CITY_NAME}`,
    location: '50.8503,4.3517',
    radius:   '15000',
    key:      googleKey,
  })
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
  try {
    const res = await fetch(url)
    if (!res.ok) return { error: `HTTP ${res.status}` }
    const json = await res.json()
    if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      return { error: `status ${json.status}` }
    }
    const top = json.results?.[0]
    if (!top) return { error: 'no results' }
    return {
      address:  (top.formatted_address ?? '').replace(/, Belgium.*$/, '').trim(),
      lat:      top.geometry?.location?.lat ?? null,
      lng:      top.geometry?.location?.lng ?? null,
      placeId:  top.place_id ?? null,
      photoRef: top.photos?.[0]?.photo_reference ?? null,
    }
  } catch (err) {
    return { error: err.message }
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const updated = new Map()

for (let i = 0; i < targets.length; i++) {
  const v = targets[i]
  const result = await lookup(v)
  if (result.error) {
    console.log(`[${i + 1}/${targets.length}] ${v.id.padEnd(38)} ERROR (${result.error})`)
  } else {
    const hood = result.lat && result.lng ? guessNeighborhood(result.lat, result.lng) : v.neighborhood
    console.log(`[${i + 1}/${targets.length}] ${v.id.padEnd(38)} ✓ ${result.address}`)
    console.log(`                                            ${hood}  (${result.lat?.toFixed(4)}, ${result.lng?.toFixed(4)})`)
    updated.set(v.id, {
      ...v,
      address:      result.address || v.address,
      lat:          result.lat ?? v.lat,
      lng:          result.lng ?? v.lng,
      neighborhood: hood,
    })
  }
  if (i + 1 < targets.length) await sleep(DELAY_MS)
}

if (DRY) {
  console.log('')
  console.log(`Would update ${updated.size} venues. Re-run without DRY=1 to write.`)
  process.exit(0)
}

// Merge updates back into the full venues array — preserve original order.
const next = venues.map(v => updated.get(v.id) ?? v)
writeFileSync(VENUES_PATH, JSON.stringify(next, null, 2) + '\n', 'utf-8')

console.log('')
console.log(`Wrote ${updated.size} enrichments to ${VENUES_PATH}`)
console.log('')
console.log('Next: run backfill-photo-cache.mjs to fetch photoRefs for these venues.')
console.log('  node --env-file=.env.local scripts/backfill-photo-cache.mjs')
