'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SaveButton } from '@/components/city/SaveButton'
import { useSavedEvents } from '@/lib/hooks/use-saved-events'

export interface SerializableEvent {
  id: string; title: string; date: string; time: string
  venue: string; source: string; url: string; dateTs: number; image?: string
}
export interface GroupedEvent {
  ev: SerializableEvent
  dates: { date: string; time: string; url: string }[]
}

const VENUE_COLOR: Record<string, string> = {
  'Magasin 4': '#E8001E', 'Botanique': '#2D7D46', 'Flagey': '#C8900A',
  'Halles de Schaerbeek': '#9B4DCA', 'Recyclart': '#E84B1A', 'La Monnaie': '#B8860B',
  'Ticketmaster': '#0073E6',
}

export default function EventsSection({ allEvents, cityId }: { allEvents: GroupedEvent[]; cityId: string }) {
  const [activeSource, setActiveSource] = useState<string | null>(null)
  const [filterOpen,   setFilterOpen]   = useState(false)
  const { savedIds, toggle } = useSavedEvents(cityId)

  const sources = Array.from(new Set(allEvents.map(({ ev }) => ev.source))).sort()

  const filtered = activeSource
    ? allEvents.filter(({ ev }) => ev.source === activeSource)
    : allEvents

  const nowDate   = new Date(); nowDate.setHours(0, 0, 0, 0)
  const tomorrow  = new Date(nowDate); tomorrow.setDate(tomorrow.getDate() + 1)
  const dayOfWeek = nowDate.getDay()
  const daysToSun = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  const endOfWeek = new Date(nowDate); endOfWeek.setDate(endOfWeek.getDate() + daysToSun + 1)

  const buckets = [
    { label: 'Tonight',      accent: '#FF3EBA', items: filtered.filter(({ ev }) => { const d = new Date(ev.dateTs); d.setHours(0,0,0,0); return d.getTime() === nowDate.getTime() }) },
    { label: 'This Weekend', accent: '#FAB400', items: filtered.filter(({ ev }) => { const d = new Date(ev.dateTs); d.setHours(0,0,0,0); return d >= tomorrow && d < endOfWeek }) },
    { label: 'Coming Up',    accent: 'rgba(10,10,10,0.12)', items: filtered.filter(({ ev }) => { const d = new Date(ev.dateTs); d.setHours(0,0,0,0); return d >= endOfWeek }) },
  ].filter(b => b.items.length > 0)

  if (allEvents.length === 0) return null

  return (
    <section>

      {/* ── Section label + filter control — inline, unobtrusive ──────────── */}
      <div className="flex items-center justify-between mb-6">
        <div /> {/* spacer — headings live inside each bucket */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen(v => !v)}
            className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.15em] uppercase transition-opacity hover:opacity-60"
            style={{ color: activeSource ? '#4744C8' : 'rgba(10,10,10,0.3)' }}>
            {activeSource ?? 'All venues'}
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ transform: filterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
              <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] shadow-lg"
              style={{ background: '#fff', border: '1px solid rgba(10,10,10,0.1)' }}>
              <button
                onClick={() => { setActiveSource(null); setFilterOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-[10px] font-black tracking-wide uppercase hover:bg-neutral-50 transition-colors"
                style={{ color: !activeSource ? '#0A0A0A' : 'rgba(10,10,10,0.4)', borderBottom: '1px solid rgba(10,10,10,0.06)' }}>
                All venues
              </button>
              {sources.map(src => {
                const color = VENUE_COLOR[src] ?? '#4744C8'
                const count = allEvents.filter(({ ev }) => ev.source === src).length
                return (
                  <button
                    key={src}
                    onClick={() => { setActiveSource(activeSource === src ? null : src); setFilterOpen(false) }}
                    className="w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                    style={{ borderBottom: '1px solid rgba(10,10,10,0.04)' }}>
                    <span className="text-[10px] font-black tracking-wide uppercase" style={{ color }}>{src}</span>
                    <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.3)' }}>{count}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Buckets ──────────────────────────────────────────────────────── */}
      <div className="space-y-16">
        {buckets.map((bucket, bucketIdx) => {
          const isComingUp = bucket.label === 'Coming Up'
          const hero       = bucket.items[0]
          const rest       = bucket.items.slice(1, isComingUp ? 999 : 7)

          return (
            <div key={bucket.label}>

              {/* Bucket heading */}
              <div className="flex items-baseline justify-between mb-5">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-display font-black leading-none"
                    style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
                    {bucket.label}
                  </h2>
                  <span className="text-xs font-medium" style={{ color: 'rgba(10,10,10,0.25)' }}>
                    {bucket.items.length}
                  </span>
                </div>
                {isComingUp && (
                  <Link href={`/${cityId}/connect`}
                    className="text-[10px] font-black tracking-widest uppercase hover:opacity-50 transition-opacity"
                    style={{ color: '#4744C8' }}>
                    See all →
                  </Link>
                )}
              </div>

              {/* ── Coming Up: editorial list rows ──────────────────────── */}
              {isComingUp && (
                <div>
                  {bucket.items.slice(0, 12).map(({ ev, dates }, idx) => {
                    const venueColor = VENUE_COLOR[ev.source] ?? '#4744C8'
                    const isSaved    = savedIds.has(ev.id)
                    return (
                      <a key={ev.id + idx}
                        href={dates[0].url} target="_blank" rel="noopener noreferrer"
                        className="group flex items-start gap-4 py-4 hover:bg-neutral-50 -mx-3 px-3 transition-colors"
                        style={{ borderTop: '1px solid rgba(10,10,10,0.07)' }}>

                        {/* Thumbnail — only when image exists */}
                        {ev.image && (
                          <div className="shrink-0 w-14 h-14 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={ev.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm font-bold leading-snug group-hover:opacity-70 transition-opacity"
                            style={{ color: '#0A0A0A' }}>
                            {ev.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: venueColor }}>
                              {ev.source}
                            </span>
                            <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.3)' }}>·</span>
                            <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.4)' }}>
                              {dates[0].date}
                              {dates[0].time && <span className="ml-1 opacity-70">{dates[0].time}</span>}
                            </span>
                            {dates.length > 1 && (
                              <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.3)' }}>
                                +{dates.length - 1} dates
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 pt-0.5">
                          <SaveButton saved={isSaved} onToggle={() => toggle(ev)} />
                        </div>
                      </a>
                    )
                  })}
                </div>
              )}

              {/* ── Tonight / This Weekend: hero + grid ──────────────────── */}
              {!isComingUp && (
                <div className="space-y-3">

                  {/* Hero — full width, tall image */}
                  {hero && (() => {
                    const { ev, dates } = hero
                    const venueColor    = VENUE_COLOR[ev.source] ?? '#4744C8'
                    const isSaved       = savedIds.has(ev.id)
                    const isDark        = bucket.label === 'Tonight'

                    return (
                      <a href={dates[0].url} target="_blank" rel="noopener noreferrer"
                        className="group block relative overflow-hidden hover:opacity-95 transition-opacity"
                        style={{ border: `1px solid ${isDark ? 'rgba(255,62,186,0.15)' : 'rgba(10,10,10,0.08)'}` }}>

                        <div className="absolute top-3 right-3 z-10">
                          <SaveButton saved={isSaved} onToggle={() => toggle(ev)} />
                        </div>

                        {ev.image ? (
                          <div className="relative overflow-hidden" style={{ height: 'clamp(220px, 35vw, 340px)' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={ev.image} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,5,5,0.88) 0%, rgba(5,5,5,0.3) 45%, transparent 70%)' }} />
                            {/* Venue chip */}
                            <span className="absolute top-4 left-4 text-[10px] font-black px-2 py-0.5 uppercase tracking-wider"
                              style={{ background: venueColor, color: '#fff' }}>
                              {ev.source}
                            </span>
                            {/* Accent bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: bucket.accent }} />
                            {/* Content overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                              <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: bucket.accent }}>
                                {dates[0].date}
                                {dates[0].time && <span className="ml-2 opacity-75">{dates[0].time}</span>}
                                {dates.length > 1 && <span className="ml-3 opacity-50">+{dates.length - 1} dates</span>}
                              </p>
                              <p className="font-display font-black leading-tight text-white"
                                style={{ fontSize: 'clamp(1.2rem, 3vw, 1.75rem)', letterSpacing: '-0.01em' }}>
                                {ev.title}
                              </p>
                              {ev.venue && ev.venue !== ev.source && (
                                <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{ev.venue}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* No image: clean text-only hero — no fake placeholder */
                          <div className="px-6 py-8 pr-14"
                            style={{ borderLeft: `4px solid ${venueColor}` }}>
                            <span className="text-[10px] font-black px-2 py-0.5 uppercase tracking-wider inline-block mb-3"
                              style={{ background: venueColor, color: '#fff' }}>
                              {ev.source}
                            </span>
                            <p className="text-[10px] font-black tracking-widest uppercase mb-3"
                              style={{ color: 'rgba(10,10,10,0.4)' }}>
                              {dates[0].date}{dates[0].time && ` · ${dates[0].time}`}
                              {dates.length > 1 && <span className="ml-3 opacity-60">+{dates.length - 1} dates</span>}
                            </p>
                            <p className="font-display font-black leading-tight"
                              style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#0A0A0A', letterSpacing: '-0.01em' }}>
                              {ev.title}
                            </p>
                            {ev.venue && ev.venue !== ev.source && (
                              <p className="text-xs mt-2" style={{ color: 'rgba(10,10,10,0.38)' }}>{ev.venue}</p>
                            )}
                          </div>
                        )}
                      </a>
                    )
                  })()}

                  {/* Rest — 2-col grid */}
                  {rest.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {rest.map(({ ev, dates }, idx) => {
                        const venueColor = VENUE_COLOR[ev.source] ?? '#4744C8'
                        const isSaved    = savedIds.has(ev.id)
                        return (
                          <a key={ev.id + idx}
                            href={dates[0].url} target="_blank" rel="noopener noreferrer"
                            className="group overflow-hidden hover:opacity-85 transition-opacity flex flex-col"
                            style={{ border: '1px solid rgba(10,10,10,0.08)', background: '#FFFFFF', borderLeft: ev.image ? '1px solid rgba(10,10,10,0.08)' : `3px solid ${venueColor}` }}>

                            {/* Image — only when available */}
                            {ev.image && (
                              <div className="relative overflow-hidden shrink-0" style={{ height: 100 }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={ev.image} alt="" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,5,5,0.5) 0%, transparent 60%)' }} />
                                <span className="absolute bottom-2 left-2 text-[7px] font-black px-1.5 py-0.5 uppercase tracking-wide"
                                  style={{ background: venueColor, color: '#fff' }}>
                                  {ev.source}
                                </span>
                              </div>
                            )}

                            {/* Body */}
                            <div className="px-3 py-3 flex flex-col flex-1">
                              {/* Source chip for text-only cards */}
                              {!ev.image && (
                                <span className="text-[7px] font-black px-1.5 py-0.5 uppercase tracking-wide self-start mb-2"
                                  style={{ background: venueColor, color: '#fff' }}>
                                  {ev.source}
                                </span>
                              )}
                              <p className="text-[10px] font-black tracking-wide uppercase mb-1.5"
                                style={{ color: bucket.accent === 'rgba(10,10,10,0.12)' ? '#4744C8' : bucket.accent }}>
                                {dates[0].date.split(' ').slice(0, 3).join(' ')}
                                {dates[0].time && <span className="ml-1 opacity-60">{dates[0].time}</span>}
                              </p>
                              <p className="text-xs font-bold leading-snug flex-1" style={{ color: '#0A0A0A' }}>
                                {ev.title}
                              </p>
                              <div className="mt-2 flex justify-end">
                                <SaveButton saved={isSaved} onToggle={() => toggle(ev)} />
                              </div>
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  )}

                </div>
              )}

            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-sm text-center" style={{ color: 'rgba(10,10,10,0.3)' }}>
          No events for this venue.
        </p>
      )}
    </section>
  )
}
