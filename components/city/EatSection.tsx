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

const TYPE_PALETTE: Record<string, { bg: string; accent: string }> = {
  restaurant: { bg: '#FAF0EB', accent: '#E8612A' },
  bar:        { bg: '#ECEDF8', accent: '#4744C8' },
  cafe:       { bg: '#FDF8E6', accent: '#B08800' },
  other:      { bg: '#EFEFED', accent: '#252450' },
}

const TAG_LABELS: Record<string, string> = {
  'craft-beer':      'Craft beer',
  'natural-wine':    'Natural wine',
  'remote-work':     'Remote-work friendly',
  'wifi':            'Good wifi',
  'no-reservations': 'No reservations',
  'cash-only':       'Cash only',
  'late-night':      'Late night',
  'expat-favorite':  'Expat favourite',
  'locals':          'Local favourite',
  'institution':     'Institution',
  'all-day':         'All day',
  'terrace':         'Terrace',
  'groups':          'Good for groups',
}

interface Props {
  venues: Venue[]
  reddit: RedditPost[]
  cityId: string
}

function PartnerCard({ venue }: { venue: Venue }) {
  const pal = TYPE_PALETTE[venue.broadType] ?? TYPE_PALETTE.other
  return (
    <div className="rounded-2xl overflow-hidden mb-14"
      style={{ background: '#0F0E1E' }}>
      {/* Header */}
      <div className="relative px-7 pt-7 pb-5 overflow-hidden"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="absolute right-0 top-0 font-display font-black select-none pointer-events-none"
          style={{ fontSize: '11rem', color: 'rgba(255,255,255,0.03)', lineHeight: 1, transform: 'translate(8%, -10%)' }}>
          {venue.name.charAt(0)}
        </span>
        <span className="text-[9px] font-black tracking-[0.28em] uppercase"
          style={{ color: pal.accent }}>
          {venue.dealTag ?? 'Partner Venue'} · Exclusive deal
        </span>
      </div>

      <div className="px-7 pt-5 pb-7">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h3 className="font-display font-black leading-tight"
            style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: '#F5F4F0', letterSpacing: '-0.02em' }}>
            {venue.name}
          </h3>
          <span className="shrink-0 font-bold text-sm mt-1" style={{ color: pal.accent }}>
            {venue.price}
          </span>
        </div>

        <p className="text-xs mb-1" style={{ color: 'rgba(245,244,240,0.35)' }}>
          {venue.category} · {venue.neighborhood}
        </p>

        <p className="text-sm mb-5 leading-relaxed italic max-w-lg"
          style={{ color: 'rgba(245,244,240,0.65)' }}>
          "{venue.why}"
        </p>

        {venue.deal && (
          <div className="rounded-lg px-4 py-3 mb-5 inline-block"
            style={{ background: `${pal.accent}18`, border: `1px solid ${pal.accent}30` }}>
            <p className="text-xs font-semibold" style={{ color: pal.accent }}>
              {venue.deal}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {venue.website && (
            <a href={venue.website} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-lg transition-opacity hover:opacity-75"
              style={{ background: pal.accent, color: '#fff' }}>
              Visit ↗
            </a>
          )}
          {venue.openingHours && (
            <span className="text-[9px]" style={{ color: 'rgba(245,244,240,0.22)' }}>
              {venue.openingHours.split(';')[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function VenueCard({ venue }: { venue: Venue }) {
  const pal = TYPE_PALETTE[venue.broadType] ?? TYPE_PALETTE.other
  const shownTags = (venue.tags ?? [])
    .filter(t => TAG_LABELS[t])
    .slice(0, 2)

  return (
    <div className="rounded-xl overflow-hidden flex flex-col bg-white"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}>

      {/* Coloured header band */}
      <div className="relative overflow-hidden shrink-0 px-4 pt-4 pb-3 flex flex-col justify-end"
        style={{ background: pal.bg, minHeight: 80 }}>
        {/* Ambient initial */}
        <span className="absolute font-display font-black select-none pointer-events-none leading-none"
          style={{
            fontSize: '5.5rem', color: pal.accent, opacity: 0.13,
            right: '-4px', bottom: '-14px', lineHeight: 1,
          }}>
          {venue.name.charAt(0)}
        </span>
        {/* Neighbourhood + price */}
        <div className="relative flex items-end justify-between gap-2">
          <span className="text-[9px] font-black tracking-widest uppercase"
            style={{ color: pal.accent }}>
            {venue.neighborhood}
          </span>
          <span className="text-xs font-bold shrink-0" style={{ color: pal.accent }}>
            {venue.price}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1">
        {/* Name */}
        {venue.website ? (
          <a href={venue.website} target="_blank" rel="noopener noreferrer"
            className="font-bold text-sm leading-snug hover:opacity-60 transition-opacity mb-1"
            style={{ color: '#0F0E1E' }}>
            {venue.name} ↗
          </a>
        ) : (
          <p className="font-bold text-sm leading-snug mb-1" style={{ color: '#0F0E1E' }}>
            {venue.name}
          </p>
        )}

        {/* Category */}
        <p className="text-[10px] mb-2" style={{ color: 'rgba(15,14,30,0.38)' }}>
          {venue.category}
        </p>

        {/* Vibe — the key editorial line */}
        <p className="text-[11px] leading-snug italic flex-1"
          style={{ color: 'rgba(15,14,30,0.55)' }}>
          {venue.vibe}
        </p>

        {/* Tags */}
        {shownTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {shownTags.map(t => (
              <span key={t}
                className="text-[8px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded"
                style={{ background: `${pal.accent}10`, color: pal.accent }}>
                {TAG_LABELS[t]}
              </span>
            ))}
          </div>
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
      {featured && <PartnerCard venue={featured} />}

      {/* Filter tabs */}
      <div className="flex items-center gap-7 mb-8"
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
              <span className="ml-1.5 font-medium" style={{ opacity: 0.4 }}>{count}</span>
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: '#0F0E1E' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Cards */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-20">
          {filtered.map(v => <VenueCard key={v.id} venue={v} />)}
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
