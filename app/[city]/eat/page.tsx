'use client'
import { use, useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import AuthGate from '@/components/auth/AuthGate'
import { getCity } from '@/lib/data/cities'
import { getVenues } from '@/lib/data/venues'
import type { Venue } from '@/lib/data/venues'

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
    { name: 'Saint-Gilles', sub: 'Authentic & unhurried', desc: 'Arty, local, genuinely affordable. Moeder Lambic, terrace cafés on the parvis, and a neighbourhood feeling you cannot fake.', color: '#FF3EBA' },
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
  'institution':     { label: 'Institution', bg: 'rgba(37,36,80,0.07)',   text: 'rgba(37,36,80,0.55)' },
  'locals':          { label: 'Local fave',  bg: 'rgba(16,185,129,0.1)',  text: '#0E9B6B' },
  'terrace':         { label: 'Terrace',     bg: 'rgba(250,180,0,0.1)',   text: '#A07000' },
}
const SIG_PRIORITY = ['no-reservations','cash-only','remote-work','expat-favorite','late-night','locals','institution','terrace']

const TYPE_COLOR: Record<string, string> = { restaurant: '#E8612A', bar: '#4744C8', cafe: '#B08800', other: '#252450' }
type VenueType = 'all' | 'restaurant' | 'bar' | 'cafe'

const FOOD_KW = ['restaurant','food','eat','bar','drink','coffee','brunch','lunch','dinner',
  'café','cafe','recommend','pizza','vegan','beer','frites','belgian','hidden gem','best place',
  'where to','wine','brasserie','bistro','ramen','sushi','pasta','burger','thai','italian']

/* ── Partner card ────────────────────────────────────────────────────────── */

function PartnerCard({ venue }: { venue: Venue }) {
  const color = TYPE_COLOR[venue.broadType] ?? '#252450'
  return (
    <div className="mb-12" style={{ background: '#0F0E1E' }}>
      <div className="relative px-7 pt-6 pb-5 overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="absolute right-0 top-0 font-display font-black select-none pointer-events-none"
          style={{ fontSize: '10rem', color: 'rgba(255,255,255,0.03)', lineHeight: 1, transform: 'translate(8%,-10%)' }}>
          {venue.name.charAt(0)}
        </span>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[9px] font-black tracking-[0.28em] uppercase" style={{ color }}>
            {venue.dealTag ?? 'Roots Pick'} · Exclusive deal
          </span>
          <span className="text-[9px] font-black tracking-wider px-2 py-1"
            style={{ background: `${color}20`, color }}>
            Members only
          </span>
        </div>
      </div>
      <div className="px-7 pt-5 pb-7">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 className="font-display font-black leading-tight"
            style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', color: '#F5F4F0', letterSpacing: '-0.02em' }}>
            {venue.name}
          </h2>
          <span className="shrink-0 font-bold text-base mt-1" style={{ color }}>{venue.price}</span>
        </div>
        <p className="text-xs mb-1" style={{ color: 'rgba(245,244,240,0.3)' }}>{venue.category} · {venue.neighborhood}</p>
        <p className="text-sm leading-relaxed italic max-w-lg mb-5" style={{ color: 'rgba(245,244,240,0.6)' }}>
          &ldquo;{venue.why}&rdquo;
        </p>
        {venue.deal && (
          <div className="inline-block px-4 py-3 mb-5" style={{ borderLeft: `3px solid ${color}`, background: `${color}10` }}>
            <p className="text-xs font-semibold" style={{ color }}>🎟 {venue.deal}</p>
          </div>
        )}
        <div className="flex items-center gap-4 flex-wrap">
          {venue.website && (
            <a href={venue.website} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-black tracking-widest uppercase hover:opacity-60 transition-opacity"
              style={{ color }}>
              Visit ↗
            </a>
          )}
          {venue.openingHours && (
            <span className="text-[9px]" style={{ color: 'rgba(245,244,240,0.2)' }}>
              {venue.openingHours.split(';')[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Venue card ───────────────────────────────────────────────────────────── */

function VenueCard({ venue }: { venue: Venue }) {
  const color   = TYPE_COLOR[venue.broadType] ?? '#252450'
  const signals = SIG_PRIORITY.filter(t => venue.tags?.includes(t)).slice(0, 2)
  return (
    <div className="flex gap-3 py-4" style={{ borderTop: '1px solid rgba(37,36,80,0.08)' }}>
      <div className="w-0.5 shrink-0 self-stretch" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <span className="text-[9px] font-black tracking-widest uppercase" style={{ color }}>{venue.neighborhood}</span>
          <span className="text-xs font-bold shrink-0" style={{ color }}>{venue.price}</span>
        </div>
        {venue.website ? (
          <a href={venue.website} target="_blank" rel="noopener noreferrer"
            className="font-bold text-sm leading-snug hover:opacity-50 transition-opacity mb-0.5 block"
            style={{ color: '#0F0E1E' }}>
            {venue.name} ↗
          </a>
        ) : (
          <p className="font-bold text-sm leading-snug mb-1" style={{ color: '#0F0E1E' }}>{venue.name}</p>
        )}
        <p className="text-[10px] mb-2.5" style={{ color: 'rgba(15,14,30,0.35)' }}>{venue.category}</p>
        <p className="text-[11px] leading-snug italic flex-1" style={{ color: 'rgba(15,14,30,0.6)' }}>{venue.vibe}</p>
        {signals.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {signals.map(t => {
              const s = SIGNALS[t]
              if (!s) return null
              return (
                <span key={t} className="text-[8px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded"
                  style={{ background: s.bg, color: s.text }}>
                  {s.label}
                </span>
              )
            })}
          </div>
        )}
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
    <div style={{ background: '#1C1A2E' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black" style={{ color: '#FF4500' }}>r/{cityId}</span>
          <span className="text-[9px]" style={{ color: 'rgba(245,236,215,0.3)' }}>· food & drink</span>
        </div>
        <a href={`https://reddit.com/r/${cityId}`} target="_blank" rel="noopener noreferrer"
          className="text-[9px] font-black tracking-wider hover:opacity-60 transition-opacity"
          style={{ color: 'rgba(245,236,215,0.25)' }}>OPEN ↗</a>
      </div>
      {posts.map((post, i) => {
        const diff = Math.floor(Date.now() / 1000) - post.created
        const ago  = diff < 3600 ? `${Math.floor(diff/60)}m` : diff < 86400 ? `${Math.floor(diff/3600)}h` : `${Math.floor(diff/86400)}d`
        return (
          <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
            className="flex items-start gap-4 px-5 py-4 hover:opacity-70 transition-opacity"
            style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <span className="shrink-0 text-[10px] font-black w-7 text-right mt-0.5" style={{ color: '#FF4500' }}>
              {post.score >= 1000 ? `${(post.score/1000).toFixed(1)}k` : post.score}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium leading-snug line-clamp-2" style={{ color: '#F5ECD7' }}>{post.title}</p>
              <p className="text-[9px] mt-1" style={{ color: 'rgba(245,236,215,0.25)' }}>{post.comments} comments · {ago}</p>
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

  const [venues,     setVenues]     = useState<Venue[]>([])
  const [typeFilter, setTypeFilter] = useState<VenueType>('all')
  const [activeCol,  setActiveCol]  = useState<string | null>(null)

  useEffect(() => {
    if (city) getVenues(city.id).then(setVenues)
  }, [city])

  if (!city) return null
  if (authLoading) return <div className="min-h-screen bg-cream" />
  if (!user) return <AuthGate cityName={city.name} cityId={cityId}>{null}</AuthGate>

  const featured = venues.find(v => v.featured)
  const regular  = venues.filter(v => !v.featured)
  const hoods    = HOODS[cityId] ?? []

  let filtered = regular
  if (activeCol) {
    const col = COLLECTIONS.find(c => c.id === activeCol)
    if (col) filtered = regular.filter(v => v.tags?.includes(col.matchTag))
  } else if (typeFilter !== 'all') {
    filtered = regular.filter(v => v.broadType === typeFilter)
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>

      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: '#0F0E1E' }}>
        <div className="absolute rounded-full pointer-events-none"
          style={{ width: 500, height: 500, top: -200, right: -120, background: '#E8612A', opacity: 0.10, filter: 'blur(90px)' }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ width: 280, height: 280, bottom: -100, left: -60, background: '#4744C8', opacity: 0.12, filter: 'blur(70px)' }} />
        <div className="relative max-w-5xl mx-auto px-6 md:px-12 py-12">
          <p className="text-[9px] font-black tracking-[0.3em] uppercase mb-5" style={{ color: 'rgba(245,236,215,0.25)' }}>
            Eat & Drink · {city.name}
          </p>
          <h1 className="font-display font-black leading-[0.85] mb-4"
            style={{ fontSize: 'clamp(2.8rem,7vw,5rem)', color: '#F5ECD7', letterSpacing: '-0.02em' }}>
            Where to eat<br />
            <em className="not-italic" style={{ color: '#E8612A' }}>in {city.name}.</em>
          </h1>
          <p className="text-sm max-w-md" style={{ color: 'rgba(245,236,215,0.4)' }}>
            Curated by people who actually live here. No tourist traps, no paid rankings — just the places worth your time.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-12 pb-16">

        {/* Featured deal */}
        {featured && <div className="pt-10"><PartnerCard venue={featured} /></div>}

        {/* Curated collections */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: 'rgba(37,36,80,0.4)' }}>
              Curated lists
            </p>
            {activeCol && (
              <button onClick={() => setActiveCol(null)} className="text-xs text-stone hover:text-espresso transition-colors">
                Clear ×
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {COLLECTIONS.map(col => {
              const count  = regular.filter(v => v.tags?.includes(col.matchTag)).length
              const active = activeCol === col.id
              return (
                <button key={col.id} onClick={() => setActiveCol(active ? null : col.id)}
                  className="text-left py-3 transition-all"
                  style={{
                    borderTop: `2px solid ${active ? col.color : 'rgba(37,36,80,0.12)'}`,
                  }}>
                  <p className="text-xs font-black leading-tight mb-0.5" style={{ color: active ? '#fff' : '#252450' }}>
                    {col.label}
                  </p>
                  <p className="text-[9px] leading-snug" style={{ color: active ? 'rgba(255,255,255,0.6)' : 'rgba(37,36,80,0.4)' }}>
                    {count} place{count !== 1 ? 's' : ''}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Browse */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: 'rgba(37,36,80,0.4)' }}>
              {activeCol ? COLLECTIONS.find(c => c.id === activeCol)?.label : 'Browse all'}
              <span className="ml-2 font-medium" style={{ opacity: 0.5 }}>{filtered.length}</span>
            </p>
          </div>
          {!activeCol && (
            <div className="flex items-center gap-6 mb-7" style={{ borderBottom: '1px solid rgba(37,36,80,0.08)' }}>
              {(['all','restaurant','bar','cafe'] as VenueType[]).map(t => {
                const count  = t === 'all' ? regular.length : regular.filter(v => v.broadType === t).length
                const active = typeFilter === t
                if (count === 0 && t !== 'all') return null
                const label  = t === 'all' ? 'All' : t === 'restaurant' ? 'Restaurants' : t === 'bar' ? 'Bars' : 'Cafés'
                return (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    className="relative pb-3 text-[10px] font-black tracking-widest uppercase transition-colors"
                    style={{ color: active ? '#252450' : 'rgba(37,36,80,0.3)' }}>
                    {label}
                    {active && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#252450' }} />}
                  </button>
                )
              })}
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: 'rgba(37,36,80,0.4)' }}>No venues match — try a different filter.</p>
            </div>
          ) : (
            <div>
              {filtered.map(v => <VenueCard key={v.id} venue={v} />)}
            </div>
          )}
        </div>

        {/* Neighbourhood guide */}
        {hoods.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px" style={{ background: 'rgba(37,36,80,0.1)' }} />
              <p className="text-[9px] font-black tracking-[0.28em] uppercase shrink-0" style={{ color: 'rgba(37,36,80,0.35)' }}>
                Neighbourhood guide
              </p>
              <div className="flex-1 h-px" style={{ background: 'rgba(37,36,80,0.1)' }} />
            </div>
            <div>
              {hoods.map(h => (
                <div key={h.name} className="flex gap-4 py-4" style={{ borderTop: '1px solid rgba(37,36,80,0.08)' }}>
                  <div className="w-0.5 shrink-0 self-stretch" style={{ background: h.color }} />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                      <p className="text-sm font-black" style={{ color: '#252450' }}>{h.name}</p>
                      <p className="text-[9px] font-medium" style={{ color: 'rgba(37,36,80,0.35)' }}>{h.sub}</p>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(37,36,80,0.6)' }}>{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reddit food signal */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(37,36,80,0.1)' }} />
            <p className="text-[9px] font-black tracking-[0.28em] uppercase shrink-0" style={{ color: 'rgba(37,36,80,0.35)' }}>
              What the city is eating
            </p>
            <div className="flex-1 h-px" style={{ background: 'rgba(37,36,80,0.1)' }} />
          </div>
          <RedditFoodPanel cityId={cityId} />
        </div>

      </div>
    </div>
  )
}
