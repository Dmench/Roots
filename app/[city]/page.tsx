import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import { getEvents } from '@/lib/data/events'
import type { EventPreview } from '@/lib/data/events'
import { getNews } from '@/lib/data/news'
import { getVenues } from '@/lib/data/venues'
import EventsSection from '@/components/city/EventsSection'
import type { GroupedEvent } from '@/components/city/EventsSection'
import { SettlersStrip } from '@/components/city/SettlersStrip'
import { LiveSettlerCount } from '@/components/city/LiveSettlerCount'
import AuthGate from '@/components/auth/AuthGate'
import RedditFeed from '@/components/city/RedditFeed'
import { CityHubClient } from '@/components/city/CityHubClient'

export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

export const revalidate = 1800

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
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <CityHubClient cityName={city.name} cityId={cityId} />

      {/* ── Masthead ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', borderBottom: '2px solid #0A0A0A' }}>

        {/* Brand rule — single indigo line replaces rainbow stripe */}
        <div style={{ height: 4, background: '#252450' }} />

        <div className="max-w-5xl mx-auto px-6 md:px-12 py-6 md:py-8">

          {/* City nameplate */}
          <div className="flex items-center justify-between gap-4">
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
                style={{ color: 'rgba(10,10,10,0.25)' }}>
                {city.country} · Updated today
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
                  <LiveSettlerCount cityId={cityId} fallback={city.settlerCount} /> settling now
                </span>
              </div>
              {allEvents.length > 0 && (
                <p className="text-[10px]" style={{ color: 'rgba(10,10,10,0.25)' }}>
                  {allEvents.length} event{allEvents.length !== 1 ? 's' : ''} upcoming
                </p>
              )}
            </div>
          </div>

          {/* ── Section portal cards ────────────────────────────────────────
               gap-px + background = 1px gridline trick (no CSS hacks needed) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px mt-8"
            style={{ background: 'rgba(10,10,10,0.1)', border: '1px solid rgba(10,10,10,0.1)' }}>
            {[
              { href: `/${cityId}/connect`, label: 'Community',   sub: 'Tips, questions & posts',        color: '#FF3EBA' },
              { href: `/${cityId}/eat`,     label: 'Eat & Drink', sub: `${venues.length} curated spots`, color: '#E8612A' },
              { href: `/${cityId}/settle`,  label: 'Settle in',   sub: 'Your guided checklist',          color: '#FAB400' },
              { href: `/${cityId}/ask`,     label: 'Ask the AI',  sub: 'Brussels, answered',             color: '#38C0F0' },
              { href: `/${cityId}/people`,  label: 'People',      sub: 'Meet other settlers',            color: '#4744C8' },
            ].map(p => (
              <Link key={p.href} href={p.href}
                className="group flex flex-col px-4 py-4 bg-white hover:bg-neutral-50 transition-colors"
                style={{ borderTop: `3px solid ${p.color}` }}>
                <span className="text-[9px] font-black tracking-[0.22em] uppercase mb-1.5"
                  style={{ color: p.color }}>
                  {p.label}
                </span>
                <span className="text-[11px] leading-snug flex-1"
                  style={{ color: 'rgba(10,10,10,0.5)' }}>
                  {p.sub}
                </span>
                <span className="text-xs font-black mt-3 group-hover:translate-x-0.5 transition-transform inline-block"
                  style={{ color: p.color }}>
                  →
                </span>
              </Link>
            ))}
          </div>

          <SettlersStrip cityId={cityId} />
        </div>
      </div>

      {/* ── Ask featured block — light sky tint, NOT dark ─────────────────── */}
      <div style={{
        background: 'rgba(56,192,240,0.04)',
        borderTop: '3px solid #38C0F0',
        borderBottom: '1px solid rgba(56,192,240,0.15)',
      }}>
        <div className="max-w-5xl mx-auto px-6 md:px-12 py-9 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center gap-7 md:gap-14">

            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black tracking-[0.35em] uppercase mb-4"
                style={{ color: '#38C0F0' }}>
                AI · Powered by Claude · {city.name}
              </p>
              <h2 className="font-display font-black leading-[0.92] mb-4"
                style={{ fontSize: 'clamp(1.9rem, 5vw, 3rem)', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
                Ask anything<br />
                <em className="not-italic" style={{ color: '#38C0F0' }}>about {city.name}.</em>
              </h2>
              <p className="text-sm max-w-sm mb-6" style={{ color: 'rgba(10,10,10,0.45)', lineHeight: 1.6 }}>
                Admin, housing, healthcare, tax, expat life — specific answers, not generic guides.
              </p>

              <div className="flex flex-wrap gap-2">
                {[
                  'How do I register at my commune?',
                  'Which mutuelle is best for expats?',
                  'What is a 3-6-9 lease?',
                ].map(q => (
                  <Link key={q} href={`/${cityId}/ask`}
                    className="px-3 py-1.5 text-[10px] font-medium hover:opacity-75 transition-opacity"
                    style={{
                      background: 'rgba(56,192,240,0.1)',
                      color: '#0A8AAA',
                      border: '1px solid rgba(56,192,240,0.22)',
                    }}>
                    {q} →
                  </Link>
                ))}
              </div>
            </div>

            <Link href={`/${cityId}/ask`}
              className="shrink-0 flex items-center gap-3 px-8 py-4 font-bold text-sm hover:opacity-90 transition-opacity self-start md:self-center"
              style={{ background: '#38C0F0', color: '#FFFFFF' }}>
              Ask anything
              <span className="opacity-70">→</span>
            </Link>

          </div>
        </div>
      </div>

      {/* ── Editorial body ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-12">

        {/* Column rule */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_1px_320px]">
          <div className="lg:pr-9 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(10,10,10,0.1)' }} />
          <div />
          <div className="lg:pl-9 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(10,10,10,0.1)' }} />
        </div>
        <div className="lg:hidden pt-5 pb-4" style={{ borderBottom: '1px solid rgba(10,10,10,0.1)' }} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_320px] gap-0 pb-16">

          {/* ── LEFT: Events ────────────────────────────────────────────── */}
          <div className="lg:pr-9 pt-7">
            <EventsSection allEvents={allEvents} cityId={cityId} />
          </div>

          {/* Vertical rule */}
          <div className="hidden lg:block" style={{ background: 'rgba(10,10,10,0.08)' }} />

          {/* ── RIGHT: Sidebar ──────────────────────────────────────────── */}
          <div className="lg:pl-9 pt-7">

            {/* Eat & Drink strip */}
            {venues.length > 0 && (
              <section className="mb-10">
                <SectionLabel right={
                  <Link href={`/${cityId}/eat`}
                    className="text-[9px] font-black tracking-widest uppercase hover:opacity-50 transition-opacity"
                    style={{ color: '#E8612A' }}>
                    See all →
                  </Link>
                }>
                  Eat &amp; Drink
                </SectionLabel>

                {/* Featured venue — orange-bordered card, no dark bg */}
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
                        {p.deal && (
                          <p className="text-[9px] mt-0.5 line-clamp-1" style={{ color: 'rgba(10,10,10,0.45)' }}>
                            {p.deal}
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
                            <p className="text-xs font-bold truncate" style={{ color: '#0A0A0A' }}>{v.name}</p>
                            {'price' in v && (
                              <span className="text-[9px] font-bold shrink-0" style={{ color: tc }}>
                                {(v as { price?: string }).price}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px]" style={{ color: 'rgba(10,10,10,0.35)' }}>
                            {v.neighborhood} · {(v as { vibe?: string }).vibe?.split(',')[0] ?? v.category}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* In the news */}
            {featuredNews && (
              <section className="mb-10">
                <SectionLabel>In the news</SectionLabel>

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

            {/* City pulse — Reddit */}
            <RedditFeed cityId={cityId} />

            {/* Explore links */}
            <section>
              <SectionLabel>Explore</SectionLabel>
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

function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-1"
      style={{ borderBottom: '1px solid rgba(10,10,10,0.12)' }}>
      <span className="text-[10px] font-black tracking-[0.22em] uppercase"
        style={{ color: 'rgba(10,10,10,0.4)' }}>
        {children}
      </span>
      {right}
    </div>
  )
}
