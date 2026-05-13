// One-time backfill: fills venue_photo_cache for any Brussels venue
// that's either uncached OR cached as null (the original lookup used a
// weak `${name} Brussels` query and produced false negatives for Fuse,
// Delirium, La Paix, etc.). This version queries with name + address
// + city for much better matching.
//
// Run:
//   DRY=1 node --env-file=.env.local scripts/backfill-photo-cache.mjs
//   node --env-file=.env.local scripts/backfill-photo-cache.mjs       (actually writes)
//
// Cost: ~1 Google Places Text Search call per venue. Text Search SKU
// is ~€16/1000, so 50 venues ≈ €0.80. Quota-friendly.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const VENUES_PATH = join(__dirname, '..', 'lib', 'data', 'static', 'brussels-venues.json')
const CITY_ID = 'brussels'
const CITY_NAME = 'Brussels'

const DRY = process.env.DRY === '1'
const CONCURRENCY = 4
const DELAY_MS = 250  // gentle on Google rate limits

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const googleKey   = process.env.GOOGLE_PLACES_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars.')
  process.exit(1)
}
if (!googleKey) {
  console.error('Missing GOOGLE_PLACES_API_KEY in .env.local.')
  process.exit(1)
}

const admin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf-8'))

const { data: cacheRows, error } = await admin
  .from('venue_photo_cache')
  .select('venue_id, photo_ref')
  .eq('city_id', CITY_ID)

if (error) {
  console.error('Supabase read error:', error.message)
  process.exit(1)
}

const cacheById = new Map(cacheRows.map(r => [r.venue_id, r.photo_ref]))

// Targets: uncached OR cached-as-null. Both deserve a fresh attempt
// with the stronger query (name + address + city).
const targets = venues.filter(v => {
  if (!cacheById.has(v.id)) return true              // never queried
  if (cacheById.get(v.id) === null) return true       // queried but missed — retry
  return false                                        // has a photoRef already, skip
})

console.log(`Targets: ${targets.length} (uncached + null-cached)`)
console.log(`Mode: ${DRY ? 'DRY RUN (no writes, no Google calls)' : 'LIVE'}`)
console.log('')

if (targets.length === 0) {
  console.log('Nothing to do — cache is fully populated.')
  process.exit(0)
}

if (DRY) {
  console.log('Would query Google for these venues:')
  for (const v of targets) {
    const q = buildQuery(v)
    console.log(`  ${v.id.padEnd(38)} -> "${q}"`)
  }
  console.log('\n(Set DRY=0 or omit DRY to actually run.)')
  process.exit(0)
}

function buildQuery(v) {
  const addr = (v.address ?? '').trim()
  const hood = (v.neighborhood ?? '').trim()
  // Prefer specific address; fall back to neighborhood. Always include city.
  const loc = addr || hood
  return loc ? `${v.name} ${loc} ${CITY_NAME}` : `${v.name} ${CITY_NAME}`
}

async function lookup(v) {
  const query = buildQuery(v)
  const params = new URLSearchParams({
    query,
    fields: 'place_id,photos',
    key: googleKey,
  })
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return { v, photoRef: null, error: `HTTP ${res.status}` }
    }
    const json = await res.json()
    if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      return { v, photoRef: null, error: `status ${json.status}` }
    }
    const photoRef = json.results?.[0]?.photos?.[0]?.photo_reference ?? null
    return { v, photoRef, error: null }
  } catch (err) {
    return { v, photoRef: null, error: err.message }
  }
}

async function processOne(v, idx, total) {
  const { photoRef, error } = await lookup(v)
  const verdict = error
    ? `ERROR (${error})`
    : photoRef ? `✓ photoRef (${photoRef.slice(0, 20)}...)` : '○ null (no photo)'
  console.log(`[${String(idx + 1).padStart(2)}/${total}] ${v.id.padEnd(38)} ${verdict}`)

  // Only upsert on a real Google answer (success or zero-results). On a
  // transient failure — rate limit, network blip, bad-key — leave the
  // cache row alone so a future run retries cleanly instead of treating
  // the transient failure as a permanent miss.
  if (error) return { id: v.id, photoRef, error }

  const { error: writeErr } = await admin
    .from('venue_photo_cache')
    .upsert({
      venue_id:  v.id,
      city_id:   CITY_ID,
      photo_ref: photoRef,
      found_at:  new Date().toISOString(),
      last_used: new Date().toISOString(),
    })
  if (writeErr) {
    console.log(`         ⚠ write failed: ${writeErr.message}`)
  }
  return { id: v.id, photoRef, error }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

const results = []
for (let i = 0; i < targets.length; i += CONCURRENCY) {
  const batch = targets.slice(i, i + CONCURRENCY)
  const batchResults = await Promise.all(
    batch.map((v, j) => processOne(v, i + j, targets.length)),
  )
  results.push(...batchResults)
  if (i + CONCURRENCY < targets.length) await sleep(DELAY_MS)
}

const ok    = results.filter(r => r.photoRef).length
const miss  = results.filter(r => !r.photoRef && !r.error).length
const errs  = results.filter(r => r.error).length

console.log('')
console.log('=== Backfill complete ===')
console.log(`Got a photoRef:  ${ok}`)
console.log(`Genuine misses:  ${miss}`)
console.log(`Errors:          ${errs}`)
console.log('')
console.log('Re-run scripts/audit-photo-cache.mjs to verify final state.')
