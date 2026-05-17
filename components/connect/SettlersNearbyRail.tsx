'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Stage } from '@/lib/types'

interface Settler {
  id:           string
  displayName:  string | null
  neighborhood: string | null
  stage:        Stage | null
}

interface Props {
  cityId:       string
  cityName:     string
  /** Viewer's neighbourhood, used to bias the avatar selection */
  viewerHood?:  string
  /** Viewer's stage, used to bias the avatar selection */
  viewerStage?: Stage
}

const STAGE_COLORS: Record<Stage, string> = {
  planning:     '#6865CC',
  just_arrived: '#B88A00',
  settling:     '#1A8FAD',
  settled:      '#0E9B6B',
}

function firstInitial(name: string | null): string {
  if (!name) return '·'
  const c = name.trim().charAt(0)
  return c ? c.toUpperCase() : '·'
}

// Settlers Nearby — a thin rail of 3 real avatars + a count, shown on
// /people above the IntroLane + directory list. Honest at 10-user scale
// because everything rendered is real `profiles` data
// (show_in_directory = true). No fake presence indicators, no inflated
// counts. If we can't find ≥1 settler, the rail self-hides.
export function SettlersNearbyRail({ cityId, cityName, viewerHood, viewerStage }: Props) {
  const [settlers, setSettlers] = useState<Settler[]>([])
  const [total, setTotal] = useState<number>(0)

  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    // Pull up to 24 directory-visible settlers, then bias the top 3 by
    // hood-match → stage-match → other. Single round-trip.
    sb.from('profiles')
      .select('id, display_name, neighborhood, stage', { count: 'exact' })
      .eq('city_id', cityId)
      .eq('show_in_directory', true)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(24)
      .then(({ data, count, error }) => {
        if (error || !data) return
        const all: Settler[] = data.map(r => ({
          id:           r.id as string,
          displayName:  (r.display_name as string | null) ?? null,
          neighborhood: (r.neighborhood as string | null) ?? null,
          stage:        ((r.stage as string | null) ?? null) as Stage | null,
        }))
        const score = (s: Settler) => {
          let n = 0
          if (viewerHood && s.neighborhood === viewerHood) n += 2
          if (viewerStage && s.stage === viewerStage) n += 1
          return n
        }
        const ranked = [...all].sort((a, b) => score(b) - score(a))
        setSettlers(ranked.slice(0, 3))
        setTotal(count ?? all.length)
      })
  }, [cityId, viewerHood, viewerStage])

  if (settlers.length === 0) return null

  // Copy is dynamic: prefer a hood-anchored line when ≥2 hood matches,
  // otherwise fall back to city-wide.
  const hoodMatches = viewerHood
    ? settlers.filter(s => s.neighborhood === viewerHood).length
    : 0
  const hoodShort = viewerHood ? viewerHood.split(' / ')[0] : null

  const copy = hoodMatches >= 2 && hoodShort
    ? `You and ${total - 1} others new to ${hoodShort}.`
    : total > 1
      ? `${total} settlers active in ${cityName} this week.`
      : `${total} settler active in ${cityName} this week.`

  return (
    <section className="mb-8 flex items-center gap-4 px-5 py-4"
      style={{ background: '#FAFAF7', border: '1px solid rgba(10,10,10,0.08)' }}>
      {/* Avatar stack */}
      <div className="flex shrink-0 -space-x-2">
        {settlers.map(s => {
          const ring = s.stage ? STAGE_COLORS[s.stage] : 'rgba(10,10,10,0.2)'
          return (
            <Link key={s.id} href={`/settlers/${s.id}`}
              className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-[12px] font-black hover:scale-105 transition-transform"
              style={{
                background: '#FFFFFF',
                color: ring,
                border: `2px solid ${ring}`,
              }}
              title={s.displayName ?? 'Settler'}>
              {firstInitial(s.displayName)}
            </Link>
          )
        })}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-0.5"
          style={{ color: 'rgba(10,10,10,0.4)' }}>
          Settlers nearby
        </p>
        <p className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>
          {copy}
        </p>
      </div>

      {/* "See all →" link removed — the rail lives on /[city]/people now,
          so a link to /people is a no-op. The full directory list is
          directly below this rail on the same page. */}
    </section>
  )
}
