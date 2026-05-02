// STIB-MIVB Brussels public transport disruptions
// Source: STIB open data portal + stib-mivb.be disruptions page
// Falls back gracefully — this is enhancement, not critical path

export interface TransportDisruption {
  id:          string
  line:        string    // e.g. "M1", "T81", "B54"
  type:        'metro' | 'tram' | 'bus' | 'all'
  description: string
  severity:    'info' | 'warning' | 'critical'
  url:         string
}

export interface TransportData {
  disruptions: TransportDisruption[]
  hasService:  boolean   // false only if total shutdown detected
  updatedAt:   number
}

const UA = 'Mozilla/5.0 (compatible; Roots/1.0; +https://roots.so)'

// STIB Open Data — service alerts via GTFS-Realtime is behind registration.
// Fallback: scrape the STIB news/disruptions page for current alerts.
async function scrapeSTIBDisruptions(): Promise<TransportDisruption[]> {
  try {
    const res = await fetch('https://www.stib-mivb.be/disruptions.htm?l=en', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      next: { revalidate: 300 }, // 5 min — transport info changes fast
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const html = await res.text()
    const out: TransportDisruption[] = []

    // Extract disruption blocks — STIB renders them in div.disruption-item or similar
    const blockRe = /<(?:div|li)[^>]+class="[^"]*(?:disruption|alert|perturbation)[^"]*"[^>]*>([\s\S]{0,800}?)<\/(?:div|li)>/gi
    let m: RegExpExecArray | null
    while ((m = blockRe.exec(html)) !== null && out.length < 8) {
      const inner = m[1]
      const text  = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (!text || text.length < 10) continue

      // Try to detect line number/letter
      const lineMatch = text.match(/\b(M[1-6]|T\d{1,2}|B\d{2,3}|line\s+\d+)\b/i)
      const line      = lineMatch ? lineMatch[1].toUpperCase() : 'Network'

      // Detect type from line prefix
      let type: TransportDisruption['type'] = 'all'
      if (line.startsWith('M'))       type = 'metro'
      else if (line.startsWith('T'))  type = 'tram'
      else if (line.startsWith('B'))  type = 'bus'

      // Severity heuristics
      const lower    = text.toLowerCase()
      let severity: TransportDisruption['severity'] = 'info'
      if (lower.includes('interrupt') || lower.includes('suspend') || lower.includes('no service')) severity = 'critical'
      else if (lower.includes('delay') || lower.includes('partial') || lower.includes('deviation')) severity = 'warning'

      const slug = text.slice(0, 20).replace(/\W/g, '-')
      out.push({
        id:          `stib-${slug}-${out.length}`,
        line,
        type,
        description: text.slice(0, 140),
        severity,
        url:         'https://www.stib-mivb.be/disruptions.htm?l=en',
      })
    }

    // If the above didn't parse, try simpler text extraction
    if (out.length === 0) {
      const alertRe = /<p[^>]*class="[^"]*alert[^"]*"[^>]*>([\s\S]{0,200}?)<\/p>/gi
      while ((m = alertRe.exec(html)) !== null && out.length < 5) {
        const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        if (!text || text.length < 15) continue
        out.push({
          id:          `stib-alert-${out.length}`,
          line:        'Network',
          type:        'all',
          description: text.slice(0, 140),
          severity:    'info',
          url:         'https://www.stib-mivb.be/disruptions.htm?l=en',
        })
      }
    }

    return out
  } catch {
    return []
  }
}

// Also try STIB's XML/RSS disruption feed if available
async function fetchSTIBFeed(): Promise<TransportDisruption[]> {
  const FEEDS = [
    'https://www.stib-mivb.be/disruptions.xml',
    'https://www.stib-mivb.be/rss/disruptions_en.xml',
  ]
  for (const url of FEEDS) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(6000),
      })
      if (!res.ok) continue
      const xml = await res.text()
      const out: TransportDisruption[] = []
      const itemRe = /<item>([\s\S]*?)<\/item>/g
      let m: RegExpExecArray | null
      while ((m = itemRe.exec(xml)) !== null && out.length < 6) {
        const inner  = m[1]
        const title  = inner.match(/<title[^>]*><!?\[?CDATA\[?([\s\S]*?)\]?\]?><\/title>/)?.[1]
                    ?? inner.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? ''
        const linkM  = inner.match(/<link[^>]*>([\s\S]*?)<\/link>/)
        const clean  = title.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        if (!clean) continue
        const lineM  = clean.match(/\b(M[1-6]|T\d{1,2}|B\d{2,3})\b/i)
        const line   = lineM ? lineM[1].toUpperCase() : 'Network'
        let type: TransportDisruption['type'] = 'all'
        if (line.startsWith('M'))      type = 'metro'
        else if (line.startsWith('T')) type = 'tram'
        else if (line.startsWith('B')) type = 'bus'
        const lower    = clean.toLowerCase()
        let severity: TransportDisruption['severity'] = 'info'
        if (lower.includes('interrupt') || lower.includes('suspend')) severity = 'critical'
        else if (lower.includes('delay') || lower.includes('partial')) severity = 'warning'
        out.push({
          id:          `stib-rss-${out.length}`,
          line,
          type,
          description: clean.slice(0, 140),
          severity,
          url:         linkM?.[1]?.trim() ?? url,
        })
      }
      if (out.length > 0) return out
    } catch { /* try next */ }
  }
  return []
}

export async function getTransportStatus(cityId: string): Promise<TransportData> {
  if (cityId !== 'brussels') {
    return { disruptions: [], hasService: true, updatedAt: Date.now() }
  }

  const [rss, scraped] = await Promise.all([fetchSTIBFeed(), scrapeSTIBDisruptions()])
  // RSS is more structured — prefer it; fall back to scraped
  const disruptions = rss.length > 0 ? rss : scraped

  const hasService = !disruptions.some(d =>
    d.severity === 'critical' && d.line === 'Network'
  )

  return { disruptions, hasService, updatedAt: Date.now() }
}
