import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import { getEvents } from '@/lib/data/events'
import type { EventPreview } from '@/lib/data/events'
import { getNews } from '@/lib/data/news'
import { getVenues } from '@/lib/data/venues'
import EventsSection from '@/components/city/EventsSection'
import type { GroupedEvent } from '@/components/city/EventsSection'
import { EditorsPicks } from '@/components/city/EditorsPicks'
import { currentBrusselsPick } from '@/lib/data/picks/brussels'
import { VenueSpotlight } from '@/components/city/VenueSpotlight'
import { SettlersStrip } from '@/components/city/SettlersStrip'
import { LiveSettlerCount } from '@/components/city/LiveSettlerCount'
import AuthGate from '@/components/auth/AuthGate'
import { CityHubClient } from '@/components/city/CityHubClient'
import { WeatherWidget } from '@/components/city/WeatherWidget'
import { TransportWidget } from '@/components/city/TransportWidget'
import { RentalsWidget } from '@/components/city/RentalsWidget'
import { SpinWheel } from '@/components/city/SpinWheel'
import { FirstWeekModule } from '@/components/city/FirstWeekModule'
import { HousingHubCard } from '@/components/city/HousingHubCard'
import { EventsHubCard } from '@/components/city/EventsHubCard'
import { WeeklyNote } from '@/components/connect/WeeklyNote'
import WeeklyMatchup from '@/components/connect/WeeklyMatchup'
import { ResumeStateHero } from '@/components/city/ResumeStateHero'
import type { CityId } from '@/lib/types'

export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

// Shortened from 1800s (30 min) to 300s (5 min) so changes to the
// venue_photo_cache propagate faster — without it, a freshly-populated
// photoRef can take up to 30 min to appear in user views.
export const revalidate = 300

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city || !city.active) notFound()

  const [eventsRaw, news, venues] = await Promise.all([
    getEvents(cityId), getNews(cityId), getVenues(cityId),
  ])

  const grouped = new Map<string, { ev: EventPreview; dates: { date: string; time: string; url: string }[] }>()
  for (const ev of eventsRaw) {
    const key = ev.title.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (grouped.has(key)) {
      grouped.get(key)!.dates.push({ date: ev.date, time: ev.time, url: ev.url })
    } else {
      grouped.set(key, { ev, dates: [{ date: ev.date, time: ev.time, url: ev.url }] })
    }
  }
  const allEvents: GroupedEvent[] = [...grouped.values()].map(({ ev, dates }) => ({
    ev: {
      id: ev.id, title: ev.title, date: ev.date, time: ev.time,
      venue: ev.venue, source: ev.source, url: ev.url,
      dateTs: ev.dateObj.getTime(), image: ev.image,
    },
    dates,
  }))

  const now     = new Date()
  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const SOURCE_COLOR: Record<string, string> = {
    'The Bulletin': '#4744C8',
    'Politico EU':  '#C8152A',
  }

  const featuredNews  = news[0]
  const secondaryNews = news.slice(1, 4)

  return (
    <AuthGate cityName={city.name} cityId={cityId}>
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }} className="relative overflow-hidden">
      {/* Geometric thread — echoes landing page */}
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: '#4744C8', width: '40vw', height: '40vw', maxWidth: 500, maxHeight: 500, top: '-18%', right: '-12%', opacity: 0.03 }} />
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: '#FF3EBA', width: '15vw', height: '15vw', maxWidth: 180, maxHeight: 180, bottom: '8%', left: '3%', opacity: 0.025 }} />
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: '#FAB400', width: '10vw', height: '10vw', maxWidth: 120, maxHeight: 120, top: '60%', right: '5%', opacity: 0.03 }} />

      <CityHubClient cityName={city.name} cityId={cityId} />

      {/* ── Masthead ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#F9F8F6', borderBottom: '2px solid #0A0A0A' }}>

        {/* Brand rule */}
        <div style={{ height: 4, background: '#252450' }} />

        <div className="px-6 sm:px-10 md:px-14 py-10 md:py-14">

          {/* City nameplate */}
          <div className="flex items-center justify-between gap-4 mb-10">
            <div className="hidden sm:block shrink-0">
              <p className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: 'rgba(10,10,10,0.3)' }}>
                {dayName}
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(10,10,10,0.2)' }}>
                {dateStr}
              </p>
            </div>

            <div className="flex-1 sm:text-center">
              <h1 className="font-display font-black leading-none tracking-tight"
                style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', color: '#0A0A0A' }}>
                {city.name}
              </h1>
              <p className="text-[10px] font-black tracking-[0.28em] uppercase mt-1"
                style={{ color: 'rgba(10,10,10,0.35)' }}>
                Local, on purpose · Your first 90 days in {city.country}
              </p>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    style={{ background: '#10B981' }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5"
                    style={{ background: '#10B981' }} />
                </span>
                <span className="text-xs font-medium" style={{ color: 'rgba(10,10,10,0.45)' }}>
                  <LiveSettlerCount cityId={cityId} fallback={city.settlerCount} />
                </span>
              </div>
              {allEvents.length > 0 && (
                <p className="text-[10px]" style={{ color: 'rgba(10,10,10,0.25)' }}>
                  {allEvents.length} event{allEvents.length !== 1 ? 's' : ''} upcoming
                </p>
              )}
            </div>
          </div>

          {/* ── Section nav — typographic, colored, magazine-grade ──────────
              Color lives in the typography + a 2px top rule per button.
              No bordered pills — the editorial council called those "tag
              cloud, not navigation." Hover state slides the rule on full. */}
          <nav className="flex flex-wrap mt-2"
            style={{ borderTop: '1px solid rgba(10,10,10,0.08)', paddingTop: 18 }}>
            {[
              { href: `/${cityId}/settle`,         label: 'Settle',        color: '#FAB400' },
              { href: `/${cityId}/neighbourhoods`, label: 'Neighbourhoods', color: '#4744C8' },
              { href: `/${cityId}/eat`,            label: 'Eat & Drink',   color: '#E8612A' },
              { href: `/${cityId}/connect`,        label: 'Community',     color: '#FF3EBA' },
              { href: `/${cityId}/ask`,            label: 'Ask',           color: '#38C0F0' },
              { href: `/${cityId}/people`,         label: 'People',        color: '#0E9B6B' },
            ].map(p => (
              <Link key={p.href} href={p.href}
                className="group text-[11px] font-black tracking-[0.18em] uppercase pr-6 py-2 relative"
                style={{ color: p.color }}>
                {/* Top accent rule — 2px when idle, full-bar slide on hover */}
                <span className="absolute left-0 right-6 top-0 h-[2px] transition-all"
                  style={{ background: p.color, opacity: 0.25 }} />
                <span className="absolute left-0 top-0 h-[2px] w-3 group-hover:w-[calc(100%-1.5rem)] transition-all duration-300"
                  style={{ background: p.color }} />
                {p.label}
              </Link>
            ))}
          </nav>

          <SettlersStrip cityId={cityId} />
        </div>
      </div>


      {/* ── Settler-supply cards: Housing + Events ─────────────────────────
          Sit between masthead and editorial body — the "seam" placement
          (editorial council). On white, not in the cream masthead block,
          so they read as deliberate handoff to user-action, not as a
          fifth masthead element. Above-the-fold on mobile.            */}
      <div className="px-6 sm:px-10 md:px-14 pt-6 pb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <HousingHubCard cityId={cityId} />
          <EventsHubCard  cityId={cityId} />
        </div>
      </div>

      {/* ── City signals — moved from Connect (IA council unanimous): the
          weekly editorial note and the Vrijdag matchup are CITY signals,
          not community conversation. They belong on the Hub next to
          weather / transport / events, not inside the talk page.        */}
      <div className="px-6 sm:px-10 md:px-14 pt-8 pb-2">
        <WeeklyNote cityId={cityId} />
        <WeeklyMatchup cityId={cityId} />
      </div>


      {/* ── Editorial body ───────────────────────────────────────────────── */}
      <div className="px-6 sm:px-10 md:px-14">

        {/* Column rule */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_1px_400px]">
          <div className="lg:pr-10 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(10,10,10,0.1)' }} />
          <div />
          <div className="lg:pl-10 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(10,10,10,0.1)' }} />
        </div>
        <div className="lg:hidden pt-5 pb-4" style={{ borderBottom: '1px solid rgba(10,10,10,0.1)' }} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_400px] gap-0 pb-16">

          {/* ── LEFT: Resume hero (returning users) → First-Week spine + Editor's Picks + Events ──────── */}
          <div className="lg:pr-10 pt-7">
            <ResumeStateHero cityId={cityId as CityId} cityName={city.name} />
            <FirstWeekModule cityId={cityId as CityId} />

            {cityId === 'brussels' && (() => {
              const pick = currentBrusselsPick()
              // Resolve the editor's-pick venue's photoRef from the
              // already-enriched venue list. Falls back to `null` and the
              // component renders the text-only hero variant.
              const pickVenue = pick.venue.venueId
                ? venues.find(v => v.id === pick.venue.venueId)
                : null
              return <EditorsPicks pick={pick} cityId={cityId} photoRef={pickVenue?.photoRef ?? null} />
            })()}

            {/* Running head — colored type + colored puck + 2px colored bottom rule */}
            <div className="flex items-baseline justify-between gap-3 mb-5 pb-2.5"
              style={{ borderBottom: '2px solid #FF3EBA' }}>
              <span className="flex items-center gap-2.5">
                {/* Pink filled circle puck — section identity ornament */}
                <span className="shrink-0 inline-block"
                  style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF3EBA' }} />
                <span className="text-[9px] font-black tracking-[0.32em] uppercase"
                  style={{ color: '#FF3EBA' }}>
                  № 01
                </span>
                <span className="text-xs font-black tracking-[0.16em] uppercase"
                  style={{ color: '#FF3EBA' }}>
                  What&apos;s on in {city.name}
                </span>
              </span>
              {allEvents.length > 0 && (
                <span className="text-[10px] font-black tracking-[0.18em] uppercase"
                  style={{ color: 'rgba(10,10,10,0.4)' }}>
                  {allEvents.length} ahead
                </span>
              )}
            </div>
            <EventsSection allEvents={allEvents} cityId={cityId} />
          </div>

          {/* Vertical rule */}
          <div className="hidden lg:block" style={{ background: 'rgba(10,10,10,0.08)' }} />

          {/* ── RIGHT: Sidebar ──────────────────────────────────────────── */}
          <div className="lg:pl-10 pt-7">

            {/* ─ SpinWheel — sidebar lead. Interactive discovery first;
                the rest of the rail is utility + editorial below. ─ */}
            {(venues.length > 0 || allEvents.length > 0) && (
              <section className="mb-10">
                <SectionLabel number="02" color="#9B4DCA">Decide for me</SectionLabel>
                <div className="pt-3 pb-2">
                  <SpinWheel
                    cityId={cityId}
                    venues={venues.map(v => ({
                      id:           v.id,
                      name:         v.name,
                      category:     v.category,
                      broadType:    v.broadType,
                      neighborhood: v.neighborhood ?? '',
                      vibe:         (v as { vibe?: string }).vibe ?? '',
                      website:      v.website,
                    }))}
                    events={allEvents.slice(0, 30).map(e => ({
                      title: e.ev.title,
                      date:  e.ev.date,
                      venue: e.ev.venue,
                      url:   e.ev.url ?? `/${cityId}`,
                    }))}
                  />
                </div>
              </section>
            )}

            {/* ─ Venue spotlight — photo-led editorial moment.
                Always renders (component has internal colour-block fallback for
                missing/broken photos). Prefers the featured curated venue with
                a photoRef; falls back to any curated venue. ─ */}
            {(() => {
              const spotlight = venues.find(v => v.featured && v.photoRef)
                              ?? venues.find(v => v.featured)
                              ?? venues.find(v => v.photoRef)
                              ?? venues[0]
              return spotlight ? <VenueSpotlight venue={spotlight} cityId={cityId} /> : null
            })()}

            {/* ─ Daily context ─ */}
            <Suspense fallback={<SidebarSkeleton label="Weather" />}>
              <WeatherWidget cityId={cityId} />
            </Suspense>

            <Suspense fallback={<SidebarSkeleton label="Transport" />}>
              <TransportWidget cityId={cityId} />
            </Suspense>

            {/* ─ Eat & Drink ─ */}
            {venues.length > 0 && (
              <section className="mb-10">
                <SectionLabel number="03" color="#E8612A" right={
                  <Link href={`/${cityId}/eat`}
                    className="text-[10px] font-black tracking-widest uppercase hover:opacity-90 transition-opacity"
                    style={{ color: 'rgba(255,255,255,0.95)' }}>
                    See all →
                  </Link>
                }>
                  Eat &amp; Drink
                </SectionLabel>

                {venues.find(v => v.featured) && (() => {
                  const p = venues.find(v => v.featured)!
                  return (
                    <Link href={`/${cityId}/eat`}
                      className="flex items-center gap-3 px-4 py-3.5 mb-3 hover:opacity-90 transition-opacity"
                      style={{ border: '1.5px solid #E8612A' }}>
                      <div className="shrink-0 flex items-center justify-center text-white font-display font-black text-base leading-none"
                        style={{ width: 36, height: 36, background: '#E8612A' }}>
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black tracking-widest uppercase mb-0.5"
                          style={{ color: '#E8612A' }}>
                          {p.dealTag ?? 'Venue pick'}
                        </p>
                        <p className="text-xs font-black truncate" style={{ color: '#0A0A0A' }}>{p.name}</p>
                        {p.neighborhood && (
                          <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: 'rgba(10,10,10,0.45)' }}>
                            {p.neighborhood} · {(p as { vibe?: string }).vibe?.split(',')[0] ?? p.category}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })()}

                <div>
                  {venues.filter(v => !v.featured).slice(0, 4).map((v, idx) => {
                    const tc = v.broadType === 'bar' ? '#4744C8' : v.broadType === 'cafe' ? '#B08800' : '#E8612A'
                    return (
                      <div key={v.id} className="flex items-start gap-3 py-2.5"
                        style={{ borderTop: idx > 0 ? '1px solid rgba(10,10,10,0.06)' : 'none' }}>
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: tc }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-1">
                            <p className="text-sm font-bold truncate" style={{ color: '#0A0A0A' }}>{v.name}</p>
                            {'price' in v && (
                              <span className="text-[10px] font-bold shrink-0" style={{ color: tc }}>
                                {(v as { price?: string }).price}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px]" style={{ color: 'rgba(10,10,10,0.35)' }}>
                            {v.neighborhood} · {(v as { vibe?: string }).vibe?.split(',')[0] ?? v.category}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Rentals — practical reference, not daily-read.
                Sits between Eat (discovery) and News (pulse). */}
            <Suspense fallback={<SidebarSkeleton label="Rent prices" />}>
              <RentalsWidget cityId={cityId} />
            </Suspense>

            {/* In the news */}
            {featuredNews && (
              <section className="mb-10">
                <SectionLabel number="04" color="#252450">In the news</SectionLabel>

                <a href={featuredNews.url} target="_blank" rel="noopener noreferrer"
                  className="group block pt-4 pb-5 hover:opacity-70 transition-opacity"
                  style={{ borderBottom: '2px solid #0A0A0A' }}>
                  <p className="text-[8px] font-black tracking-[0.28em] uppercase mb-2.5"
                    style={{ color: SOURCE_COLOR[featuredNews.source] ?? '#0A0A0A' }}>
                    {featuredNews.source}
                  </p>
                  <h3 className="font-display font-bold leading-[1.1]"
                    style={{ fontSize: '1.05rem', color: '#0A0A0A', letterSpacing: '-0.01em' }}>
                    {featuredNews.title}
                  </h3>
                </a>

                {secondaryNews.map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                    className="group flex items-baseline gap-3 py-3 hover:opacity-60 transition-opacity"
                    style={{ borderBottom: '1px solid rgba(10,10,10,0.07)' }}>
                    <span className="shrink-0 text-[8px] font-black tracking-wider uppercase"
                      style={{ color: SOURCE_COLOR[item.source] ?? 'rgba(10,10,10,0.4)', width: 60 }}>
                      {item.source.split(' ')[0]}
                    </span>
                    <p className="flex-1 text-xs font-semibold leading-snug line-clamp-2"
                      style={{ color: '#0A0A0A' }}>
                      {item.title}
                    </p>
                  </a>
                ))}
              </section>
            )}

            {/* City pulse (Reddit feed) removed from hub — Reddit's anonymous
                API is blocked from Vercel IPs and OAuth setup was a wall.
                /connect still surfaces r/brussels as a community channel. */}

            {/* Explore links */}
            <section>
              <SectionLabel number="05" color="#4744C8">Explore</SectionLabel>
              {[
                { href: `/${cityId}/ask`,    label: 'Ask anything', sub: 'AI that knows the city', dot: '#38C0F0' },
                { href: `/${cityId}/settle`, label: 'Settle in',    sub: 'Admin, commune, bank',   dot: '#FAB400' },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 py-3 group hover:opacity-60 transition-opacity"
                  style={{ borderTop: '1px solid rgba(10,10,10,0.07)' }}>
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: item.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: '#0A0A0A' }}>{item.label}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(10,10,10,0.38)' }}>{item.sub}</p>
                  </div>
                  <span className="text-xs opacity-20 group-hover:opacity-50 transition-opacity"
                    style={{ color: '#0A0A0A' }}>→</span>
                </Link>
              ))}
            </section>

          </div>
        </div>
      </div>
    </div>
    </AuthGate>
  )
}

function SidebarSkeleton({ label }: { label: string }) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between pb-3 mb-1"
        style={{ borderBottom: '1px solid rgba(10,10,10,0.12)' }}>
        <span className="text-xs font-black tracking-[0.16em] uppercase"
          style={{ color: 'rgba(10,10,10,0.5)' }}>{label}</span>
      </div>
      <div className="space-y-2 pt-1">
        {[100, 75, 90].map(w => (
          <div key={w} className="h-3 animate-pulse"
            style={{ width: `${w}%`, background: 'rgba(10,10,10,0.06)' }} />
        ))}
      </div>
    </section>
  )
}

// Magazine running-head: colored typography + a filled CIRCLE in the
// section accent (matches the landing-page geometric motif: circles).
// 2px colored bottom-rule completes the identity. No invented shapes.
function SectionLabel({ children, right, number, color = '#252450' }: {
  children: React.ReactNode
  right?: React.ReactNode
  number?: string
  /** Identity color used for the dot, the № number, the title type, and the 2px bottom rule. */
  color?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-4 pb-2.5"
      style={{ borderBottom: `2px solid ${color}` }}>
      <span className="flex items-center gap-2.5 min-w-0">
        {/* Circle puck — the motif's primitive */}
        <span className="shrink-0 inline-block"
          style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        {number && (
          <span className="text-[9px] font-black tracking-[0.32em] uppercase shrink-0"
            style={{ color }}>
            № {number}
          </span>
        )}
        <span className="text-xs font-black tracking-[0.16em] uppercase truncate"
          style={{ color }}>
          {children}
        </span>
      </span>
      {right && <span className="shrink-0">{right}</span>}
    </div>
  )
}
