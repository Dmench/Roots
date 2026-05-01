import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ city: string }> },
) {
  const { city: cityId } = await params

  try {
    const admin = createAdminClient()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Total directory-visible settlers in this city (all time)
    const { count: allTotal } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', cityId)
      .eq('show_in_directory', true)

    // Recent settlers (last 30 days, with display name) for the strip
    const { data, count: recentCount } = await admin
      .from('profiles')
      .select('display_name, stage, neighborhood', { count: 'exact' })
      .eq('city_id', cityId)
      .eq('show_in_directory', true)
      .not('display_name', 'is', null)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(12)

    return NextResponse.json({
      settlers: data ?? [],
      total: allTotal ?? 0,          // all-time total for the "settling now" count
      recentTotal: recentCount ?? 0, // last 30 days for the strip label
    })
  } catch (err) {
    console.error('[settlers API]', err)
    return NextResponse.json({ settlers: [], total: 0, recentTotal: 0 })
  }
}
