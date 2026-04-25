'use client'
import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getCity, STAGES, LANGUAGES } from '@/lib/data/cities'
import { Nav } from '@/components/layout/Nav'
import { cn } from '@/lib/utils'
import type { Stage, SituationTag } from '@/lib/types'

interface Member {
  id: string
  displayName: string | null
  neighborhood: string | null
  stage: Stage | null
  situations: SituationTag[]
  languages: string[]
  arrivalDate: string | null
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
      .select('id, display_name, neighborhood, stage, situations, languages, arrival_date')
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
        }))
        setMembers(mapped)
        setLoading(false)
      })
  }, [cityId, city])

  if (!city) {
    return (
      <div className="min-h-screen bg-cream">
        <Nav />
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <p className="text-stone text-sm">City not found.</p>
        </div>
      </div>
    )
  }

  const stages: Array<Stage | 'all'> = ['all', 'planning', 'just_arrived', 'settling', 'settled']
  const filtered = filter === 'all' ? members : members.filter(m => m.stage === filter)

  return (
    <div className="min-h-screen bg-cream">
      <Nav />

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-14">

        {/* Header */}
        <div className="mb-8">
          <Link href={`/${cityId}`}
            className="inline-flex items-center gap-1.5 text-xs text-stone hover:text-espresso transition-colors mb-4">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {city.name}
          </Link>
          <h1 className="font-display font-bold text-espresso text-3xl mb-1">
            Settlers in {city.name}
          </h1>
          <p className="text-sm text-walnut/60">
            {loading ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''} in the directory`}
          </p>
        </div>

        {/* Stage filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {stages.map(s => {
            const active = filter === s
            const colors = s !== 'all' ? STAGE_COLORS[s as Stage] : null
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border',
                  active
                    ? 'border-transparent text-white'
                    : 'bg-white border-sand text-stone hover:border-walnut/30 hover:text-espresso'
                )}
                style={active
                  ? colors
                    ? { background: colors.text, borderColor: colors.text }
                    : { background: '#252450' }
                  : {}}
              >
                {s === 'all' ? 'All stages' : stageLabel(s as Stage)}
              </button>
            )
          })}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="divide-y divide-sand/40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="py-4 flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-sand/60 shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 bg-sand/60 rounded w-32 mb-1.5" />
                  <div className="h-2.5 bg-sand/40 rounded w-20" />
                </div>
                <div className="h-2.5 bg-sand/40 rounded w-24 hidden sm:block" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="py-20 border-t border-sand/40">
            <p className="text-sm font-medium text-espresso mb-1.5">
              {filter === 'all' ? 'No members yet' : `No ${stageLabel(filter as Stage).toLowerCase()} members yet`}
            </p>
            <p className="text-xs text-walnut/50 mb-6">
              Members who opt in to the directory will appear here.
            </p>
            <Link href="/profile"
              className="text-xs font-semibold text-espresso underline underline-offset-4 hover:opacity-60 transition-opacity">
              Update your visibility settings →
            </Link>
          </div>
        )}

        {/* Member list */}
        {!loading && filtered.length > 0 && (
          <div className="divide-y divide-sand/30">
            {filtered.map(m => {
              const days   = daysInCity(m.arrivalDate)
              const stage  = m.stage
              const colors = stage ? STAGE_COLORS[stage] : null
              const hasName = !!m.displayName

              return (
                <div key={m.id}
                  className="py-4 flex items-center gap-4 group hover:bg-white/60 -mx-2 px-2 rounded-lg transition-colors">

                  {/* Avatar dot */}
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #E8E7F8 0%, #F0DCF5 100%)', color: '#3D3CAC' }}>
                    {hasName
                      ? m.displayName![0].toUpperCase()
                      : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="8" r="4" stroke="#3D3CAC" strokeWidth="1.8" />
                          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#3D3CAC" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      )
                    }
                  </div>

                  {/* Name + location */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-espresso leading-tight truncate">
                      {m.displayName ?? 'Anonymous settler'}
                    </p>
                    {m.neighborhood && (
                      <p className="text-xs text-walnut/45 mt-0.5">{m.neighborhood}</p>
                    )}
                  </div>

                  {/* Right: stage + days */}
                  <div className="flex items-center gap-3 shrink-0">
                    {days !== null && (
                      <span className="text-xs text-walnut/35 hidden sm:block">
                        Day {days}
                      </span>
                    )}
                    {stage && colors && (
                      <span className="text-[11px] font-medium"
                        style={{ color: colors.text }}>
                        {stageLabel(stage)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Opt-in nudge at bottom */}
        {!loading && members.length > 0 && (
          <p className="text-center text-xs text-walnut/35 mt-10">
            Not seeing yourself?{' '}
            <Link href="/profile" className="underline underline-offset-2 hover:text-espresso transition-colors">
              Check your profile visibility settings.
            </Link>
          </p>
        )}

      </div>
    </div>
  )
}
