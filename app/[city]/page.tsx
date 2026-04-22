import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import { getEvents } from '@/lib/data/events'
import type { EventPreview } from '@/lib/data/events'
import { getRedditPosts } from '@/lib/data/reddit'
import { getNews } from '@/lib/data/news'
import { getVenues } from '@/lib/data/venues'
import EventsSection from '@/components/city/EventsSection'
import type { GroupedEvent } from '@/components/city/EventsSection'
import { SettlersStrip } from '@/components/city/SettlersStrip'


export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city || !city.active) notFound()

  const [eventsRaw, reddit, news, venues] = await Promise.all([getEvents(cityId), getRedditPosts(cityId), getNews(cityId), getVenues(cityId)])

  // Deduplicate events by normalised title
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

  const featuredNews   = news[0]
  const secondaryNews  = news.slice(1, 4)

  return (
    <div style={{ background: '#F5F4F0', minHeight: '100vh' }}>

      {/* ── Masthead ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#252450' }}>
        <div className="flex h-1">
          {['#FF3EBA','#38C0F0','#FAB400','#4744C8'].map(c => (
            <div key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>

        <div className="max-w-5xl mx-auto px-6 md:px-12 py-7 md:py-10">
          <div className="flex items-center justify-between gap-4">
            <div className="hidden sm:block shrink-0">
              <p className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: 'rgba(245,236,215,0.35)' }}>
                {dayName}
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(245,236,215,0.2)' }}>
                {dateStr}
              </p>
            </div>

            <div className="flex-1 sm:text-center">
              <h1 className="font-display font-black leading-none tracking-tight"
                style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', color: '#F5ECD7' }}>
                {city.name}
              </h1>
              <p className="text-[10px] font-black tracking-[0.28em] uppercase mt-1"
                style={{ color: 'rgba(245,236,215,0.25)' }}>
                {city.country} · Updated today
              </p>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#10B981' }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#10B981' }} />
                </span>
                <span className="text-xs font-medium" style={{ color: 'rgba(245,236,215,0.4)' }}>
                  {city.settlerCount} settling now
                </span>
              </div>
              {allEvents.length > 0 && (
                <p className="text-[10px]" style={{ color: 'rgba(245,236,215,0.25)' }}>
                  {allEvents.length} event{allEvents.length !== 1 ? 's' : ''} upcoming
                </p>
              )}
            </div>
          </div>

          {/* Nav pills */}
          <div className="flex items-center gap-2 flex-wrap mt-6">
            {[
              { href: `/${cityId}/connect`, label: 'Community',    color: '#FF3EBA' },
              { href: `/${cityId}/eat`,     label: 'Eat & Drink',  color: '#E8612A' },
              { href: `/${cityId}/ask`,     label: 'Ask anything', color: '#38C0F0' },
              { href: `/${cityId}/settle`,  label: 'Get set up',   color: '#FAB400' },
            ].map(p => (
              <Link key={p.href} href={p.href}
                className="px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all hover:opacity-80"
                style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}28` }}>
                {p.label}
              </Link>
            ))}
          </div>

          <SettlersStrip cityId={cityId} />
        </div>
      </div>

      {/* ── Editorial body ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-12">

        {/* Column headers */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_1px_320px] gap-0">
          <div className="lg:pr-9 pt-7 pb-4" style={{ borderBottom: '2px solid #252450' }}>
            <span className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: '#252450' }}>
              What&rsquo;s On
            </span>
            <span className="ml-3 text-xs font-medium" style={{ color: 'rgba(37,36,80,0.3)' }}>
              {allEvents.length} upcoming events
            </span>
          </div>
          <div />
          <div className="lg:pl-9 pt-7 pb-4" style={{ borderBottom: '2px solid #252450' }}>
            <span className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: '#252450' }}>
              Around the city
            </span>
          </div>
        </div>

        {/* Mobile header */}
        <div className="lg:hidden pt-7 pb-4" style={{ borderBottom: '2px solid #252450' }}>
          <span className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: '#252450' }}>
            What&rsquo;s On
          </span>
          <span className="ml-3 text-xs font-medium" style={{ color: 'rgba(37,36,80,0.3)' }}>
            {allEvents.length} upcoming
          </span>
        </div>

        {/* Two-column editorial grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_320px] gap-0 pb-16">

          {/* ── LEFT: Events — primary ──────────────────────────────────── */}
          <div className="lg:pr-9 pt-7">
            <EventsSection allEvents={allEvents} cityId={cityId} />
          </div>

          {/* Vertical rule — desktop only */}
          <div className="hidden lg:block" style={{ background: 'rgba(37,36,80,0.1)' }} />

          {/* ── RIGHT: News + Reddit ────────────────────────────────────── */}
          <div className="lg:pl-9 pt-7">

            {/* ── Eat & Drink strip ────────────────────────────────────── */}
            {venues.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between pb-3 mb-4"
                  style={{ borderBottom: '1px solid rgba(37,36,80,0.15)' }}>
                  <span className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: 'rgba(37,36,80,0.5)' }}>
                    Eat &amp; Drink
                  </span>
                  <Link href={`/${cityId}/eat`}
                    className="text-[9px] font-black tracking-widest uppercase hover:opacity-50 transition-opacity"
                    style={{ color: '#E8612A' }}>
                    See all →
                  </Link>
                </div>

                {/* Featured partner venue */}
                {venues.find(v => v.featured) && (() => {
                  const p = venues.find(v => v.featured)!
                  return (
                    <Link href={`/${cityId}/eat`}
                      className="block rounded-xl p-3.5 mb-3 hover:opacity-90 transition-opacity"
                      style={{ background: '#0F0E1E' }}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[8px] font-black tracking-widest uppercase" style={{ color: '#E8612A' }}>
                          {p.dealTag ?? 'Partner venue'}
                        </span>
                        <span className="text-[8px] font-black tracking-wide px-1.5 py-0.5 rounded-sm"
                          style={{ background: 'rgba(232,97,42,0.15)', color: '#E8612A' }}>
                          Exclusive deal
                        </span>
                      </div>
                      <p className="text-xs font-black truncate" style={{ color: '#F5F4F0' }}>{p.name}</p>
                      {p.deal && (
                        <p className="text-[9px] mt-1 line-clamp-1" style={{ color: 'rgba(245,244,240,0.45)' }}>
                          {p.deal}
                        </p>
                      )}
                    </Link>
                  )
                })()}

                <div className="space-y-0">
                  {venues.filter(v => !v.featured).slice(0, 4).map((v, idx) => {
                    const typeColor = v.broadType === 'bar' ? '#4744C8' : v.broadType === 'cafe' ? '#B08800' : '#E8612A'
                    return (
                      <div key={v.id}
                        className="flex items-start gap-3 py-2.5"
                        style={{ borderTop: idx > 0 ? '1px solid rgba(37,36,80,0.06)' : 'none' }}>
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: typeColor }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-1">
                            <p className="text-xs font-bold truncate" style={{ color: '#0F0E1E' }}>{v.name}</p>
                            {'price' in v && <span className="text-[9px] font-bold shrink-0" style={{ color: typeColor }}>{(v as {price?: string}).price}</span>}
                          </div>
                          <p className="text-[9px]" style={{ color: 'rgba(37,36,80,0.35)' }}>
                            {v.neighborhood} · {(v as {vibe?: string}).vibe?.split(',')[0] ?? v.category}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── In the news ──────────────────────────────────────────── */}
            {featuredNews && (
              <section className="mb-10">
                <SectionLabel>In the news</SectionLabel>

                {/* Featured story */}
                <a href={featuredNews.url} target="_blank" rel="noopener noreferrer"
                  className="group block mt-5 pb-5"
                  style={{ borderBottom: '1px solid rgba(37,36,80,0.08)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ background: SOURCE_COLOR[featuredNews.source] ?? '#252450' }} />
                    <span className="text-[9px] font-black tracking-widest uppercase"
                      style={{ color: SOURCE_COLOR[featuredNews.source] ?? '#252450' }}>
                      {featuredNews.source}
                    </span>
                  </div>
                  <h3 className="font-display font-bold leading-[1.15] group-hover:opacity-55 transition-opacity"
                    style={{ fontSize: '1.1rem', color: '#0F0E1E' }}>
                    {featuredNews.title}
                  </h3>
                  <span className="inline-block mt-3 text-[9px] font-black tracking-widest uppercase opacity-30 group-hover:opacity-60 transition-opacity"
                    style={{ color: '#0F0E1E' }}>
                    Read ↗
                  </span>
                </a>

                {/* Supporting stories */}
                {secondaryNews.map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                    className="group flex items-start gap-3 py-4 hover:opacity-55 transition-opacity"
                    style={{ borderBottom: '1px solid rgba(37,36,80,0.08)' }}>
                    <div className="shrink-0 w-1 self-stretch rounded-full mt-0.5"
                      style={{ background: SOURCE_COLOR[item.source] ?? '#252450' }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[8px] font-black tracking-widest uppercase block mb-1.5"
                        style={{ color: SOURCE_COLOR[item.source] ?? 'rgba(37,36,80,0.4)' }}>
                        {item.source}
                      </span>
                      <p className="text-xs font-semibold leading-snug line-clamp-3"
                        style={{ color: '#0F0E1E' }}>
                        {item.title}
                      </p>
                    </div>
                  </a>
                ))}
              </section>
            )}

            {/* ── City pulse — Reddit ──────────────────────────────────── */}
            {reddit.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between">
                  <SectionLabel right={
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#10B981' }} />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#10B981' }} />
                      </span>
                      <a href={`https://reddit.com/r/${cityId}`} target="_blank" rel="noopener noreferrer"
                        className="text-[9px] font-bold hover:opacity-50 transition-opacity"
                        style={{ color: 'rgba(37,36,80,0.35)' }}>
                        r/{cityId} ↗
                      </a>
                    </div>
                  }>City pulse</SectionLabel>
                </div>

                {reddit.slice(0, 5).map((post, i) => {
                  const diff = Math.floor(Date.now() / 1000) - post.created
                  const ago  = diff < 3600 ? `${Math.floor(diff / 60)}m` : diff < 86400 ? `${Math.floor(diff / 3600)}h` : `${Math.floor(diff / 86400)}d`
                  return (
                    <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
                      className="group flex gap-3 py-3.5 hover:opacity-55 transition-opacity"
                      style={{ borderTop: '1px solid rgba(37,36,80,0.07)' }}>
                      <span className="shrink-0 text-[10px] font-black w-7 text-right leading-tight pt-0.5"
                        style={{ color: '#FF4500' }}>
                        {post.score >= 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
                      </span>
                      <div className="flex-1 min-w-0">
                        {post.flair && (
                          <span className="text-[7px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded-sm mr-1.5 inline-block mb-1"
                            style={{ background: 'rgba(255,69,0,0.1)', color: '#FF4500' }}>
                            {post.flair}
                          </span>
                        )}
                        <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: '#0F0E1E' }}>
                          {post.title}
                        </p>
                        <p className="text-[9px] mt-1" style={{ color: 'rgba(37,36,80,0.3)' }}>
                          {post.comments} comments · {ago}
                        </p>
                      </div>
                    </a>
                  )
                })}

                <Link href={`/${cityId}/connect`}
                  className="block mt-4 pt-4 text-[9px] font-black tracking-widest uppercase hover:opacity-50 transition-opacity"
                  style={{ borderTop: '1px solid rgba(37,36,80,0.07)', color: '#FF3EBA' }}>
                  Join the community →
                </Link>
              </section>
            )}

            {/* ── Tools ────────────────────────────────────────────────── */}
            <section>
              <SectionLabel>Explore</SectionLabel>
              {[
                { href: `/${cityId}/ask`,    label: 'Ask anything', sub: 'AI that knows the city', dot: '#38C0F0' },
                { href: `/${cityId}/settle`, label: 'Settle in',    sub: 'Admin, commune, bank',   dot: '#FAB400' },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 py-3 group hover:opacity-60 transition-opacity"
                  style={{ borderTop: '1px solid rgba(37,36,80,0.07)' }}>
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: item.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: '#252450' }}>{item.label}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(37,36,80,0.38)' }}>{item.sub}</p>
                  </div>
                  <span className="text-xs opacity-20 group-hover:opacity-50 transition-opacity" style={{ color: '#252450' }}>→</span>
                </Link>
              ))}
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Section label ───────────────────────────────────────────────────────── */

function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-1" style={{ borderBottom: '1px solid rgba(37,36,80,0.15)' }}>
      <span className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: 'rgba(37,36,80,0.5)' }}>
        {children}
      </span>
      {right}
    </div>
  )
}
