export interface RedditPost {
  id: string; title: string; flair: string | null
  score: number; comments: number; permalink: string; created: number
}

const SUB_MAP: Record<string, string> = { brussels: 'brussels', lisbon: 'portugal' }

// Reddit blocks generic UAs from server IPs. Use .json on old.reddit which is
// less aggressively rate-limited, with a realistic browser User-Agent.
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}

export async function getRedditPosts(cityId: string, limit = 6): Promise<RedditPost[]> {
  const sub = SUB_MAP[cityId] ?? 'brussels'

  // Try www first, fall back to oauth-free endpoint
  const urls = [
    `https://www.reddit.com/r/${sub}/hot.json?limit=${Math.max(limit + 5, 15)}&raw_json=1`,
    `https://old.reddit.com/r/${sub}/hot.json?limit=${Math.max(limit + 5, 15)}&raw_json=1`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: HEADERS,
        next: { revalidate: 900 },
      })
      if (!res.ok) continue

      const json = await res.json()
      const posts = (json.data?.children ?? [])
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

      if (posts.length > 0) return posts
    } catch { continue }
  }

  return []
}
