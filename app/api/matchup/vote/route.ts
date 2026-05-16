import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createUserClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

// POST /api/matchup/vote
// body: { matchup_id: string, choice: 'a' | 'b' }
//
// Upserts the user's vote. PK (matchup_id, user_id) means revoting just
// changes the choice — no duplicate rows. Returns the updated aggregate
// vote counts so the UI can flip to results immediately.
export async function POST(req: NextRequest) {
  // Auth
  const authHeader = req.headers.get('Authorization') ?? ''
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: { user } } = await createUserClient(token).auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Rate limit — per user, 30/min covers normal use and absorbs accidental
  // double-taps without throttling legitimate revoting.
  const { ok } = await rateLimit(`matchup-vote:${user.id}`, { max: 30, windowMs: 60_000 })
  if (!ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  let body: { matchup_id?: string; choice?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }

  const matchupId = body.matchup_id
  const choice    = body.choice
  if (!matchupId || (choice !== 'a' && choice !== 'b')) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()

    // Confirm the matchup is active before accepting the vote. Stale matchups
    // shouldn't take new votes.
    const { data: matchup } = await admin
      .from('weekly_matchups')
      .select('id, active')
      .eq('id', matchupId)
      .maybeSingle()
    if (!matchup || !matchup.active) {
      return NextResponse.json({ error: 'matchup_not_active' }, { status: 404 })
    }

    const { error: upErr } = await admin
      .from('matchup_votes')
      .upsert({
        matchup_id: matchupId,
        user_id:    user.id,
        choice,
        created_at: new Date().toISOString(),
      }, { onConflict: 'matchup_id,user_id' })

    if (upErr) {
      console.error('[matchup vote] upsert error:', upErr.message)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }

    // Fresh count after the write
    const { data: votes } = await admin
      .from('matchup_votes')
      .select('choice')
      .eq('matchup_id', matchupId)

    const counts = { a: 0, b: 0 }
    for (const v of votes ?? []) {
      if (v.choice === 'a') counts.a++
      else if (v.choice === 'b') counts.b++
    }

    return NextResponse.json({ ok: true, counts, userVote: choice })
  } catch (err) {
    console.error('[matchup vote]', err)
    return NextResponse.json({ error: 'unexpected' }, { status: 500 })
  }
}
