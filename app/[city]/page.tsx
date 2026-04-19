import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import { getEvents } from '@/lib/data/events'
import type { EventPreview } from '@/lib/data/events'
import { getRedditPosts } from '@/lib/data/reddit'
import { getNews } from '@/lib/data/news'
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

  const [eventsRaw, reddit, news] = await Promise.all([getEvents(cityId), getRedditPosts(cityId), getNews(cityId)])

  // Deduplicate: group by normalised title, collect dates
  const grouped = new Map<string, { ev: EventPreview; dates: { date: string; time: string; url: string }[] }>()
  for (const ev of eventsRaw) {
    const key = ev.title.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (grouped.has(key)) {
      grouped.get(key)!.dates.push({ date: ev.date, time: ev.time, url: ev.url })
    } else {
      grouped.set(key, { ev, dates: [{ date: ev.date, time: ev.time, url: ev.url }] })
    }
  }
  // Serialize for client component (Date → timestamp number)
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
    'Politico EU':  '#EF3340',
  }

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh' }}>

      {/* ── Masthead ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#252450', borderBottom: '1px solid rgba(245,236,215,0.1)' }}>
        {/* Thin color bar */}
        <div className="flex h-1">
          {['#FF3EBA','#38C0F0','#FAB400','#4744C8'].map(c => (
            <div key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>

        <div className="max-w-5xl mx-auto px-6 md:px-12 py-7 md:py-9">
          {/* Three-column masthead */}
          <div className="flex items-center justify-between gap-4">
            {/* Date */}
            <div className="hidden sm:block">
              <p className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: 'rgba(245,236,215,0.35)' }}>
                {dayName}
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(245,236,215,0.2)' }}>
                {dateStr}
              </p>
            </div>

            {/* City name — centred on desktop, left on mobile */}
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

            {/* Live count */}
            <div className="hidden sm:flex flex-col items-end gap-1">
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

          {/* ── Compact news signal — woven into masthead ────────────────── */}
          {news.length > 0 && (
            <div className="mt-5 pt-5 flex items-start gap-4 flex-wrap"
              style={{ borderTop: '1px solid rgba(245,236,215,0.07)' }}>
              <span className="text-[8px] font-black tracking-[0.22em] uppercase shrink-0 mt-1"
                style={{ color: 'rgba(245,236,215,0.18)' }}>
                In the news
              </span>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 flex-1 min-w-0">
                {news.slice(0, 3).map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                    className="group flex items-baseline gap-1.5 min-w-0 hover:opacity-70 transition-opacity"
                    style={{ maxWidth: '30ch' }}>
                    <span className="text-[8px] font-black uppercase shrink-0 tracking-wide"
                      style={{ color: SOURCE_COLOR[item.source] ?? 'rgba(245,236,215,0.35)' }}>
                      {item.source === 'The Bulletin' ? 'Bulletin' : item.source.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-medium truncate leading-snug"
                      style={{ color: 'rgba(245,236,215,0.38)' }}>
                      {item.title}
                    </span>
                    <span className="text-[9px] shrink-0" style={{ color: 'rgba(245,236,215,0.15)' }}>↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Nav pills */}
          <div className="flex items-center gap-2 flex-wrap mt-5">
            {[
              { href: `/${cityId}/connect`, label: 'Community',   color: '#FF3EBA' },
              { href: `/${cityId}/ask`,     label: 'Ask anything', color: '#38C0F0' },
              { href: `/${cityId}/settle`,  label: 'Get set up',  color: '#FAB400' },
            ].map(p => (
              <Link key={p.href} href={p.href}
                className="px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all hover:opacity-80"
                style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}28` }}>
                {p.label}
              </Link>
            ))}
          </div>

          {/* New settlers this month */}
          <SettlersStrip cityId={cityId} />
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_284px] gap-8">

          {/* ── LEFT — Events (the living core) ──────────────────────────── */}
          <div>
            <EventsSection allEvents={allEvents} cityId={cityId} />
          </div>

          {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* City pulse — Reddit */}
            {reddit.length > 0 && (
              <section>
                <Mastlabel>City pulse</Mastlabel>
                <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: '#1C1A2E' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-3.5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black" style={{ color: '#FF4500' }}>r/{cityId}</span>
                      <span className="flex items-center gap-1">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#10B981' }} />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#10B981' }} />
                        </span>
                        <span className="text-[9px] font-medium" style={{ color: 'rgba(245,236,215,0.25)' }}>live</span>
                      </span>
                    </div>
                    <a href={`https://reddit.com/r/${cityId}`} target="_blank" rel="noopener noreferrer"
                      className="text-[9px] font-black hover:opacity-60 transition-opacity"
                      style={{ color: 'rgba(245,236,215,0.22)', letterSpacing: '0.08em' }}>
                      OPEN ↗
                    </a>
                  </div>

                  {/* Featured top post */}
                  {(() => {
                    const top  = reddit[0]
                    const diff = Math.floor(Date.now() / 1000) - top.created
                    const ago  = diff < 3600 ? `${Math.floor(diff / 60)}m` : diff < 86400 ? `${Math.floor(diff / 3600)}h` : `${Math.floor(diff / 86400)}d`
                    return (
                      <a href={top.permalink} target="_blank" rel="noopener noreferrer"
                        className="block px-4 py-4 group hover:opacity-80 transition-opacity"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 text-center" style={{ minWidth: 30 }}>
                            <p className="text-lg font-black leading-none" style={{ color: '#FF4500' }}>↑</p>
                            <p className="text-[10px] font-black mt-0.5" style={{ color: '#FF4500' }}>
                              {top.score >= 1000 ? `${(top.score / 1000).toFixed(1)}k` : top.score}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            {top.flair && (
                              <span className="inline-block text-[8px] font-black px-1.5 py-0.5 rounded-full mb-1.5"
                                style={{ background: 'rgba(255,69,0,0.18)', color: '#FF4500', letterSpacing: '0.06em' }}>
                                {top.flair.toUpperCase()}
                              </span>
                            )}
                            <p className="text-xs font-bold leading-snug" style={{ color: '#F5ECD7' }}>
                              {top.title}
                            </p>
                            <p className="text-[9px] mt-1.5" style={{ color: 'rgba(245,236,215,0.28)' }}>
                              {top.comments} comments · {ago}
                            </p>
                          </div>
                        </div>
                      </a>
                    )
                  })()}

                  {/* Remaining posts */}
                  {reddit.slice(1).map((post) => {
                    const diff = Math.floor(Date.now() / 1000) - post.created
                    const ago  = diff < 3600 ? `${Math.floor(diff / 60)}m` : diff < 86400 ? `${Math.floor(diff / 3600)}h` : `${Math.floor(diff / 86400)}d`
                    const maxScore = Math.max(...reddit.map(p => p.score))
                    const barPct = maxScore > 0 ? Math.round((post.score / maxScore) * 100) : 0
                    return (
                      <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-4 py-3 group hover:opacity-70 transition-opacity"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="shrink-0 flex flex-col items-center gap-0.5" style={{ width: 24 }}>
                          <p className="text-[9px] font-black leading-none" style={{ color: 'rgba(255,69,0,0.65)' }}>
                            {post.score >= 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
                          </p>
                          <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: '#FF4500' }} />
                          </div>
                        </div>
                        <p className="flex-1 min-w-0 text-[10px] font-semibold leading-snug line-clamp-2"
                          style={{ color: 'rgba(245,236,215,0.65)' }}>
                          {post.title}
                        </p>
                        <span className="shrink-0 text-[9px]" style={{ color: 'rgba(245,236,215,0.18)' }}>{ago}</span>
                      </a>
                    )
                  })}

                  {/* Footer */}
                  <div className="px-4 py-3.5 flex items-center justify-between"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <Link href={`/${cityId}/connect`}
                      className="text-[9px] font-black tracking-wider hover:opacity-60 transition-opacity"
                      style={{ color: '#FF3EBA', letterSpacing: '0.08em' }}>
                      POST IN COMMUNITY →
                    </Link>
                    <span className="text-[9px]" style={{ color: 'rgba(245,236,215,0.15)' }}>via Reddit</span>
                  </div>
                </div>
              </section>
            )}

            {/* In the news — compact sidebar */}
            {news.length > 0 && (
              <section>
                <Mastlabel>In the news</Mastlabel>
                <div className="mt-4 rounded-xl overflow-hidden bg-white"
                  style={{ border: '1px solid rgba(37,36,80,0.07)' }}>
                  {news.map((item, i) => {
                    const srcColor = SOURCE_COLOR[item.source] ?? '#252450'
                    return (
                      <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-start gap-2.5 px-4 py-3.5 group hover:bg-parchment/40 transition-colors"
                        style={{ borderTop: i > 0 ? '1px solid rgba(37,36,80,0.05)' : 'none' }}>
                        <div className="w-0.5 shrink-0 self-stretch rounded-full" style={{ background: srcColor }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-black tracking-wider uppercase mb-1" style={{ color: srcColor }}>
                            {item.source === 'The Bulletin' ? 'Bulletin' : 'Politico EU'}
                          </p>
                          <p className="text-xs font-semibold leading-snug line-clamp-3 group-hover:opacity-55 transition-opacity"
                            style={{ color: '#252450' }}>
                            {item.title}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] mt-0.5 opacity-25 group-hover:opacity-50 transition-opacity"
                          style={{ color: '#252450' }}>↗</span>
                      </a>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Tools */}
            <section>
              <Mastlabel>Tools</Mastlabel>
              <div className="mt-4 bg-white rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(37,36,80,0.07)' }}>
                {[
                  { href: `/${cityId}/ask`,    label: 'Ask anything', sub: 'AI answers about city life', dot: '#38C0F0' },
                  { href: `/${cityId}/connect`, label: 'Community',   sub: 'Posts, tips, people',        dot: '#FF3EBA' },
                  { href: `/${cityId}/settle`,  label: 'Settle in',   sub: 'Admin, commune, bank',       dot: '#FAB400' },
                ].map((item, i) => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-3 px-4 py-3.5 group hover:bg-parchment/30 transition-colors"
                    style={{ borderTop: i > 0 ? '1px solid rgba(37,36,80,0.05)' : 'none' }}>
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: item.dot }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold" style={{ color: '#252450' }}>{item.label}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(37,36,80,0.38)' }}>{item.sub}</p>
                    </div>
                    <span className="text-xs opacity-20 group-hover:opacity-50 transition-opacity" style={{ color: '#252450' }}>→</span>
                  </Link>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function Mastlabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-[10px] font-black tracking-[0.22em] uppercase shrink-0"
        style={{ color: 'rgba(37,36,80,0.35)' }}>
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ background: 'rgba(37,36,80,0.1)' }} />
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
