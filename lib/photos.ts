const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

// Public URL for a cached venue photo in Supabase Storage.
//
// Photos are uploaded by `scripts/upload-photos-to-storage.mjs` and served
// from Supabase's edge CDN — no Google call per request, no quota burn,
// no edge-region cold-start lottery. The bucket is public-read, so this
// URL works directly in <img src>.
//
// If the file isn't in Storage yet (new venue, partial backfill, etc.),
// Supabase returns 404. Components should use this URL as the primary
// source and fall back to `/api/places/photo?ref=<photoRef>` via the
// <img onError> handler — that proxy hits Google as last resort.
export function venuePhotoUrl(cityId: string, venueId: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/venue-photos/${cityId}/${venueId}.jpg`
}
