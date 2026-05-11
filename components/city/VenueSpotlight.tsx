'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Venue } from '@/lib/data/venues'

interface Props {
  venue:  Venue
  cityId: string
}

// Photo-led editorial moment at the top of the city hub sidebar. Always
// renders — when photoRef is missing OR the image fails to load, falls back
// to a colour-block hero card so the editorial section still anchors the
// sidebar instead of disappearing into nothing. (Previously this returned
// null on missing photoRef which produced an invisible feature.)
//
// Client component because we need `onError` on the image to switch to the
// fallback state when Google's photo URL is missing or 404s.
export function VenueSpotlight({ venue, cityId }: Props) {
  const [imgErrored, setImgErrored] = useState(false)
  const label = venue.dealTag ?? 'Editor’s pick'
  const photoUrl = venue.photoRef
    ? `/api/places/photo?ref=${encodeURIComponent(venue.photoRef)}`
    : null
  const showImage = !!photoUrl && !imgErrored

  // Colour block fallback uses the broadType register — terracotta for
  // restaurants, navy/purple for bars, gold for cafés.
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
            // Plain <img> not next/image — the photo proxy at /api/places/photo
            // streams the bytes itself; the Next.js image optimizer adds nothing
            // here, and using <img> sidesteps optimizer pipeline edge cases that
            // were occasionally returning an empty slot.
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

          {/* Bottom gradient for legibility — heavier when no image so the
              caption still reads against the colour block. */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: showImage
                ? 'linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.78) 100%)'
                : 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
            }} />

          {/* Top-left chip */}
          <span className="absolute top-3 left-3 text-[8px] font-black tracking-[0.28em] uppercase px-2 py-1"
            style={{ background: '#FF3EBA', color: '#FFFFFF' }}>
            {label}
          </span>

          {/* Bottom-left caption */}
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
