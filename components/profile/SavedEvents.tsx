'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'

interface SavedRow {
  event_id: string
  title:    string
  date:     string
  time:     string | null
  venue:    string | null
  source:   string | null
  url:      string | null
  image:    string | null
  date_ts:  number
}

const SOURCE_COLOR: Record<string, string> = {
  'Magasin 4': '#E8001E', 'Botanique': '#2D7D46', 'Flagey': '#C8900A',
  'Halles de Schaerbeek': '#9B4DCA', 'Recyclart': '#E84B1A', 'La Monnaie': '#B8860B',
  'Ticketmaster': '#0073E6', 'Visit Brussels': '#FF3EBA', 'Bruxelles Brûle': '#FF6B00',
  'Meetup': '#E1523D', 'Eventbrite': '#F05537',
}

interface Props {
  /** Current user's city (used for filtering — saved events span cities). */
  cityId?: string
}

// Lists the user's saved events as a horizontal scrolling strip on the profile.
// Reads directly from Supabase via RLS — no extra API surface needed. Splits
// upcoming from past so the upcoming row is what catches the eye.
// Empty state nudges to the city hub where Save buttons live.
export function SavedEvents({ cityId }: Props) {
  const { user } = useAuth()
  const [events, setEvents] = useState<SavedRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !user) { setLoading(false); return }
    const sb = supabase
    let q = sb
      .from('saved_events')
      .select('event_id, title, date, time, venue, source, url, image, date_ts')
      .eq('user_id', user.id)
      .order('date_ts', { ascending: true })
    if (cityId) q = q.eq('city_id', cityId)

    q.then(({ data, error }) => {
      if (error) {
        console.error('[saved-events]', error.code, error.message)
        setLoading(false)
        return
      }
      setEvents((data ?? []) as SavedRow[])
      setLoading(false)
    })
  }, [user, cityId])

  async function unsave(eventId: string) {
    if (!supabase || !user) return
    // Optimistic remove
    setEvents(prev => prev.filter(e => e.event_id !== eventId))
    await supabase.from('saved_events').delete()
      .eq('user_id', user.id)
      .eq('event_id', eventId)
  }

  const now      = Date.now() / 1000
  const upcoming = events.filter(e => e.date_ts >= now)
  // Auto-clean: silently drop past events from Supabase so they don't clutter
  // the next render. Pure cleanup — no UX implication beyond the strip
  // staying tight to actually-upcoming things.
  useEffect(() => {
    if (!supabase || !user) return
    const stale = events.filter(e => e.date_ts < now).map(e => e.event_id)
    if (stale.length === 0) return
    supabase.from('saved_events').delete()
      .eq('user_id', user.id)
      .in('event_id', stale)
      .then(({ error }) => {
        if (error) console.warn('[saved-events] cleanup:', error.message)
      })
  }, [events, user, now])

  if (loading) {
    return (
      <section className="mt-10">
        <div className="flex items-baseline justify-between mb-4 pb-2"
          style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase"
            style={{ color: 'rgba(10,10,10,0.4)' }}>Saved events</p>
        </div>
        <div className="flex gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="w-44 h-32 animate-pulse"
              style={{ background: 'rgba(10,10,10,0.04)' }} />
          ))}
        </div>
      </section>
    )
  }

  if (upcoming.length === 0) {
    return (
      <section className="mt-12">
        <div className="flex items-baseline justify-between mb-5 pb-3"
          style={{ borderBottom: '2px solid #0A0A0A' }}>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase"
            style={{ color: '#0A0A0A' }}>Saved events</p>
        </div>
        <div className="px-6 py-10 flex items-center gap-5"
          style={{ border: '1px dashed rgba(10,10,10,0.15)', background: '#FAFAF7' }}>
          <div className="shrink-0 flex items-center justify-center"
            style={{ width: 56, height: 56, background: 'rgba(255,62,186,0.08)', border: '1px dashed rgba(255,62,186,0.3)' }}>
            <span style={{ fontSize: 20, color: '#FF3EBA' }}>♥</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold mb-1" style={{ color: '#0A0A0A' }}>
              No upcoming events saved.
            </p>
            <p className="text-sm leading-relaxed max-w-md" style={{ color: 'rgba(10,10,10,0.55)' }}>
              Tap the heart on any event in your city hub to save it. They&apos;ll show up here and in your weekly digest. Past events are removed automatically.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between mb-5 pb-3"
        style={{ borderBottom: '2px solid #0A0A0A' }}>
        <p className="text-[10px] font-black tracking-[0.25em] uppercase"
          style={{ color: '#0A0A0A' }}>Saved events</p>
        <p className="text-[10px] font-black tracking-[0.18em] uppercase"
          style={{ color: '#FF3EBA' }}>
          {upcoming.length} upcoming
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {upcoming.map(e => <SavedCard key={e.event_id} ev={e} onRemove={unsave} />)}
      </div>
    </section>
  )
}

function SavedCard({ ev, onRemove }: {
  ev: SavedRow
  onRemove: (id: string) => void
}) {
  const color = ev.source ? (SOURCE_COLOR[ev.source] ?? '#4744C8') : '#4744C8'
  return (
    <div className="group flex flex-col"
      style={{ border: '1px solid rgba(10,10,10,0.08)', background: '#FFFFFF' }}>
      {/* Image OR colour block */}
      <div className="relative h-28 overflow-hidden shrink-0" style={{ background: color + '12' }}>
        {ev.image ? (
          <Image src={ev.image} alt="" fill sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-black tracking-widest uppercase" style={{ color }}>
              {ev.source}
            </span>
          </div>
        )}
        <button
          onClick={() => onRemove(ev.event_id)}
          aria-label="Remove from saved"
          className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}>
          ✕
        </button>
      </div>

      {/* Body */}
      <a href={ev.url ?? '#'} target="_blank" rel="noopener noreferrer"
        className="px-3.5 py-3.5 flex-1 flex flex-col hover:opacity-80 transition-opacity">
        <p className="text-[9px] font-black tracking-widest uppercase mb-1.5" style={{ color }}>
          {ev.source ?? 'Event'}
        </p>
        <p className="text-[13px] font-bold leading-snug line-clamp-2 mb-2"
          style={{ color: '#0A0A0A' }}>
          {ev.title}
        </p>
        <p className="text-[10px] mt-auto" style={{ color: 'rgba(10,10,10,0.45)' }}>
          {ev.date}{ev.time && <span className="opacity-70 ml-1">{ev.time}</span>}
        </p>
      </a>
    </div>
  )
}
