export interface RedditPost {
  id: string; title: string; flair: string | null
  score: number; comments: number; permalink: string; created: number
}

const SUB_MAP: Record<string, string> = { brussels: 'brussels', lisbon: 'portugal' }

export async function getRedditPosts(cityId: string, limit = 6): Promise<RedditPost[]> {
  const sub = SUB_MAP[cityId] ?? 'brussels'
  try {
    const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=${Math.max(limit + 5, 15)}`, {
      headers: { 'User-Agent': 'Roots/1.0 (+https://roots.so; contact: hello@roots.so)' },
      next: { revalidate: 900 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data?.children ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => !c.data.over_18 && !c.data.stickied)
      .slice(0, limit)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => ({
        id: c.data.id, title: c.data.title, flair: c.data.link_flair_text ?? null,
        score: c.data.score, comments: c.data.num_comments,
        permalink: `https://reddit.com${c.data.permalink}`, created: c.data.created_utc,
      }))
  } catch { return [] }
}
