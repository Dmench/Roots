// Read-only audit: compares brussels-venues.json against the
// venue_photo_cache table to report what's covered, what's missing, and
// whether any cached IDs no longer exist in the corpus (drift).
//
// Run:
//   node --env-file=.env.local scripts/audit-photo-cache.mjs
//
// Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in
// .env.local. No Google calls; no writes.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const VENUES_PATH = join(__dirname, '..', 'lib', 'data', 'static', 'brussels-venues.json')
const CITY_ID = 'brussels'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing env. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf-8'))
const venueIds = new Set(venues.map(v => v.id))

const { data: cacheRows, error } = await admin
  .from('venue_photo_cache')
  .select('venue_id, photo_ref, found_at')
  .eq('city_id', CITY_ID)

if (error) {
  console.error('Supabase error:', error.message)
  process.exit(1)
}

const cacheById = new Map(cacheRows.map(r => [r.venue_id, r]))
const cached = []
const cachedNull = []  // venue is in cache but photo_ref is null (Google had no photo)
const uncached = []
const orphaned = []    // in cache but not in current JSON

for (const v of venues) {
  const row = cacheById.get(v.id)
  if (!row) {
    uncached.push(v)
  } else if (row.photo_ref === null) {
    cachedNull.push({ ...v, foundAt: row.found_at })
  } else {
    cached.push({ ...v, photoRef: row.photo_ref, foundAt: row.found_at })
  }
}

for (const row of cacheRows) {
  if (!venueIds.has(row.venue_id)) orphaned.push(row)
}

console.log('=== Venue photo cache audit ===\n')
console.log(`Corpus (brussels-venues.json): ${venues.length} venues`)
console.log(`Cache rows for brussels:        ${cacheRows.length}`)
console.log('')
console.log(`✓ Cached with photoRef:  ${cached.length}`)
console.log(`○ Cached as null (Google had no photo): ${cachedNull.length}`)
console.log(`✗ Uncached (need lookup): ${uncached.length}`)
console.log(`⚠ Orphaned in cache (ID no longer in JSON): ${orphaned.length}`)
console.log('')

if (uncached.length) {
  console.log('--- Uncached venues (will need Google lookup) ---')
  for (const v of uncached.slice(0, 20)) {
    console.log(`  ${v.id.padEnd(40)} ${v.name}`)
  }
  if (uncached.length > 20) console.log(`  ... and ${uncached.length - 20} more`)
  console.log('')
}

if (cachedNull.length) {
  console.log('--- Cached as null (Google had no photo at time of lookup) ---')
  for (const v of cachedNull.slice(0, 10)) {
    console.log(`  ${v.id.padEnd(40)} ${v.name}`)
  }
  if (cachedNull.length > 10) console.log(`  ... and ${cachedNull.length - 10} more`)
  console.log('')
}

if (orphaned.length) {
  console.log('--- Orphaned cache entries (IDs not in current JSON) ---')
  for (const row of orphaned.slice(0, 10)) {
    console.log(`  ${row.venue_id}`)
  }
  if (orphaned.length > 10) console.log(`  ... and ${orphaned.length - 10} more`)
  console.log('')
}

console.log('Sample cached IDs (first 5):')
for (const v of cached.slice(0, 5)) {
  console.log(`  ${v.id.padEnd(40)} photoRef=${v.photoRef.slice(0, 30)}...`)
}
