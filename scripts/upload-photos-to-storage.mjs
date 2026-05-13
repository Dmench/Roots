// One-time backfill: downloads every cached photoRef from Google and
// uploads the JPEG bytes to Supabase Storage at venue-photos/{city}/{id}.jpg.
//
// After this runs, the live app serves photos directly from Supabase's
// edge CDN — no Google call per photo serve. The /api/places/photo
// route stays as a fallback for venues we haven't backfilled yet.
//
// Prereqs:
//   1. supabase/migration_venue_photos_storage.sql has been run.
//   2. venue_photo_cache is populated (run audit + backfill scripts first).
//
// Run:
//   DRY=1 node --env-file=.env.local scripts/upload-photos-to-storage.mjs
//   node --env-file=.env.local scripts/upload-photos-to-storage.mjs
//
// Cost: one Google Places Photo call per venue. Photo SKU is cheaper than
// Text Search (~€6/1000), so 80 photos ≈ €0.50. Quota: 80 against the
// daily cap.

import { createClient } from '@supabase/supabase-js'

const CITY_ID = 'brussels'
const BUCKET  = 'venue-photos'
const MAX_WIDTH = 640                 // bigger than the /api/places/photo proxy's 320 — Storage is permanent so we cache higher quality
const DELAY_MS = 400                  // serial pacing to dodge Google per-second limit (same as backfill-photo-cache)
const DRY      = process.env.DRY === '1'
const FORCE    = process.env.FORCE === '1'  // re-upload even if Storage already has the object

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const googleKey   = process.env.GOOGLE_PLACES_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars.')
  process.exit(1)
}
if (!googleKey && !DRY) {
  console.error('Missing GOOGLE_PLACES_API_KEY in .env.local.')
  process.exit(1)
}

const admin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// 1. Ensure the bucket exists. Public-read is enabled at creation time;
//    public buckets bypass RLS, so no additional policy work is needed.
{
  const { data: buckets, error: bucketsError } = await admin.storage.listBuckets()
  if (bucketsError) {
    console.error('Failed to list buckets:', bucketsError.message)
    process.exit(1)
  }
  const exists = buckets.some(b => b.id === BUCKET)
  if (!exists) {
    console.log(`Creating bucket "${BUCKET}" (public read)...`)
    const { error: createError } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 524288,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
    if (createError) {
      console.error('Failed to create bucket:', createError.message)
      process.exit(1)
    }
    console.log('Bucket created.')
  }
}

// 2. Read all cached photoRefs for this city
const { data: rows, error } = await admin
  .from('venue_photo_cache')
  .select('venue_id, photo_ref')
  .eq('city_id', CITY_ID)
  .not('photo_ref', 'is', null)

if (error) {
  console.error('Supabase read error:', error.message)
  process.exit(1)
}

// 3. Figure out which we still need to upload
//    (Storage list is O(1) per directory; cheaper than per-object HEAD.)
const { data: existingObjects, error: listError } = await admin.storage
  .from(BUCKET)
  .list(CITY_ID, { limit: 1000 })

if (listError) {
  console.error('Storage list error:', listError.message)
  process.exit(1)
}

const existing = new Set((existingObjects ?? []).map(o => o.name))

const targets = rows.filter(r => {
  const objectName = `${r.venue_id}.jpg`
  return FORCE || !existing.has(objectName)
})

console.log(`Cache rows with photoRef:  ${rows.length}`)
console.log(`Already in Storage:        ${existing.size}`)
console.log(`To upload this run:        ${targets.length}`)
console.log(`Mode:                      ${DRY ? 'DRY RUN' : 'LIVE'}${FORCE ? ' + FORCE re-upload' : ''}`)
console.log('')

if (targets.length === 0) {
  console.log('Nothing to do — Storage is fully populated.')
  process.exit(0)
}

if (DRY) {
  for (const r of targets) {
    console.log(`  would upload  ${CITY_ID}/${r.venue_id}.jpg  (photoRef len ${r.photo_ref.length})`)
  }
  console.log('\n(Drop DRY=1 to actually run.)')
  process.exit(0)
}

// 3. Serial fetch+upload to keep Google rate limit happy

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchPhoto(photoRef) {
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${MAX_WIDTH}&photo_reference=${encodeURIComponent(photoRef)}&key=${googleKey}`
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) {
    return { bytes: null, error: `Google HTTP ${res.status}` }
  }
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) {
    return { bytes: null, error: `Unexpected content-type ${contentType}` }
  }
  const buf = Buffer.from(await res.arrayBuffer())
  return { bytes: buf, contentType, error: null }
}

async function uploadOne({ venue_id, photo_ref }, idx, total) {
  const { bytes, contentType, error } = await fetchPhoto(photo_ref)
  if (error) {
    console.log(`[${String(idx + 1).padStart(2)}/${total}] ${venue_id.padEnd(38)} ⚠ fetch failed: ${error}`)
    return { id: venue_id, ok: false, error }
  }

  const path = `${CITY_ID}/${venue_id}.jpg`
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: contentType ?? 'image/jpeg',
      upsert: true,
      cacheControl: '31536000',  // 1 year — photoRefs are stable until we explicitly re-backfill
    })

  if (upErr) {
    console.log(`[${String(idx + 1).padStart(2)}/${total}] ${venue_id.padEnd(38)} ⚠ upload failed: ${upErr.message}`)
    return { id: venue_id, ok: false, error: upErr.message }
  }

  console.log(`[${String(idx + 1).padStart(2)}/${total}] ${venue_id.padEnd(38)} ✓ ${bytes.length.toString().padStart(6)} bytes uploaded`)
  return { id: venue_id, ok: true, bytes: bytes.length }
}

const results = []
for (let i = 0; i < targets.length; i++) {
  results.push(await uploadOne(targets[i], i, targets.length))
  if (i + 1 < targets.length) await sleep(DELAY_MS)
}

const ok      = results.filter(r => r.ok).length
const errs    = results.filter(r => !r.ok).length
const totalKB = Math.round(results.filter(r => r.ok).reduce((sum, r) => sum + r.bytes, 0) / 1024)

console.log('')
console.log('=== Upload complete ===')
console.log(`Uploaded:   ${ok}`)
console.log(`Errors:     ${errs}`)
console.log(`Total size: ${totalKB} KB`)
console.log('')
console.log('Public URL pattern:')
console.log(`  ${supabaseUrl}/storage/v1/object/public/${BUCKET}/${CITY_ID}/{venue_id}.jpg`)
