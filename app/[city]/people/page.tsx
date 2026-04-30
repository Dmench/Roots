'use client'
import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getCity, STAGES, LANGUAGES } from '@/lib/data/cities'
import { cn } from '@/lib/utils'
import type { Stage, SituationTag, Spot } from '@/lib/types'
import { SPOT_CATEGORIES } from '@/lib/types'

interface Member {
  id: string
  displayName: string | null
  neighborhood: string | null
  stage: Stage | null
  situations: SituationTag[]
  languages: string[]
  arrivalDate: string | null
  spots: Spot[]
}

function daysInCity(d?: string | null): number | null {
  if (!d) return null
  return Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000))
}

function stageLabel(s: Stage | null): string {
  return STAGES.find(st => st.id === s)?.label ?? ''
}

const STAGE_COLORS: Record<Stage, { bg: string; text: string }> = {
  planning:     { bg: 'rgba(71,68,200,0.12)',  text: '#6865CC' },
  just_arrived: { bg: 'rgba(250,180,0,0.15)',  text: '#B88A00' },
  settling:     { bg: 'rgba(56,192,240,0.15)', text: '#1A8FAD' },
  settled:      { bg: 'rgba(16,185,129,0.15)', text: '#0E9B6B' },
}

export default function PeoplePage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = use(params)
  const city = getCity(cityId)

  const [members,  setMembers]  = useState<Member[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<Stage | 'all'>('all')

  useEffect(() => {
    if (!supabase || !city) { setLoading(false); return }

    supabase
      .from('profiles')
      .select('id, display_name, neighborhood, stage, situations, languages, arrival_date, spots')
      .eq('city_id', cityId)
      .eq('show_in_directory', true)
      .order('arrival_date', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('[people]', error.message); setLoading(false); return }
        const mapped: Member[] = (data ?? []).map(row => ({
          id:          row.id as string,
          displayName: row.display_name as string | null,
          neighborhood:row.neighborhood as string | null,
          stage:       row.stage as Stage | null,
          situations:  (row.situations as SituationTag[]) ?? [],
          languages:   (row.languages as string[]) ?? [],
          arrivalDate: row.arrival_date as string | null,
          spots:       (row.spots as Spot[]) ?? [],
        }))
        setMembers(mapped)
        setLoading(false)
      })
  }, [cityId, city])

  if (!city) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="text-stone text-sm">City not found.</p>
      </div>
    )
  }

  const stages: Array<Stage | 'all'> = ['all', 'planning', 'just_arrived', 'settling', 'settled']
  const filtered = filter === 'all' ? members : members.filter(m => m.stage === filter)

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-14">

        {/* Header */}
        <div className="mb-8" style={{ borderBottom: '2px solid #0A0A0A', paddingBottom: 16 }}>
          <Link href={`/${cityId}`}
            className="inline-flex items-center gap-1.5 text-xs hover:opacity-60 transition-opacity mb-4"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {city.name}
          </Link>
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="font-display font-black text-3xl leading-tight" style={{ color: '#0A0A0A' }}>
              Settlers in {city.name}
            </h1>
            <span className="text-sm shrink-0" style={{ color: 'rgba(10,10,10,0.3)' }}>
              {loading ? '…' : `${members.length} members`}
            </span>
          </div>
        </div>

        {/* Stage filter — underline tabs */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 mb-8">
          {stages.map(s => {
            const active = filter === s
            const colors = s !== 'all' ? STAGE_COLORS[s as Stage] : null
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'text-[10px] font-black tracking-[0.15em] uppercase pb-0.5 transition-all',
                  active ? '' : 'opacity-30 hover:opacity-60'
                )}
                style={active
                  ? { color: colors?.text ?? '#0A0A0A', borderBottom: `1px solid ${colors?.text ?? '#0A0A0A'}` }
                  : { color: '#0A0A0A' }}
              >
                {s === 'all' ? 'All' : stageLabel(s as Stage)}
              </button>
            )
          })}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="py-5 animate-pulse" style={{ borderBottom: '1px solid rgba(10,10,10,0.07)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 bg-neutral-200 shrink-0" />
                  <div className="h-3.5 bg-neutral-200 rounded w-28" />
                  <div className="h-3 bg-neutral-100 rounded w-16 ml-auto hidden sm:block" />
                </div>
                <div className="h-2.5 bg-neutral-100 rounded w-48 ml-10" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="py-20" style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}>
            <p className="text-sm font-medium mb-1.5" style={{ color: '#0A0A0A' }}>
              {filter === 'all' ? 'No members yet' : `No ${stageLabel(filter as Stage).toLowerCase()} members`}
            </p>
            <p className="text-xs mb-6" style={{ color: 'rgba(10,10,10,0.4)' }}>
              Members who opt in to the directory will appear here.
            </p>
            <Link href="/profile"
              className="text-xs font-semibold underline underline-offset-4 hover:opacity-60 transition-opacity"
              style={{ color: '#0A0A0A' }}>
              Update your visibility settings →
            </Link>
          </div>
        )}

        {/* Member list */}
        {!loading && filtered.length > 0 && (
          <div>
            {filtered.map(m => {
              const days    = daysInCity(m.arrivalDate)
              const stage   = m.stage
              const colors  = stage ? STAGE_COLORS[stage] : null
              const initial = m.displayName?.[0]?.toUpperCase() ?? '?'

              return (
                <div key={m.id}
                  className="py-5 hover:bg-neutral-50 transition-colors -mx-2 px-2"
                  style={{ borderBottom: '1px solid rgba(10,10,10,0.07)' }}>

                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-7 h-7 shrink-0 flex items-center justify-center text-xs font-black"
                      style={{ background: '#0A0A0A', color: '#FFFFFF' }}>
                      {initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name + stage */}
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold leading-tight" style={{ color: '#0A0A0A' }}>
                          {m.displayName ?? 'Settler'}
                          {m.neighborhood && (
                            <span className="ml-2 text-xs font-normal" style={{ color: 'rgba(10,10,10,0.35)' }}>
                              · {m.neighborhood}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 shrink-0">
                          {days !== null && (
                            <span className="text-[10px] hidden sm:block" style={{ color: 'rgba(10,10,10,0.25)' }}>
                              Day {days}
                            </span>
                          )}
                          {stage && colors && (
                            <span className="text-[10px] font-semibold" style={{ color: colors.text }}>
                              {stageLabel(stage)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Spots */}
                      {m.spots.length > 0 && (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                          {m.spots.map(spot => {
                            const cat = SPOT_CATEGORIES.find(c => c.id === spot.category)
                            return (
                              <span key={spot.id} className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full shrink-0" style={{ background: cat?.color ?? '#888' }} />
                                <span className="text-[11px]" style={{ color: 'rgba(10,10,10,0.55)' }}>
                                  {spot.name}
                                </span>
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Opt-in nudge */}
        {!loading && members.length > 0 && (
          <p className="text-center text-xs mt-10" style={{ color: 'rgba(10,10,10,0.3)' }}>
            Not seeing yourself?{' '}
            <Link href="/profile" className="underline underline-offset-2 hover:opacity-60 transition-opacity">
              Check your profile visibility settings.
            </Link>
          </p>
        )}

      </div>
    </div>
  )
}
