import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

const CITY_SUBS: Record<string, string[]> = {
  brussels: ['brussels', 'belgium'],
  lisbon:   ['portugal', 'pliving'],
  berlin:   ['berlin', 'germany'],
  barcelona: ['barcelona', 'spain'],
  amsterdam: ['amsterdam', 'thenetherlands'],
  prague:   ['prague', 'czech'],
}

export interface RedditPost {
  id:        string
  subreddit: string
  title:     string
  text:      string
  author:    string
  score:     number
  comments:  number
  created:   number
  permalink: string
  flair:     string | null
}

// Honest User-Agent per Reddit API guidelines.
// For higher rate limits, register a Reddit app at reddit.com/prefs/apps and add
// REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET env vars with OAuth client_credentials flow.
const USER_AGENT = 'roots-city-guide/1.0 (https://roots.so; contact@roots.so)'

async function fetchSub(sub: string): Promise<RedditPost[]> {
  const headers = {
    'User-Agent':      USER_AGENT,
    'Accept':          'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
  }

  for (const base of ['https://www.reddit.com', 'https://old.reddit.com']) {
    try {
      const res = await fetch(`${base}/r/${sub}/hot.json?limit=20&raw_json=1`, {
        headers,
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const json = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (json.data?.children ?? []).flatMap((c: any) => {
        const d = c.data
        if (d.over_18 || d.stickied) return []
        return [{
          id:        d.id,
          subreddit: d.subreddit,
          title:     d.title,
          text:      (d.selftext ?? '').slice(0, 220),
          author:    d.author,
          score:     d.score,
          comments:  d.num_comments,
          created:   d.created_utc,
          permalink: `https://reddit.com${d.permalink}`,
          flair:     d.link_flair_text ?? null,
        }]
      })
    } catch { continue }
  }
  return []
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const { ok } = rateLimit(ip, { max: 20, windowMs: 60_000 })
  if (!ok) return NextResponse.json({ posts: [] }, { status: 429 })

  const city = req.nextUrl.searchParams.get('city') ?? 'brussels'
  const subs = CITY_SUBS[city] ?? CITY_SUBS.brussels

  try {
    const results = await Promise.all(subs.map(fetchSub))
    const posts   = results.flat().sort((a, b) => b.score - a.score).slice(0, 20)
    return NextResponse.json({ posts }, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  } catch (err) {
    console.error('[reddit]', err)
    return NextResponse.json({ posts: [] })
  }
}
