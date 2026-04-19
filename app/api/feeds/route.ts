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

export type FeedSource = 'reddit' | 'bulletin' | 'expatica' | 'btimes' | 'politico' | 'eventbrite' | 'euobserver' | 'euronews' | 'meetup' | 'ticketmaster' | 'visitbrussels' | 'magasin4' | 'botanique' | 'flagey' | 'halles' | 'recyclart' | 'lamonnaie'

export interface FeedItem {
  id:          string
  source:      FeedSource
  sourceLabel: string
  category:    FeedCategory
  title:       string
  summary:     string
  url:         string
  published:   number    // unix seconds
  image?:      string    // cover image URL (events only for now)
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

// Meetup group URL slugs — community/expat/social groups per city
const CITY_MEETUP: Record<string, string[]> = {
  brussels: [
    'brussels-expats',
    'english-speaking-brussels',
    'brussels-internationals',
    'brussels-language-exchange',
    'lets-learn-languages-in-brussels',
    'brusselsdrinkers',
    'brussels-hiking-outdoor-activities',
    'brussels-board-games',
    'brussels-tech-meetup',
  ],
  lisbon: [
    'lisbon-expats',
    'lisbon-internationals',
  ],
}

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

      // Pick best image: prefer 16:9 ratio, width closest to 640px
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imgs: any[] = e.images ?? []
      const preferred = imgs
        .filter((img: any) => img.url && img.ratio === '16_9' && img.width >= 300)
        .sort((a: any, b: any) => Math.abs(a.width - 640) - Math.abs(b.width - 640))
      const fallback = imgs.filter((img: any) => img.url && img.width >= 300)
        .sort((a: any, b: any) => Math.abs(a.width - 640) - Math.abs(b.width - 640))
      const image = preferred[0]?.url ?? fallback[0]?.url ?? undefined

      return [{
        id: `ticketmaster-${e.id}`, source: 'ticketmaster', sourceLabel: 'Ticketmaster',
        category: 'events', title: e.name,
        summary: [displayDate, venue].filter(Boolean).join(' · '),
        url: e.url,
        image,
        published: dateUtc ? new Date(dateUtc).getTime() / 1000 : Date.now() / 1000,
      }]
    })
    const now = Date.now() / 1000
    const upcoming = items.filter(i => i.published >= now)
    return { items: upcoming, source: { label: 'Ticketmaster', status: 'ok', count: upcoming.length } }
  } catch (err) {
    console.error('[feeds:ticketmaster] threw:', err)
    return { items: [], source: { label: 'Ticketmaster', status: 'error', count: 0, error: String(err) } }
  }
}

/* ── Meetup (RSS per group) ─────────────────────────────────────────────────── */

async function fetchMeetup(city: string): Promise<{ items: FeedItem[]; source: SourceResult }> {
  const groups = CITY_MEETUP[city] ?? []
  if (groups.length === 0) return { items: [], source: { label: 'Meetup', status: 'skipped', count: 0 } }

  const now = Date.now() / 1000
  const results = await Promise.allSettled(
    groups.map(slug =>
      fetch(`https://www.meetup.com/${slug}/events/rss/`, {
        headers: { 'User-Agent': UA, Accept: 'application/rss+xml, */*' },
        cache: 'no-store',
      }).then(r => r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`)))
    )
  )

  const items: FeedItem[] = []
  results.forEach((r, i) => {
    if (r.status === 'rejected') return
    const parsed = parseRSS(r.value)
    for (const item of parsed) {
      const published = rssDateToUnix(item.pubDate)
      if (published < now) continue  // skip past events
      items.push({
        id:          `meetup-${groups[i]}-${Buffer.from(item.link).toString('base64').slice(0, 12)}`,
        source:      'meetup',
        sourceLabel: 'Meetup',
        category:    'events',
        title:       item.title,
        summary:     item.description.slice(0, 120),
        url:         item.link,
        published,
      })
    }
  })

  // sort by date asc, take top 20
  items.sort((a, b) => a.published - b.published)
  const top = items.slice(0, 20)
  console.log(`[feeds:meetup] ${top.length} upcoming events from ${groups.length} groups`)
  return { items: top, source: { label: 'Meetup', status: 'ok', count: top.length } }
}

/* ── Eventbrite (public search page → JSON-LD scrape) ───────────────────────── */

async function fetchEventbrite(city: string): Promise<{ items: FeedItem[]; source: SourceResult }> {
  const citySlug: Record<string, string> = {
    brussels: 'brussels--be',
    lisbon:   'lisbon--pt',
  }
  const slug = citySlug[city]
  if (!slug) return { items: [], source: { label: 'Eventbrite', status: 'skipped', count: 0 } }

  const now = Date.now() / 1000

  try {
    // Eventbrite's public search page embeds events as window.__SERVER_DATA__ or JSON-LD
    const res = await fetch(
      `https://www.eventbrite.com/d/${slug}/events/`,
      { headers: { 'User-Agent': UA, Accept: 'text/html' }, cache: 'no-store' }
    )
    if (!res.ok) {
      console.error(`[feeds:eventbrite] HTTP ${res.status}`)
      return { items: [], source: { label: 'Eventbrite', status: 'error', count: 0, error: `HTTP ${res.status}` } }
    }

    const html = await res.text()

    // Extract JSON-LD blocks — Eventbrite injects Event schema markup
    const items: FeedItem[] = []
    const jsonLdRe = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
    let m: RegExpExecArray | null
    while ((m = jsonLdRe.exec(html)) !== null) {
      try {
        const data = JSON.parse(m[1])
        const list = Array.isArray(data) ? data : [data]
        for (const obj of list) {
          if (obj['@type'] !== 'Event') continue
          const name      = obj.name?.trim()
          const url       = obj.url?.trim()
          const startRaw  = obj.startDate ?? ''
          const image     = typeof obj.image === 'string' ? obj.image : obj.image?.url ?? undefined
          const location  = obj.location?.name ?? obj.location?.address?.addressLocality ?? ''
          if (!name || !url || !startRaw) continue
          const published = new Date(startRaw).getTime() / 1000
          if (published < now) continue
          items.push({
            id:          `eventbrite-${Buffer.from(url).toString('base64').slice(0, 16)}`,
            source:      'eventbrite',
            sourceLabel: 'Eventbrite',
            category:    'events',
            title:       name,
            summary:     location,
            url,
            image,
            published,
          })
        }
      } catch { /* skip malformed block */ }
    }

    items.sort((a, b) => a.published - b.published)
    const top = items.slice(0, 20)
    console.log(`[feeds:eventbrite] ${top.length} upcoming events`)
    return { items: top, source: { label: 'Eventbrite', status: 'ok', count: top.length } }
  } catch (err) {
    console.error('[feeds:eventbrite] threw:', err)
    return { items: [], source: { label: 'Eventbrite', status: 'error', count: 0, error: String(err) } }
  }
}

/* ── Visit Brussels (official city agenda) ──────────────────────────────────── */

async function fetchVisitBrussels(): Promise<{ items: FeedItem[]; source: SourceResult }> {
  const now = Date.now() / 1000
  try {
    // Visit Brussels exposes a public JSON API for their agenda
    const res = await fetch(
      'https://visit.brussels/api/events?lang=en&limit=30&sort=startDate',
      { headers: { 'User-Agent': UA, Accept: 'application/json' }, cache: 'no-store' }
    )
    if (!res.ok) {
      // Fallback: scrape their agenda RSS if available
      const rss = await fetch('https://visit.brussels/fr/rss/agenda', {
        headers: { 'User-Agent': UA }, cache: 'no-store',
      })
      if (!rss.ok) return { items: [], source: { label: 'Visit Brussels', status: 'error', count: 0, error: `HTTP ${res.status}` } }
      const xml   = await rss.text()
      const parsed = parseRSS(xml)
      const items: FeedItem[] = parsed
        .map(p => ({ ...p, published: rssDateToUnix(p.pubDate) }))
        .filter(p => p.published >= now)
        .slice(0, 10)
        .map((p, i) => ({
          id: `visitbru-${i}-${Math.floor(p.published)}`,
          source: 'visitbrussels' as const, sourceLabel: 'Visit Brussels',
          category: 'events' as const,
          title: p.title, summary: p.description.slice(0, 120),
          url: p.link, published: p.published,
        }))
      console.log(`[feeds:visitbrussels] ${items.length} events via RSS`)
      return { items, source: { label: 'Visit Brussels', status: 'ok', count: items.length } }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json()
    const items: FeedItem[] = (Array.isArray(json) ? json : json.results ?? json.items ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .flatMap((e: any): FeedItem[] => {
        const name  = e.title?.en ?? e.title?.fr ?? e.name
        const url   = e.url ?? e.link ?? e.permalink
        const start = e.startDate ?? e.start_date ?? e.date
        if (!name || !url || !start) return []
        const published = new Date(start).getTime() / 1000
        if (published < now) return []
        return [{
          id: `visitbru-${e.id ?? Buffer.from(url).toString('base64').slice(0, 10)}`,
          source: 'visitbrussels', sourceLabel: 'Visit Brussels',
          category: 'events', title: name,
          summary: e.description?.en?.slice(0, 120) ?? '',
          url, image: e.image ?? e.thumbnail ?? undefined, published,
        }]
      })
      .slice(0, 15)

    console.log(`[feeds:visitbrussels] ${items.length} events`)
    return { items, source: { label: 'Visit Brussels', status: 'ok', count: items.length } }
  } catch (err) {
    console.error('[feeds:visitbrussels] threw:', err)
    return { items: [], source: { label: 'Visit Brussels', status: 'error', count: 0, error: String(err) } }
  }
}

/* ── Venue scrapers ─────────────────────────────────────────────────────────── */

// Magasin 4 — punk/hardcore/metal/experimental venue since 1994
// HTML: <a class="event-item-link ..."> containing .event-date-text, .event-artists, .event-genre
async function fetchMagasin4(): Promise<{ items: FeedItem[]; source: SourceResult }> {
  const BASE = 'https://www.magasin4.be'
  const now  = Date.now() / 1000
  try {
    const res = await fetch(`${BASE}/concerts/`, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return { items: [], source: { label: 'Magasin 4', status: 'error', count: 0, error: `HTTP ${res.status}` } }
    const html = await res.text()

    const items: FeedItem[] = []
    const seen = new Set<string>()
    // Each event: <a href="https://www.magasin4.be/concerts/ID/YYYY-MM-DD/" class="event-item-link ...">
    // href is a full absolute URL (not relative); same event may appear twice on page — dedup by URL
    const linkRe = /<a\s+href="(https:\/\/www\.magasin4\.be\/concerts\/\d+\/(\d{4}-\d{2}-\d{2})\/[^"]*)"[^>]*class="[^"]*event-item-link[^"]*"[^>]*>([\s\S]*?)<\/a>/g
    let m: RegExpExecArray | null
    while ((m = linkRe.exec(html)) !== null) {
      const url       = m[1]
      const dateStr   = m[2]
      const inner     = m[3]

      if (seen.has(url)) continue
      seen.add(url)

      const published = new Date(dateStr + 'T20:00:00').getTime() / 1000
      if (published < now) continue

      // Collect all artist names from artist-accent-flyer spans
      const artistRe = /class="[^"]*artist-accent-flyer[^"]*"[^>]*>([^<]+)<\/span>/g
      const artists: string[] = []
      let am: RegExpExecArray | null
      while ((am = artistRe.exec(inner)) !== null) {
        const name = am[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#039;/g, "'")
        if (name) artists.push(name)
      }
      const genreMatch = inner.match(/class="event-genre"[^>]*>([^<]+)<\/div>/)
      const imgMatch   = inner.match(/<img[^>]+src="([^"]+)"/)
      const title = artists.length > 0 ? artists.join(' + ') : 'Event at Magasin 4'
      const genre = genreMatch?.[1]?.trim() ?? ''
      const image = imgMatch?.[1] ?? undefined

      items.push({
        id:          `magasin4-${url.split('/').filter(Boolean).slice(-2).join('-')}`,
        source:      'magasin4',
        sourceLabel: 'Magasin 4',
        category:    'events',
        title,
        summary:     genre,
        url,
        image,
        published,
      })
    }

    items.sort((a, b) => a.published - b.published)
    console.log(`[feeds:magasin4] ${items.length} upcoming events`)
    return { items: items.slice(0, 20), source: { label: 'Magasin 4', status: 'ok', count: items.length } }
  } catch (err) {
    console.error('[feeds:magasin4] threw:', err)
    return { items: [], source: { label: 'Magasin 4', status: 'error', count: 0, error: String(err) } }
  }
}

// Botanique — indie/world/experimental venue in a greenhouse, beloved Brussels institution
// HTML: <div class="node-type-event node-view-mode-teaser"> with Drupal date/image/title structure
async function fetchBotanique(): Promise<{ items: FeedItem[]; source: SourceResult }> {
  const BASE = 'https://botanique.be'
  const now  = Date.now() / 1000
  try {
    const res = await fetch(`${BASE}/en/concerts`, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return { items: [], source: { label: 'Botanique', status: 'error', count: 0, error: `HTTP ${res.status}` } }
    const html = await res.text()

    const items: FeedItem[] = []
    // Split on event block openers — each block starts with data-history-node-id + about="/en/concert/..."
    // This is more reliable than a lookahead regex across the whole page
    const blockMarkerRe = /<div[^>]+data-history-node-id="[^"]*"[^>]+about="(\/en\/concert\/[^"]+)"[^>]*class="[^"]*node-type-event[^"]*"[^>]*>/g
    const blockStarts: { about: string; pos: number }[] = []
    let bm: RegExpExecArray | null
    while ((bm = blockMarkerRe.exec(html)) !== null) {
      blockStarts.push({ about: bm[1], pos: bm.index + bm[0].length })
    }

    for (let i = 0; i < blockStarts.length; i++) {
      const { about, pos } = blockStarts[i]
      const end   = blockStarts[i + 1]?.pos ?? html.length
      const inner = html.slice(pos, end)

      // Date: separate spans for weekday / day / month+year
      const weekday = inner.match(/class="node-date__weekday">([^<]+)</)?.[1]?.trim() ?? ''
      const day     = inner.match(/class="node-date__day">([^<]+)</)?.[1]?.trim() ?? ''
      const month   = inner.match(/class="node-date__month">([^<]+)</)?.[1]?.trim() ?? ''
      const year    = inner.match(/class="node-date__year">([^<]+)</)?.[1]?.trim() ?? ''
      if (!day || !month || !year) continue

      const published = new Date(`${day} ${month} ${year} 20:00`).getTime() / 1000
      if (isNaN(published) || published < now) continue

      // Title: h2 > a > span
      const titleMatch = inner.match(/<h2[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/)
      const title = titleMatch?.[1]?.trim().replace(/<[^>]+>/g, '') ?? 'Event at Botanique'

      // Image: first img src (relative path on botanique.be)
      const imgMatch = inner.match(/<img[^>]+src="([^"]+)"/)
      const imgSrc   = imgMatch?.[1]
      const image    = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${BASE}${imgSrc}`) : undefined

      items.push({
        id:          `botanique-${about.split('/').pop()}`,
        source:      'botanique',
        sourceLabel: 'Botanique',
        category:    'events',
        title,
        summary:     `${weekday} ${day} ${month} · Botanique`,
        url:         `${BASE}${about}`,
        image,
        published,
      })
    }

    items.sort((a, b) => a.published - b.published)
    console.log(`[feeds:botanique] ${items.length} upcoming events`)
    return { items: items.slice(0, 20), source: { label: 'Botanique', status: 'ok', count: items.length } }
  } catch (err) {
    console.error('[feeds:botanique] threw:', err)
    return { items: [], source: { label: 'Botanique', status: 'error', count: 0, error: String(err) } }
  }
}

/* ── Flagey — classical, jazz, electronic, world, cinema ────────────────────
   Homepage lists upcoming days as ?date_string=YYYY-MM-DD links; each returns
   server-rendered HTML with event cards in #stream_container.               */

async function fetchFlagey(): Promise<{ items: FeedItem[]; source: SourceResult }> {
  const BASE = 'https://www.flagey.be'
  const now  = Date.now() / 1000
  try {
    // First fetch homepage to get the list of upcoming date strings
    const home = await fetch(`${BASE}/en`, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      next: { revalidate: 3600 },
    })
    if (!home.ok) return { items: [], source: { label: 'Flagey', status: 'error', count: 0, error: `HTTP ${home.status}` } }
    const homeHtml = await home.text()

    // Collect up to 10 upcoming date strings from the day picker
    const dateRe = /data-href="https:\/\/www\.flagey\.be\/en\/\?date_string=(\d{4}-\d{2}-\d{2})"/g
    const dates: string[] = []
    let dm: RegExpExecArray | null
    while ((dm = dateRe.exec(homeHtml)) !== null) {
      if (!dates.includes(dm[1])) dates.push(dm[1])
    }

    if (dates.length === 0) return { items: [], source: { label: 'Flagey', status: 'error', count: 0, error: 'No dates found' } }

    // Fetch the first 5 days in parallel
    const dayPages = await Promise.allSettled(
      dates.slice(0, 5).map(d =>
        fetch(`${BASE}/en/?date_string=${d}`, {
          headers: { 'User-Agent': UA, Accept: 'text/html' },
          next: { revalidate: 3600 },
        }).then(r => r.ok ? r.text().then(html => ({ date: d, html })) : Promise.reject(new Error(`HTTP ${r.status}`)))
      )
    )

    const items: FeedItem[] = []
    for (const result of dayPages) {
      if (result.status === 'rejected') continue
      const { date, html } = result.value

      // Events live inside #stream_container > ul.grid
      const containerPos = html.indexOf('id="stream_container"')
      if (containerPos < 0) continue
      const container = html.slice(containerPos, containerPos + 20000)

      const liRe = /<li class="item[^"]*">([\s\S]*?)<\/li>/g
      let lm: RegExpExecArray | null
      while ((lm = liRe.exec(container)) !== null) {
        const inner = lm[1]
        const linkMatch  = inner.match(/href="(\/en\/activity\/[^"]+)"/)
        const titleMatch = inner.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)
        const timeMatch  = inner.match(/<span class="item__dates">([^<]+)</)
        const imgMatch   = inner.match(/data-srcset="([^ ,]+)/)
        const tagsMatch  = inner.match(/class="tags[^"]*">([\s\S]*?)<\/div>/)
        if (!linkMatch || !titleMatch) continue

        const timeStr = timeMatch?.[1]?.trim() ?? '20:00'
        const published = new Date(`${date}T${timeStr.includes(':') ? timeStr : '20:00'}:00`).getTime() / 1000
        if (published < now) continue

        const title   = titleMatch[1].trim().replace(/<[^>]+>/g, '')
        const tags    = tagsMatch ? tagsMatch[1].replace(/<[^>]+>/g, '').replace(/,\s*/g, ' · ').trim() : ''
        const imgSrc  = imgMatch?.[1]
        const image   = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${BASE}${imgSrc}`) : undefined

        items.push({
          id:          `flagey-${date}-${linkMatch[1].split('/').filter(Boolean).pop()}`,
          source:      'flagey',
          sourceLabel: 'Flagey',
          category:    'events',
          title,
          summary:     tags || `${timeStr} · Flagey`,
          url:         `${BASE}${linkMatch[1]}`,
          image,
          published,
        })
      }
    }

    items.sort((a, b) => a.published - b.published)
    console.log(`[feeds:flagey] ${items.length} upcoming events`)
    return { items: items.slice(0, 20), source: { label: 'Flagey', status: 'ok', count: items.length } }
  } catch (err) {
    console.error('[feeds:flagey] threw:', err)
    return { items: [], source: { label: 'Flagey', status: 'error', count: 0, error: String(err) } }
  }
}

/* ── Les Halles de Schaerbeek — dance, circus, theatre, world music ─────────
   Monthly agenda pages: /en/agenda?ym=YYYY-MM
   Structure: agenda__day groups with agenda__date + agenda__activities list  */

async function fetchHalles(): Promise<{ items: FeedItem[]; source: SourceResult }> {
  const BASE = 'https://www.halles.be'
  const now  = Date.now() / 1000
  try {
    // Fetch current and next month
    const today = new Date()
    const months = [
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
      `${today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear()}-${String((today.getMonth() + 2) % 12 || 12).padStart(2, '0')}`,
    ]

    const pages = await Promise.allSettled(
      months.map(ym =>
        fetch(`${BASE}/en/agenda?ym=${ym}`, {
          headers: { 'User-Agent': UA, Accept: 'text/html' },
          next: { revalidate: 3600 },
        }).then(r => r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`)))
      )
    )

    const items: FeedItem[] = []

    for (let pi = 0; pi < pages.length; pi++) {
      const result = pages[pi]
      if (result.status === 'rejected') continue
      const html = result.value
      const monthNum = parseInt(months[pi].split('-')[1])
      const yearNum  = parseInt(months[pi].split('-')[0])

      // Each agenda__day contains: agenda__date (weekday + number) + agenda__activities (ul with li.agenda__item)
      const dayRe = /class="agenda__date">([\s\S]{0,300}?)<\/div>\s*<ul class="agenda__activities">([\s\S]{0,5000}?)<\/ul>/g
      let dm: RegExpExecArray | null
      while ((dm = dayRe.exec(html)) !== null) {
        const datePart  = dm[1]
        const itemsPart = dm[2]

        const dayNum = datePart.match(/agenda__date__number">\s*(\d+)/)?.[1]
        if (!dayNum) continue

        const dateStr  = `${yearNum}-${String(monthNum).padStart(2, '0')}-${dayNum.padStart(2, '0')}`

        // Parse each li.agenda__item
        const itemRe = /<li class="agenda__item item">([\s\S]*?)<\/li>/g
        let im: RegExpExecArray | null
        while ((im = itemRe.exec(itemsPart)) !== null) {
          const inner = im[1]
          const linkMatch  = inner.match(/href="(https:\/\/www\.halles\.be\/en\/ap\/[^"]+)"/)
          const hourMatch  = inner.match(/agenda__item__hour[^>]*>\s*([^<\s][^<]*?)\s*<\/div>/)
          const titleMatch = inner.match(/<h2[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h2>/)
          // image: first data-srcset entry (webp, smallest useful size ~288)
          const imgMatch   = inner.match(/data-srcset="([^\s,]+)\s+\d+w/)

          if (!linkMatch || !titleMatch) continue
          const timeStr  = hourMatch?.[1]?.trim() ?? '20:00'
          const published = new Date(`${dateStr}T${timeStr.replace('h', ':')}:00`).getTime() / 1000
          if (isNaN(published) || published < now) continue

          const title  = titleMatch[1].trim().replace(/<[^>]+>/g, '')
          const imgSrc = imgMatch?.[1]
          // img paths are relative like /en/rimage/...
          const image  = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${BASE}${imgSrc}`) : undefined

          items.push({
            id:          `halles-${linkMatch[1].split('/').filter(Boolean).pop()}`,
            source:      'halles',
            sourceLabel: 'Halles de Schaerbeek',
            category:    'events',
            title,
            summary:     `${timeStr} · Les Halles`,
            url:         linkMatch[1],
            image,
            published,
          })
        }
      }
    }

    items.sort((a, b) => a.published - b.published)
    console.log(`[feeds:halles] ${items.length} upcoming events`)
    return { items: items.slice(0, 20), source: { label: 'Halles de Schaerbeek', status: 'ok', count: items.length } }
  } catch (err) {
    console.error('[feeds:halles] threw:', err)
    return { items: [], source: { label: 'Halles de Schaerbeek', status: 'error', count: 0, error: String(err) } }
  }
}

/* ── Recyclart — alternative, experimental, community arts ──────────────────
   Agenda page: /fr/agenda  — ItemList JSON-LD gives URLs, datetime attrs give
   dates, and each li card has an img + h2 title.                             */

async function fetchRecyclart(): Promise<{ items: FeedItem[]; source: SourceResult }> {
  const BASE = 'https://recyclart.be'
  const now  = Date.now() / 1000
  try {
    const res = await fetch(`${BASE}/fr/agenda`, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return { items: [], source: { label: 'Recyclart', status: 'error', count: 0, error: `HTTP ${res.status}` } }
    const html = await res.text()

    const items: FeedItem[] = []
    // Each event card is a <li> containing: <a href="...agenda/slug"> with <img>, <h2>, and <time datetime="YYYY-MM-DD">
    // Find each list item that contains an agenda link
    const liRe = /<li[^>]*>\s*<a[^>]+href="(https:\/\/recyclart\.be\/fr\/agenda\/[^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/li>/g
    let lm: RegExpExecArray | null
    while ((lm = liRe.exec(html)) !== null) {
      const url   = lm[1]
      const inner = lm[2]

      // Date: first <time datetime="YYYY-MM-DD">
      const dateMatch = inner.match(/datetime="(\d{4}-\d{2}-\d{2})"/)
      if (!dateMatch) continue
      const published = new Date(dateMatch[1] + 'T20:00:00').getTime() / 1000
      if (published < now) continue

      const titleMatch = inner.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)
      const imgMatch   = inner.match(/<img[^>]+src="([^"]+)"/)
      if (!titleMatch) continue

      const title = titleMatch[1].trim().replace(/<[^>]+>/g, '').replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
      const image = imgMatch?.[1]
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30).replace(/-$/, '')

      items.push({
        id:          `recyclart-${dateMatch[1]}-${safeTitle}`,
        source:      'recyclart',
        sourceLabel: 'Recyclart',
        category:    'events',
        title,
        summary:     `${dateMatch[1]} · Recyclart`,
        url,
        image,
        published,
      })
    }

    items.sort((a, b) => a.published - b.published)
    console.log(`[feeds:recyclart] ${items.length} upcoming events`)
    return { items: items.slice(0, 20), source: { label: 'Recyclart', status: 'ok', count: items.length } }
  } catch (err) {
    console.error('[feeds:recyclart] threw:', err)
    return { items: [], source: { label: 'Recyclart', status: 'error', count: 0, error: String(err) } }
  }
}

/* ── La Monnaie / De Munt — opera and classical concerts ────────────────────
   Program page has <time datetime="YYYY-MM-DD"> elements adjacent to
   production links like /en/program/ID-slug                                  */

async function fetchLaMonnaie(): Promise<{ items: FeedItem[]; source: SourceResult }> {
  const BASE = 'https://www.lamonnaiedemunt.be'
  const now  = Date.now() / 1000
  try {
    const res = await fetch(`${BASE}/en/program`, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return { items: [], source: { label: 'La Monnaie', status: 'error', count: 0, error: `HTTP ${res.status}` } }
    const html = await res.text()

    const items: FeedItem[] = []
    const seen = new Set<string>()

    // Cards: <a href="/en/program/..."> containing <time datetime="YYYY-MM-DD"> and <h2>/<h3>
    const cardRe = /<a\s+href="(\/en\/program\/\d+[^"]+)"[^>]*>([\s\S]*?)<\/a>/g
    let cm: RegExpExecArray | null
    while ((cm = cardRe.exec(html)) !== null) {
      const path  = cm[1]
      const inner = cm[2]

      if (seen.has(path)) continue
      seen.add(path)

      const dateMatch  = inner.match(/datetime="(\d{4}-\d{2}-\d{2})"/)
      if (!dateMatch) continue
      const published = new Date(dateMatch[1] + 'T20:00:00').getTime() / 1000
      if (published < now) continue

      const titleMatch = inner.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/)
      const imgMatch   = inner.match(/<img[^>]+src="([^"]+)"/)
      if (!titleMatch) continue

      const title = titleMatch[1].trim().replace(/<[^>]+>/g, '').replace(/&#039;/g, "'").replace(/&amp;/g, '&')
      const imgSrc = imgMatch?.[1]
      const image  = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${BASE}${imgSrc}`) : undefined

      items.push({
        id:          `lamonnaie-${path.split('/').pop()}`,
        source:      'lamonnaie',
        sourceLabel: 'La Monnaie',
        category:    'events',
        title,
        summary:     `${dateMatch[1]} · La Monnaie / De Munt`,
        url:         `${BASE}${path}`,
        image,
        published,
      })
    }

    items.sort((a, b) => a.published - b.published)
    console.log(`[feeds:lamonnaie] ${items.length} upcoming events`)
    return { items: items.slice(0, 15), source: { label: 'La Monnaie', status: 'ok', count: items.length } }
  } catch (err) {
    console.error('[feeds:lamonnaie] threw:', err)
    return { items: [], source: { label: 'La Monnaie', status: 'error', count: 0, error: String(err) } }
  }
}

/* ── Route ─────────────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const city  = req.nextUrl.searchParams.get('city') ?? 'brussels'
  const debug = req.nextUrl.searchParams.get('debug') === '1'

  const subs     = CITY_SUBS[city] ?? CITY_SUBS.brussels
  const rssFeeds = CITY_RSS[city] ?? []

  const isBrussels = city === 'brussels'
  const skip = { items: [] as FeedItem[], source: { label: '', status: 'skipped' as const, count: 0 } }

  const [
    redditResult, ticketmasterResult, meetupResult, eventbriteResult,
    visitBrusselsResult, magasin4Result, botaniqueResult,
    flageyResult, hallesResult, recyclartResult, lamonnaieResult,
    ...rssResults
  ] = await Promise.all([
    fetchReddit(subs),
    fetchTicketmaster(city),
    fetchMeetup(city),
    fetchEventbrite(city),
    isBrussels ? fetchVisitBrussels() : Promise.resolve(skip),
    isBrussels ? fetchMagasin4()      : Promise.resolve(skip),
    isBrussels ? fetchBotanique()     : Promise.resolve(skip),
    isBrussels ? fetchFlagey()        : Promise.resolve(skip),
    isBrussels ? fetchHalles()        : Promise.resolve(skip),
    isBrussels ? fetchRecyclart()     : Promise.resolve(skip),
    isBrussels ? fetchLaMonnaie()     : Promise.resolve(skip),
    ...rssFeeds.map(fetchRSS),
  ])

  const all: FeedItem[] = [
    ...redditResult.items,
    ...ticketmasterResult.items,
    ...meetupResult.items,
    ...eventbriteResult.items,
    ...visitBrusselsResult.items,
    ...magasin4Result.items,
    ...botaniqueResult.items,
    ...flageyResult.items,
    ...hallesResult.items,
    ...recyclartResult.items,
    ...lamonnaieResult.items,
    ...rssResults.flatMap((r: { items: FeedItem[] }) => r.items),
  ].sort((a, b) => b.published - a.published)

  const counts: Record<string, number> = { all: all.length }
  for (const item of all) {
    counts[item.category] = (counts[item.category] ?? 0) + 1
  }

  const sources = [
    redditResult.source, ticketmasterResult.source, meetupResult.source, eventbriteResult.source,
    visitBrusselsResult.source, magasin4Result.source, botaniqueResult.source,
    flageyResult.source, hallesResult.source, recyclartResult.source, lamonnaieResult.source,
    ...rssResults.map((r: { source: SourceResult }) => r.source),
  ]
  console.log('[feeds] sources:', sources.map(s => `${s.label}:${s.status}(${s.count})`).join(' | '))

  return NextResponse.json(
    debug ? { items: all, counts, _sources: sources } : { items: all, counts },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
