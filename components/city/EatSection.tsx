'use client'
import { useState } from 'react'
import type { Venue } from '@/lib/data/venues'
import type { RedditPost } from '@/lib/data/reddit'

type Filter = 'all' | 'restaurant' | 'bar' | 'cafe'

const FILTER_TABS: { id: Filter; label: string; color: string }[] = [
  { id: 'all',        label: 'All',         color: '#252450' },
  { id: 'restaurant', label: 'Restaurants', color: '#E8612A' },
  { id: 'bar',        label: 'Bars',        color: '#4744C8' },
  { id: 'cafe',       label: 'Cafés',       color: '#FAB400' },
]

function PriceTag({ price }: { price: number }) {
  return (
    <span className="text-[9px] font-black tracking-wide" style={{ color: 'rgba(37,36,80,0.4)' }}>
      {'$'.repeat(price)}<span style={{ opacity: 0.2 }}>{'$'.repeat(4 - price)}</span>
    </span>
  )
}

function RatingBadge({ rating }: { rating: number }) {
  const color = rating >= 9 ? '#10B981' : rating >= 8 ? '#FAB400' : rating >= 7 ? '#38C0F0' : 'rgba(37,36,80,0.3)'
  return (
    <span className="text-xs font-black tabular-nums" style={{ color }}>
      {rating.toFixed(1)}
    </span>
  )
}

interface Props {
  venues:    Venue[]
  reddit:    RedditPost[]
  cityId:    string
}

export default function EatSection({ venues, reddit, cityId }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = filter === 'all'
    ? venues
    : venues.filter(v => v.broadType === filter)

  // Food-relevant Reddit posts
  const FOOD_KW = ['restaurant', 'food', 'eat', 'bar', 'drink', 'coffee', 'brunch', 'lunch', 'dinner', 'café', 'cafe', 'recommend', 'pizza', 'burger', 'vegan', 'beer', 'frites', 'belgian', 'hidden gem', 'best place', 'where to', 'sushi', 'wine', 'brasserie', 'bistro']
  const foodPosts = reddit.filter(p =>
    FOOD_KW.some(kw => p.title.toLowerCase().includes(kw))
  ).slice(0, 6)

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap mb-8">
        {FILTER_TABS.map(tab => {
          const count  = tab.id === 'all' ? venues.length : venues.filter(v => v.broadType === tab.id).length
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

      {/* No venues state — show if API key not configured */}
      {venues.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-sm font-medium" style={{ color: 'rgba(37,36,80,0.35)' }}>
            Venue data coming soon.
          </p>
          <p className="text-xs mt-2" style={{ color: 'rgba(37,36,80,0.2)' }}>
            Below — what the {cityId} community is saying.
          </p>
        </div>
      )}

      {/* Venue grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-16">
          {filtered.map(venue => (
            <div
              key={venue.id}
              className="bg-white rounded-2xl overflow-hidden flex flex-col"
              style={{ border: '1px solid rgba(37,36,80,0.07)' }}
            >
              {/* Photo */}
              {venue.photo ? (
                <div className="w-full h-36 overflow-hidden bg-parchment shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={venue.photo}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
                  />
                </div>
              ) : (
                <div className="w-full h-2 shrink-0"
                  style={{ background: FILTER_TABS.find(t => t.id === venue.broadType)?.color ?? '#252450' }} />
              )}

              <div className="px-4 py-4 flex flex-col flex-1">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-bold leading-snug" style={{ color: '#0F0E1E' }}>
                    {venue.name}
                  </p>
                  {venue.rating && <RatingBadge rating={venue.rating} />}
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-black tracking-wide uppercase px-2 py-0.5 rounded-sm"
                    style={{
                      background: `${FILTER_TABS.find(t => t.id === venue.broadType)?.color ?? '#252450'}12`,
                      color: FILTER_TABS.find(t => t.id === venue.broadType)?.color ?? '#252450',
                    }}>
                    {venue.category}
                  </span>
                  {venue.price && <PriceTag price={venue.price} />}
                </div>

                {/* Neighborhood */}
                {venue.neighborhood && (
                  <p className="text-[10px] mb-2" style={{ color: 'rgba(37,36,80,0.4)' }}>
                    {venue.neighborhood}
                    {venue.address && ` · ${venue.address}`}
                  </p>
                )}

                {/* Community tip */}
                {venue.tip && (
                  <p className="text-[10px] leading-snug mt-auto pt-3 italic line-clamp-2"
                    style={{ color: 'rgba(37,36,80,0.5)', borderTop: '1px solid rgba(37,36,80,0.06)' }}>
                    &ldquo;{venue.tip}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
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
            {foodPosts.map((post, i) => {
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
