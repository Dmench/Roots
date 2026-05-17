'use client'
import { isSafeUrl } from '@/lib/listings/quality'
import type { Post } from '@/lib/types'

interface Props {
  post:        Post
  onReport?:   () => void
  reported?:   boolean
}

function formatEventDate(iso?: string): { dayShort: string; dateNum: string; time: string; rel: string } {
  if (!iso) return { dayShort: '', dateNum: '', time: '', rel: '' }
  const d   = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / 86_400_000)
  const dayShort = d.toLocaleDateString('en-GB', { weekday: 'short' })
  const dateNum  = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const time     = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  let rel = ''
  if (diffMs < 0) rel = 'Past'
  else if (diffDays === 0) rel = 'Today'
  else if (diffDays === 1) rel = 'Tomorrow'
  else if (diffDays < 7)   rel = `In ${diffDays} days`
  else                     rel = ''
  return { dayShort, dateNum, time, rel }
}

// Event listing card. Date-led ("FRI · 4 JUL") with venue + optional photo.
// Editorial register; not an Eventbrite row.
export function EventCard({ post, onReport, reported }: Props) {
  const accent = '#E8612A'
  const fmt = formatEventDate(post.eventDate)
  const safeEventUrl = post.eventUrl && isSafeUrl(post.eventUrl) ? post.eventUrl : null
  const safePhotoUrl = post.photoUrl && isSafeUrl(post.photoUrl) ? post.photoUrl : null

  return (
    <article className="flex flex-col h-full"
      style={{ background: '#FFFFFF', border: `1px solid rgba(232,97,42,0.3)` }}>
      <div style={{ height: 4, background: accent }} />

      {safePhotoUrl && (
        <div className="relative w-full" style={{ height: 200, background: '#FAF6EE' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={safePhotoUrl}
            alt={post.title ?? 'Event poster'}
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        </div>
      )}

      <div className="px-5 pt-4 pb-4 flex flex-col flex-1">
        {/* Date stamp — typographic date-block; date dominates as headline */}
        <div className="flex items-start gap-4 mb-3">
          <div className="shrink-0 flex flex-col leading-none"
            style={{ color: accent, fontFamily: 'var(--font-display)' }}>
            <span className="text-[9px] font-black tracking-[0.22em] uppercase">
              {fmt.dayShort}
            </span>
            <span className="font-black text-3xl md:text-4xl mt-0.5"
              style={{ letterSpacing: '-0.02em' }}>
              {fmt.dateNum}
            </span>
          </div>
          {(fmt.time || fmt.rel) && (
            <span className="text-[11px] font-bold pt-1" style={{ color: '#0A0A0A' }}>
              {fmt.time}{fmt.time && fmt.rel ? ' · ' : ''}
              <span style={{ color: accent }}>{fmt.rel}</span>
            </span>
          )}
        </div>

        {/* Title */}
        {post.title && (
          <h3 className="font-display font-black text-lg md:text-xl leading-tight mb-2"
            style={{ color: '#0A0A0A', letterSpacing: '-0.01em' }}>
            {post.title}
          </h3>
        )}

        {/* Venue + neighbourhood line */}
        {(post.eventVenue || post.neighborhood) && (
          <p className="text-xs mb-3" style={{ color: 'rgba(10,10,10,0.55)' }}>
            {post.eventVenue}{post.eventVenue && post.neighborhood ? ' · ' : ''}{post.neighborhood?.split(' / ')[0]}
          </p>
        )}

        {/* Description */}
        {post.text && (
          <p className="text-sm leading-relaxed mb-3 flex-1 line-clamp-4"
            style={{ color: 'rgba(10,10,10,0.75)' }}>
            {post.text}
          </p>
        )}

        {/* Footer — link + report-behind-overflow */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2 relative"
          style={{ borderTop: '1px solid rgba(10,10,10,0.06)' }}>
          {safeEventUrl ? (
            <a href={safeEventUrl} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
              style={{ color: accent }}>
              ↗ Details / tickets
            </a>
          ) : <span />}
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
              {reported ? 'Reported' : 'Report event'}
            </button>
          </details>
        </div>
      </div>
    </article>
  )
}
