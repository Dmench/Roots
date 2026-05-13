import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

// Audited May 2026: only verified-real subreddits. r/eububble and r/pliving
// were aspirational/wrong and returned 404 from Reddit's about.json endpoint.
const CITY_SUBS: Record<string, string[]> = {
  brussels:  ['brussels', 'belgium'],
  lisbon:    ['lisbon', 'PortugalExpats'],
  berlin:    ['berlin', 'germany'],
  barcelona: ['Barcelona', 'spain'],
  amsterdam: ['Amsterdam', 'thenetherlands'],
  prague:    ['Prague', 'czech'],
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

// Honest User-Agent per Reddit API guidelines. Required — Reddit aggressively
// rate-limits / blocks generic UAs.
const USER_AGENT = 'roots-city-guide/1.0 (https://roots.so; contact@roots.so)'

// Reddit OAuth — application-only flow.
//
// As of mid-2024, anonymous reads of www.reddit.com/r/X.json are routinely
// 403'd from datacenter IPs (Vercel, AWS, etc.) regardless of User-Agent.
// The OAuth client-credentials flow against oauth.reddit.com works fine.
//
// Register an app at https://www.reddit.com/prefs/apps:
//   - type: "web app" (or "script"; either works for app-only auth)
//   - redirect uri: anything — not used here
// Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in env.local + Vercel env.
//
// Without those env vars set, the route falls back to the old anonymous
// path, which mostly 403s in prod but can work in local dev.

interface TokenCache {
  token:     string
  expiresAt: number    // ms epoch
}
let tokenCache: TokenCache | null = null

async function getRedditToken(): Promise<string | null> {
  const id     = process.env.REDDIT_CLIENT_ID
  const secret = process.env.REDDIT_CLIENT_SECRET
  if (!id || !secret) return null

  // Reuse a cached token if it has at least 60s of life left.
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token
  }

  try {
    const basic = Buffer.from(`${id}:${secret}`).toString('base64')
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type':  'application/x-www-form-urlencoded',
        'User-Agent':    USER_AGENT,
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.warn(`[reddit] token request HTTP ${res.status}`)
      return null
    }
    const json = await res.json() as { access_token?: string; expires_in?: number }
    if (!json.access_token) return null

    tokenCache = {
      token:     json.access_token,
      // Reddit tokens last 1h. Cache just under that to be safe.
      expiresAt: Date.now() + Math.max(60_000, (json.expires_in ?? 3600) * 1000 - 60_000),
    }
    return tokenCache.token
  } catch (err) {
    console.warn('[reddit] token fetch error:', err)
    return null
  }
}

async function fetchSubViaOAuth(sub: string, token: string): Promise<RedditPost[]> {
  try {
    const res = await fetch(`https://oauth.reddit.com/r/${sub}/hot?limit=20&raw_json=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent':    USER_AGENT,
        'Accept':        'application/json',
      },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.warn(`[reddit] /r/${sub} HTTP ${res.status} via oauth`)
      return []
    }
    const json = await res.json()
    return parseListing(json)
  } catch (err) {
    console.warn(`[reddit] /r/${sub} oauth error:`, err)
    return []
  }
}

async function fetchSubAnonymous(sub: string): Promise<RedditPost[]> {
  // Best-effort fallback when no OAuth creds are configured. Reddit 403s most
  // Vercel/datacenter IPs now, so this rarely succeeds — but it can work in
  // local dev / from residential IPs.
  for (const base of ['https://www.reddit.com', 'https://old.reddit.com']) {
    try {
      const res = await fetch(`${base}/r/${sub}/hot.json?limit=20&raw_json=1`, {
        headers: {
          'User-Agent':      USER_AGENT,
          'Accept':          'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) continue
      const json = await res.json()
      return parseListing(json)
    } catch { continue }
  }
  return []
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseListing(json: any): RedditPost[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (json.data?.children ?? []).flatMap((c: any) => {
    const d = c.data
    if (!d || d.over_18 || d.stickied) return []
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
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const { ok } = await rateLimit(`reddit:${ip}`, { max: 20, windowMs: 60_000 })
  if (!ok) return NextResponse.json({ posts: [] }, { status: 429 })

  const city = req.nextUrl.searchParams.get('city') ?? 'brussels'
  const subs = CITY_SUBS[city] ?? CITY_SUBS.brussels

  try {
    const token = await getRedditToken()
    const fetcher = token
      ? (sub: string) => fetchSubViaOAuth(sub, token)
      : fetchSubAnonymous
    const results = await Promise.all(subs.map(fetcher))
    const posts   = results.flat().sort((a, b) => b.score - a.score).slice(0, 20)
    return NextResponse.json({ posts }, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  } catch (err) {
    console.error('[reddit]', err)
    return NextResponse.json({ posts: [] })
  }
}
