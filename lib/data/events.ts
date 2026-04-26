export interface EventPreview {
  id: string; title: string; date: string; time: string
  venue: string; source: string; url: string; dateObj: Date; image?: string
}

const UA = 'Mozilla/5.0 (compatible; Roots/1.0; +https://roots.so)'

export async function getEvents(cityId: string): Promise<EventPreview[]> {
  const now = Date.now()

  async function fromTicketmaster(): Promise<EventPreview[]> {
    const key = process.env.TICKETMASTER_API_KEY
    if (!key) return []
    const cityMap: Record<string, { city: string; countryCode: string }> = {
      brussels: { city: 'Brussels', countryCode: 'BE' },
      lisbon:   { city: 'Lisbon',   countryCode: 'PT' },
    }
    const loc = cityMap[cityId] ?? cityMap.brussels
    try {
      const params = new URLSearchParams({ city: loc.city, countryCode: loc.countryCode, size: '12', sort: 'date,asc', apikey: key })
      const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`, { next: { revalidate: 3600 } })
      if (!res.ok) return []
      const json = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (json._embedded?.events ?? []).flatMap((e: any): EventPreview[] => {
        if (!e.name || !e.url) return []
        const dateLocal = e.dates?.start?.localDate ?? ''
        const timeLocal = e.dates?.start?.localTime ?? ''
        if (!dateLocal) return []
        const d = new Date(`${dateLocal}T${timeLocal || '00:00:00'}`)
        if (d.getTime() < now) return []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgs: any[] = e.images ?? []
        const preferred = imgs.filter((img: any) => img.url && img.ratio === '16_9' && img.width >= 300).sort((a: any, b: any) => Math.abs(a.width - 640) - Math.abs(b.width - 640))
        const fallback   = imgs.filter((img: any) => img.url && img.width >= 300).sort((a: any, b: any) => Math.abs(a.width - 640) - Math.abs(b.width - 640))
        const image = preferred[0]?.url ?? fallback[0]?.url ?? undefined
        return [{ id: e.id, title: e.name, date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), time: timeLocal ? timeLocal.slice(0, 5) : '', venue: e._embedded?.venues?.[0]?.name ?? '', source: 'Ticketmaster', url: e.url, dateObj: d, image }]
      })
    } catch { return [] }
  }

  async function fromMagasin4(): Promise<EventPreview[]> {
    if (cityId !== 'brussels') return []
    try {
      const res = await fetch('https://www.magasin4.be/concerts/', { headers: { 'User-Agent': UA, Accept: 'text/html' }, next: { revalidate: 3600 } })
      if (!res.ok) return []
      const html = await res.text()
      const out: EventPreview[] = []
      const seen = new Set<string>()
      const linkRe = /<a\s+href="(https:\/\/www\.magasin4\.be\/concerts\/\d+\/(\d{4}-\d{2}-\d{2})\/[^"]*)"[^>]*class="[^"]*event-item-link[^"]*"[^>]*>([\s\S]*?)<\/a>/g
      let m: RegExpExecArray | null
      while ((m = linkRe.exec(html)) !== null) {
        const [, url, dateStr, inner] = m
        if (seen.has(url)) continue; seen.add(url)
        const d = new Date(dateStr + 'T20:00:00')
        if (d.getTime() < now) continue
        const artistRe = /class="[^"]*artist-accent-flyer[^"]*"[^>]*>([^<]+)<\/span>/g
        const artists: string[] = []
        let am: RegExpExecArray | null
        while ((am = artistRe.exec(inner)) !== null) {
          const name = am[1].trim().replace(/&amp;/g, '&').replace(/&#039;/g, "'")
          if (name) artists.push(name)
        }
        const genreMatch = inner.match(/class="event-genre"[^>]*>([^<]+)<\/div>/)
        const imgMatch   = inner.match(/<img[^>]+src="([^"]+)"/)
        out.push({ id: `magasin4-${url.split('/').filter(Boolean).slice(-2).join('-')}`, title: artists.length > 0 ? artists.join(' + ') : 'Event at Magasin 4', date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), time: '20:00', venue: 'Magasin 4', source: genreMatch?.[1]?.trim() ?? 'Magasin 4', url, dateObj: d, image: imgMatch?.[1] ?? undefined })
      }
      return out
    } catch { return [] }
  }

  async function fromBotanique(): Promise<EventPreview[]> {
    if (cityId !== 'brussels') return []
    const BASE = 'https://botanique.be'
    try {
      const res = await fetch(`${BASE}/en/concerts`, { headers: { 'User-Agent': UA, Accept: 'text/html' }, next: { revalidate: 3600 } })
      if (!res.ok) return []
      const html = await res.text()
      const out: EventPreview[] = []
      const blockMarkerRe = /<div[^>]+data-history-node-id="[^"]*"[^>]+about="(\/en\/concert\/[^"]+)"[^>]*class="[^"]*node-type-event[^"]*"[^>]*>/g
      const blockStarts: { about: string; pos: number }[] = []
      let bm: RegExpExecArray | null
      while ((bm = blockMarkerRe.exec(html)) !== null) blockStarts.push({ about: bm[1], pos: bm.index + bm[0].length })
      for (let i = 0; i < blockStarts.length; i++) {
        const { about, pos } = blockStarts[i]
        const inner = html.slice(pos, blockStarts[i + 1]?.pos ?? html.length)
        const day   = inner.match(/class="node-date__day">([^<]+)</)?.[1]?.trim() ?? ''
        const month = inner.match(/class="node-date__month">([^<]+)</)?.[1]?.trim() ?? ''
        const year  = inner.match(/class="node-date__year">([^<]+)</)?.[1]?.trim() ?? ''
        if (!day || !month || !year) continue
        const d = new Date(`${day} ${month} ${year} 20:00`)
        if (isNaN(d.getTime()) || d.getTime() < now) continue
        const titleMatch = inner.match(/<h2[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/)
        const title = titleMatch?.[1]?.trim().replace(/<[^>]+>/g, '') ?? 'Event at Botanique'
        const imgSrc = inner.match(/<img[^>]+src="([^"]+)"/) ?.[1]
        out.push({ id: `botanique-${about.split('/').pop()}`, title, date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), time: '20:00', venue: 'Botanique', source: 'Botanique', url: `${BASE}${about}`, dateObj: d, image: imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${BASE}${imgSrc}`) : undefined })
      }
      return out
    } catch { return [] }
  }

  async function fromFlagey(): Promise<EventPreview[]> {
    if (cityId !== 'brussels') return []
    const BASE = 'https://www.flagey.be'
    try {
      const home = await fetch(`${BASE}/en`, { headers: { 'User-Agent': UA, Accept: 'text/html' }, next: { revalidate: 3600 } })
      if (!home.ok) return []
      const homeHtml = await home.text()
      const dateRe = /data-href="https:\/\/www\.flagey\.be\/en\/\?date_string=(\d{4}-\d{2}-\d{2})"/g
      const dates: string[] = []
      let dm: RegExpExecArray | null
      while ((dm = dateRe.exec(homeHtml)) !== null) { if (!dates.includes(dm[1])) dates.push(dm[1]) }
      const dayPages = await Promise.allSettled(
        dates.slice(0, 5).map(d =>
          fetch(`${BASE}/en/?date_string=${d}`, { headers: { 'User-Agent': UA, Accept: 'text/html' }, next: { revalidate: 3600 } })
            .then(r => r.ok ? r.text().then(html => ({ date: d, html })) : Promise.reject())
        )
      )
      const out: EventPreview[] = []
      for (const result of dayPages) {
        if (result.status === 'rejected') continue
        const { date, html } = result.value
        const containerPos = html.indexOf('id="stream_container"')
        if (containerPos < 0) continue
        const container = html.slice(containerPos, containerPos + 20000)
        const liRe = /<li class="item[^"]*">([\s\S]*?)<\/li>/g
        let lm: RegExpExecArray | null
        while ((lm = liRe.exec(container)) !== null) {
          const inner = lm[1]
          const linkMatch  = inner.match(/href="(\/en\/activity\/[^"]+)"/)
          const titleMatch = inner.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)
          const timeMatch  = inner.match(/<span class="item__dates">([^<]+)</)
          const imgMatch   = inner.match(/data-srcset="([^ ,]+)/)
          if (!linkMatch || !titleMatch) continue
          const timeStr = timeMatch?.[1]?.trim() ?? '20:00'
          const d = new Date(`${date}T${timeStr.includes(':') ? timeStr : '20:00'}:00`)
          if (isNaN(d.getTime()) || d.getTime() < now) continue
          const title  = titleMatch[1].trim().replace(/<[^>]+>/g, '')
          const imgSrc = imgMatch?.[1]
          out.push({ id: `flagey-${date}-${linkMatch[1].split('/').filter(Boolean).pop()}`, title, date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), time: timeStr, venue: 'Flagey', source: 'Flagey', url: `${BASE}${linkMatch[1]}`, dateObj: d, image: imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${BASE}${imgSrc}`) : undefined })
        }
      }
      return out
    } catch { return [] }
  }

  async function fromHalles(): Promise<EventPreview[]> {
    if (cityId !== 'brussels') return []
    const BASE = 'https://www.halles.be'
    try {
      const today2 = new Date()
      const months = [
        `${today2.getFullYear()}-${String(today2.getMonth() + 1).padStart(2, '0')}`,
        `${today2.getMonth() === 11 ? today2.getFullYear() + 1 : today2.getFullYear()}-${String((today2.getMonth() + 2) % 12 || 12).padStart(2, '0')}`,
      ]
      const pages = await Promise.allSettled(months.map(ym =>
        fetch(`${BASE}/en/agenda?ym=${ym}`, { headers: { 'User-Agent': UA, Accept: 'text/html' }, next: { revalidate: 3600 } })
          .then(r => r.ok ? r.text().then(html => ({ ym, html })) : Promise.reject())
      ))
      const out: EventPreview[] = []
      for (const result of pages) {
        if (result.status === 'rejected') continue
        const { ym, html } = result.value
        const [yearNum, monthNum] = ym.split('-').map(Number)
        const dayRe = /class="agenda__date">([\s\S]{0,300}?)<\/div>\s*<ul class="agenda__activities">([\s\S]{0,5000}?)<\/ul>/g
        let dm: RegExpExecArray | null
        while ((dm = dayRe.exec(html)) !== null) {
          const dayNum = dm[1].match(/agenda__date__number">\s*(\d+)/)?.[1]
          if (!dayNum) continue
          const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${dayNum.padStart(2, '0')}`
          const itemRe = /<li class="agenda__item item">([\s\S]*?)<\/li>/g
          let im: RegExpExecArray | null
          while ((im = itemRe.exec(dm[2])) !== null) {
            const inner = im[1]
            const linkMatch  = inner.match(/href="(https:\/\/www\.halles\.be\/en\/ap\/[^"]+)"/)
            const hourMatch  = inner.match(/agenda__item__hour[^>]*>\s*([^<\s][^<]*?)\s*<\/div>/)
            const titleMatch = inner.match(/<h2[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h2>/)
            const imgMatch   = inner.match(/data-srcset="([^\s,]+)\s+\d+w/)
            if (!linkMatch || !titleMatch) continue
            const timeStr = hourMatch?.[1]?.trim() ?? '20:00'
            const d = new Date(`${dateStr}T${timeStr.replace('h', ':')}:00`)
            if (isNaN(d.getTime()) || d.getTime() < now) continue
            const title  = titleMatch[1].trim().replace(/<[^>]+>/g, '')
            const imgSrc = imgMatch?.[1]
            out.push({ id: `halles-${linkMatch[1].split('/').filter(Boolean).pop()}`, title, date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), time: timeStr, venue: 'Halles de Schaerbeek', source: 'Halles de Schaerbeek', url: linkMatch[1], dateObj: d, image: imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${BASE}${imgSrc}`) : undefined })
          }
        }
      }
      return out
    } catch { return [] }
  }

  async function fromRecyclart(): Promise<EventPreview[]> {
    if (cityId !== 'brussels') return []
    const BASE = 'https://recyclart.be'
    try {
      const res = await fetch(`${BASE}/fr/agenda`, { headers: { 'User-Agent': UA, Accept: 'text/html' }, next: { revalidate: 3600 } })
      if (!res.ok) return []
      const html = await res.text()
      const out: EventPreview[] = []
      const liRe = /<li[^>]*>\s*<a[^>]+href="(https:\/\/recyclart\.be\/fr\/agenda\/[^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/li>/g
      let lm: RegExpExecArray | null
      while ((lm = liRe.exec(html)) !== null) {
        const url = lm[1]; const inner = lm[2]
        const dateMatch = inner.match(/datetime="(\d{4}-\d{2}-\d{2})"/)
        if (!dateMatch) continue
        const d = new Date(dateMatch[1] + 'T20:00:00')
        if (d.getTime() < now) continue
        const titleMatch = inner.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)
        const imgMatch   = inner.match(/<img[^>]+src="([^"]+)"/)
        if (!titleMatch) continue
        const title = titleMatch[1].trim().replace(/<[^>]+>/g, '').replace(/&#039;/g, "'").replace(/&amp;/g, '&')
        const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30).replace(/-$/, '')
        out.push({ id: `recyclart-${dateMatch[1]}-${safeTitle}`, title, date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), time: '20:00', venue: 'Recyclart', source: 'Recyclart', url, dateObj: d, image: imgMatch?.[1] ?? undefined })
      }
      return out
    } catch { return [] }
  }

  async function fromVisitBrussels(): Promise<EventPreview[]> {
    if (cityId !== 'brussels') return []
    const BASE = 'https://www.visit.brussels'
    try {
      const res = await fetch(`${BASE}/en/visitors/agenda`, {
        headers: { 'User-Agent': UA, Accept: 'text/html' },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) return []
      const html = await res.text()
      const out: EventPreview[] = []

      // Method 1: JSON-LD structured Event objects
      const jsonLdRe = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
      let m: RegExpExecArray | null
      while ((m = jsonLdRe.exec(html)) !== null) {
        try {
          const data = JSON.parse(m[1])
          const candidates = Array.isArray(data) ? data : (data['@graph'] ? data['@graph'] : [data])
          for (const obj of candidates) {
            if (obj['@type'] !== 'Event') continue
            const name     = typeof obj.name === 'string' ? obj.name.trim() : undefined
            const url      = typeof obj.url  === 'string' ? obj.url.trim()  : undefined
            const startRaw = obj.startDate ?? obj.datePublished
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const imgRaw   = obj.image as any
            const image    = typeof imgRaw === 'string' ? imgRaw : imgRaw?.url ?? undefined
            if (!name || !url || !startRaw) continue
            const d = new Date(startRaw)
            if (isNaN(d.getTime()) || d.getTime() < now) continue
            out.push({
              id:      `visitbru-ld-${url.split('/').pop()?.slice(0, 20) ?? Math.random().toString(36).slice(2)}`,
              title:   name,
              date:    d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
              time:    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              venue:   obj.location?.name ?? 'Brussels',
              source:  'Visit Brussels',
              url,
              dateObj: d,
              image,
            })
          }
        } catch { /* skip malformed block */ }
      }

      // Method 2: link extraction fallback
      if (out.length === 0) {
        const seen   = new Set<string>()
        const linkRe = /href="((?:https:\/\/www\.visit\.brussels)?\/en\/visitors\/agenda\/event-detail\.[^"#?]+)"/g
        while ((m = linkRe.exec(html)) !== null) {
          let href = m[1]
          if (href.startsWith('/')) href = BASE + href
          if (seen.has(href)) continue
          seen.add(href)
          const pathPart = href.split('/').pop() ?? ''
          const titleRaw = pathPart.replace(/^event-detail\./, '').replace(/\.\d+$/, '').replace(/\./g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
          const title    = titleRaw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
          const linkIdx  = html.indexOf(m[0])
          const ctxStart = Math.max(0, linkIdx - 800)
          const context  = html.slice(ctxStart, linkIdx + 2000)
          const dateMatch = context.match(/datetime="(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/)
          const d = dateMatch
            ? new Date(`${dateMatch[1]}T${dateMatch[2] ?? '20:00'}:00`)
            : new Date(now + (out.length + 1) * 86400000)
          if (dateMatch && d.getTime() < now) continue
          const imgMatch = context.match(/src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)
          const numId    = pathPart.match(/\.(\d+)$/)?.[1] ?? Math.random().toString(36).slice(2)
          out.push({
            id:      `visitbru-${numId}`,
            title:   title || 'Event in Brussels',
            date:    d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
            time:    dateMatch?.[2] ?? '20:00',
            venue:   'Brussels',
            source:  'Visit Brussels',
            url:     href,
            dateObj: d,
            image:   imgMatch?.[1],
          })
          if (out.length >= 30) break
        }
        out.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      }

      return out.slice(0, 30)
    } catch { return [] }
  }

  async function fromLaMonnaie(): Promise<EventPreview[]> {
    if (cityId !== 'brussels') return []
    const BASE = 'https://www.lamonnaiedemunt.be'
    try {
      const res = await fetch(`${BASE}/en/program`, { headers: { 'User-Agent': UA, Accept: 'text/html' }, next: { revalidate: 3600 } })
      if (!res.ok) return []
      const html = await res.text()
      const out: EventPreview[] = []
      const seen = new Set<string>()
      const cardRe = /<a\s+href="(\/en\/program\/\d+[^"]+)"[^>]*>([\s\S]*?)<\/a>/g
      let cm: RegExpExecArray | null
      while ((cm = cardRe.exec(html)) !== null) {
        const path = cm[1]; const inner = cm[2]
        if (seen.has(path)) continue; seen.add(path)
        const dateMatch  = inner.match(/datetime="(\d{4}-\d{2}-\d{2})"/)
        if (!dateMatch) continue
        const d = new Date(dateMatch[1] + 'T20:00:00')
        if (d.getTime() < now) continue
        const titleMatch = inner.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/)
        const imgMatch   = inner.match(/<img[^>]+src="([^"]+)"/)
        if (!titleMatch) continue
        const title  = titleMatch[1].trim().replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')
        const imgSrc = imgMatch?.[1]
        out.push({ id: `lamonnaie-${path.split('/').pop()}`, title, date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), time: '20:00', venue: 'La Monnaie / De Munt', source: 'La Monnaie', url: `${BASE}${path}`, dateObj: d, image: imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${BASE}${imgSrc}`) : undefined })
      }
      return out
    } catch { return [] }
  }

  async function fromFeu(): Promise<EventPreview[]> {
    if (cityId !== 'brussels') return []
    const BASE = 'https://feu.ultravnr.be'
    const today = new Date()
    const thisYear  = today.getFullYear()
    const thisMonth = today.getMonth() + 1
    try {
      const res = await fetch(BASE, { headers: { 'User-Agent': UA, Accept: 'text/html' }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(10000) })
      if (!res.ok) return []
      const html = await res.text()
      const out: EventPreview[] = []
      const liRe = /<li>([\s\S]*?)<\/li>/gi
      let m: RegExpExecArray | null
      while ((m = liRe.exec(html)) !== null) {
        const raw = m[1]
        const dateM = raw.match(/<span[^>]*l-date[^>]*>(\d{2})\/(\d{2})<\/span>/i)
        if (!dateM) continue
        const day = parseInt(dateM[1], 10), month = parseInt(dateM[2], 10)
        if (day < 1 || day > 31 || month < 1 || month > 12) continue
        const year = month < thisMonth - 1 ? thisYear + 1 : thisYear
        const dateISO = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
        const timeRaw = raw.match(/<span[^>]*l-heure[^>]*>([^<]*)<\/span>/i)?.[1]?.trim() ?? '20:00'
        const startT  = timeRaw.split(/[-–]/)[0].trim().replace(/^(\d{1,2})h(\d{2})?$/i, (_, h, min) => `${h.padStart(2,'0')}:${min ?? '00'}`)
                          .replace(/^(\d{1,2}):(\d{2})$/, (_, h, min) => `${h.padStart(2,'0')}:${min}`) || '20:00'
        const d = new Date(`${dateISO}T${startT}:00`)
        if (isNaN(d.getTime()) || d.getTime() < now) continue
        const venueM = raw.match(/@<a[^>]+href="([^"]*)"[^>]*>([^<]+)<\/a>/)
        const venueUrl  = venueM?.[1] || BASE
        const venueName = venueM?.[2]?.trim() ?? 'Brussels'
        const stripped = raw
          .replace(/<span[^>]*l-date[^>]*>[^<]*<\/span>/i, '')
          .replace(/<span[^>]*l-heure[^>]*>[^<]*<\/span>/i, '')
        const titleRaw = stripped.match(/^\s*([\s\S]+?)@<a/)?.[1] ?? stripped.replace(/<[^>]+>/g, ' ')
        let title = titleRaw
          .replace(/&amp;/g, '&').replace(/&#8211;/g, '–').replace(/&#039;/g, "'").replace(/&[a-zA-Z#0-9]+;/g, ' ')
          .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          .replace(/\s*-\s*(Entr[eé]e libre|Gratuit|GRATUIT|prix libre|chapeau|\d[\d€/–-]*€[^-]*).*$/i, '')
          .replace(/\s*\([a-zA-ZÀ-ÿ/ ][^)]{1,60}\)\s*$/, '')
          .replace(/\s*[-–]\s*$/, '').trim()
        out.push({ id: `feu-${dateISO}-${title.slice(0,12).replace(/\W/g,'')}`, title: title || venueName, date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), time: startT, venue: venueName, source: 'Bruxelles Brûle', url: venueUrl, dateObj: d })
      }
      return out.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()).slice(0, 25)
    } catch { return [] }
  }

  const [tm, vb, m4, bot, flagey, halles, recyclart, lamonnaie, feu] = await Promise.all([
    fromTicketmaster(), fromVisitBrussels(), fromMagasin4(), fromBotanique(),
    fromFlagey(), fromHalles(), fromRecyclart(), fromLaMonnaie(), fromFeu(),
  ])
  return [...tm, ...vb, ...m4, ...bot, ...flagey, ...halles, ...recyclart, ...lamonnaie, ...feu]
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
}

/** Returns true for events that are broadly accessible — safe to include in curated digest picks */
export function isBroadAppeal(ev: EventPreview): boolean {
  const t = ev.title.toLowerCase()
  const NICHE = ['metal', 'hardcore', 'grindcore', 'thrash', 'doom', 'sludge', 'death metal', 'black metal', 'noise rock', 'powerviolence']
  return !NICHE.some(kw => t.includes(kw))
}
