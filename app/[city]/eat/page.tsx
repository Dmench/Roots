'use client'
import { use, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import AuthGate from '@/components/auth/AuthGate'
import { getCity } from '@/lib/data/cities'
import { getVenues } from '@/lib/data/venues'
import type { Venue } from '@/lib/data/venues'
import { supabase } from '@/lib/supabase/client'

const VenueMap = dynamic(() => import('./VenueMap'), { ssr: false })

/* ── Editorial collections ───────────────────────────────────────────────── */

const COLLECTIONS = [
  { id: 'walk-in', label: 'Just walk in',     sub: 'No reservations, no apps',       color: '#10B981', matchTag: 'no-reservations' },
  { id: 'remote',  label: 'Work from here',   sub: 'Wifi, plugs, and no rush',       color: '#38C0F0', matchTag: 'remote-work'     },
  { id: 'belgian', label: 'Belgian classics', sub: 'The real thing, no tourist tax', color: '#FAB400', matchTag: 'belgian'         },
  { id: 'late',    label: 'Still open late',  sub: 'When dinner turns into drinks',  color: '#FF3EBA', matchTag: 'late-night'      },
]

/* ── Neighbourhood primer ────────────────────────────────────────────────── */

const HOODS: Record<string, { name: string; sub: string; desc: string; color: string }[]> = {
  brussels: [
    { name: 'Ixelles',    sub: 'The settler heartland', desc: 'Where most expats end up. Natural wine bars, specialty coffee, the best ramen in the city, and independent restaurants on nearly every block.', color: '#4744C8' },
    { name: 'Parvis Saint-Gilles', sub: 'The best terrace in Brussels', desc: 'The square every expat gets told about on day 2. Moeder Lambic anchor one corner, a dozen terrace cafés fill the rest. Packed on any sunny day, year-round. This is the heartbeat of the city.', color: '#FF3EBA' },
    { name: 'Marolles',   sub: 'Old Brussels, no tourists', desc: 'Place du Jeu de Balle flea market every Sunday morning — get there before 9am. Chez Biquet does the best frites in the city (cash, queue outside, no apologies). Brasserie Ploegmans for gueuze after. No menus in English, no tourist pricing, no Instagram crowds.', color: '#E8612A' },
    { name: 'Flagey & Ixelles Square', sub: 'Market, brunch, and wine', desc: 'The Saturday morning market at Place Flagey is the best food market in Brussels — cheese, wine, bread, Moroccan olives. Surrounding the square: Belga (terrace institution), wine bars, specialty coffee. Go Saturday morning, stay for lunch.', color: '#10B981' },
    { name: 'Dansaert',   sub: 'Creative district', desc: 'Brussels Beer Project, fashion boutiques, all-day cafés. The city\'s coolest strip — come here when you want to look like you\'ve lived here a year.', color: '#38C0F0' },
    { name: 'EU Quarter', sub: 'Fast & functional', desc: 'Excellent specialty coffee, reliable lunch spots, no surprises. Built for mornings before 9am meetings.', color: '#FAB400' },
  ],
}

/* ── Signal badges ───────────────────────────────────────────────────────── */

const SIGNALS: Record<string, { label: string; bg: string; text: string }> = {
  'no-reservations': { label: 'Walk in',     bg: 'rgba(16,185,129,0.1)',  text: '#0E9B6B' },
  'cash-only':       { label: 'Cash only',   bg: 'rgba(250,180,0,0.12)',  text: '#A07000' },
  'remote-work':     { label: 'Laptop ok',   bg: 'rgba(56,192,240,0.12)', text: '#0F7FA0' },
  'expat-favorite':  { label: 'Expat fave',  bg: 'rgba(71,68,200,0.1)',   text: '#4744C8' },
  'late-night':      { label: 'Late night',  bg: 'rgba(255,62,186,0.1)',  text: '#B8007A' },
  'institution':     { label: 'Institution', bg: 'rgba(10,10,10,0.07)',   text: 'rgba(10,10,10,0.55)' },
  'locals':          { label: 'Local fave',  bg: 'rgba(16,185,129,0.1)',  text: '#0E9B6B' },
  'terrace':         { label: 'Terrace',     bg: 'rgba(250,180,0,0.1)',   text: '#A07000' },
}
const SIG_PRIORITY = ['no-reservations','cash-only','remote-work','expat-favorite','late-night','locals','institution','terrace']

const TYPE_COLOR: Record<string, string> = { restaurant: '#E8612A', bar: '#4744C8', cafe: '#B08800', other: '#0A0A0A' }
type VenueType = 'all' | 'restaurant' | 'bar' | 'cafe'

const FOOD_KW = ['restaurant','food','eat','bar','drink','coffee','brunch','lunch','dinner',
  'café','cafe','recommend','pizza','vegan','beer','frites','belgian','hidden gem','best place',
  'where to','wine','brasserie','bistro','ramen','sushi','pasta','burger','thai','italian']

/* ── Partner teaser (coming soon slot) ───────────────────────────────────── */

function PartnerTeaser() {
  return (
    <div className="flex items-center gap-5 px-5 py-4 mb-3"
      style={{ border: '1.5px dashed rgba(10,10,10,0.13)' }}>
      {/* Placeholder square */}
      <div className="shrink-0 flex flex-col items-center justify-center"
        style={{ width: 56, height: 56, border: '1.5px dashed rgba(10,10,10,0.12)', background: 'rgba(10,10,10,0.02)' }}>
        <span style={{ fontSize: '1.4rem', opacity: 0.18 }}>★</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-0.5"
          style={{ color: 'rgba(10,10,10,0.28)' }}>
          Venue of the Month · Coming soon
        </p>
        <p className="text-xs" style={{ color: 'rgba(10,10,10,0.38)' }}>
          We'll feature an exclusive deal with a Brussels venue here.
        </p>
      </div>
    </div>
  )
}

/* ── Venue card (editorial, vertical) ────────────────────────────────────── */

function VenueCard({ venue, onSave, saved, photoRef: photoRefOverride, lead = false }: {
  venue: Venue; onSave: () => void; saved: boolean; photoRef?: string | null; lead?: boolean
}) {
  const color    = TYPE_COLOR[venue.broadType] ?? '#0A0A0A'
  const signals  = SIG_PRIORITY.filter(t => venue.tags?.includes(t)).slice(0, 2)
  const photoH   = lead ? 220 : 170
  // Use photoRef baked into venue first, fall back to lazily-fetched override
  const photoRef = venue.photoRef ?? photoRefOverride

  return (
    <div className="flex flex-col overflow-hidden h-full" style={{ border: '1px solid rgba(10,10,10,0.08)' }}>
      {/* Photo / color block — full card width */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: photoH, background: color }}>
        {photoRef ? (
          <img
            src={`/api/places/photo?ref=${encodeURIComponent(photoRef)}`}
            alt={venue.name}
            className="w-full h-full object-cover"
            style={{ opacity: 0, transition: 'opacity 0.4s ease' }}
            onLoad={e => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display font-black select-none"
            style={{ fontSize: lead ? '5rem' : '4rem', color: 'rgba(255,255,255,0.18)', lineHeight: 1 }}>
            {venue.name.charAt(0)}
          </span>
        )}
        {/* Price badge */}
        <span className="absolute top-2 right-2 text-[10px] font-black px-1.5 py-0.5"
          style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}>
          {venue.price}
        </span>
        {/* Rating badge — only on curated venues with confirmed Google data */}
        {venue.rating != null && venue.source === 'curated' && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5"
            style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            ★ {venue.rating.toFixed(1)}
            {venue.reviewCount != null && (
              <span style={{ opacity: 0.65 }}>
                ({venue.reviewCount >= 1000 ? `${(venue.reviewCount / 1000).toFixed(1)}k` : venue.reviewCount})
              </span>
            )}
          </span>
        )}
        {/* Type accent bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: color }} />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3">
        <span className="text-[8px] font-black tracking-[0.2em] uppercase mb-1" style={{ color }}>{venue.neighborhood}</span>
        {venue.website ? (
          <a href={venue.website} target="_blank" rel="noopener noreferrer"
            className="font-bold text-sm leading-snug hover:opacity-50 transition-opacity mb-0.5 block"
            style={{ color: '#0A0A0A' }}>
            {venue.name} ↗
          </a>
        ) : (
          <p className="font-bold text-sm leading-snug mb-0.5" style={{ color: '#0A0A0A' }}>{venue.name}</p>
        )}
        <p className="text-[10px] mb-2" style={{ color: 'rgba(10,10,10,0.38)' }}>{venue.category}</p>
        <p className="text-[11px] italic leading-snug mb-3 flex-1" style={{ color: 'rgba(10,10,10,0.55)' }}>
          {venue.vibe}
        </p>
        <div className="flex items-center justify-between gap-1.5 mt-auto">
          <div className="flex flex-wrap gap-1">
            {signals.map(t => {
              const s = SIGNALS[t]
              if (!s) return null
              return (
                <span key={t} className="text-[8px] font-black tracking-wide uppercase px-1.5 py-0.5"
                  style={{ background: s.bg, color: s.text }}>
                  {s.label}
                </span>
              )
            })}
          </div>
          <button
            onClick={onSave}
            className="shrink-0 text-[8px] font-black tracking-[0.12em] uppercase px-2 py-1 transition-all"
            style={{
              color:      saved ? '#0E9B6B' : 'rgba(10,10,10,0.3)',
              background: saved ? 'rgba(16,185,129,0.08)' : 'transparent',
              border:     saved ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(10,10,10,0.1)',
            }}>
            {saved ? '✓ Saved' : '+ Spots'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Scout card (compact, non-editorial) ────────────────────────────────── */

function ScoutCard({ venue, onSave, saved }: {
  venue: Venue; onSave: () => void; saved: boolean
}) {
  const color = TYPE_COLOR[venue.broadType] ?? '#0A0A0A'
  return (
    <div className="flex flex-col overflow-hidden" style={{ border: '1px solid rgba(10,10,10,0.07)' }}>
      {/* Photo block */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: 120, background: color }}>
        {venue.photoRef ? (
          <img
            src={`/api/places/photo?ref=${encodeURIComponent(venue.photoRef)}`}
            alt={venue.name}
            className="w-full h-full object-cover"
            style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
            onLoad={e => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display font-black select-none"
            style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.15)' }}>
            {venue.name.charAt(0)}
          </span>
        )}
        {/* Rating */}
        {venue.rating != null && (
          <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black px-1 py-0.5"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            ★ {venue.rating.toFixed(1)}
          </span>
        )}
        <span className="absolute top-1.5 right-1.5 text-[9px] font-black px-1 py-0.5"
          style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}>
          {venue.price}
        </span>
      </div>
      {/* Content */}
      <div className="p-2.5 flex flex-col flex-1">
        <span className="text-[8px] font-black tracking-[0.18em] uppercase mb-0.5" style={{ color }}>{venue.neighborhood}</span>
        <p className="text-xs font-bold leading-snug mb-1" style={{ color: '#0A0A0A' }}>{venue.name}</p>
        <p className="text-[9px] mb-2" style={{ color: 'rgba(10,10,10,0.38)' }}>{venue.category}</p>
        <div className="flex items-center justify-between mt-auto">
          {venue.reviewCount != null && (
            <span className="text-[9px]" style={{ color: 'rgba(10,10,10,0.3)' }}>
              {venue.reviewCount >= 1000 ? `${(venue.reviewCount / 1000).toFixed(1)}k` : venue.reviewCount} reviews
            </span>
          )}
          <button
            onClick={onSave}
            className="text-[8px] font-black tracking-[0.1em] uppercase px-1.5 py-0.5 transition-all ml-auto"
            style={{
              color:      saved ? '#0E9B6B' : 'rgba(10,10,10,0.3)',
              background: saved ? 'rgba(16,185,129,0.08)' : 'transparent',
              border:     saved ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(10,10,10,0.1)',
            }}>
            {saved ? '✓' : '+'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Reddit food panel ───────────────────────────────────────────────────── */

interface RedditRow { id: string; title: string; score: number; comments: number; permalink: string; created: number }

function RedditFoodPanel({ cityId }: { cityId: string }) {
  const [posts, setPosts] = useState<RedditRow[]>([])
  useEffect(() => {
    const SUB: Record<string,string> = { brussels: 'brussels', lisbon: 'portugal', berlin: 'berlin', barcelona: 'barcelona', amsterdam: 'amsterdam' }
    const sub = SUB[cityId] ?? cityId
    fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=60&raw_json=1`, { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(json => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = (json.data?.children ?? []).filter((c: any) => !c.data.over_18 && !c.data.stickied)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((c: any) => FOOD_KW.some(kw => c.data.title.toLowerCase().includes(kw)))
          .slice(0, 8)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((c: any) => ({ id: c.data.id, title: c.data.title, score: c.data.score, comments: c.data.num_comments, permalink: `https://reddit.com${c.data.permalink}`, created: c.data.created_utc }))
        setPosts(rows)
      }).catch(() => {})
  }, [cityId])
  if (posts.length === 0) return null
  return (
    <div style={{ border: '1px solid rgba(10,10,10,0.08)' }}>
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(10,10,10,0.07)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black" style={{ color: '#FF4500' }}>r/{cityId}</span>
          <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.3)' }}>· food & drink</span>
        </div>
        <a href={`https://reddit.com/r/${cityId}`} target="_blank" rel="noopener noreferrer"
          className="text-[10px] font-black tracking-wider hover:opacity-60 transition-opacity"
          style={{ color: 'rgba(10,10,10,0.25)' }}>OPEN ↗</a>
      </div>
      {posts.map((post, i) => {
        const diff = Math.floor(Date.now() / 1000) - post.created
        const ago  = diff < 3600 ? `${Math.floor(diff/60)}m` : diff < 86400 ? `${Math.floor(diff/3600)}h` : `${Math.floor(diff/86400)}d`
        return (
          <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
            className="flex items-start gap-4 px-5 py-3.5 hover:bg-neutral-50 transition-colors"
            style={{ borderTop: i > 0 ? '1px solid rgba(10,10,10,0.06)' : 'none' }}>
            <span className="shrink-0 text-[10px] font-black w-7 text-right mt-0.5" style={{ color: '#FF4500' }}>
              {post.score >= 1000 ? `${(post.score/1000).toFixed(1)}k` : post.score}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium leading-snug line-clamp-2" style={{ color: '#0A0A0A' }}>{post.title}</p>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(10,10,10,0.3)' }}>{post.comments} comments · {ago}</p>
            </div>
          </a>
        )
      })}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function EatPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = use(params)
  const city = getCity(cityId)
  const { user, loading: authLoading } = useAuth()
  const { profile, addSpot } = useProfile()

  const [venues,        setVenues]        = useState<Venue[]>([])
  const [typeFilter,    setTypeFilter]    = useState<VenueType>('all')
  const [activeCol,     setActiveCol]     = useState<string | null>(null)
  const [venuePhotos,   setVenuePhotos]   = useState<Record<string, string | null>>({})
  const [view,          setView]          = useState<'grid' | 'map'>('grid')
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null)

  useEffect(() => {
    if (city) getVenues(city.id).then(setVenues)
  }, [city])

  // Lazy-fetch photos only for venues that don't have a photoRef baked in
  // (curated venues without a Google match, and OSM venues)
  useEffect(() => {
    if (venues.length === 0 || !city) return
    const cid = city.id
    const needsPhoto = venues.filter(v => !v.photoRef)
    if (needsPhoto.length === 0) return

    const fetchPhotos = async () => {
      const { data: { session } } = await (supabase?.auth.getSession() ?? Promise.resolve({ data: { session: null } }))
      const headers: Record<string, string> = {}
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const entries = await Promise.all(needsPhoto.map(async v => {
        const sKey = `places-eat-${cid}-${v.id}`
        const cached = sessionStorage.getItem(sKey)
        if (cached !== null) return [v.id, cached === '' ? null : cached] as const
        try {
          const q   = encodeURIComponent(`${v.name}${v.address ? ' ' + v.address : ''}`)
          const res = await fetch(`/api/places/search?q=${q}&cityId=${cid}`, { headers })
          const json = await res.json() as { results: Array<{ photoRef: string | null }> }
          const ref  = json.results?.[0]?.photoRef ?? null
          sessionStorage.setItem(sKey, ref ?? '')
          return [v.id, ref] as const
        } catch {
          return [v.id, null] as const
        }
      }))
      setVenuePhotos(Object.fromEntries(entries))
    }
    fetchPhotos()
  }, [venues, city])

  if (!city) return null
  if (authLoading) return <div className="min-h-screen bg-cream" />
  if (!user) return <AuthGate cityName={city.name} cityId={cityId}>{null}</AuthGate>

  const featured  = venues.find(v => v.featured)
  const curated   = venues.filter(v => !v.featured && v.source !== 'scouted')
  const scouted   = venues.filter(v => v.source === 'scouted')
  const hoods     = HOODS[cityId] ?? []

  // regular = curated (non-featured) for the editorial grid
  const regular = curated

  let filtered = regular
  if (activeCol) {
    const col = COLLECTIONS.find(c => c.id === activeCol)
    if (col) filtered = regular.filter(v => v.tags?.includes(col.matchTag))
  } else if (typeFilter !== 'all') {
    filtered = regular.filter(v => v.broadType === typeFilter)
  }

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>

      {/* ── Section masthead — newspaper section front ─────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-12" style={{ borderBottom: '2px solid #0A0A0A' }}>
        <div className="flex items-end justify-between gap-4 py-5">
          <div>
            <p className="text-[8px] font-black tracking-[0.32em] uppercase mb-1"
              style={{ color: 'rgba(10,10,10,0.3)' }}>
              {city.name}
            </p>
            <h1 className="font-display font-black leading-none"
              style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
              Eat &amp; Drink
            </h1>
          </div>
          <p className="text-xs max-w-xs text-right hidden sm:block pb-1" style={{ color: 'rgba(10,10,10,0.38)' }}>
            Curated by people who live here. No tourist traps, no paid rankings.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-12 pb-16">

        {/* Coming-soon partner slot */}
        <div className="pt-4">
          <PartnerTeaser />
        </div>

        {/* Browse */}
        <div className="mb-14">
          {/* Header row: label + type tabs + view toggle */}
          <div className="flex items-center gap-4 mb-4" style={{ borderBottom: '1px solid rgba(10,10,10,0.08)', paddingBottom: '0.75rem' }}>
            <p className="text-[10px] font-black tracking-[0.22em] uppercase flex-1" style={{ color: 'rgba(10,10,10,0.4)' }}>
              {activeCol ? COLLECTIONS.find(c => c.id === activeCol)?.label : 'Browse all'}
              <span className="ml-2 font-medium" style={{ opacity: 0.5 }}>{filtered.length}</span>
            </p>

            {/* Type tabs — only when no collection active */}
            {!activeCol && (
              <div className="flex items-center gap-4">
                {(['all','restaurant','bar','cafe'] as VenueType[]).map(t => {
                  const count  = t === 'all' ? regular.length : regular.filter(v => v.broadType === t).length
                  const active = typeFilter === t
                  if (count === 0 && t !== 'all') return null
                  const label = t === 'all' ? 'All' : t === 'restaurant' ? 'Restaurants' : t === 'bar' ? 'Bars' : 'Cafés'
                  return (
                    <button key={t} onClick={() => setTypeFilter(t)}
                      className="text-[10px] font-black tracking-widest uppercase transition-colors"
                      style={{ color: active ? '#0A0A0A' : 'rgba(10,10,10,0.28)' }}>
                      {label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* View toggle */}
            <div className="flex items-center shrink-0" style={{ border: '1px solid rgba(10,10,10,0.12)' }}>
              {(['grid','map'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className="px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all"
                  style={{
                    background: view === v ? '#0A0A0A' : 'transparent',
                    color:      view === v ? '#fff'    : 'rgba(10,10,10,0.35)',
                  }}>
                  {v === 'grid' ? '▦' : '◎'} {v}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: 'rgba(10,10,10,0.4)' }}>No venues match — try a different filter.</p>
            </div>
          ) : view === 'map' ? (
            /* ── Map view ──────────────────────────────────────────────── */
            <div style={{ height: 560, border: '1px solid rgba(10,10,10,0.1)' }}>
              <VenueMap
                venues={filtered}
                venuePhotos={venuePhotos}
                selected={selectedVenue}
                onSelect={setSelectedVenue}
              />
            </div>
          ) : (
            /* ── FT-style editorial grid ───────────────────────────────── */
            <div>
              {/* Lead row: first 2 venues large */}
              {filtered.length >= 2 && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {filtered.slice(0, 2).map(v => {
                    const saved = (profile.spots ?? []).some(s => s.name === v.name)
                    return (
                      <VenueCard key={v.id} venue={v} saved={saved} photoRef={venuePhotos[v.id]} lead
                        onSave={() => {
                          if (!user || saved) return
                          const cat = v.broadType === 'restaurant' ? 'restaurant' : v.broadType === 'bar' ? 'bar' : v.broadType === 'cafe' ? 'cafe' : 'shop'
                          addSpot({ name: v.name, category: cat })
                        }} />
                    )
                  })}
                </div>
              )}
              {/* Regular 3-col grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filtered.slice(filtered.length >= 2 ? 2 : 0).map(v => {
                  const saved = (profile.spots ?? []).some(s => s.name === v.name)
                  return (
                    <VenueCard key={v.id} venue={v} saved={saved} photoRef={venuePhotos[v.id]}
                      onSave={() => {
                        if (!user || saved) return
                        const cat = v.broadType === 'restaurant' ? 'restaurant' : v.broadType === 'bar' ? 'bar' : v.broadType === 'cafe' ? 'cafe' : 'shop'
                        addSpot({ name: v.name, category: cat })
                      }} />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Spotted around Brussels ─────────────────────────────────────── */}
        {scouted.length > 0 && !activeCol && (
          <div className="mb-14">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(10,10,10,0.1)' }} />
              <div className="shrink-0 text-center">
                <p className="text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: 'rgba(10,10,10,0.35)' }}>
                  Spotted around Brussels
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: 'rgba(10,10,10,0.22)' }}>
                  Via web · not manually vetted
                </p>
              </div>
              <div className="flex-1 h-px" style={{ background: 'rgba(10,10,10,0.1)' }} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {scouted
                .filter(v => typeFilter === 'all' || v.broadType === typeFilter)
                .map(v => {
                  const saved = (profile.spots ?? []).some(s => s.name === v.name)
                  return (
                    <ScoutCard key={v.id} venue={v} saved={saved}
                      onSave={() => {
                        if (!user || saved) return
                        const cat = v.broadType === 'restaurant' ? 'restaurant' : v.broadType === 'bar' ? 'bar' : v.broadType === 'cafe' ? 'cafe' : 'shop'
                        addSpot({ name: v.name, category: cat })
                      }} />
                  )
                })}
            </div>
          </div>
        )}

        {/* Neighbourhood guide */}
        {hoods.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px" style={{ background: 'rgba(10,10,10,0.1)' }} />
              <p className="text-[10px] font-black tracking-[0.28em] uppercase shrink-0" style={{ color: 'rgba(10,10,10,0.35)' }}>
                Neighbourhood guide
              </p>
              <div className="flex-1 h-px" style={{ background: 'rgba(10,10,10,0.1)' }} />
            </div>
            <div>
              {hoods.map(h => (
                <div key={h.name} className="flex gap-4 py-4" style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}>
                  <div className="w-0.5 shrink-0 self-stretch" style={{ background: h.color }} />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                      <p className="text-sm font-black" style={{ color: '#0A0A0A' }}>{h.name}</p>
                      <p className="text-[10px] font-medium" style={{ color: 'rgba(10,10,10,0.35)' }}>{h.sub}</p>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.6)' }}>{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reddit food signal */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(10,10,10,0.1)' }} />
            <p className="text-[10px] font-black tracking-[0.28em] uppercase shrink-0" style={{ color: 'rgba(10,10,10,0.35)' }}>
              What the city is eating
            </p>
            <div className="flex-1 h-px" style={{ background: 'rgba(10,10,10,0.1)' }} />
          </div>
          <RedditFoodPanel cityId={cityId} />
        </div>

      </div>
    </div>
  )
}
