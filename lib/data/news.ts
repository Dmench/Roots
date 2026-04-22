export interface NewsItem {
  title:  string
  url:    string
  source: string
  image?: string
}

const FEED_MAP: Record<string, { url: string; source: string }[]> = {
  brussels: [
    { url: 'https://www.thebulletin.be/rss.xml', source: 'The Bulletin' },
    { url: 'https://www.politico.eu/feed/',       source: 'Politico EU' },
  ],
}

function extractImage(itemXml: string): string | undefined {
  // Try media:content url="..."
  const mediaContent = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1]
  if (mediaContent) return mediaContent

  // Try media:thumbnail url="..."
  const mediaThumbnail = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1]
  if (mediaThumbnail) return mediaThumbnail

  // Try enclosure url="..." type="image/..."
  const enclosure = itemXml.match(/<enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/i)?.[1]
    ?? itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image[^"']*["']/i)?.[1]
  if (enclosure) return enclosure

  // Try <image><url>...</url> within item
  const imageUrl = itemXml.match(/<image>\s*<url>([^<]+)<\/url>/i)?.[1]
  if (imageUrl) return imageUrl

  return undefined
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
      const xml   = await res.text()
      const block = /<item>([\s\S]*?)<\/item>/g
      let m: RegExpExecArray | null; let count = 0
      while ((m = block.exec(xml)) !== null && count < 3) {
        const c     = m[1]
        const title = c.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim()
        const link  = c.match(/<link>([^<]+)<\/link>/)?.[1]?.trim()
          ?? c.match(/<link[^>]+href=["']([^"']+)["']/)?.[1]
        const image = extractImage(c)
        if (title && link?.startsWith('http')) {
          items.push({ title: title.replace(/<[^>]+>/g, ''), url: link, source: feed.source, image })
          count++
        }
      }
    } catch { continue }
  }
  return items.slice(0, limit)
}
