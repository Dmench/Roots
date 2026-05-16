import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createUserClient } from '@/lib/supabase/server'

// GET /api/matchup?city=brussels
//
// Returns the currently-active weekly matchup for a city, with aggregate
// vote counts and the requesting user's vote (if any). Returns null when
// no matchup is active — the component renders nothing in that case.
//
// Shape:
//   { matchup: null }
//   { matchup: { id, week_start, option_a_label, option_b_label,
//                option_a_venue_id, option_b_venue_id, context,
//                counts: { a: number, b: number },
//                userVote: 'a' | 'b' | null } }
//
// Cache: short — vote counts move in real-time during peak voting windows.
// 30s is enough to absorb a thundering herd but not stale enough to feel
// dead.
export async function GET(req: NextRequest) {
  const cityId = req.nextUrl.searchParams.get('city') ?? 'brussels'

  // Optional auth — we still serve the matchup unauth'd readers, but
  // skip the userVote field.
  const authHeader = req.headers.get('Authorization') ?? ''
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  let userId: string | null = null
  if (token) {
    try {
      const { data: { user } } = await createUserClient(token).auth.getUser()
      userId = user?.id ?? null
    } catch { /* unauth — that's fine */ }
  }

  try {
    const admin = createAdminClient()

    // 1. Active matchup for the city (unique index guarantees ≤1 row)
    const { data: matchup, error: mErr } = await admin
      .from('weekly_matchups')
      .select('id, week_start, option_a_label, option_b_label, option_a_venue_id, option_b_venue_id, context')
      .eq('city_id', cityId)
      .eq('active', true)
      .maybeSingle()

    if (mErr || !matchup) {
      return NextResponse.json({ matchup: null }, {
        headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' },
      })
    }

    // 2. Vote counts — one round-trip, group on the client side.
    const { data: votes } = await admin
      .from('matchup_votes')
      .select('choice')
      .eq('matchup_id', matchup.id)

    const counts = { a: 0, b: 0 }
    for (const v of votes ?? []) {
      if (v.choice === 'a') counts.a++
      else if (v.choice === 'b') counts.b++
    }

    // 3. User's own vote (only if authed)
    let userVote: 'a' | 'b' | null = null
    if (userId) {
      const { data: own } = await admin
        .from('matchup_votes')
        .select('choice')
        .eq('matchup_id', matchup.id)
        .eq('user_id', userId)
        .maybeSingle()
      userVote = (own?.choice as 'a' | 'b' | undefined) ?? null
    }

    return NextResponse.json(
      { matchup: { ...matchup, counts, userVote } },
      { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' } },
    )
  } catch (err) {
    console.error('[matchup]', err)
    return NextResponse.json({ matchup: null }, { status: 500 })
  }
}
