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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-sand/50 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-sand/60" />
                  <div className="flex-1">
                    <div className="h-3.5 bg-sand/60 rounded w-24 mb-2" />
                    <div className="h-2.5 bg-sand/40 rounded w-16" />
                  </div>
                </div>
                <div className="h-2.5 bg-sand/40 rounded w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(37,36,80,0.06)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="4" stroke="#252450" strokeWidth="1.4" strokeOpacity="0.4" />
                <path d="M3 20c0-3.3 2.7-6 6-6" stroke="#252450" strokeWidth="1.4" strokeOpacity="0.4" strokeLinecap="round" />
                <circle cx="17" cy="10" r="3" stroke="#252450" strokeWidth="1.4" strokeOpacity="0.4" />
                <path d="M14 20c0-2.8 2.2-5 4.9-5" stroke="#252450" strokeWidth="1.4" strokeOpacity="0.4" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-espresso mb-1.5">
              {filter === 'all' ? 'No members yet' : `No ${stageLabel(filter as Stage).toLowerCase()} members yet`}
            </p>
            <p className="text-xs text-walnut/50 max-w-xs mx-auto">
              Members who opt in to the directory will appear here. You can toggle visibility on your profile.
            </p>
            <Link href="/profile"
              className="inline-block mt-5 text-xs font-semibold px-4 py-2 rounded-full hover:opacity-80 transition-opacity"
              style={{ background: '#252450', color: '#fff' }}>
              Update your profile →
            </Link>
          </div>
        )}

        {/* Member grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(m => {
              const days     = daysInCity(m.arrivalDate)
              const stage    = m.stage
              const colors   = stage ? STAGE_COLORS[stage] : null
              const langFlags = LANGUAGES.filter(l => m.languages.includes(l.code)).map(l => l.flag)
              const initial  = (m.displayName ?? '?')[0].toUpperCase()

              return (
                <div key={m.id}
                  className="bg-white border border-sand/50 rounded-2xl p-5 hover:border-walnut/20 transition-colors shadow-sm group">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-display font-black shrink-0"
                      style={{ background: 'linear-gradient(135deg, #E8E7F8 0%, #F5D0EC 100%)', color: '#3D3CAC' }}
                    >
                      {initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-espresso text-sm leading-tight truncate">
                        {m.displayName ?? 'Settler'}
                      </p>
                      {m.neighborhood && (
                        <p className="text-xs text-walnut/50 mt-0.5 truncate">{m.neighborhood}</p>
                      )}
                    </div>

                    {/* Language flags */}
                    {langFlags.length > 0 && (
                      <div className="flex gap-0.5 shrink-0">
                        {langFlags.slice(0, 3).map((f, i) => (
                          <span key={i} className="text-sm leading-none">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stage + days badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {stage && colors && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: colors.bg, color: colors.text }}>
                        {stageLabel(stage)}
                      </span>
                    )}
                    {days !== null && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(37,36,80,0.05)', color: 'rgba(37,36,80,0.45)' }}>
                        Day {days}
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
