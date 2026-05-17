'use client'
import Link from 'next/link'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import { BRUSSELS_TASKS } from '@/lib/data/tasks/brussels'
import { filterTasks } from '@/lib/data/tasks'
import { getCuratedTip } from '@/lib/data/connect/curated-brussels'
import type { Stage, SituationTag, CityId } from '@/lib/types'

interface Props {
  cityId:   CityId
  cityName: string
}

const STAGE_COLOR: Record<Stage, string> = {
  planning:     '#6865CC',
  just_arrived: '#B88A00',
  settling:     '#1A8FAD',
  settled:      '#0E9B6B',
}

// Resume-state hero — for returning auth'd users, the Hub stops being a
// dashboard and becomes a "pick up where you left off" surface. Reads only
// from existing profile fields; no new infra. Self-hides for users without
// enough state to resume from (genuinely-new users see FirstWeekModule and
// Editor's Picks as their entry point).
//
// Priority order for what to surface:
//   1. Next unfinished First-Week task (stage + situation matched)
//   2. Most-recent saved tip (profile.savedTipSlugs)
//   3. Most-recent saved spot (profile.spots) — light fallback
//   4. Nothing — render null. Don't fake activity.
export function ResumeStateHero({ cityId, cityName }: Props) {
  const { user } = useAuth()
  const { profile, hydrated } = useProfile()

  if (!hydrated || !user) return null

  const stage      = (profile.stage ?? 'just_arrived') as Stage
  const situations = (profile.situations ?? []) as SituationTag[]
  const completed  = new Set(profile.completedTaskIds ?? [])
  const savedTips  = profile.savedTipSlugs ?? []

  // 1) Next unfinished task
  const filtered = filterTasks(BRUSSELS_TASKS, stage, situations)
  const ranked = [...filtered].sort((a, b) => {
    const aDone = completed.has(a.id) ? 1 : 0
    const bDone = completed.has(b.id) ? 1 : 0
    return aDone - bDone
  })
  const nextTask = ranked.find(t => !completed.has(t.id))

  // 2) Most-recent saved tip
  const savedTipSlug = savedTips[savedTips.length - 1]
  const savedTip = savedTipSlug ? getCuratedTip(savedTipSlug) : undefined

  // If we have no actionable state at all, render nothing — don't fake activity.
  if (!nextTask && !savedTip) return null

  const stageColor = STAGE_COLOR[stage]
  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 5)  return 'Late one'
    if (hour < 12) return 'Morning'
    if (hour < 18) return 'Afternoon'
    return 'Evening'
  })()

  // Prefer the next task as the lead resume action; saved tip as the
  // secondary "or read this again" affordance.
  return (
    <section className="mb-8 flex items-stretch gap-px"
      style={{ background: 'rgba(10,10,10,0.08)' }}>

      {/* Stage rail — coloured strip carrying identity */}
      <div className="shrink-0" style={{ width: 4, background: stageColor }} />

      <div className="flex-1 px-5 py-4" style={{ background: '#FFFFFF' }}>
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <p className="text-[10px] font-black tracking-[0.22em] uppercase"
            style={{ color: stageColor }}>
            {greeting}{profile.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}
          </p>
          <p className="text-[10px] font-black tracking-[0.18em] uppercase"
            style={{ color: 'rgba(10,10,10,0.35)' }}>
            {cityName}
          </p>
        </div>

        {nextTask ? (
          <div>
            <p className="text-xs mb-2" style={{ color: 'rgba(10,10,10,0.55)' }}>
              Pick up where you left off
            </p>
            <h3 className="font-display font-black text-xl md:text-2xl leading-tight mb-2"
              style={{ color: '#0A0A0A', letterSpacing: '-0.01em' }}>
              {nextTask.title}
            </h3>
            <p className="text-xs leading-snug mb-3 line-clamp-1" style={{ color: 'rgba(10,10,10,0.55)' }}>
              {nextTask.summary}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={`/${cityId}/settle/${nextTask.slug}`}
                className="inline-flex items-center justify-center px-4 py-2 text-[10px] font-black tracking-[0.18em] uppercase text-white transition-opacity hover:opacity-90"
                style={{ background: stageColor }}>
                Continue →
              </Link>
              {savedTip && (
                <Link href={`/${cityId}/tips/${savedTip.slug}`}
                  className="text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
                  style={{ color: 'rgba(10,10,10,0.45)' }}>
                  Or re-read: {savedTip.title.slice(0, 38)}{savedTip.title.length > 38 ? '…' : ''} →
                </Link>
              )}
            </div>
          </div>
        ) : savedTip ? (
          <div>
            <p className="text-xs mb-2" style={{ color: 'rgba(10,10,10,0.55)' }}>
              You saved this last
            </p>
            <h3 className="font-display font-black text-xl md:text-2xl leading-tight mb-2"
              style={{ color: '#0A0A0A', letterSpacing: '-0.01em' }}>
              {savedTip.title}
            </h3>
            <p className="text-xs leading-snug mb-3 line-clamp-1" style={{ color: 'rgba(10,10,10,0.55)' }}>
              {savedTip.body}
            </p>
            <Link href={`/${cityId}/tips/${savedTip.slug}`}
              className="inline-flex items-center justify-center px-4 py-2 text-[10px] font-black tracking-[0.18em] uppercase text-white transition-opacity hover:opacity-90"
              style={{ background: stageColor }}>
              Re-read →
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
