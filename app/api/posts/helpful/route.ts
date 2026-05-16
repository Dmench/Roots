import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createUserClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

// POST /api/posts/helpful  body: { post_id: string }
//
// Toggle: if the user hasn't marked this post helpful, add the row;
// if they have, remove it. Returns the fresh count + new own-state so
// the UI can update optimistically without a second round-trip.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') ?? ''
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: { user } } = await createUserClient(token).auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { ok } = await rateLimit(`post-helpful:${user.id}`, { max: 60, windowMs: 60_000 })
  if (!ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  let body: { post_id?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }
  const postId = body.post_id
  if (!postId) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  try {
    const admin = createAdminClient()

    // Check current state
    const { data: existing } = await admin
      .from('post_helpful')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle()

    let helpful: boolean
    if (existing) {
      await admin.from('post_helpful').delete()
        .eq('post_id', postId).eq('user_id', user.id)
      helpful = false
    } else {
      await admin.from('post_helpful').insert({
        post_id: postId, user_id: user.id, created_at: new Date().toISOString(),
      })
      helpful = true
    }

    const { count } = await admin
      .from('post_helpful')
      .select('post_id', { count: 'exact', head: true })
      .eq('post_id', postId)

    return NextResponse.json({ helpful, count: count ?? 0 })
  } catch (err) {
    console.error('[posts helpful]', err)
    return NextResponse.json({ error: 'unexpected' }, { status: 500 })
  }
}
