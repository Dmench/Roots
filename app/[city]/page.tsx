import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'

export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

/* ── Data fetchers ───────────────────────────────────────────────────────── */

interface EventPreview {
  id: string
  title: string
  date: string       // formatted e.g. "Sat 12 Apr"
  time: string       // e.g. "20:00"
  venue: string
  url: string
  dateObj: Date
}

interface RedditPost {
  id: string
  title: string
  flair: string | null
  score: number
  comments: number
  permalink: string
  created: number
}

interface NewsItem {
  title: string
  url: string
  source: string
}

async function getEvents(cityId: string): Promise<EventPreview[]> {
  const key = process.env.TICKETMASTER_API_KEY
  if (!key) return []
  const cityMap: Record<string, { city: string; countryCode: string }> = {
    brussels: { city: 'Brussels', countryCode: 'BE' },
    lisbon:   { city: 'Lisbon',   countryCode: 'PT' },
  }
  const loc = cityMap[cityId] ?? cityMap.brussels
  try {
    const params = new URLSearchParams({
      city: loc.city, countryCode: loc.countryCode,
      size: '6', sort: 'date,asc', apikey: key,
    })
    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const json = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (json._embedded?.events ?? []).flatMap((e: any): EventPreview[] => {
      if (!e.name || !e.url) return []
      const dateLocal = e.dates?.start?.localDate ?? ''
      const timeLocal = e.dates?.start?.localTime ?? ''
      if (!dateLocal) return []
      const d = new Date(`${dateLocal}T${timeLocal || '00:00:00'}`)
      return [{
        id:      e.id,
        title:   e.name,
        date:    d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
        time:    timeLocal ? timeLocal.slice(0, 5) : '',
        venue:   e._embedded?.venues?.[0]?.name ?? '',
        url:     e.url,
        dateObj: d,
      }]
    })
  } catch { return [] }
}

async function getRedditPosts(cityId: string): Promise<RedditPost[]> {
  const subMap: Record<string, string> = { brussels: 'brussels', lisbon: 'portugal' }
  const sub = subMap[cityId] ?? 'brussels'
  try {
    const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=15`, {
      headers: { 'User-Agent': 'Roots/1.0 (+https://roots.so; contact: hello@roots.so)' },
      next: { revalidate: 900 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data?.children ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => !c.data.over_18 && !c.data.stickied)
      .slice(0, 5)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => ({
        id:        c.data.id,
        title:     c.data.title,
        flair:     c.data.link_flair_text ?? null,
        score:     c.data.score,
        comments:  c.data.num_comments,
        permalink: `https://reddit.com${c.data.permalink}`,
        created:   c.data.created_utc,
      }))
  } catch { return [] }
}

async function getNews(cityId: string): Promise<NewsItem[]> {
  const feedMap: Record<string, { url: string; source: string }[]> = {
    brussels: [
      { url: 'https://www.thebulletin.be/rss.xml',   source: 'The Bulletin' },
      { url: 'https://www.politico.eu/feed/',         source: 'Politico EU' },
    ],
  }
  const feeds = feedMap[cityId] ?? feedMap.brussels
  const items: NewsItem[] = []
  for (const feed of feeds) {
    if (items.length >= 3) break
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Roots/1.0)', Accept: 'application/rss+xml, */*' },
        next: { revalidate: 1800 },
      })
      if (!res.ok) continue
      const xml   = await res.text()
      const block = /<item>([\s\S]*?)<\/item>/g
      let m: RegExpExecArray | null
      let count = 0
      while ((m = block.exec(xml)) !== null && count < 2) {
        const c     = m[1]
        const title = c.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim()
        const link  = c.match(/<link>([^<]+)<\/link>/)?.[1]?.trim()
          ?? c.match(/<link[^>]+href=["']([^"']+)["']/)?.[1]
        if (title && link?.startsWith('http')) {
          items.push({ title: title.replace(/<[^>]+>/g, ''), url: link, source: feed.source })
          count++
        }
      }
    } catch { continue }
  }
  return items.slice(0, 3)
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city || !city.active) notFound()

  const [events, reddit, news] = await Promise.all([
    getEvents(cityId),
    getRedditPosts(cityId),
    getNews(cityId),
  ])

  const now    = new Date()
  const month  = now.toLocaleDateString('en-GB', { month: 'long' })
  const dayNum = now.getDate()

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 md:px-12 pt-12 pb-16" style={{ background: '#F5ECD7' }}>
        {/* Shapes — present but not dominant */}
        <div className="absolute rounded-full pointer-events-none opacity-90"
          style={{ background: '#4744C8', width: 320, height: 320, top: -120, right: -80 }} />
        <div className="absolute rounded-full pointer-events-none opacity-70"
          style={{ background: '#38C0F0', width: 100, height: 100, bottom: 20, right: '22%' }} />
        <div className="absolute pointer-events-none overflow-hidden" style={{ width: 70, height: 35, bottom: 0, left: '44%' }}>
          <div className="w-full rounded-full" style={{ background: '#FF3EBA', height: 70, marginTop: -35, opacity: 0.8 }} />
        </div>

        <div className="max-w-4xl mx-auto relative">
          {/* Date line */}
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-6" style={{ color: 'rgba(37,36,80,0.35)' }}>
            {month} {dayNum} · {city.name}
          </p>

          {/* City name */}
          <h1 className="font-display font-black leading-[0.82] mb-5"
            style={{ fontSize: 'clamp(4.5rem, 12vw, 10rem)', color: '#252450' }}>
            {city.name}
          </h1>

          {/* Live pulse */}
          <div className="flex items-center gap-2 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#10B981' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#10B981' }} />
            </span>
            <span className="text-sm" style={{ color: 'rgba(37,36,80,0.5)' }}>
              {events.length > 0 ? `${events.length} things on this week` : 'Live from the city'}
              {reddit.length > 0 && ` · ${reddit.length} conversations active`}
            </span>
          </div>

          <Link
            href={`/${cityId}/connect`}
            className="inline-flex items-center gap-2 px-7 py-3.5 text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ background: '#4744C8' }}
          >
            Open the community
          </Link>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="px-6 md:px-12 pb-20" style={{ background: '#F5ECD7' }}>
        <div className="max-w-4xl mx-auto space-y-14 pt-14">

          {/* ── This week ──────────────────────────────────────────────── */}
          {events.length > 0 && (
            <section>
              <SectionLabel>This week</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
                {events.map(ev => (
                  <a
                    key={ev.id}
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white rounded-2xl border border-sand/50 p-5 hover:shadow-lg hover:shadow-espresso/6 hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                  >
                    {/* Date block */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#10B981' }}>
                          {ev.date.split(' ')[1]} {ev.date.split(' ')[2]}
                        </div>
                        <div className="text-3xl font-black leading-none" style={{ color: '#252450' }}>
                          {ev.date.split(' ')[0]}
                        </div>
                      </div>
                      {ev.time && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(71,68,200,0.08)', color: '#4744C8' }}>
                          {ev.time}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-espresso leading-snug flex-1 group-hover:text-terracotta transition-colors mb-2">
                      {ev.title}
                    </p>
                    {ev.venue && (
                      <p className="text-xs text-stone/60 truncate">{ev.venue}</p>
                    )}
                  </a>
                ))}
              </div>
              <div className="mt-4">
                <Link href={`/${cityId}/connect`} className="text-xs font-bold hover:opacity-70 transition-opacity" style={{ color: '#4744C8' }}>
                  All events in What&apos;s On →
                </Link>
              </div>
            </section>
          )}

          {/* ── What people are asking ─────────────────────────────────── */}
          {reddit.length > 0 && (
            <section>
              <SectionLabel>What people are asking</SectionLabel>
              <div className="mt-5 rounded-2xl border border-sand/50 overflow-hidden divide-y divide-sand/40 bg-white">
                {reddit.map(post => {
                  const diff = Math.floor(Date.now() / 1000) - post.created
                  const ago  = diff < 3600 ? `${Math.floor(diff / 60)}m`
                            : diff < 86400 ? `${Math.floor(diff / 3600)}h`
                            : `${Math.floor(diff / 86400)}d`
                  return (
                    <a
                      key={post.id}
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 px-5 py-4 hover:bg-parchment/40 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-espresso leading-snug line-clamp-1 group-hover:text-terracotta transition-colors">
                          {post.title}
                        </p>
                        {post.flair && (
                          <span className="text-xs text-stone/50 mt-0.5 inline-block">{post.flair}</span>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-3 text-xs text-stone/40">
                        <span>{post.comments} replies</span>
                        <span>{ago}</span>
                      </div>
                    </a>
                  )
                })}
              </div>
              <div className="mt-4 flex items-center gap-4">
                <Link href={`/${cityId}/connect`} className="text-xs font-bold hover:opacity-70 transition-opacity" style={{ color: '#4744C8' }}>
                  Ask your own question →
                </Link>
                <span className="text-xs text-stone/40">via r/{cityId === 'lisbon' ? 'portugal' : cityId}</span>
              </div>
            </section>
          )}

          {/* ── In the news ────────────────────────────────────────────── */}
          {news.length > 0 && (
            <section>
              <SectionLabel>In the news</SectionLabel>
              <div className="mt-5 space-y-2">
                {news.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-white rounded-xl border border-sand/50 px-5 py-4 hover:bg-parchment/30 hover:border-sand transition-all group"
                  >
                    <span className="shrink-0 text-[10px] font-black tracking-wider uppercase px-2 py-1 rounded" style={{ background: 'rgba(37,36,80,0.07)', color: '#252450' }}>
                      {item.source === 'The Bulletin' ? 'Bulletin' : 'Politico'}
                    </span>
                    <p className="flex-1 min-w-0 text-sm font-medium text-espresso line-clamp-1 group-hover:text-terracotta transition-colors">
                      {item.title}
                    </p>
                    <span className="shrink-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity font-semibold" style={{ color: '#4744C8' }}>→</span>
                  </a>
                ))}
              </div>
              <div className="mt-4">
                <Link href={`/${cityId}/connect`} className="text-xs font-bold hover:opacity-70 transition-opacity" style={{ color: '#4744C8' }}>
                  Full news feed →
                </Link>
              </div>
            </section>
          )}

          {/* ── Utility strip ──────────────────────────────────────────── */}
          <section>
            <SectionLabel>When you need them</SectionLabel>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href={`/${cityId}/settle`}
                className="group flex items-center gap-4 rounded-2xl px-6 py-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                style={{ background: '#FAB400' }}
              >
                <div className="flex-1">
                  <p className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: 'rgba(37,36,80,0.45)' }}>Settle</p>
                  <p className="text-base font-bold leading-tight" style={{ color: '#252450' }}>
                    Registration, mutuelle, bank — step by step.
                  </p>
                </div>
                <span className="text-2xl font-black opacity-30 group-hover:opacity-60 transition-opacity" style={{ color: '#252450' }}>→</span>
              </Link>

              <Link
                href={`/${cityId}/ask`}
                className="group flex items-center gap-4 rounded-2xl px-6 py-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                style={{ background: '#38C0F0' }}
              >
                <div className="flex-1">
                  <p className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: 'rgba(37,36,80,0.45)' }}>Ask</p>
                  <p className="text-base font-bold leading-tight" style={{ color: '#252450' }}>
                    Any question about living in {city.name}.
                  </p>
                </div>
                <span className="text-2xl font-black opacity-30 group-hover:opacity-60 transition-opacity" style={{ color: '#252450' }}>→</span>
              </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-[10px] font-black tracking-[0.22em] uppercase shrink-0" style={{ color: 'rgba(37,36,80,0.35)' }}>
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ background: 'rgba(37,36,80,0.1)' }} />
    </div>
  )
}
