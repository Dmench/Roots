import Link from 'next/link'
import Image from 'next/image'
import type { Venue } from '@/lib/data/venues'

interface Props {
  venue:  Venue
  cityId: string
}

// Photo-led editorial moment at the top of the city hub sidebar. Pulls a
// Google Places photo via the auth-free /api/places/photo proxy (regex +
// rate-limit + same-origin referer protection). Caller is responsible for
// picking a venue with a valid photoRef — if none, render nothing (the
// fallback is handled in the parent so the layout stays consistent).
//
// Why this matters: it's the only photographic surface on the hub. The
// rest of the page is type-led. One strong image at the top anchors the
// editorial register the rest of the platform now promises.
export function VenueSpotlight({ venue, cityId }: Props) {
  if (!venue.photoRef) return null

  const label = venue.dealTag ?? 'Editor’s pick'

  return (
    <section className="mb-10">
      <Link href={`/${cityId}/eat`} className="block group">
        <div className="relative w-full overflow-hidden"
          style={{ aspectRatio: '5 / 4', background: 'rgba(10,10,10,0.05)' }}>
          <Image
            src={`/api/places/photo?ref=${encodeURIComponent(venue.photoRef)}`}
            alt={venue.name}
            fill
            sizes="400px"
            priority
            className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
          />

          {/* Bottom gradient for legibility */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.78) 100%)' }} />

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
