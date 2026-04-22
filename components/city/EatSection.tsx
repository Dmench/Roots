'use client'
import { useState } from 'react'
import type { Venue } from '@/lib/data/venues'
import type { RedditPost } from '@/lib/data/reddit'

type Filter = 'all' | 'restaurant' | 'bar' | 'cafe'

const FILTER_TABS: { id: Filter; label: string; color: string }[] = [
  { id: 'all',        label: 'All',         color: '#252450' },
  { id: 'restaurant', label: 'Restaurants', color: '#E8612A' },
  { id: 'bar',        label: 'Bars & Pubs', color: '#4744C8' },
  { id: 'cafe',       label: 'Cafés',       color: '#FAB400' },
]

const TYPE_COLOR: Record<string, string> = {
  restaurant: '#E8612A',
  bar:        '#4744C8',
  cafe:       '#FAB400',
  other:      '#252450',
}

interface Props {
  venues: Venue[]
  reddit: RedditPost[]
  cityId: string
}

function PartnerCard({ venue }: { venue: Venue }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-10"
      style={{ background: '#0F0E1E', border: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[9px] font-black tracking-widest uppercase"
          style={{ color: '#E8612A' }}>
          {venue.dealTag ?? 'Partner Venue'}
        </span>
        <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-sm"
          style={{ background: '#E8612A18', color: '#E8612A' }}>
          Exclusive deal
        </span>
      </div>

      <div className="px-5 py-5">
        {/* Venue name + category */}
        <div className="flex items-start justify-between gap-4 mb-1">
          <h3 className="font-display font-black leading-tight"
            style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', color: '#F5ECD7' }}>
            {venue.name}
          </h3>
          <span className="shrink-0 text-[9px] font-black tracking-wide uppercase px-2 py-1 rounded-sm mt-1"
            style={{ background: `${TYPE_COLOR[venue.broadType]}20`, color: TYPE_COLOR[venue.broadType] }}>
            {venue.category}
          </span>
        </div>

        {/* Address */}
        {(venue.neighborhood || venue.address) && (
          <p className="text-xs mb-4" style={{ color: 'rgba(245,236,215,0.4)' }}>
            {[venue.neighborhood, venue.address].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Deal */}
        <div className="rounded-xl px-4 py-3 mb-5"
          style={{ background: 'rgba(232,97,42,0.1)', border: '1px solid rgba(232,97,42,0.2)' }}>
          <p className="text-xs font-bold" style={{ color: '#F5ECD7' }}>
            🍺 {venue.deal}
          </p>
        </div>

        {/* CTA row */}
        <div className="flex items-center gap-3 flex-wrap">
          {venue.website && (
            <a href={venue.website} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-wide px-4 py-2 rounded-full transition-opacity hover:opacity-75"
              style={{ background: '#E8612A', color: '#fff' }}>
              View venue ↗
            </a>
          )}
          <span className="text-[10px] font-bold px-4 py-2 rounded-full cursor-default"
            style={{ background: 'rgba(245,236,215,0.06)', color: 'rgba(245,236,215,0.35)' }}>
            QR redemption coming soon
          </span>
        </div>
      </div>

      {/* Opening hours footer */}
      {venue.openingHours && (
        <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[9px] truncate" style={{ color: 'rgba(245,236,215,0.25)' }}>
            {venue.openingHours}
          </p>
        </div>
      )}
    </div>
  )
}

export default function EatSection({ venues, reddit, cityId }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const featured  = venues.find(v => v.featured)
  const regular   = venues.filter(v => !v.featured)
  const filtered  = filter === 'all' ? regular : regular.filter(v => v.broadType === filter)

  const FOOD_KW = ['restaurant', 'food', 'eat', 'bar', 'drink', 'coffee', 'brunch', 'lunch', 'dinner',
    'café', 'cafe', 'recommend', 'pizza', 'burger', 'vegan', 'beer', 'frites', 'belgian',
    'hidden gem', 'best place', 'where to', 'sushi', 'wine', 'brasserie', 'bistro', 'kebab', 'thai']
  const foodPosts = reddit
    .filter(p => FOOD_KW.some(kw => p.title.toLowerCase().includes(kw)))
    .slice(0, 8)

  return (
    <div>
      {/* Partner hero card */}
      {featured && <PartnerCard venue={featured} />}

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap mb-8">
        {FILTER_TABS.map(tab => {
          const count  = tab.id === 'all' ? regular.length : regular.filter(v => v.broadType === tab.id).length
          const active = filter === tab.id
          if (count === 0 && tab.id !== 'all') return null
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-wide transition-all"
              style={active
                ? { background: tab.color, color: '#fff' }
                : { background: `${tab.color}10`, color: tab.color }}
            >
              {tab.label}
              <span className="ml-1.5 opacity-50">·{count}</span>
            </button>
          )
        })}
      </div>

      {regular.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-sm font-medium" style={{ color: 'rgba(37,36,80,0.35)' }}>
            No venues found.
          </p>
        </div>
      )}

      {/* Venue grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-16">
          {filtered.map(venue => {
            const color = TYPE_COLOR[venue.broadType]
            return (
              <div
                key={venue.id}
                className="bg-white rounded-xl flex flex-col overflow-hidden"
                style={{ border: '1px solid rgba(37,36,80,0.07)' }}
              >
                <div className="h-1 w-full shrink-0" style={{ background: color }} />
                <div className="px-4 py-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    {venue.website ? (
                      <a href={venue.website} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-bold leading-snug hover:opacity-60 transition-opacity"
                        style={{ color: '#0F0E1E' }}>
                        {venue.name} ↗
                      </a>
                    ) : (
                      <p className="text-sm font-bold leading-snug" style={{ color: '#0F0E1E' }}>
                        {venue.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-black tracking-wide uppercase px-2 py-0.5 rounded-sm"
                      style={{ background: `${color}12`, color }}>
                      {venue.category}
                    </span>
                  </div>
                  {(venue.neighborhood || venue.address) && (
                    <p className="text-[10px] mt-auto pt-2" style={{ color: 'rgba(37,36,80,0.38)' }}>
                      {[venue.neighborhood, venue.address].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {venue.openingHours && (
                    <p className="text-[9px] mt-1 truncate" style={{ color: 'rgba(37,36,80,0.28)' }}>
                      {venue.openingHours}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Community voices */}
      {foodPosts.length > 0 && (
        <section>
          <div className="flex items-center justify-between pb-3 mb-6"
            style={{ borderBottom: '2px solid #252450' }}>
            <h2 className="font-display font-black" style={{ fontSize: '1.3rem', color: '#0F0E1E' }}>
              What the community says
            </h2>
            <a href={`https://reddit.com/r/${cityId}`} target="_blank" rel="noopener noreferrer"
              className="text-[9px] font-black tracking-widest uppercase hover:opacity-50 transition-opacity"
              style={{ color: 'rgba(37,36,80,0.3)' }}>
              r/{cityId} ↗
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            {foodPosts.map((post) => {
              const diff = Math.floor(Date.now() / 1000) - post.created
              const ago  = diff < 3600 ? `${Math.floor(diff / 60)}m` : diff < 86400 ? `${Math.floor(diff / 3600)}h` : `${Math.floor(diff / 86400)}d`
              return (
                <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
                  className="group flex gap-3 py-4 hover:opacity-60 transition-opacity"
                  style={{ borderTop: '1px solid rgba(37,36,80,0.07)' }}>
                  <span className="shrink-0 text-[10px] font-black w-7 text-right pt-0.5" style={{ color: '#FF4500' }}>
                    {post.score >= 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: '#0F0E1E' }}>
                      {post.title}
                    </p>
                    <p className="text-[9px] mt-1" style={{ color: 'rgba(37,36,80,0.3)' }}>
                      {post.comments} comments · {ago}
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
