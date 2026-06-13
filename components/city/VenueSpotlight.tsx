'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { venuePhotoUrl } from '@/lib/photos'
import type { Venue } from '@/lib/data/venues'

interface Props {
  venue:  Venue
  cityId: string
  /** 'feature' renders a wide, full-width editorial photo band (homepage lead);
   *  'sidebar' (default) is the tall rail card. */
  variant?: 'sidebar' | 'feature'
}

// Photo-led editorial moment at the top of the city hub sidebar.
//
// Photo source preference (highest → lowest):
//   1. venue.photo — manually-curated direct URL. Bypasses everything.
//   2. Supabase Storage at venue-photos/{city}/{venueId}.jpg. Cached bytes,
//      no Google quota burn. Populated by scripts/upload-photos-to-storage.
//   3. venue.photoRef → /api/places/photo proxy (counts against daily Places
//      quota). Used when Storage 404s.
//   4. Client-side /api/places/search to discover a photoRef on the fly.
//   5. Colour-block fallback when everything fails or quota's gone.
//
// The cascade is implemented as <img onError> hops: try Storage, fall to
// proxy, fall to colour. Each step is one request; failures are silent.
export function VenueSpotlight({ venue, cityId, variant = 'sidebar' }: Props) {
  const [photoRef, setPhotoRef]     = useState<string | null>(venue.photoRef ?? null)
  const [imgErrored, setImgErrored] = useState(false)
  const [proxyTried, setProxyTried] = useState(false)

  // Direct URL takes precedence — skip everything else if present
  const directPhoto = venue.photo

  // Client-side lookup only when no direct photo AND no photoRef.
  useEffect(() => {
    if (directPhoto || photoRef) return
    let cancelled = false
    const sb = supabase
    if (!sb) return

    const lookupPhoto = async () => {
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
  }, [venue.id, venue.name, venue.address, cityId, photoRef, directPhoto])

  const label = venue.dealTag ?? 'Editor’s pick'
  // Cascade: direct URL > Supabase Storage > Places proxy.
  // `proxyTried` flips after Storage 404s, switching the src to the proxy.
  const storageUrl = venuePhotoUrl(cityId, venue.id)
  const proxyUrl   = photoRef ? `/api/places/photo?ref=${encodeURIComponent(photoRef)}` : null
  const photoUrl   = directPhoto
    ?? (!proxyTried ? storageUrl : proxyUrl)
  const showImage  = !!photoUrl && !imgErrored

  const handleImgError = () => {
    // First failure: assume it was Storage; try the proxy if we have a ref.
    if (!proxyTried && !directPhoto && proxyUrl) {
      setProxyTried(true)
      return
    }
    // Either proxy failed too, or no proxy available — give up.
    setImgErrored(true)
  }

  const fallbackBg =
    venue.broadType === 'bar'        ? '#4744C8' :
    venue.broadType === 'cafe'       ? '#B08800' :
    venue.broadType === 'restaurant' ? '#E8612A' : '#252450'

  // ── Feature variant — wide full-width editorial band ──────────────────
  // The homepage "venue of the week" lead. Mirrors the EventsSection hero:
  // tall photo, bottom gradient, big display name overlaid. Sized to entice.
  if (variant === 'feature') {
    return (
      <Link href={`/${cityId}/eat`}
        className="group block relative w-full overflow-hidden"
        style={{ height: 'clamp(300px, 42vw, 480px)', background: fallbackBg }}>

        {showImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={venue.name}
            onError={handleImgError}
            loading="eager"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
          />
        )}

        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(5,5,5,0.9) 0%, rgba(5,5,5,0.35) 45%, transparent 72%)' }} />

        <span className="absolute top-5 left-5 text-[10px] font-black tracking-[0.28em] uppercase px-2.5 py-1"
          style={{ background: '#FF3EBA', color: '#FFFFFF' }}>
          {label === 'Editor’s pick' ? 'Venue of the week' : label}
        </span>

        <div className="absolute left-5 right-5 sm:left-8 sm:right-8 bottom-6 text-white">
          <p className="font-display font-black leading-[1.02]"
            style={{ fontSize: 'clamp(1.9rem, 5vw, 3.4rem)', letterSpacing: '-0.02em' }}>
            {venue.name}
          </p>
          <p className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase mt-2 opacity-85">
            {venue.neighborhood} &middot; {venue.category}
          </p>
          {venue.why && (
            <p className="text-sm leading-relaxed mt-3 max-w-xl" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {venue.why}
            </p>
          )}
        </div>
      </Link>
    )
  }

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
              onError={handleImgError}
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
