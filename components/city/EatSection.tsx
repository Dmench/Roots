'use client'
import { useState } from 'react'
import type { Venue } from '@/lib/data/venues'
import type { RedditPost } from '@/lib/data/reddit'

type Filter = 'all' | 'restaurant' | 'bar' | 'cafe'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',         label: 'All'         },
  { id: 'restaurant',  label: 'Restaurants' },
  { id: 'bar',         label: 'Bars & Pubs' },
  { id: 'cafe',        label: 'Cafés'       },
]

const TYPE_LABEL: Record<string, string> = {
  restaurant: 'Restaurant',
  bar:        'Bar',
  cafe:       'Café',
  other:      'Venue',
}

interface Props {
  venues: Venue[]
  reddit: RedditPost[]
  cityId: string
}

function PartnerFeature({ venue }: { venue: Venue }) {
  return (
    <div className="mb-16">
      {/* Rule + label */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px" style={{ background: '#0F0E1E' }} />
        <span className="text-[9px] font-black tracking-[0.3em] uppercase shrink-0"
          style={{ color: '#0F0E1E' }}>
          {venue.dealTag ?? 'Partner Venue'}
        </span>
        <div className="flex-1 h-px" style={{ background: '#0F0E1E' }} />
      </div>

      {/* Venue name */}
      <h2 className="font-display font-black leading-none mb-3"
        style={{ fontSize: 'clamp(2.8rem, 9vw, 5.5rem)', color: '#0F0E1E', letterSpacing: '-0.02em' }}>
        {venue.name}
      </h2>

      {/* Category + hours on one line */}
      <p className="text-xs mb-6" style={{ color: 'rgba(15,14,30,0.4)' }}>
        {venue.category}
        {venue.openingHours ? ` · ${venue.openingHours}` : ''}
      </p>

      {/* The deal — set as body copy, no box */}
      {venue.deal && (
        <p className="text-base mb-6 max-w-lg"
          style={{ color: '#0F0E1E', fontStyle: 'italic', lineHeight: 1.55 }}>
          "{venue.deal}"
        </p>
      )}

      {/* Link */}
      {venue.website && (
        <a href={venue.website} target="_blank" rel="noopener noreferrer"
          className="link-hover text-[10px] font-black tracking-widest uppercase"
          style={{ color: '#0F0E1E' }}>
          Visit {venue.name} ↗
        </a>
      )}

      {/* Bottom rule */}
      <div className="mt-8 h-px" style={{ background: 'rgba(15,14,30,0.1)' }} />
    </div>
  )
}

export default function EatSection({ venues, reddit, cityId }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const featured = venues.find(v => v.featured)
  const regular  = venues.filter(v => !v.featured)
  const filtered = filter === 'all' ? regular : regular.filter(v => v.broadType === filter)

  const FOOD_KW = ['restaurant', 'food', 'eat', 'bar', 'drink', 'coffee', 'brunch', 'lunch', 'dinner',
    'café', 'cafe', 'recommend', 'pizza', 'burger', 'vegan', 'beer', 'frites', 'belgian',
    'hidden gem', 'best place', 'where to', 'sushi', 'wine', 'brasserie', 'bistro', 'kebab', 'thai']
  const foodPosts = reddit
    .filter(p => FOOD_KW.some(kw => p.title.toLowerCase().includes(kw)))
    .slice(0, 8)

  return (
    <div>
      {/* Partner feature */}
      {featured && <PartnerFeature venue={featured} />}

      {/* Filter tabs — text with underline indicator */}
      <div className="flex items-center gap-6 mb-10"
        style={{ borderBottom: '1px solid rgba(15,14,30,0.1)' }}>
        {FILTERS.map(f => {
          const count  = f.id === 'all' ? regular.length : regular.filter(v => v.broadType === f.id).length
          const active = filter === f.id
          if (count === 0 && f.id !== 'all') return null
          return (
            <button key={f.id}
              onClick={() => setFilter(f.id)}
              className="pb-3 text-[10px] font-black tracking-widest uppercase transition-all relative"
              style={{ color: active ? '#0F0E1E' : 'rgba(15,14,30,0.3)' }}>
              {f.label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: '#0F0E1E' }} />
              )}
            </button>
          )
        })}
      </div>

      {regular.length === 0 && (
        <p className="py-20 text-center text-sm" style={{ color: 'rgba(15,14,30,0.3)' }}>
          No venues found.
        </p>
      )}

      {/* Editorial list */}
      {filtered.length > 0 && (
        <div className="mb-20">
          {filtered.map((venue, i) => (
            <div key={venue.id}
              className="group grid py-4"
              style={{
                gridTemplateColumns: '2.5rem 1fr auto',
                borderTop: '1px solid rgba(15,14,30,0.08)',
                alignItems: 'start',
              }}>
              {/* Index */}
              <span className="text-[10px] font-black pt-0.5"
                style={{ color: 'rgba(15,14,30,0.2)', fontVariantNumeric: 'tabular-nums' }}>
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Name + meta */}
              <div className="min-w-0 pr-4">
                {venue.website ? (
                  <a href={venue.website} target="_blank" rel="noopener noreferrer"
                    className="link-hover font-bold text-sm leading-snug"
                    style={{ color: '#0F0E1E' }}>
                    {venue.name}
                  </a>
                ) : (
                  <p className="font-bold text-sm leading-snug" style={{ color: '#0F0E1E' }}>
                    {venue.name}
                  </p>
                )}
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(15,14,30,0.38)' }}>
                  {venue.category}
                  {venue.neighborhood ? ` · ${venue.neighborhood}` : ''}
                </p>
              </div>

              {/* Hours or website arrow */}
              <div className="text-right shrink-0">
                {venue.openingHours ? (
                  <p className="text-[9px] leading-tight max-w-[160px] text-right"
                    style={{ color: 'rgba(15,14,30,0.25)' }}>
                    {venue.openingHours.split(';')[0]}
                  </p>
                ) : venue.website ? (
                  <span className="text-[10px]" style={{ color: 'rgba(15,14,30,0.2)' }}>↗</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Community voices */}
      {foodPosts.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px" style={{ background: 'rgba(15,14,30,0.1)' }} />
            <span className="text-[9px] font-black tracking-[0.3em] uppercase shrink-0"
              style={{ color: 'rgba(15,14,30,0.4)' }}>
              Community
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(15,14,30,0.1)' }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
            {foodPosts.map((post) => {
              const diff = Math.floor(Date.now() / 1000) - post.created
              const ago  = diff < 3600 ? `${Math.floor(diff / 60)}m`
                         : diff < 86400 ? `${Math.floor(diff / 3600)}h`
                         : `${Math.floor(diff / 86400)}d`
              return (
                <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
                  className="flex gap-4 py-4 hover:opacity-50 transition-opacity"
                  style={{ borderTop: '1px solid rgba(15,14,30,0.07)' }}>
                  <span className="shrink-0 text-[10px] font-black w-6 pt-0.5 text-right"
                    style={{ color: '#FF4500' }}>
                    {post.score >= 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-snug line-clamp-2"
                      style={{ color: '#0F0E1E' }}>
                      {post.title}
                    </p>
                    <p className="text-[9px] mt-1" style={{ color: 'rgba(15,14,30,0.3)' }}>
                      {post.comments} comments · {ago} · r/{cityId}
                    </p>
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
