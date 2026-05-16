import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createUserClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const ALLOWED_REASONS = ['spam', 'harassment', 'off-topic', 'wrong-info'] as const

// POST /api/posts/report
// body: { post_id: string, reason: 'spam' | 'harassment' | 'off-topic' | 'wrong-info' }
//
// Records one report from this user on this post. The UNIQUE constraint
// on (post_id, reporter_id) silently blocks duplicate reports — we treat
// that as a no-op success so the UI doesn't leak who already reported.
//
// Three distinct reports auto-hide the post from /connect via the
// posts_hidden_by_reports view; the founder reviews the queue manually.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') ?? ''
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: { user } } = await createUserClient(token).auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Rate limit per user — 10 reports/min is well above any plausible
  // legitimate use, but caps brigading attempts.
  const { ok } = await rateLimit(`post-report:${user.id}`, { max: 10, windowMs: 60_000 })
  if (!ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  let body: { post_id?: string; reason?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }

  const postId = body.post_id
  const reason = body.reason
  if (!postId || !reason || !ALLOWED_REASONS.includes(reason as typeof ALLOWED_REASONS[number])) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const { error: insertErr } = await admin
      .from('post_reports')
      .insert({
        post_id:     postId,
        reporter_id: user.id,
        reason,
        created_at:  new Date().toISOString(),
      })

    // Duplicate (23505) is fine — user already reported this post; UI gets
    // the same "thanks" toast either way.
    if (insertErr && insertErr.code !== '23505') {
      console.error('[posts report] insert error:', insertErr.message)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[posts report]', err)
    return NextResponse.json({ error: 'unexpected' }, { status: 500 })
  }
}
