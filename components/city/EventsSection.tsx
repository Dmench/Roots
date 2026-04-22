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

export default function EventsSection({
  allEvents,
  cityId,
}: {
  allEvents: GroupedEvent[]
  cityId: string
}) {
  const [activeSource, setActiveSource] = useState<string | null>(null)
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
    { label: 'Today',        items: filtered.filter(({ ev }) => { const d = new Date(ev.dateTs); d.setHours(0,0,0,0); return d.getTime() === nowDate.getTime() }) },
    { label: 'This weekend', items: filtered.filter(({ ev }) => { const d = new Date(ev.dateTs); d.setHours(0,0,0,0); return d >= tomorrow && d < endOfWeek }) },
    { label: 'Coming up',    items: filtered.filter(({ ev }) => { const d = new Date(ev.dateTs); d.setHours(0,0,0,0); return d >= endOfWeek }) },
  ].filter(b => b.items.length > 0)

  if (allEvents.length === 0) return null

  return (
    <section>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-wrap mb-8">
        <button
          onClick={() => setActiveSource(null)}
          className="px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide transition-all"
          style={!activeSource
            ? { background: '#252450', color: '#F5ECD7' }
            : { background: 'rgba(37,36,80,0.06)', color: 'rgba(37,36,80,0.4)' }
          }
        >
          All venues
        </button>
        {sources.map(src => {
          const color  = VENUE_COLOR[src] ?? '#4744C8'
          const count  = allEvents.filter(({ ev }) => ev.source === src).length
          const active = activeSource === src
          return (
            <button
              key={src}
              onClick={() => setActiveSource(active ? null : src)}
              className="px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide transition-all"
              style={active
                ? { background: color, color: '#fff' }
                : { background: `${color}10`, color: color }
              }
            >
              {src}
              <span className="ml-1 opacity-60">·{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── Bucketed sections ──────────────────────────────────────────── */}
      <div className="space-y-12">
        {buckets.map(bucket => {
          const isTonight  = bucket.label === 'Today'
          const isWeekend  = bucket.label === 'This weekend'
          const items = bucket.items.slice(0, bucket.label === 'Coming up' ? 8 : 99)

          // Label copy + accent
          const labelText    = isTonight ? 'Tonight' : isWeekend ? 'This Weekend' : 'Coming Up'
          const accentColor  = isTonight ? '#FF3EBA' : isWeekend ? '#FAB400' : 'rgba(37,36,80,0.2)'

          return (
            <div key={bucket.label}>
              {/* Section header */}
              <div className="flex items-end justify-between mb-5 pb-3"
                style={{ borderBottom: `2px solid ${accentColor}` }}>
                <div className="flex items-baseline gap-3">
                  <h2 className="font-display font-black leading-none"
                    style={{ fontSize: 'clamp(1.4rem, 3vw, 1.75rem)', color: '#0F0E1E' }}>
                    {labelText}
                  </h2>
                  <span className="text-xs font-medium" style={{ color: 'rgba(37,36,80,0.3)' }}>
                    {bucket.items.length} event{bucket.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {bucket.label === 'Coming up' && (
                  <Link href={`/${cityId}/connect`}
                    className="text-[10px] font-black tracking-widest uppercase hover:opacity-60 transition-opacity shrink-0"
                    style={{ color: '#4744C8' }}>
                    See all →
                  </Link>
                )}
              </div>

              {/* ── Grid ─────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map(({ ev, dates }, idx) => {
                  const venueColor  = VENUE_COLOR[ev.source] ?? '#4744C8'
                  const isHero      = idx === 0 && bucket.label !== 'Coming up'
                  const isDarkHero  = isHero && isTonight

                  const isSaved = savedIds.has(ev.id)

                  return (
                    <a
                      key={`${bucket.label}-${ev.id}-${idx}`}
                      href={dates[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        isDarkHero
                          ? 'group rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col sm:col-span-2 relative'
                          : isHero
                          ? 'group bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col sm:col-span-2 relative'
                          : 'group bg-white rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col relative'
                      }
                      style={isDarkHero
                        ? { background: '#0F0E1E', border: '1px solid rgba(255,62,186,0.15)' }
                        : { border: '1px solid rgba(37,36,80,0.07)' }}
                    >
                      {/* Save button — always top-right */}
                      <div className="absolute top-3 right-3 z-10">
                        <SaveButton saved={isSaved} onToggle={() => toggle(ev)} />
                      </div>

                      {/* Image */}
                      {ev.image ? (
                        <div className={`w-full overflow-hidden relative shrink-0 ${isHero ? 'h-52' : 'h-36'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ev.image}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                          <div className="absolute inset-0"
                            style={{ background: 'linear-gradient(to top, rgba(15,13,30,0.65) 0%, transparent 55%)' }} />
                          {/* Venue badge */}
                          <span
                            className="absolute top-3 left-3 text-[9px] font-black px-2.5 py-1 rounded-full"
                            style={{ background: venueColor, color: '#fff', letterSpacing: '0.07em' }}>
                            {ev.source.toUpperCase()}
                          </span>
                          {/* Date on image */}
                          {isHero && (
                            <div className="absolute bottom-3 left-4 right-4">
                              <p className="text-[10px] font-black tracking-wider uppercase mb-1"
                                style={{ color: '#10B981' }}>
                                {dates[0].date}
                                {dates[0].time && <span className="ml-2 opacity-70">{dates[0].time}</span>}
                              </p>
                              <p className="text-lg font-bold leading-tight" style={{ color: '#F5ECD7' }}>
                                {ev.title}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* No image — colored venue band */
                        <div className="w-full flex items-center justify-between px-4 py-2.5 shrink-0"
                          style={{ background: `${venueColor}12` }}>
                          <span className="text-[9px] font-black tracking-wider uppercase"
                            style={{ color: venueColor }}>
                            {ev.source}
                          </span>
                        </div>
                      )}

                      {/* Body — only show title/dates below image for hero (title is on the image overlay) */}
                      {!isHero && (
                        <div className="px-4 py-4 flex flex-col flex-1">
                          <p className="text-[10px] font-black tracking-wider uppercase mb-2"
                            style={{ color: '#10B981' }}>
                            {dates[0].date.split(' ').slice(0, 3).join(' ')}
                            {dates[0].time && (
                              <span className="ml-2 font-medium opacity-60">{dates[0].time}</span>
                            )}
                            {dates.length > 1 && (
                              <span className="ml-2 opacity-40" style={{ color: '#252450' }}>
                                +{dates.length - 1}
                              </span>
                            )}
                          </p>
                          <p className="text-sm font-bold leading-snug group-hover:opacity-70 transition-opacity flex-1"
                            style={{ color: '#252450' }}>
                            {ev.title}
                          </p>
                          {ev.venue && ev.venue !== ev.source && (
                            <p className="text-[10px] mt-2 truncate" style={{ color: 'rgba(37,36,80,0.35)' }}>
                              {ev.venue}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Hero body — dark card no-image fallback + extra dates */}
                      {isHero && !ev.image && (
                        <div className="px-5 py-5 flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full"
                              style={{ background: venueColor, color: '#fff' }}>
                              {ev.source.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] font-black tracking-wider uppercase mb-3"
                            style={{ color: isDarkHero ? '#FF3EBA' : '#10B981' }}>
                            {dates[0].date}
                            {dates[0].time && <span className="ml-2 opacity-70">{dates[0].time}</span>}
                          </p>
                          <p className="font-display font-bold leading-snug flex-1"
                            style={{ fontSize: '1.15rem', color: isDarkHero ? '#F5ECD7' : '#252450' }}>
                            {ev.title}
                          </p>
                          {ev.venue && ev.venue !== ev.source && (
                            <p className="text-[10px] mt-3 truncate"
                              style={{ color: isDarkHero ? 'rgba(245,236,215,0.35)' : 'rgba(37,36,80,0.35)' }}>
                              {ev.venue}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Hero body with image — extra dates footer */}
                      {isHero && ev.image && (
                        <div className="px-4 py-3 flex items-center justify-between"
                          style={{ background: isDarkHero ? 'rgba(255,255,255,0.04)' : undefined }}>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            {dates.slice(1, 4).map((d, i) => (
                              <span key={i} className="text-[10px] font-bold"
                                style={{ color: isDarkHero ? 'rgba(245,236,215,0.35)' : 'rgba(37,36,80,0.4)' }}>
                                {d.date.split(' ').slice(0, 3).join(' ')}
                              </span>
                            ))}
                            {dates.length > 4 && (
                              <span className="text-[10px] opacity-35"
                                style={{ color: isDarkHero ? '#F5ECD7' : '#252450' }}>
                                +{dates.length - 4} more
                              </span>
                            )}
                          </div>
                          {ev.venue && ev.venue !== ev.source && (
                            <p className="text-[10px] shrink-0 ml-3"
                              style={{ color: isDarkHero ? 'rgba(245,236,215,0.3)' : 'rgba(37,36,80,0.35)' }}>
                              {ev.venue}
                            </p>
                          )}
                        </div>
                      )}
                    </a>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: 'rgba(37,36,80,0.3)' }}>
            No upcoming events for this venue.
          </p>
        </div>
      )}
    </section>
  )
}
