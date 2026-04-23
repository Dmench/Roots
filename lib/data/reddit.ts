export interface RedditPost {
  id: string; title: string; flair: string | null
  score: number; comments: number; permalink: string; created: number
}

const SUB_MAP: Record<string, string> = {
  brussels: 'brussels',
  lisbon:   'portugal',
  berlin:   'berlin',
  barcelona: 'barcelona',
  amsterdam: 'amsterdam',
  prague:   'prague',
}

// Rotate through multiple UAs — Reddit blocks IPs that look like server scrapers.
// Using realistic browser UAs dramatically improves hit rate from server environments.
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
]

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

function makeHeaders() {
  return {
    'User-Agent':      randomUA(),
    'Accept':          'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control':   'no-cache',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePosts(json: any, limit: number): RedditPost[] {
  return (json.data?.children ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((c: any) => !c.data.over_18 && !c.data.stickied)
    .slice(0, limit)
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
}

export async function getRedditPosts(cityId: string, limit = 6): Promise<RedditPost[]> {
  const sub = SUB_MAP[cityId] ?? 'brussels'

  // Try multiple endpoints in order — www, old, and the JSON endpoint with different paths
  const endpoints = [
    `https://www.reddit.com/r/${sub}/hot.json?limit=${limit + 10}&raw_json=1`,
    `https://old.reddit.com/r/${sub}/hot.json?limit=${limit + 10}&raw_json=1`,
    `https://www.reddit.com/r/${sub}.json?limit=${limit + 10}&raw_json=1`,
  ]

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: makeHeaders(),
        next: { revalidate: 1800 }, // cache alongside page revalidation
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) {
        console.warn(`[reddit] ${url} → HTTP ${res.status}`)
        continue
      }
      const json = await res.json()
      const posts = parsePosts(json, limit)
      if (posts.length > 0) return posts
    } catch (e) {
      console.warn(`[reddit] ${url} failed:`, e instanceof Error ? e.message : e)
      continue
    }
  }

  console.warn(`[reddit] all endpoints failed for r/${sub}`)
  return []
}
