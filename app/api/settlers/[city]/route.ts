import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ city: string }> },
) {
  const { city: cityId } = await params

  try {
    const admin        = createAdminClient()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data, count } = await admin
      .from('profiles')
      .select('display_name, stage, neighborhood', { count: 'exact' })
      .eq('city_id', cityId)
      .eq('show_in_directory', true)
      .not('display_name', 'is', null)
      .gte('joined_at', thirtyDaysAgo)
      .order('joined_at', { ascending: false })
      .limit(12)

    return NextResponse.json({ settlers: data ?? [], total: count ?? 0 })
  } catch {
    return NextResponse.json({ settlers: [], total: 0 })
  }
}
