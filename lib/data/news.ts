export interface NewsItem {
  title: string; url: string; source: string
}

const FEED_MAP: Record<string, { url: string; source: string }[]> = {
  brussels: [
    { url: 'https://www.thebulletin.be/rss.xml', source: 'The Bulletin' },
    { url: 'https://www.politico.eu/feed/',       source: 'Politico EU' },
  ],
}

export async function getNews(cityId: string, limit = 6): Promise<NewsItem[]> {
  const feeds = FEED_MAP[cityId] ?? FEED_MAP.brussels
  const items: NewsItem[] = []
  for (const feed of feeds) {
    if (items.length >= limit) break
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Roots/1.0)', Accept: 'application/rss+xml, */*' },
        next: { revalidate: 1800 },
      })
      if (!res.ok) continue
      const xml = await res.text()
      const block = /<item>([\s\S]*?)<\/item>/g
      let m: RegExpExecArray | null; let count = 0
      while ((m = block.exec(xml)) !== null && count < 3) {
        const c     = m[1]
        const title = c.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim()
        const link  = c.match(/<link>([^<]+)<\/link>/)?.[1]?.trim() ?? c.match(/<link[^>]+href=["']([^"']+)["']/)?.[1]
        if (title && link?.startsWith('http')) { items.push({ title: title.replace(/<[^>]+>/g, ''), url: link, source: feed.source }); count++ }
      }
    } catch { continue }
  }
  return items.slice(0, limit)
}
