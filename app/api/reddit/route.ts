import { NextRequest, NextResponse } from 'next/server'

const CITY_SUBS: Record<string, string[]> = {
  brussels: ['brussels', 'belgium'],
  lisbon:   ['portugal', 'pliving'],
}

export interface RedditPost {
  id:        string
  subreddit: string
  title:     string
  text:      string
  author:    string
  score:     number
  comments:  number
  created:   number   // unix seconds
  permalink: string
  flair:     string | null
}

async function fetchSub(sub: string): Promise<RedditPost[]> {
  const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=15`, {
    headers: { 'User-Agent': 'Roots/1.0 city-onboarding (+https://roots.so; contact: hello@roots.so)' },
    next: { revalidate: 900 }, // cache 15 min on the server
  })
  if (!res.ok) return []
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
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') ?? 'brussels'
  const subs = CITY_SUBS[city] ?? CITY_SUBS.brussels

  try {
    const results  = await Promise.all(subs.map(fetchSub))
    const posts    = results.flat().sort((a, b) => b.score - a.score).slice(0, 20)
    return NextResponse.json({ posts }, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
    })
  } catch (err) {
    console.error('[reddit]', err)
    return NextResponse.json({ posts: [] })
  }
}
