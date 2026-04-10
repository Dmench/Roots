import { NextRequest, NextResponse } from 'next/server'

/* ── Types ─────────────────────────────────────────────────────────────────── */

export type FeedCategory =
  | 'news'
  | 'community'
  | 'housing'
  | 'questions'
  | 'events'
  | 'lifestyle'
  | 'transport'
  | 'work'

export type FeedSource = 'reddit' | 'bulletin' | 'expatica' | 'btimes' | 'politico' | 'eventbrite' | 'euobserver' | 'euronews' | 'meetup' | 'ticketmaster'

export interface FeedItem {
  id:          string
  source:      FeedSource
  sourceLabel: string
  category:    FeedCategory
  title:       string
  summary:     string
  url:         string
  published:   number    // unix seconds
  subreddit?:  string
  flair?:      string
  score?:      number
  comments?:   number
  author?:     string
}

interface SourceResult {
  label:  string
  status: 'ok' | 'error' | 'skipped'
  count:  number
  error?: string
}

/* ── Config ────────────────────────────────────────────────────────────────── */

const CITY_SUBS: Record<string, string[]> = {
  brussels: ['brussels'],
  lisbon:   ['portugal', 'pliving'],
}

const FLAIR_CATEGORY: Record<string, FeedCategory> = {
  'Housing':             'housing',
  'Work':                'work',
  'Jobs':                'work',
  'Question':            'questions',
  'Help':                'questions',
  'News':                'news',
  'Actualité':           'news',
  'Event':               'events',
  'Events':              'events',
  'Food & Drink':        'lifestyle',
  'Restaurant':          'lifestyle',
  'Culture & Nightlife': 'lifestyle',
  'Culture':             'lifestyle',
  'Sport':               'lifestyle',
  'Tourism':             'lifestyle',
  'Transport':           'transport',
  'Mobilité':            'transport',
  'STIB':                'transport',
  'Discussion':          'community',
  'Photo':               'community',
  'AMA':                 'community',
  'Off-topic':           'community',
}

// Multiple URL candidates per source — tries each in order, stops on first success
const CITY_RSS: Record<string, { urls: string[]; label: string; source: FeedSource; category?: FeedCategory }[]> = {
  brussels: [
    {
      label: 'The Bulletin',
      source: 'bulletin',
      urls: ['https://www.thebulletin.be/rss.xml'],
    },
    {
      label: 'Politico EU',
      source: 'politico',
      urls: [
        'https://www.politico.eu/feed/',
        'https://www.politico.eu/rss/',
      ],
    },
    {
      label: 'EUobserver',
      source: 'euobserver',
      urls: [
        'https://euobserver.com/rss.xml',
        'https://euobserver.com/feed',
      ],
    },
    {
      label: 'Euronews',
      source: 'euronews',
      urls: [
        'https://www.euronews.com/rss',
        'https://feeds.feedburner.com/euronews/en/news/',
        'https://www.euronews.com/rss?level=theme&name=news',
      ],
    },
  ],
  lisbon: [
    {
      label: 'EUobserver',
      source: 'euobserver',
      urls: ['https://euobserver.com/rss.xml'],
    },
  ],
}

/* ── RSS parser ────────────────────────────────────────────────────────────── */

function extractTag(xml: string, tag: string): string {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`)
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)
  return (xml.match(cdata)?.[1] ?? xml.match(plain)?.[1] ?? '').trim()
}

// Handles RSS <link> which can be self-closing or a plain text element
function extractLink(itemXml: string): string {
  // Try plain text <link>url</link>
  const plain = itemXml.match(/<link>([^<]+)<\/link>/)
  if (plain?.[1]?.startsWith('http')) return plain[1].trim()
  // Atom-style <link href="..." />
  const atom = itemXml.match(/<link[^>]+href=["']([^"']+)["']/)
  if (atom?.[1]) return atom[1]
  // Fallback: <guid> is often the permalink
  return extractTag(itemXml, 'guid')
}

interface RSSItem { title: string; link: string; description: string; pubDate: string }

function decodeEntities(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')       // strip any HTML tags
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g,  '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')         // strip numeric entities
    .replace(/<[^>]+>/g, ' ')       // strip tags that appeared after decoding
    .replace(/\s+/g, ' ')
    .trim()
}

function parseRSS(xml: string): RSSItem[] {
  const out: RSSItem[] = []
  const block = /<item>([\s\S]*?)<\/item>/g
  let m: RegExpExecArray | null
  while ((m = block.exec(xml)) !== null) {
    const c     = m[1]
    const title = decodeEntities(extractTag(c, 'title'))
    const link  = extractLink(c)
    if (!title || !link) continue
    out.push({
      title,
      link,
      description: decodeEntities(extractTag(c, 'description')).slice(0, 200),
      pubDate:     extractTag(c, 'pubDate'),
    })
  }
  return out
}

function rssDateToUnix(d: string): number {
  const t = new Date(d).getTime()
  return isNaN(t) ? Date.now() / 1000 : t / 1000
}

/* ── Fetchers ──────────────────────────────────────────────────────────────── */

// Browser-like UA to avoid blocks
const UA = 'Mozilla/5.0 (compatible; Roots/1.0; +https://roots.so)'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchReddit(subs: string[]): Promise<{ items: FeedItem[]; source: SourceResult }> {
  const results = await Promise.allSettled(
    subs.map(sub =>
      fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=20`, {
        headers: { 'User-Agent': 'Roots/1.0 (+https://roots.so; contact: hello@roots.so)' },
        cache: 'no-store',
      }).then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
    )
  )

  const items: FeedItem[] = []
  const errors: string[] = []

  results.forEach((r, i) => {
    const sub = subs[i]
    if (r.status === 'rejected') {
      errors.push(`r/${sub}: ${r.reason}`)
      console.error(`[feeds:reddit] r/${sub} failed:`, r.reason)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(r.value.data?.children ?? []).forEach((c: any) => {
      const d = c.data
      if (d.over_18 || d.stickied) return
      const flair    = d.link_flair_text ?? null
      const category: FeedCategory = (flair && FLAIR_CATEGORY[flair]) ?? 'community'
      items.push({
        id: `reddit-${d.id}`, source: 'reddit', sourceLabel: `r/${sub}`,
        category, title: d.title, summary: (d.selftext ?? '').slice(0, 200),
        url: `https://reddit.com${d.permalink}`, published: d.created_utc,
        subreddit: d.subreddit, flair: flair ?? undefined,
        score: d.score, comments: d.num_comments, author: d.author,
      })
    })
  })

  return {
    items,
    source: {
      label:  'Reddit',
      status: errors.length === subs.length ? 'error' : 'ok',
      count:  items.length,
      error:  errors.join('; ') || undefined,
    },
  }
}

async function fetchRSS(
  feed: { urls: string[]; label: string; source: FeedSource; category?: FeedCategory }
): Promise<{ items: FeedItem[]; source: SourceResult }> {
  for (const url of feed.urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml, */*' },
        cache: 'no-store',
      })
      if (!res.ok) {
        console.error(`[feeds:rss] ${feed.label} @ ${url} → HTTP ${res.status}`)
        continue
      }
      const xml   = await res.text()
      const items = parseRSS(xml)
      if (items.length === 0) {
        console.error(`[feeds:rss] ${feed.label} @ ${url} → parsed 0 items (xml length: ${xml.length})`)
        continue
      }
      console.log(`[feeds:rss] ${feed.label} @ ${url} → ${items.length} items ✓`)
      return {
        items: items.slice(0, 8).map((item, i) => ({
          id: `${feed.source}-${i}-${Math.floor(Date.now() / 1000)}`,
          source: feed.source, sourceLabel: feed.label,
          category: (feed.category ?? 'news') as FeedCategory,
          title: item.title, summary: item.description,
          url: item.link, published: rssDateToUnix(item.pubDate),
        })),
        source: { label: feed.label, status: 'ok', count: items.length },
      }
    } catch (err) {
      console.error(`[feeds:rss] ${feed.label} @ ${url} threw:`, err)
    }
  }
  return {
    items: [],
    source: { label: feed.label, status: 'error', count: 0, error: `All ${feed.urls.length} URL(s) failed` },
  }
}

/* ── Ticketmaster Discovery API ────────────────────────────────────────────── */

const CITY_TM: Record<string, { city: string; countryCode: string }> = {
  brussels: { city: 'Brussels', countryCode: 'BE' },
  lisbon:   { city: 'Lisbon',   countryCode: 'PT' },
}

async function fetchTicketmaster(city: string): Promise<{ items: FeedItem[]; source: SourceResult }> {
  const apiKey = process.env.TICKETMASTER_API_KEY
  if (!apiKey) return { items: [], source: { label: 'Ticketmaster', status: 'skipped', count: 0 } }

  const loc = CITY_TM[city] ?? CITY_TM.brussels
  const params = new URLSearchParams({
    city:        loc.city,
    countryCode: loc.countryCode,
    size:        '20',
    sort:        'date,asc',
    apikey:      apiKey,
  })

  try {
    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[feeds:ticketmaster] HTTP ${res.status}:`, body.slice(0, 200))
      return { items: [], source: { label: 'Ticketmaster', status: 'error', count: 0, error: `HTTP ${res.status}` } }
    }
    const json = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = json._embedded?.events ?? []
    console.log(`[feeds:ticketmaster] ${raw.length} events`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: FeedItem[] = raw.flatMap((e: any): FeedItem[] => {
      if (!e.name || !e.url) return []
      const dateUtc    = e.dates?.start?.dateTime ?? ''
      const dateLocal  = e.dates?.start?.localDate ?? ''
      const timeLocal  = e.dates?.start?.localTime ?? ''
      const displayDate = dateLocal
        ? new Date(`${dateLocal}T${timeLocal || '00:00:00'}`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: timeLocal ? '2-digit' : undefined, minute: timeLocal ? '2-digit' : undefined })
        : ''
      const venue = e._embedded?.venues?.[0]?.name ?? ''
      return [{
        id: `ticketmaster-${e.id}`, source: 'ticketmaster', sourceLabel: 'Ticketmaster',
        category: 'events', title: e.name,
        summary: [displayDate, venue].filter(Boolean).join(' · '),
        url: e.url,
        published: dateUtc ? new Date(dateUtc).getTime() / 1000 : Date.now() / 1000,
      }]
    })
    return { items, source: { label: 'Ticketmaster', status: 'ok', count: items.length } }
  } catch (err) {
    console.error('[feeds:ticketmaster] threw:', err)
    return { items: [], source: { label: 'Ticketmaster', status: 'error', count: 0, error: String(err) } }
  }
}

/* ── Route ─────────────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const city  = req.nextUrl.searchParams.get('city') ?? 'brussels'
  const debug = req.nextUrl.searchParams.get('debug') === '1'

  const subs     = CITY_SUBS[city] ?? CITY_SUBS.brussels
  const rssFeeds = CITY_RSS[city] ?? []

  const [redditResult, ticketmasterResult, ...rssResults] = await Promise.all([
    fetchReddit(subs),
    fetchTicketmaster(city),
    ...rssFeeds.map(fetchRSS),
  ])

  const all: FeedItem[] = [
    ...redditResult.items,
    ...ticketmasterResult.items,
    ...rssResults.flatMap((r: { items: FeedItem[] }) => r.items),
  ].sort((a, b) => b.published - a.published)

  const counts: Record<string, number> = { all: all.length }
  for (const item of all) {
    counts[item.category] = (counts[item.category] ?? 0) + 1
  }

  const sources = [redditResult.source, ticketmasterResult.source, ...rssResults.map((r: { source: SourceResult }) => r.source)]
  console.log('[feeds] sources:', sources.map(s => `${s.label}:${s.status}(${s.count})`).join(' | '))

  return NextResponse.json(
    debug ? { items: all, counts, _sources: sources } : { items: all, counts },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
