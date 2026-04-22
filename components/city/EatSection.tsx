'use client'
import { useState } from 'react'
import type { Venue } from '@/lib/data/venues'
import type { RedditPost } from '@/lib/data/reddit'

type Filter = 'all' | 'restaurant' | 'bar' | 'cafe'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',        label: 'All'         },
  { id: 'restaurant', label: 'Restaurants' },
  { id: 'bar',        label: 'Bars & Pubs' },
  { id: 'cafe',       label: 'Cafés'       },
]

// Per-type card header palette
const TYPE_PALETTE: Record<string, { bg: string; accent: string; label: string }> = {
  restaurant: { bg: '#FAF0EB', accent: '#E8612A', label: 'Restaurant' },
  bar:        { bg: '#ECEDF8', accent: '#4744C8', label: 'Bar'        },
  cafe:       { bg: '#FDF8E6', accent: '#C49000', label: 'Café'       },
  other:      { bg: '#F0F0EE', accent: '#252450', label: 'Venue'      },
}

interface Props {
  venues: Venue[]
  reddit: RedditPost[]
  cityId: string
}

function PartnerCard({ venue }: { venue: Venue }) {
  const palette = TYPE_PALETTE[venue.broadType] ?? TYPE_PALETTE.other
  return (
    <div className="rounded-xl overflow-hidden mb-12"
      style={{ background: '#0F0E1E', border: '1px solid rgba(255,255,255,0.05)' }}>

      {/* Visual header */}
      <div className="relative overflow-hidden flex items-end px-6 pt-6 pb-4"
        style={{ background: '#17162B', minHeight: 120 }}>
        {/* Big ambient initial */}
        <span className="absolute -right-2 -top-4 font-display font-black select-none pointer-events-none leading-none"
          style={{ fontSize: '9rem', color: 'rgba(255,255,255,0.04)', lineHeight: 1 }}>
          {venue.name.charAt(0)}
        </span>
        <div className="relative z-10">
          <span className="text-[8px] font-black tracking-[0.3em] uppercase"
            style={{ color: palette.accent }}>
            {venue.dealTag ?? 'Partner Venue'} · Exclusive deal
          </span>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4">
        {/* Name */}
        <h3 className="font-display font-black leading-tight mb-2"
          style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: '#F5F4F0', letterSpacing: '-0.02em' }}>
          {venue.name}
        </h3>

        {/* Category + location */}
        <p className="text-xs mb-5" style={{ color: 'rgba(245,244,240,0.38)' }}>
          {venue.category}
          {venue.openingHours ? ` · ${venue.openingHours.split(';')[0]}` : ''}
        </p>

        {/* Deal */}
        {venue.deal && (
          <p className="text-sm mb-6 leading-relaxed max-w-md"
            style={{ color: 'rgba(245,244,240,0.75)', fontStyle: 'italic' }}>
            "{venue.deal}"
          </p>
        )}

        {/* CTA */}
        <div className="flex items-center gap-3 flex-wrap">
          {venue.website && (
            <a href={venue.website} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: palette.accent, color: '#fff' }}>
              Visit ↗
            </a>
          )}
          <span className="text-[10px] font-semibold" style={{ color: 'rgba(245,244,240,0.25)' }}>
            QR redemption coming soon
          </span>
        </div>
      </div>
    </div>
  )
}

function VenueCard({ venue }: { venue: Venue }) {
  const palette = TYPE_PALETTE[venue.broadType] ?? TYPE_PALETTE.other
  const initial = venue.name.charAt(0).toUpperCase()

  return (
    <div className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>

      {/* Visual header */}
      <div className="relative overflow-hidden shrink-0"
        style={{ background: palette.bg, height: 88 }}>
        {/* Ambient large initial */}
        <span className="absolute -right-3 -bottom-4 font-display font-black select-none pointer-events-none leading-none"
          style={{ fontSize: '7rem', color: palette.accent, opacity: 0.12, lineHeight: 1 }}>
          {initial}
        </span>
        {/* Category pill */}
        <span className="absolute top-3 left-3 text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded-md"
          style={{ background: `${palette.accent}18`, color: palette.accent }}>
          {venue.category}
        </span>
        {/* Website arrow */}
        {venue.website && (
          <span className="absolute top-3 right-3 text-[10px]"
            style={{ color: `${palette.accent}60` }}>
            ↗
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="px-4 py-4 flex flex-col flex-1">
        {venue.website ? (
          <a href={venue.website} target="_blank" rel="noopener noreferrer"
            className="font-bold text-sm leading-snug hover:opacity-60 transition-opacity mb-1"
            style={{ color: '#0F0E1E' }}>
            {venue.name}
          </a>
        ) : (
          <p className="font-bold text-sm leading-snug mb-1" style={{ color: '#0F0E1E' }}>
            {venue.name}
          </p>
        )}

        {(venue.neighborhood || venue.address) && (
          <p className="text-[10px] mt-auto pt-3" style={{ color: 'rgba(15,14,30,0.35)' }}>
            {[venue.neighborhood, venue.address].filter(Boolean).join(' · ')}
          </p>
        )}

        {venue.openingHours && (
          <p className="text-[9px] mt-1 truncate" style={{ color: 'rgba(15,14,30,0.25)' }}>
            {venue.openingHours}
          </p>
        )}
      </div>
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
      {/* Partner hero */}
      {featured && <PartnerCard venue={featured} />}

      {/* Filter tabs */}
      <div className="flex items-center gap-6 mb-8"
        style={{ borderBottom: '1px solid rgba(15,14,30,0.08)' }}>
        {FILTERS.map(f => {
          const count  = f.id === 'all' ? regular.length : regular.filter(v => v.broadType === f.id).length
          const active = filter === f.id
          if (count === 0 && f.id !== 'all') return null
          return (
            <button key={f.id}
              onClick={() => setFilter(f.id)}
              className="relative pb-3 text-[10px] font-black tracking-widest uppercase transition-colors"
              style={{ color: active ? '#0F0E1E' : 'rgba(15,14,30,0.3)' }}>
              {f.label}
              <span className="ml-1.5 font-medium" style={{ color: 'rgba(15,14,30,0.25)' }}>
                {count}
              </span>
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
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

      {/* Card grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-20">
          {filtered.map(venue => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}

      {/* Community voices */}
      {foodPosts.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px" style={{ background: 'rgba(15,14,30,0.1)' }} />
            <span className="text-[9px] font-black tracking-[0.28em] uppercase shrink-0"
              style={{ color: 'rgba(15,14,30,0.35)' }}>
              What the community says
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
                    <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: '#0F0E1E' }}>
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
