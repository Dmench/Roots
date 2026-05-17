'use client'
import { use, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import AuthGate from '@/components/auth/AuthGate'
import { getCity } from '@/lib/data/cities'
import { getVenues } from '@/lib/data/venues'
import type { Venue } from '@/lib/data/venues'
import { venuePhotoUrl } from '@/lib/photos'
import { GeometricThread } from '@/components/layout/GeometricThread'
import { PageMasthead } from '@/components/layout/PageMasthead'

const VenueMap = dynamic(() => import('./VenueMap'), { ssr: false })

/* ── Editorial collections ───────────────────────────────────────────────── */

// Vibe-led collections — what users actually ask for ("somewhere fancy",
// "real Belgian", "dancing"). Practical filters (walk-in, remote-work) live
// further down for the smaller subset of users who plan that way.
const COLLECTIONS = [
  { id: 'friends',   label: 'Friends in town',   sub: 'Show-off Brussels',                color: '#FF3EBA', matchTag: 'friends-visiting' },
  { id: 'belgian',   label: 'Real Belgian',      sub: 'Frites, gueuze, no tourist tax',   color: '#FAB400', matchTag: 'belgian-classic'  },
  { id: 'fancy',     label: 'Fancy',             sub: 'When it has to be special',        color: '#4744C8', matchTag: 'fancy'            },
  { id: 'date',      label: 'Date night',        sub: 'Candles, low light, somewhere romantic', color: '#9B4DCA', matchTag: 'dark-lit'   },
  { id: 'cozy',      label: 'Cozy',              sub: 'Wood, fire, somewhere to sit for hours', color: '#E8612A', matchTag: 'cozy'       },
  { id: 'trendy',    label: 'Trendy',            sub: "What's actually good right now",   color: '#38C0F0', matchTag: 'trendy'           },
  { id: 'dancing',   label: 'Dancing',           sub: 'Late-late, techno-and-after',      color: '#252450', matchTag: 'nightclub'        },
  { id: 'wholesome', label: 'Wholesome',         sub: 'Brunch, family, sunny days',       color: '#10B981', matchTag: 'wholesome'        },
  { id: 'fireplace', label: 'By the fire',       sub: 'A wood fire, a glass, somewhere quiet', color: '#8A7868', matchTag: 'fireplace'   },
  { id: 'walk-in',   label: 'Just walk in',      sub: 'No reservations, no apps',         color: '#0E9B6B', matchTag: 'no-reservations'  },
  { id: 'remote',    label: 'Work from here',    sub: 'Wifi, plugs, and no rush',         color: '#1A8FAD', matchTag: 'remote-work'      },
]

/* ── Taste chips (multi-select, identity-leaning) ────────────────────────── */
//
// Cuisine + format-led tags. Multi-select; OR logic across selected chips
// (a venue passes if its tags overlap ANY selected chip's matchTags).
// Persisted to localStorage so users keep their picks across sessions.
//
// Each chip's matchTags is an array — some are aliases (asian wraps japanese
// / korean / chinese / vietnamese / taiwanese / hotpot / ramen / sushi).

const TASTE_CHIPS: { id: string; label: string; color: string; matchTags: string[] }[] = [
  { id: 'belgian',      label: 'Belgian',       color: '#FAB400', matchTags: ['belgian-classic'] },
  { id: 'italian',      label: 'Italian',       color: '#E8612A', matchTags: ['italian', 'pasta'] },
  { id: 'asian',        label: 'Asian',         color: '#FF3EBA', matchTags: ['japanese', 'korean', 'chinese', 'vietnamese', 'taiwanese', 'ramen', 'sushi', 'hotpot'] },
  { id: 'brunch',       label: 'Brunch',        color: '#0E9B6B', matchTags: ['brunch'] },
  { id: 'wine',         label: 'Natural wine',  color: '#9B4DCA', matchTags: ['natural-wine', 'wine'] },
  { id: 'cocktails',    label: 'Cocktails',     color: '#252450', matchTags: ['cocktails'] },
  { id: 'craft-beer',   label: 'Craft beer',    color: '#A07000', matchTags: ['craft-beer', 'lambic', 'gueuze'] },
  { id: 'coffee',       label: 'Coffee',        color: '#5C4033', matchTags: ['specialty-coffee'] },
  { id: 'late-night',   label: 'Late night',    color: '#6865CC', matchTags: ['late-night'] },
  { id: 'fine-dining',  label: 'Fine dining',   color: '#4744C8', matchTags: ['michelin', 'fancy'] },
  { id: 'club',         label: 'Club',          color: '#0A0A0A', matchTags: ['nightclub'] },
  { id: 'cheap-eats',   label: 'Cheap eats',    color: '#1A8FAD', matchTags: ['cheap', 'frites', 'fried-chicken', 'casual', 'comfort-food'] },
]

const TASTE_STORAGE_KEY = 'roots.eat.tastes.v1'

/* ── Neighbourhood primer ────────────────────────────────────────────────── */

const HOODS: Record<string, { name: string; sub: string; desc: string; color: string }[]> = {
  brussels: [
    { name: 'Ixelles',    sub: 'The settler heartland', desc: 'Where most newcomers cluster — international and Belgian alike. Natural wine bars, specialty coffee, the best ramen in the city, and independent restaurants on nearly every block.', color: '#4744C8' },
    { name: 'Parvis Saint-Gilles', sub: 'The best terrace in Brussels', desc: 'The square every newcomer gets told about on day 2. Moeder Lambic anchors one corner, a dozen terrace cafés fill the rest. On a sunny day it feels like the centre of Brussels.', color: '#FF3EBA' },
    { name: 'Marolles',   sub: 'Old Brussels, no tourists', desc: 'Place du Jeu de Balle flea market every Sunday morning — get there before 9am. Chez Biquet does the frites people queue for (cash, queue outside, no apologies). Brasserie Ploegmans for gueuze after. No menus in English, no tourist pricing, no camera-phone queues.', color: '#E8612A' },
    { name: 'Flagey & Ixelles Square', sub: 'Market, brunch, and wine', desc: 'The Saturday morning market at Place Flagey is the best food market in Brussels — cheese, wine, bread, Moroccan olives. Surrounding the square: Belga (terrace institution), wine bars, specialty coffee. Go Saturday morning, stay for lunch.', color: '#10B981' },
    { name: 'Dansaert',   sub: 'Creative district', desc: 'Brussels Beer Project, fashion boutiques, all-day cafés. The city\'s coolest strip — come here when you want to look the part.', color: '#38C0F0' },
    { name: 'EU Quarter', sub: 'Fast & functional', desc: 'Excellent specialty coffee, reliable lunch spots, no surprises. Built for mornings before 9am meetings.', color: '#FAB400' },
  ],
}

/* ── Signal badges ───────────────────────────────────────────────────────── */

const SIGNALS: Record<string, { label: string; bg: string; text: string }> = {
  'no-reservations': { label: 'Walk in',     bg: 'rgba(16,185,129,0.1)',  text: '#0E9B6B' },
  'cash-only':       { label: 'Cash only',   bg: 'rgba(250,180,0,0.12)',  text: '#A07000' },
  'remote-work':     { label: 'Laptop ok',   bg: 'rgba(56,192,240,0.12)', text: '#0F7FA0' },
  'newcomers':       { label: 'Settler fave', bg: 'rgba(71,68,200,0.1)',  text: '#4744C8' },
  'late-night':      { label: 'Late night',  bg: 'rgba(255,62,186,0.1)',  text: '#B8007A' },
  'institution':     { label: 'Institution', bg: 'rgba(10,10,10,0.07)',   text: 'rgba(10,10,10,0.55)' },
  'locals':          { label: 'Local fave',  bg: 'rgba(16,185,129,0.1)',  text: '#0E9B6B' },
  'terrace':         { label: 'Terrace',     bg: 'rgba(250,180,0,0.1)',   text: '#A07000' },
}
const SIG_PRIORITY = ['no-reservations','cash-only','remote-work','newcomers','late-night','locals','institution','terrace']

const TYPE_COLOR: Record<string, string> = { restaurant: '#E8612A', bar: '#4744C8', cafe: '#B08800', other: '#0A0A0A' }
type VenueType = 'all' | 'restaurant' | 'bar' | 'cafe'

// Build a Google Maps URL for a venue. Prefer name+address (Maps shows the
// full place card with hours, photos, reviews). Falls back to lat/lng if
// no address. Always opens to Google Maps' universal place search so the
// user can get directions, save, or share.
function googleMapsUrl(venue: Venue): string {
  if (venue.address && venue.name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name}, ${venue.address}, Brussels`)}`
  }
  if (venue.lat && venue.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} Brussels`)}`
}



/* ── Venue card (editorial, vertical) ────────────────────────────────────── */

function VenueCard({ venue, cityId, onSave, saved, photoRef: photoRefOverride, lead = false, leadNumber }: {
  venue: Venue; cityId: string; onSave: () => void; saved: boolean
  photoRef?: string | null; lead?: boolean
  /** When set on a lead card, renders a giant "№ 01"-style overlay on the photo (mag flatplan move). */
  leadNumber?: string
}) {
  const color    = TYPE_COLOR[venue.broadType] ?? '#0A0A0A'
  const signals  = SIG_PRIORITY.filter(t => venue.tags?.includes(t)).slice(0, 2)
  const photoH   = lead ? 220 : 170
  // Use photoRef baked into venue first, fall back to lazily-fetched override
  const photoRef = venue.photoRef ?? photoRefOverride
  // Primary source: Supabase Storage (no Google quota). Fallback: /api/places/photo
  // proxy, which counts against the daily Places quota. data-fallback is set so
  // the onError handler can swap to it without needing component state per card.
  const storageUrl = venuePhotoUrl(cityId, venue.id)
  const proxyUrl   = photoRef ? `/api/places/photo?ref=${encodeURIComponent(photoRef)}` : ''

  const mapsHref = googleMapsUrl(venue)

  return (
    <div className="flex flex-col overflow-hidden h-full" style={{ border: '1px solid rgba(10,10,10,0.08)' }}>
      {/* Photo / color block — full card width — TAP opens Google Maps */}
      <a href={mapsHref} target="_blank" rel="noopener noreferrer"
        className="relative shrink-0 overflow-hidden block group"
        style={{ height: photoH, background: color }}
        title={`Open ${venue.name} in Google Maps`}>
        <img
          src={storageUrl}
          data-fallback={proxyUrl}
          alt={venue.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
          style={{ opacity: 0, transition: 'opacity 0.4s ease, transform 0.4s ease' }}
          onLoad={e => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
          onError={e => {
            const img = e.currentTarget as HTMLImageElement
            const fb  = img.getAttribute('data-fallback')
            if (fb && img.src.indexOf(fb) === -1) {
              img.src = fb
              return
            }
            img.style.display = 'none'
          }}
        />
        {/* Fallback initial — always rendered behind photo */}
        <span className="absolute inset-0 flex items-center justify-center font-display font-black select-none pointer-events-none"
          style={{ fontSize: lead ? '5rem' : '4rem', color: 'rgba(255,255,255,0.18)', lineHeight: 1 }}>
          {venue.name.charAt(0)}
        </span>
        {/* Price badge */}
        <span className="absolute top-2 right-2 text-[10px] font-black px-1.5 py-0.5 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}>
          {venue.price}
        </span>
        {/* Rating badge — only on curated venues with confirmed Google data */}
        {venue.rating != null && venue.source === 'curated' && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            ★ {venue.rating.toFixed(1)}
            {venue.reviewCount != null && (
              <span style={{ opacity: 0.65 }}>
                ({venue.reviewCount >= 1000 ? `${(venue.reviewCount / 1000).toFixed(1)}k` : venue.reviewCount})
              </span>
            )}
          </span>
        )}
        {/* Hover hint — small "Open in Maps" pill that appears on hover */}
        <span className="absolute top-2 left-2 text-[10px] font-black px-1.5 py-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', backdropFilter: 'blur(4px)' }}>
          ↗ Maps
        </span>
        {/* Mag-flatplan running head — only on lead cards */}
        {leadNumber && (
          <span className="absolute top-2 left-2 pointer-events-none font-display font-black select-none"
            style={{
              fontSize: lead ? '4.5rem' : '3rem',
              lineHeight: 0.85,
              color: 'rgba(255,255,255,0.85)',
              mixBlendMode: 'difference',
            }}>
            № {leadNumber}
          </span>
        )}
        {/* Type accent bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 pointer-events-none" style={{ background: color }} />
      </a>
      {/* Caption strip — magazine-style photo caption */}
      <div className="flex items-baseline justify-between gap-2 px-3 py-1.5"
        style={{ borderBottom: '1px solid rgba(10,10,10,0.06)' }}>
        <span className="text-[9px] font-black tracking-[0.22em] uppercase truncate"
          style={{ color: 'rgba(10,10,10,0.45)' }}>
          {venue.neighborhood} · {(venue as { vibe?: string }).vibe?.split('—')[0]?.split(',')[0]?.trim() ?? venue.category}
        </span>
        <span className="text-[9px] font-black tracking-[0.22em] uppercase shrink-0"
          style={{ color: 'rgba(10,10,10,0.25)' }}>
          Roots Vol. 01
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3">
        {/* Neighbourhood now lives in the caption strip above the content — no duplicate here */}
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
        {/* Directions row — always visible, opens Google Maps in a new tab */}
        <a href={mapsHref} target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[9px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
          style={{ color }}>
          ↗ Directions
        </a>
      </div>
    </div>
  )
}

/* ── Scout card (compact, non-editorial) ────────────────────────────────── */

function ScoutCard({ venue, cityId, onSave, saved }: {
  venue: Venue; cityId: string; onSave: () => void; saved: boolean
}) {
  const color = TYPE_COLOR[venue.broadType] ?? '#0A0A0A'
  const storageUrl = venuePhotoUrl(cityId, venue.id)
  const proxyUrl   = venue.photoRef ? `/api/places/photo?ref=${encodeURIComponent(venue.photoRef)}` : ''
  const mapsHref   = googleMapsUrl(venue)
  return (
    <div className="flex flex-col overflow-hidden" style={{ border: '1px solid rgba(10,10,10,0.07)' }}>
      {/* Photo block — TAP opens Google Maps */}
      <a href={mapsHref} target="_blank" rel="noopener noreferrer"
        className="relative shrink-0 overflow-hidden block"
        style={{ height: 120, background: color }}
        title={`Open ${venue.name} in Google Maps`}>
        <img
          src={storageUrl}
          data-fallback={proxyUrl}
          alt={venue.name}
          className="w-full h-full object-cover"
          style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
          onLoad={e => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
          onError={e => {
            const img = e.currentTarget as HTMLImageElement
            const fb  = img.getAttribute('data-fallback')
            if (fb && img.src.indexOf(fb) === -1) {
              img.src = fb
              return
            }
            img.style.display = 'none'
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center font-display font-black select-none pointer-events-none"
          style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.15)' }}>
          {venue.name.charAt(0)}
        </span>
        {/* Rating */}
        {venue.rating != null && (
          <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black px-1 py-0.5 pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            ★ {venue.rating.toFixed(1)}
          </span>
        )}
        <span className="absolute top-1.5 right-1.5 text-[9px] font-black px-1 py-0.5 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}>
          {venue.price}
        </span>
      </a>
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

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function EatPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = use(params)
  const city = getCity(cityId)
  const { user, loading: authLoading } = useAuth()
  const { profile, addSpot } = useProfile()

  const [venues,        setVenues]        = useState<Venue[]>([])
  const [typeFilter,    setTypeFilter]    = useState<VenueType>('all')
  const [activeMoods,   setActiveMoods]   = useState<string[]>([])
  const [activeTastes,  setActiveTastes]  = useState<string[]>([])
  const [activeHoods,   setActiveHoods]   = useState<string[]>([])
  const [venuePhotos,   setVenuePhotos]   = useState<Record<string, string | null>>({})
  const [view,          setView]          = useState<'grid' | 'map'>('grid')
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null)

  // Hydrate tastes from localStorage on first mount + watch URL param
  // (?taste=pizza,sushi) so links from /tips pages preselect them.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const fromUrl = new URLSearchParams(window.location.search).get('taste')
    if (fromUrl) {
      const ids = fromUrl.split(',').filter(t => TASTE_CHIPS.some(c => c.id === t))
      if (ids.length > 0) {
        setActiveTastes(ids)
        try { localStorage.setItem(TASTE_STORAGE_KEY, JSON.stringify(ids)) } catch {}
        return
      }
    }
    try {
      const stored = localStorage.getItem(TASTE_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as unknown
        if (Array.isArray(parsed)) {
          setActiveTastes(parsed.filter((t): t is string =>
            typeof t === 'string' && TASTE_CHIPS.some(c => c.id === t)))
        }
      }
    } catch { /* private mode */ }
  }, [])

  // Persist taste changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(TASTE_STORAGE_KEY, JSON.stringify(activeTastes))
    } catch { /* private mode */ }
  }, [activeTastes])

  function toggleTaste(id: string) {
    setActiveTastes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }
  function toggleMood(id: string) {
    setActiveMoods(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }
  function toggleHood(name: string) {
    setActiveHoods(prev => prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name])
  }

  useEffect(() => {
    if (city) getVenues(city.id).then(setVenues)
  }, [city])

  // Pull cached photoRefs from the server-side venue_photo_cache table.
  // /eat is a client component so it can't read Supabase with the service-
  // role admin client (where the cache lives) directly — this single
  // endpoint exposes it as JSON. No Google calls, no quota burn.
  //
  // For venues not yet in the cache, the city hub's server-side
  // enrichCurated() fills entries up to 5 per render. After a few /brussels
  // visits, the cache covers the corpus.
  useEffect(() => {
    if (venues.length === 0 || !city) return
    const cid = city.id

    const fetchCache = async () => {
      try {
        const res = await fetch(`/api/venues/photo-cache?cityId=${cid}`, {
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) return
        const cache = await res.json() as Record<string, string | null>
        setVenuePhotos(cache)
      } catch {
        // Cache fetch failed — fall back to colour blocks. No retry.
      }
    }
    fetchCache()
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

  // Unique neighbourhoods present in the loaded venues — sorted by venue count
  // (most-populous first). Drives the Neighbourhood chip rail.
  const hoodCounts = new Map<string, number>()
  for (const v of regular) {
    if (v.neighborhood) hoodCounts.set(v.neighborhood, (hoodCounts.get(v.neighborhood) ?? 0) + 1)
  }
  const HOOD_CHIPS = [...hoodCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)

  // Filter chain: default = ALL venues. Each axis is multi-select with
  // OR-within-axis (any picked chip matches), AND-across-axes (all axes
  // must independently match). Empty axis = no filter applied for that axis.
  //
  //   Cuisine  : tastes picked → venue.tags ∩ (union of chip matchTags) ≠ ∅
  //   Vibe     : moods picked  → venue.tags ∩ (union of mood matchTags)  ≠ ∅
  //   Hood     : hoods picked  → venue.neighborhood in selected
  //   Type     : type picked   → venue.broadType === type (legacy tab)
  let filtered = regular
  if (typeFilter !== 'all') {
    filtered = filtered.filter(v => v.broadType === typeFilter)
  }
  if (activeTastes.length > 0) {
    const tasteTagSet = new Set(
      activeTastes.flatMap(id => TASTE_CHIPS.find(c => c.id === id)?.matchTags ?? []),
    )
    filtered = filtered.filter(v => v.tags?.some(t => tasteTagSet.has(t)))
  }
  if (activeMoods.length > 0) {
    const moodTagSet = new Set(
      activeMoods.flatMap(id => COLLECTIONS.find(c => c.id === id)?.matchTag).filter((t): t is string => !!t),
    )
    filtered = filtered.filter(v => v.tags?.some(t => moodTagSet.has(t)))
  }
  if (activeHoods.length > 0) {
    filtered = filtered.filter(v => v.neighborhood && activeHoods.includes(v.neighborhood))
  }

  const anyFilterActive = typeFilter !== 'all' || activeTastes.length > 0 || activeMoods.length > 0 || activeHoods.length > 0
  function resetAll() {
    setTypeFilter('all')
    setActiveTastes([])
    setActiveMoods([])
    setActiveHoods([])
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#FFFFFF' }}>
      <GeometricThread accent="#E8612A" />

      <PageMasthead
        eyebrow={`${city.name} · Eat & Drink`}
        headline={`${city.name},`}
        emphasis="hungry."
        emphasisColor="#E8612A"
        tagline={`Local, on purpose. Where actual locals eat — neighbourhood by neighbourhood, no tourist traps, no paid rankings.`}
        backHref={`/${cityId}`}
        backLabel="← Back to hub"
      >
        {venues.length > 0 && (
          <span className="text-[10px] font-black tracking-[0.18em] uppercase"
            style={{ color: '#E8612A' }}>
            {venues.length} {venues.length === 1 ? 'venue' : 'venues'}
          </span>
        )}
        {hoods.length > 0 && (
          <span className="text-[10px] font-black tracking-[0.18em] uppercase"
            style={{ color: '#FAB400' }}>
            {hoods.length} neighbourhoods
          </span>
        )}
        {scouted.length > 0 && (
          <span className="text-[10px] font-black tracking-[0.18em] uppercase"
            style={{ color: '#FF3EBA' }}>
            {scouted.length} new this season
          </span>
        )}
      </PageMasthead>

      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-6 pb-16">

        {/* ── Three-axis filter: Cuisine / Vibe / Neighbourhood ─────────── */}
        {/* Default state = all venues shown. Each chip you tap NARROWS the
            list. Tap a chip again to remove it. Reset all = show everything. */}

        {/* CUISINE — multi-select, persisted */}
        <section className="mb-4">
          <div className="flex items-baseline justify-between gap-3 mb-2.5">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase"
              style={{ color: 'rgba(10,10,10,0.4)' }}>
              Cuisine
            </p>
            {activeTastes.length > 0 && (
              <button onClick={() => setActiveTastes([])}
                className="text-[10px] font-bold hover:opacity-60 transition-opacity"
                style={{ color: 'rgba(10,10,10,0.4)' }}>
                Reset
              </button>
            )}
          </div>
          <div className="relative">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
              {TASTE_CHIPS.map(chip => {
                const active = activeTastes.includes(chip.id)
                return (
                  <button key={chip.id}
                    onClick={() => toggleTaste(chip.id)}
                    className="shrink-0 text-[10px] font-black tracking-[0.14em] uppercase px-3 py-1.5 transition-all"
                    style={{
                      color: active ? '#FFFFFF' : chip.color,
                      background: active ? chip.color : 'transparent',
                      border: `1px solid ${active ? chip.color : `${chip.color}40`}`,
                    }}>
                    {chip.label}
                  </button>
                )
              })}
            </div>
            <div className="pointer-events-none absolute top-0 right-0 bottom-1 w-8 md:hidden"
              style={{ background: 'linear-gradient(to right, transparent, #FFFFFF)' }} />
          </div>
        </section>

        {/* VIBE — multi-select */}
        <section className="mb-4">
          <div className="flex items-baseline justify-between gap-3 mb-2.5">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase"
              style={{ color: 'rgba(10,10,10,0.4)' }}>
              Vibe
            </p>
            {activeMoods.length > 0 && (
              <button onClick={() => setActiveMoods([])}
                className="text-[10px] font-bold hover:opacity-60 transition-opacity"
                style={{ color: 'rgba(10,10,10,0.4)' }}>
                Reset
              </button>
            )}
          </div>
          <div className="relative">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
              {COLLECTIONS.map(col => {
                const active = activeMoods.includes(col.id)
                return (
                  <button key={col.id}
                    onClick={() => toggleMood(col.id)}
                    className="shrink-0 text-[10px] font-black tracking-[0.14em] uppercase px-3 py-1.5 transition-all"
                    style={{
                      color: active ? '#FFFFFF' : col.color,
                      background: active ? col.color : 'transparent',
                      border: `1px solid ${active ? col.color : `${col.color}40`}`,
                    }}>
                    {col.label}
                  </button>
                )
              })}
            </div>
            <div className="pointer-events-none absolute top-0 right-0 bottom-1 w-8 md:hidden"
              style={{ background: 'linear-gradient(to right, transparent, #FFFFFF)' }} />
          </div>
        </section>

        {/* NEIGHBOURHOOD — multi-select, derived from venue corpus */}
        {HOOD_CHIPS.length > 0 && (
          <section className="mb-6">
            <div className="flex items-baseline justify-between gap-3 mb-2.5">
              <p className="text-[10px] font-black tracking-[0.22em] uppercase"
                style={{ color: 'rgba(10,10,10,0.4)' }}>
                Neighbourhood
              </p>
              {activeHoods.length > 0 && (
                <button onClick={() => setActiveHoods([])}
                  className="text-[10px] font-bold hover:opacity-60 transition-opacity"
                  style={{ color: 'rgba(10,10,10,0.4)' }}>
                  Reset
                </button>
              )}
            </div>
            <div className="relative">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
                {HOOD_CHIPS.map(name => {
                  const active = activeHoods.includes(name)
                  // Strip dual-language suffix for chip display ("Ixelles / Elsene" → "Ixelles")
                  const label = name.split(' / ')[0]
                  return (
                    <button key={name}
                      onClick={() => toggleHood(name)}
                      className="shrink-0 text-[10px] font-black tracking-[0.14em] uppercase px-3 py-1.5 transition-all"
                      style={{
                        color: active ? '#FFFFFF' : '#4744C8',
                        background: active ? '#4744C8' : 'transparent',
                        border: `1px solid ${active ? '#4744C8' : 'rgba(71,68,200,0.25)'}`,
                      }}>
                      {label}
                    </button>
                  )
                })}
              </div>
              <div className="pointer-events-none absolute top-0 right-0 bottom-1 w-8 md:hidden"
                style={{ background: 'linear-gradient(to right, transparent, #FFFFFF)' }} />
            </div>
          </section>
        )}

        {/* Active-filter summary + reset — solid colored band, not a ghost tint */}
        {anyFilterActive && (
          <div className="mb-6 flex items-center justify-between gap-3 px-4 py-2.5"
            style={{ background: '#4744C8' }}>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              Showing <strong>{filtered.length}</strong> of {regular.length} venues
            </p>
            <button onClick={resetAll}
              className="text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-90 transition-opacity"
              style={{ color: '#FFFFFF' }}>
              Clear all →
            </button>
          </div>
        )}

        {/* Browse */}
        <div className="mb-14">
          {/* Header row: label + type tabs + view toggle */}
          <div className="flex items-center gap-4 mb-4" style={{ borderBottom: '1px solid rgba(10,10,10,0.08)', paddingBottom: '0.75rem' }}>
            <p className="text-[10px] font-black tracking-[0.22em] uppercase flex-1" style={{ color: 'rgba(10,10,10,0.4)' }}>
              {anyFilterActive ? 'Matches' : 'Browse all'}
              <span className="ml-2 font-medium" style={{ opacity: 0.5 }}>{filtered.length}</span>
            </p>

            {/* Type tabs — always visible; they intersect with the chip filters */}
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
              {/* Lead row: asymmetric — first venue spans 2 cols of 3,
                  second venue takes 1 col. Mag flatplan move. */}
              {filtered.length >= 2 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  {filtered.slice(0, 2).map((v, i) => {
                    const saved = (profile.spots ?? []).some(s => s.name === v.name)
                    return (
                      <div key={v.id} className={i === 0 ? 'md:col-span-2' : ''}>
                        <VenueCard venue={v} cityId={cityId} saved={saved}
                          photoRef={venuePhotos[v.id]} lead
                          leadNumber={i === 0 ? '01' : '02'}
                          onSave={() => {
                            if (!user || saved) return
                            const cat = v.broadType === 'restaurant' ? 'restaurant' : v.broadType === 'bar' ? 'bar' : v.broadType === 'cafe' ? 'cafe' : 'shop'
                            addSpot({ name: v.name, category: cat })
                          }} />
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Regular 3-col grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filtered.slice(filtered.length >= 2 ? 2 : 0).map(v => {
                  const saved = (profile.spots ?? []).some(s => s.name === v.name)
                  return (
                    <VenueCard key={v.id} venue={v} cityId={cityId} saved={saved} photoRef={venuePhotos[v.id]}
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
        {/* Scouted section hides when ANY chip filter is active — the user
            is clearly looking for something specific in the curated set. */}
        {scouted.length > 0 && !anyFilterActive && (
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
                    <ScoutCard key={v.id} venue={v} cityId={cityId} saved={saved}
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

      </div>
    </div>
  )
}
