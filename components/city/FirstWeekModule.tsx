'use client'
import Link from 'next/link'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import { BRUSSELS_TASKS } from '@/lib/data/tasks/brussels'
import { LISBON_TASKS } from '@/lib/data/tasks/lisbon'
import { filterTasks } from '@/lib/data/tasks'
import type { Task, Stage, SituationTag, CityId } from '@/lib/types'

const CITY_TASKS: Record<string, Task[]> = {
  brussels: BRUSSELS_TASKS,
  lisbon:   LISBON_TASKS,
}

// Category priority for the First Week lane. Community (belonging) leads
// because it is the single biggest stay-past-winter predictor; admin sits
// second because it has hard deadlines; housing/money/health follow.
const CAT_PRIORITY: Record<string, number> = {
  community: 0,
  admin:     1,
  housing:   2,
  money:     3,
  health:    4,
  transport: 5,
  daily:     6,
  work:      7,
}

const CAT_COLOR: Record<string, string> = {
  community: '#FF3EBA',
  admin:     '#4744C8',
  housing:   '#FAB400',
  money:     '#10B981',
  health:    '#38C0F0',
  transport: '#0E9B6B',
  daily:     '#B08800',
  work:      '#252450',
}

const STAGE_HEADING: Record<Stage, { eyebrow: string; title: string; sub: string }> = {
  planning:     { eyebrow: 'Before you arrive',  title: 'Your pre-move shortlist',  sub: 'The five things worth doing before you land.' },
  just_arrived: { eyebrow: 'Your first week',    title: 'Start here',               sub: 'The five things that turn an address into a city.' },
  settling:     { eyebrow: 'Your first months',  title: 'Build the routines',       sub: 'The five things that move you from arrival to belonging.' },
  settled:      { eyebrow: 'Stay grounded',      title: 'Keep the roots',           sub: 'The handful of things long-term residents come back to.' },
}

interface Props { cityId: CityId }

export function FirstWeekModule({ cityId }: Props) {
  const { user } = useAuth()
  const { profile, hydrated } = useProfile()

  if (!hydrated || !user) return null

  const stage      = (profile.stage ?? 'just_arrived') as Stage
  const situations = (profile.situations ?? []) as SituationTag[]
  const completed  = new Set(profile.completedTaskIds ?? [])

  const allTasks   = CITY_TASKS[cityId] ?? []
  if (allTasks.length === 0) return null

  // Filter to stage + situation match, then sort by category priority
  // (community first), then by whether already completed (incomplete first).
  const filtered = filterTasks(allTasks, stage, situations)
  const ranked = [...filtered]
    .sort((a, b) => {
      const aDone = completed.has(a.id) ? 1 : 0
      const bDone = completed.has(b.id) ? 1 : 0
      if (aDone !== bDone) return aDone - bDone
      const aCat = CAT_PRIORITY[a.category] ?? 99
      const bCat = CAT_PRIORITY[b.category] ?? 99
      return aCat - bCat
    })
    .slice(0, 5)

  if (ranked.length === 0) return null

  const heading = STAGE_HEADING[stage]
  const doneCount = ranked.filter(t => completed.has(t.id)).length

  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between pb-3 mb-4"
        style={{ borderBottom: '2px solid #0A0A0A' }}>
        <div>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-1"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            {heading.eyebrow}
          </p>
          <h2 className="font-display font-black text-2xl md:text-3xl leading-tight"
            style={{ color: '#0A0A0A' }}>
            {heading.title}
          </h2>
        </div>
        <p className="text-[10px] font-black tracking-[0.18em] uppercase shrink-0"
          style={{ color: 'rgba(10,10,10,0.4)' }}>
          {doneCount}/{ranked.length}
        </p>
      </div>

      <p className="text-sm mb-5 leading-relaxed" style={{ color: 'rgba(10,10,10,0.55)' }}>
        {heading.sub}
      </p>

      <ol className="space-y-0">
        {ranked.map((task, i) => {
          const color = CAT_COLOR[task.category] ?? '#0A0A0A'
          const done  = completed.has(task.id)
          return (
            <li key={task.id}
              style={{ borderTop: i === 0 ? '1px solid rgba(10,10,10,0.08)' : 'none',
                       borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
              <Link href={`/${cityId}/settle/${task.slug}`}
                className="flex items-center gap-4 py-3.5 hover:opacity-70 transition-opacity group">
                <div className="shrink-0 w-7 flex items-center justify-center text-[10px] font-black"
                  style={{ color: done ? '#10B981' : color }}>
                  {done ? '✓' : String(i + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate"
                    style={{ color: done ? 'rgba(10,10,10,0.4)' : '#0A0A0A',
                             textDecoration: done ? 'line-through' : 'none' }}>
                    {task.title}
                  </p>
                  <p className="text-[10px] mt-0.5 line-clamp-1"
                    style={{ color: 'rgba(10,10,10,0.45)' }}>
                    {task.summary}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <span className="text-[8px] font-black tracking-[0.18em] uppercase"
                    style={{ color }}>
                    {task.category}
                  </span>
                  <span className="text-xs opacity-30 group-hover:opacity-60 transition-opacity"
                    style={{ color: '#0A0A0A' }}>→</span>
                </div>
              </Link>
            </li>
          )
        })}
      </ol>

      <div className="mt-4 flex items-center gap-3">
        <Link href={`/${cityId}/settle`}
          className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
          style={{ color: '#4744C8' }}>
          See the full checklist →
        </Link>
        <span style={{ color: 'rgba(10,10,10,0.2)' }}>·</span>
        <Link href={`/${cityId}/ask`}
          className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
          style={{ color: '#38C0F0' }}>
          Ask about any of these →
        </Link>
      </div>
    </section>
  )
}
