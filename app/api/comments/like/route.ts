import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createUserClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

// POST /api/comments/like  body: { comment_id: string }
//
// Toggle endpoint — same pattern as /api/posts/helpful. Returns fresh
// count + own-state so the UI can render immediately.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') ?? ''
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: { user } } = await createUserClient(token).auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { ok } = await rateLimit(`comment-like:${user.id}`, { max: 120, windowMs: 60_000 })
  if (!ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  let body: { comment_id?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }
  const commentId = body.comment_id
  if (!commentId) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  try {
    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('comment_likes')
      .select('comment_id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .maybeSingle()

    let liked: boolean
    if (existing) {
      await admin.from('comment_likes').delete()
        .eq('comment_id', commentId).eq('user_id', user.id)
      liked = false
    } else {
      await admin.from('comment_likes').insert({
        comment_id: commentId, user_id: user.id, created_at: new Date().toISOString(),
      })
      liked = true
    }

    const { count } = await admin
      .from('comment_likes')
      .select('comment_id', { count: 'exact', head: true })
      .eq('comment_id', commentId)

    return NextResponse.json({ liked, count: count ?? 0 })
  } catch (err) {
    console.error('[comments like]', err)
    return NextResponse.json({ error: 'unexpected' }, { status: 500 })
  }
}
