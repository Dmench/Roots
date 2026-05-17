'use client'
import { isSafeUrl } from '@/lib/listings/quality'
import type { Post } from '@/lib/types'

interface Props {
  post:        Post
  onReport?:   () => void
  reported?:   boolean
}

// Housing listing card. Photo-led when a URL is present, otherwise a
// colour block. Renders the structured fields (title, price, dates,
// neighbourhood, type chip) in a magazine-listing format — not a
// Craigslist row.
export function HousingCard({ post, onReport, reported }: Props) {
  const isOffer = post.category === 'housing-offer'
  const typeLabel = isOffer ? 'For rent' : 'Wanted'
  const accent = '#FAB400'
  const safePhotoUrl = post.photoUrl && isSafeUrl(post.photoUrl) ? post.photoUrl : null

  return (
    <article className="flex flex-col h-full"
      style={{ background: '#FFFFFF', border: `1px solid rgba(250,180,0,0.3)` }}>
      {/* Top accent bar */}
      <div style={{ height: 4, background: accent }} />

      {/* Photo / colour block — offers only, uniform 200px height for
          grid rhythm. Editorial council: mixed 200/80 read as "broken,
          not editorial." Now either a real photo or a typographic plate
          at the same height, like Apartamento's "photo coming" device. */}
      {isOffer && (
        <div className="relative w-full" style={{ height: 200, background: '#FAF6EE' }}>
          {safePhotoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={safePhotoUrl}
                alt={post.title ?? 'Listing photo'}
                className="w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display font-black text-2xl tracking-tight"
                style={{ color: 'rgba(250,180,0,0.35)' }}>
                Photo to come
              </span>
            </div>
          )}
        </div>
      )}

      <div className="px-5 pt-4 pb-4 flex flex-col flex-1">
        {/* Type + neighbourhood — typographic eyebrow (no filled chip) */}
        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
          <span className="text-[10px] font-black tracking-[0.22em] uppercase"
            style={{ color: accent }}>
            {typeLabel}
          </span>
          {post.neighborhood && (
            <>
              <span className="text-[10px] font-black"
                style={{ color: 'rgba(10,10,10,0.25)' }}>·</span>
              <span className="text-[10px] font-black tracking-[0.18em] uppercase"
                style={{ color: 'rgba(10,10,10,0.6)' }}>
                {post.neighborhood.split(' / ')[0]}
              </span>
            </>
          )}
          <span className="text-[10px] ml-auto" style={{ color: 'rgba(10,10,10,0.3)' }}>
            {post.time}
          </span>
        </div>

        {/* Title — the headline */}
        {post.title && (
          <h3 className="font-display font-black text-lg md:text-xl leading-tight mb-2"
            style={{ color: '#0A0A0A', letterSpacing: '-0.01em' }}>
            {post.title}
          </h3>
        )}

        {/* Price + dates row */}
        {(post.price || post.dates) && (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
            {post.price && (
              <span className="text-sm font-bold" style={{ color: accent }}>
                {post.price}
              </span>
            )}
            {post.dates && (
              <span className="text-xs" style={{ color: 'rgba(10,10,10,0.55)' }}>
                {post.dates}
              </span>
            )}
          </div>
        )}

        {/* Body */}
        {post.text && (
          <p className="text-sm leading-relaxed mb-3 flex-1" style={{ color: 'rgba(10,10,10,0.75)' }}>
            {post.text}
          </p>
        )}

        {/* Footer — actions; Report moved behind ⋯ overflow (design council) */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2 relative"
          style={{ borderTop: '1px solid rgba(10,10,10,0.06)' }}>
          <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.35)' }}>
            DM the lister via their profile
          </span>
          <details className="relative">
            <summary
              className="list-none cursor-pointer text-[14px] leading-none px-1 py-1 select-none hover:opacity-100 transition-opacity"
              style={{ color: reported ? '#0E9B6B' : 'rgba(10,10,10,0.3)' }}
              title="More">
              {reported ? '✓' : '⋯'}
            </summary>
            <button onClick={onReport}
              disabled={reported}
              className="absolute right-0 mt-1 text-[10px] font-bold tracking-[0.18em] uppercase px-3 py-2 whitespace-nowrap z-10"
              style={{ background: '#FFFFFF', border: '1px solid rgba(10,10,10,0.12)',
                color: reported ? '#0E9B6B' : '#0A0A0A' }}>
              {reported ? 'Reported' : 'Report listing'}
            </button>
          </details>
        </div>
      </div>
    </article>
  )
}
