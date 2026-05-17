'use client'
import { useState, useEffect } from 'react'
import { HousingPageClient } from '@/components/housing/HousingPageClient'
import { EventsPageClient } from '@/components/events/EventsPageClient'
import type { CityId } from '@/lib/types'

interface Props {
  cityId:      CityId
  cityName:    string
  initialTab:  'housing' | 'events'
}

// Combined Listings page — housing + events behind one nav slot, two
// tabs. Reduces nav crowding (IA council unanimous: tabs over two slots).
// Each tab still has a deep-linkable URL via ?tab=housing|events.
export function ListingsPageClient({ cityId, cityName, initialTab }: Props) {
  const [tab, setTab] = useState<'housing' | 'events'>(initialTab)

  // Keep URL in sync so refreshes / shares land on the right tab.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (tab === 'housing') url.searchParams.delete('tab')
    else                    url.searchParams.set('tab', tab)
    window.history.replaceState(null, '', url.toString())
  }, [tab])

  const accent = tab === 'housing' ? '#FAB400' : '#E8612A'

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-10 md:py-14">
      {/* Back to hub */}
      <a href={`/${cityId}`}
        className="inline-block mb-6 text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
        style={{ color: 'rgba(10,10,10,0.45)' }}>
        ← Back to hub
      </a>

      {/* Editorial masthead */}
      <header className="mb-8 pb-6"
        style={{ borderBottom: `2px solid ${accent}` }}>
        <div className="flex items-baseline gap-3 mb-2">
          <span aria-hidden className="inline-block shrink-0 transition-colors"
            style={{ width: 10, height: 10, borderRadius: '50%', background: accent }} />
          <span className="text-[10px] font-black tracking-[0.22em] uppercase transition-colors"
            style={{ color: accent }}>
            Vol. 01 · {cityName} · Listings
          </span>
        </div>
        <h1 className="font-display font-black text-3xl md:text-5xl leading-[0.95] mb-3"
          style={{ color: '#0A0A0A', letterSpacing: '-0.02em' }}>
          Settler supply.
          <br />
          <span className="transition-colors" style={{ color: accent }}>
            {tab === 'housing' ? 'No agencies.' : 'Posted by settlers.'}
          </span>
        </h1>
        <p className="text-sm md:text-base max-w-2xl"
          style={{ color: 'rgba(10,10,10,0.6)' }}>
          {tab === 'housing'
            ? 'Rooms, studios, and wanted ads — posted by people who live here.'
            : 'Gigs, kitchen-table dinners, classes, meetups — hosted by people who live here.'}
        </p>
      </header>

      {/* Tabs — typographic + dynamic color rule */}
      <div className="flex gap-8 mb-8" style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        {(['housing', 'events'] as const).map(t => {
          const active   = tab === t
          const tColor   = t === 'housing' ? '#FAB400' : '#E8612A'
          const tLabel   = t === 'housing' ? 'Housing' : 'Events'
          return (
            <button key={t}
              onClick={() => setTab(t)}
              className="group relative text-[12px] font-black tracking-[0.22em] uppercase py-3 transition-colors"
              style={{ color: active ? tColor : 'rgba(10,10,10,0.45)' }}>
              {tLabel}
              <span aria-hidden
                className="absolute left-0 right-0 bottom-[-1px] h-[2px] origin-bottom transition-transform duration-300 ease-out"
                style={{
                  background: tColor,
                  transform: active ? 'scaleY(1) scaleX(1)' : 'scaleY(0) scaleX(0.4)',
                }} />
            </button>
          )
        })}
      </div>

      {/* Tab content — sub-component renders without its own masthead */}
      {tab === 'housing'
        ? <HousingPageClient cityId={cityId} cityName={cityName} hideMasthead />
        : <EventsPageClient  cityId={cityId} cityName={cityName} hideMasthead />}
    </div>
  )
}
