'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { EventComposer } from '@/components/connect/EventComposer'
import { EventCard } from '@/components/connect/EventCard'
import { AuthModal } from '@/components/auth/AuthModal'
import type { Post, PostCategory, Stage, CityId } from '@/lib/types'

interface Props {
  cityId:   CityId
  cityName: string
}

function formatRelative(dateStr: string): string {
  const d    = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Dedicated Events page — mirrors the Housing pattern. Settler-posted
// events live here; scraped visitbrussels events live on the Hub feed.
// Two surfaces, two registers — supply (here) vs city signal (Hub).
export function EventsPageClient({ cityId, cityName }: Props) {
  const [posts,    setPosts]    = useState<Post[]>([])
  const [loaded,   setLoaded]   = useState(false)
  const [filter,   setFilter]   = useState<'all' | 'thisweek' | 'later'>('all')
  const [authOpen, setAuthOpen] = useState(false)
  const [reported, setReported] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    sb.from('posts')
      .select('*')
      .eq('city_id', cityId)
      .eq('category', 'event')
      .order('event_date', { ascending: true })
      .limit(100)
      .then(({ data, error }) => {
        setLoaded(true)
        if (error) {
          if (error.code === '23514' || error.code === '42703' || error.code === '42P01') return
          return
        }
        if (!data) return
        setPosts(data.map(p => ({
          id: p.id,
          cityId: p.city_id,
          stage: p.stage ?? undefined,
          category: p.category as PostCategory,
          text: p.text,
          time: formatRelative(p.created_at),
          authorStage: p.author_stage ?? undefined,
          neighborhood: p.neighborhood ?? undefined,
          title:      p.title       ?? undefined,
          photoUrl:   p.photo_url   ?? undefined,
          eventDate:  p.event_date  ?? undefined,
          eventVenue: p.event_venue ?? undefined,
          eventUrl:   p.event_url   ?? undefined,
        })))
      })
  }, [cityId])

  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    const ch = sb
      .channel(`events-${cityId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `city_id=eq.${cityId}` },
        (payload) => {
          const r = payload.new as {
            id: string; city_id: string; stage: string | null; category: string;
            text: string; created_at: string; author_stage: string | null;
            neighborhood: string | null; title: string | null;
            photo_url: string | null; event_date: string | null;
            event_venue: string | null; event_url: string | null;
          }
          if (r.category !== 'event') return
          setPosts(prev => {
            if (prev.some(p => p.id === r.id)) return prev
            const next: Post = {
              id: r.id, cityId: r.city_id as CityId,
              stage: (r.stage as Stage | null) ?? undefined,
              category: 'event' as PostCategory,
              text: r.text, time: formatRelative(r.created_at),
              authorStage: (r.author_stage as Stage | null) ?? undefined,
              neighborhood: r.neighborhood ?? undefined,
              title:      r.title       ?? undefined,
              photoUrl:   r.photo_url   ?? undefined,
              eventDate:  r.event_date  ?? undefined,
              eventVenue: r.event_venue ?? undefined,
              eventUrl:   r.event_url   ?? undefined,
            }
            // Insert in date order — earliest first
            const out = [...prev, next].sort((a, b) => {
              const ad = a.eventDate ? new Date(a.eventDate).getTime() : 0
              const bd = b.eventDate ? new Date(b.eventDate).getTime() : 0
              return ad - bd
            })
            return out
          })
        })
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [cityId])

  const reportPost = useCallback(async (id: string) => {
    setReported(prev => new Set(prev).add(id))
    if (!supabase) return
    try {
      const sb = supabase
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const { data: { session } } = await sb.auth.getSession()
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      await fetch('/api/posts/report', {
        method: 'POST', headers,
        body: JSON.stringify({ post_id: id, reason: 'spam' }),
      })
    } catch { /* leave optimistic */ }
  }, [])

  // Hide past events from main filters — they're still in `posts` for
  // archival but the user-facing list shows what's coming.
  const now      = Date.now()
  const weekEnd  = now + 7 * 86_400_000
  const upcoming = posts.filter(p => p.eventDate && new Date(p.eventDate).getTime() >= now)

  const filtered = upcoming.filter(p => {
    if (filter === 'all') return true
    const t = p.eventDate ? new Date(p.eventDate).getTime() : 0
    return filter === 'thisweek' ? t < weekEnd : t >= weekEnd
  })

  const thisWeekCount = upcoming.filter(p => {
    const t = p.eventDate ? new Date(p.eventDate).getTime() : 0
    return t < weekEnd
  }).length
  const laterCount = upcoming.length - thisWeekCount

  // Dateline — gives the page issue-rhythm rather than feed-rhythm
  const issueRange = (() => {
    const start = new Date()
    const end   = new Date(start.getTime() + 6 * 86_400_000)
    const fmt   = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    return `${fmt(start)} → ${fmt(end)}`
  })()

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-8 md:py-12">
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Masthead */}
      <header className="mb-8 pb-6"
        style={{ borderBottom: '2px solid #E8612A' }}>
        <div className="flex items-baseline gap-3 mb-2">
          <span className="inline-block shrink-0"
            style={{ width: 10, height: 10, borderRadius: '50%', background: '#E8612A' }} />
          <span className="text-[10px] font-black tracking-[0.22em] uppercase"
            style={{ color: '#E8612A' }}>
            Vol. 01 · {cityName} · Events
          </span>
        </div>
        <h1 className="font-display font-black text-3xl md:text-5xl leading-[0.95] mb-3"
          style={{ color: '#0A0A0A', letterSpacing: '-0.02em' }}>
          What&apos;s on.
          <br />
          <span style={{ color: '#E8612A' }}>Posted by settlers.</span>
        </h1>
        <p className="text-sm md:text-base max-w-2xl"
          style={{ color: 'rgba(10,10,10,0.6)' }}>
          Gigs, kitchen-table dinners, classes, meetups — hosted by people who
          live here. Scraped Brussels events live on the Hub; this is the
          settler side.
        </p>
      </header>

      {/* Composer */}
      <div className="mb-8">
        <EventComposer
          cityId={cityId}
          onNeedsAuth={() => setAuthOpen(true)}
          onSubmitted={(p) => setPosts(prev => [p, ...prev])} />
      </div>

      {/* Dateline + filter pills */}
      <div className="flex items-center justify-between gap-3 mb-5 pb-3"
        style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        <div className="flex gap-4">
          {([
            { id: 'all',       label: `All · ${upcoming.length}` },
            { id: 'thisweek',  label: `This week · ${thisWeekCount}` },
            { id: 'later',     label: `Later · ${laterCount}` },
          ] as const).map(opt => (
            <button key={opt.id} onClick={() => setFilter(opt.id)}
              className="text-[11px] font-black tracking-[0.18em] uppercase py-2 transition-opacity"
              style={{
                color: filter === opt.id ? '#E8612A' : 'rgba(10,10,10,0.4)',
                borderBottom: filter === opt.id ? '2px solid #E8612A' : '2px solid transparent',
              }}>
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-black tracking-[0.18em] uppercase"
          style={{ color: 'rgba(10,10,10,0.35)' }}>
          {issueRange}
        </span>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(p => (
            <EventCard
              key={p.id}
              post={p}
              reported={reported.has(p.id)}
              onReport={() => reportPost(p.id)} />
          ))}
        </div>
      ) : (
        <EmptyState loaded={loaded} hasAny={posts.length > 0} />
      )}
    </div>
  )
}

// Editorial empty state — magazine-style "Volume 01 opens" note + ghost
// preview, not a sad grey card. Same pattern shared with Housing.
function EmptyState({ loaded, hasAny }: { loaded: boolean; hasAny: boolean }) {
  if (!loaded) {
    return (
      <div className="py-16 px-6 text-center"
        style={{ background: '#FAFAF7', border: '1px solid rgba(10,10,10,0.08)' }}>
        <p className="text-sm" style={{ color: 'rgba(10,10,10,0.4)' }}>Loading events…</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
      <div className="py-10 px-6"
        style={{ background: '#FAFAF7', border: '1px solid rgba(10,10,10,0.08)' }}>
        <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-3"
          style={{ color: '#E8612A' }}>
          Editor&apos;s note
        </p>
        <p className="text-base font-semibold mb-3 leading-snug" style={{ color: '#0A0A0A' }}>
          {hasAny
            ? 'Nothing in this window — try another filter, or post yours.'
            : 'Volume 01 just opened. Be the first settler to host.'}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(10,10,10,0.6)' }}>
          What we publish: gigs, classes, dinners, meetups hosted by people who
          live here. What we don&apos;t: scraped feeds — those live on the Hub.
        </p>
      </div>
      <div className="py-6 px-5 flex flex-col gap-2"
        style={{ background: '#FFFFFF', border: '1px dashed rgba(232,97,42,0.4)' }}>
        <p className="text-[10px] font-black tracking-[0.18em] uppercase"
          style={{ color: 'rgba(232,97,42,0.7)' }}>
          Yours, here
        </p>
        <p className="font-display font-black text-base leading-tight"
          style={{ color: 'rgba(10,10,10,0.35)' }}>
          Reggae night at —
        </p>
        <p className="text-[11px]" style={{ color: 'rgba(10,10,10,0.3)' }}>
          Fri 22 May · Resist · Saint-Gilles
        </p>
        <p className="text-xs mt-2" style={{ color: 'rgba(10,10,10,0.3)' }}>
          Tap &quot;Post an event&quot; above.
        </p>
      </div>
    </div>
  )
}
