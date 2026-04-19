import { NextRequest, NextResponse } from 'next/server'
import { createUserClient } from '@/lib/supabase/server'

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? ''
  return auth.startsWith('Bearer ') ? auth.slice(7) : null
}

/** GET /api/events/save?cityId=brussels — returns array of saved event_ids for the user */
export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cityId = req.nextUrl.searchParams.get('cityId') ?? ''

  const sb = createUserClient(token)
  const { data, error } = await sb
    .from('saved_events')
    .select('event_id')
    .eq('city_id', cityId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ savedIds: data.map(r => r.event_id) })
}

/** POST /api/events/save — save an event */
export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event, cityId } = await req.json()
  if (!event?.id || !cityId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const sb = createUserClient(token)
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await sb.from('saved_events').upsert({
    user_id:  user.id,
    city_id:  cityId,
    event_id: event.id,
    title:    event.title,
    date:     event.date,
    time:     event.time ?? '',
    venue:    event.venue ?? '',
    source:   event.source,
    url:      event.url,
    image:    event.image ?? null,
    date_ts:  event.dateTs,
  }, { onConflict: 'user_id,event_id', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** DELETE /api/events/save — unsave an event */
export async function DELETE(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { eventId } = await req.json()
  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

  const sb = createUserClient(token)
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await sb.from('saved_events').delete()
    .eq('user_id', user.id)
    .eq('event_id', eventId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
