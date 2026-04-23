import { NextRequest, NextResponse } from 'next/server'

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

const UAS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
]

async function fetchSub(sub: string): Promise<RedditPost[]> {
  const ua = UAS[Math.floor(Math.random() * UAS.length)]
  const headers = { 'User-Agent': ua, 'Accept': 'application/json', 'Accept-Language': 'en-US,en;q=0.9' }

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
