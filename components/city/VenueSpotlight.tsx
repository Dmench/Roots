'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import type { Venue } from '@/lib/data/venues'

interface Props {
  venue:  Venue
  cityId: string
}

// Photo-led editorial moment at the top of the city hub sidebar.
//
// Two-stage photo resolution (mirrors the pattern used on /[city]/eat):
//   1. If server-side enrichCurated() filled in venue.photoRef, render it.
//   2. Otherwise client-side fetch /api/places/search?q=<name> to find one.
// This works around the case where the server-side enrichment returns no
// photos (the Text Search response sometimes drops the photos array for
// reasons that aren't ours to debug).
//
// Final fallback: a colour block tinted by venue.broadType so the editorial
// section always anchors the sidebar — never invisible.
export function VenueSpotlight({ venue, cityId }: Props) {
  const [photoRef, setPhotoRef]     = useState<string | null>(venue.photoRef ?? null)
  const [imgErrored, setImgErrored] = useState(false)

  // Client-side lookup when server didn't have a photoRef. Same auth pattern
  // /eat uses — we're authenticated on this page, so the search call works.
  useEffect(() => {
    if (photoRef) return
    let cancelled = false
    const sb = supabase
    if (!sb) return

    const lookupPhoto = async () => {
      // Session-token cache so we don't re-fetch on every hub visit
      const cacheKey = `venue-spotlight-photo:${venue.id}`
      const cached   = sessionStorage.getItem(cacheKey)
      if (cached !== null) {
        if (!cancelled && cached) setPhotoRef(cached)
        return
      }

      try {
        const { data: { session } } = await sb.auth.getSession()
        const headers: Record<string, string> = {}
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

        const q = encodeURIComponent(venue.name + (venue.address ? ' ' + venue.address : ` ${cityId}`))
        const res = await fetch(`/api/places/search?q=${q}&cityId=${cityId}`, {
          headers,
          signal: AbortSignal.timeout(6000),
        })
        if (!res.ok) {
          sessionStorage.setItem(cacheKey, '')
          return
        }
        const json = await res.json() as { results?: Array<{ photoRef?: string | null }> }
        const ref  = json.results?.[0]?.photoRef ?? ''
        sessionStorage.setItem(cacheKey, ref)
        if (!cancelled && ref) setPhotoRef(ref)
      } catch {
        // Silent — the colour-block fallback takes over
      }
    }
    lookupPhoto()
    return () => { cancelled = true }
  }, [venue.id, venue.name, venue.address, cityId, photoRef])

  const label = venue.dealTag ?? 'Editor’s pick'
  const photoUrl  = photoRef ? `/api/places/photo?ref=${encodeURIComponent(photoRef)}` : null
  const showImage = !!photoUrl && !imgErrored

  const fallbackBg =
    venue.broadType === 'bar'        ? '#4744C8' :
    venue.broadType === 'cafe'       ? '#B08800' :
    venue.broadType === 'restaurant' ? '#E8612A' : '#252450'

  return (
    <section className="mb-10">
      <Link href={`/${cityId}/eat`} className="block group">
        <div className="relative w-full overflow-hidden"
          style={{ aspectRatio: '5 / 4', background: fallbackBg }}>

          {showImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={venue.name}
              onError={() => setImgErrored(true)}
              loading="eager"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
            />
          )}

          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: showImage
                ? 'linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.78) 100%)'
                : 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
            }} />

          <span className="absolute top-3 left-3 text-[8px] font-black tracking-[0.28em] uppercase px-2 py-1"
            style={{ background: '#FF3EBA', color: '#FFFFFF' }}>
            {label}
          </span>

          <div className="absolute left-4 right-4 bottom-3 text-white">
            <p className="font-display font-black leading-tight"
              style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', letterSpacing: '-0.01em' }}>
              {venue.name}
            </p>
            <p className="text-[9px] font-black tracking-[0.18em] uppercase mt-1 opacity-85">
              {venue.neighborhood} &middot; {venue.category}
            </p>
          </div>
        </div>

        {venue.why && (
          <p className="text-xs leading-relaxed mt-3" style={{ color: 'rgba(10,10,10,0.6)' }}>
            {venue.why}
          </p>
        )}
      </Link>
    </section>
  )
}
