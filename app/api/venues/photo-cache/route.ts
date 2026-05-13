import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Returns the venue_photo_cache rows for a city as a single object keyed by
// venue_id. /eat (a client component, can't use admin client directly)
// hits this once on mount and merges cached photoRefs into its venue state.
//
// Cheap: one Supabase read, no Google call, ~5 min CDN cache. Never burns
// quota — by design, only reads from the persistent cache the server-side
// enrichCurated() populates.
//
// Shape: { "venue_id_1": "photoRef" | null, "venue_id_2": "photoRef" | null, ... }
export async function GET(req: NextRequest) {
  const cityId = req.nextUrl.searchParams.get('cityId') ?? 'brussels'

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('venue_photo_cache')
      .select('venue_id, photo_ref')
      .eq('city_id', cityId)

    if (error || !data) {
      return NextResponse.json({}, { headers: { 'Cache-Control': 'public, max-age=60' } })
    }

    const cache: Record<string, string | null> = {}
    for (const row of data) {
      cache[row.venue_id as string] = (row.photo_ref as string | null) ?? null
    }

    return NextResponse.json(cache, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    })
  } catch {
    // Cache table doesn't exist yet, or admin client failed — return empty.
    return NextResponse.json({}, { headers: { 'Cache-Control': 'public, max-age=60' } })
  }
}
