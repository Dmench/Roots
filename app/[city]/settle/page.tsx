'use client'
import { use, useState } from 'react'
import Link from 'next/link'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import { getCity, STAGES, SITUATIONS } from '@/lib/data/cities'
import AuthGate from '@/components/auth/AuthGate'
import { getTasksForCity, filterTasks } from '@/lib/data/tasks'
import { cn } from '@/lib/utils'
import type { Stage, SituationTag, TaskCategory } from '@/lib/types'

const CATEGORY_META: Record<TaskCategory, { label: string; color: string; bg: string }> = {
  admin:     { label: 'Admin',      color: '#4744C8', bg: '#4744C820' },
  housing:   { label: 'Housing',    color: '#FAB400', bg: '#FAB40020' },
  money:     { label: 'Money',      color: '#10B981', bg: '#10B98120' },
  health:    { label: 'Health',     color: '#FF3EBA', bg: '#FF3EBA20' },
  transport: { label: 'Transport',  color: '#38C0F0', bg: '#38C0F020' },
  community: { label: 'Community',  color: '#10B981', bg: '#10B98120' },
  work:      { label: 'Work',       color: '#FAB400', bg: '#FAB40020' },
  daily:     { label: 'Daily life', color: '#8A7868', bg: '#8A786820' },
}

const STAGE_COLORS = ['#4744C8', '#38C0F0', '#FAB400', '#FF3EBA']

const DIFFICULTY_DOT: Record<string, string> = {
  easy: '#10B981', medium: '#FAB400', hard: '#FF3EBA',
}

export default function SettlePage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = use(params)
  const city = getCity(cityId)
  const { profile, hydrated, setStage, toggleSituation, toggleTaskDone } = useProfile()
  const { user, loading: authLoading } = useAuth()
  const [expandedTask,   setExpandedTask]   = useState<string | null>(null)
  const [showFilters,    setShowFilters]    = useState(false)
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all')

  if (!city) return null
  if (authLoading || !hydrated) return <div className="min-h-screen" style={{ background: '#0F0E1E' }} />
  if (!user) return <AuthGate cityName={city.name} cityId={cityId}>{null}</AuthGate>

  const allTasks      = getTasksForCity(city.id)
  const filteredTasks = filterTasks(allTasks, profile.stage as Stage | undefined, profile.situations as SituationTag[] | undefined)
  const completedIds  = profile.completedTaskIds ?? []
  const doneCount     = completedIds.filter(id => filteredTasks.some(t => t.id === id)).length
  const pct           = filteredTasks.length > 0 ? Math.round((doneCount / filteredTasks.length) * 100) : 0

  const visibleTasks = activeCategory === 'all'
    ? filteredTasks
    : filteredTasks.filter(t => t.category === activeCategory)

  const categories = [...new Set(filteredTasks.map(t => t.category))] as TaskCategory[]

  // ── Stage picker ─────────────────────────────────────────────────────────
  if (!profile.stage) {
    return (
      <div className="min-h-screen" style={{ background: '#252450' }}>
        {/* Decorations */}
        <div className="fixed rounded-full pointer-events-none"
          style={{ background: '#4744C8', width: 400, height: 400, top: -160, right: -100, opacity: 0.5 }} />
        <div className="fixed rounded-full pointer-events-none"
          style={{ background: '#FF3EBA', width: 160, height: 160, bottom: 60, left: -40, opacity: 0.35 }} />

        <div className="relative max-w-2xl mx-auto px-6 md:px-10 pt-14 pb-20">
          <p className="text-[10px] font-black tracking-[0.28em] uppercase mb-8"
            style={{ color: 'rgba(245,236,215,0.3)' }}>
            Settle · {city.name}
          </p>
          <h1 className="font-display font-black leading-[0.85] mb-4"
            style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', color: '#F5ECD7' }}>
            Where are you<br />right now?
          </h1>
          <p className="text-base mb-12" style={{ color: 'rgba(245,236,215,0.5)', maxWidth: 340 }}>
            Your checklist is filtered to your stage. No irrelevant noise — only what you need next.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STAGES.map((stage, i) => (
              <button
                key={stage.id}
                onClick={() => setStage(stage.id as Stage)}
                className="group text-left p-7 rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="w-8 h-1 rounded-full mb-5 transition-all group-hover:w-12"
                  style={{ background: STAGE_COLORS[i] }} />
                <p className="text-[10px] font-black tracking-widest uppercase mb-2"
                  style={{ color: STAGE_COLORS[i] }}>
                  {stage.months}
                </p>
                <h3 className="font-display font-bold text-xl mb-1" style={{ color: '#F5ECD7' }}>
                  {stage.label}
                </h3>
                <p className="text-sm" style={{ color: 'rgba(245,236,215,0.45)' }}>
                  {stage.sublabel}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const currentStage = STAGES.find(s => s.id === profile.stage)!
  const stageColor   = STAGE_COLORS[STAGES.indexOf(currentStage)]

  // ── Task list ─────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#F8F7F4', minHeight: '100vh' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 md:px-12 pt-10 pb-10"
        style={{ background: '#F5F4F0' }}>
        <div className="absolute rounded-full pointer-events-none"
          style={{ background: stageColor, width: 200, height: 200, top: -80, right: -50, opacity: 0.5 }} />

        <div className="max-w-3xl mx-auto relative">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-3"
                style={{ color: 'rgba(37,36,80,0.3)' }}>
                Settle · {city.name}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display font-black leading-tight"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#252450' }}>
                  {currentStage.label}
                </h1>
                <button
                  onClick={() => setStage(undefined)}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-full hover:opacity-70 transition-opacity"
                  style={{ background: stageColor + '20', color: stageColor }}>
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Progress */}
          {filteredTasks.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(37,36,80,0.1)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: stageColor }} />
              </div>
              <span className="text-xs font-bold shrink-0" style={{ color: 'rgba(37,36,80,0.4)' }}>
                {doneCount}/{filteredTasks.length} done
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-12 py-8">

        {/* ── Situation filter ──────────────────────────────────────────────── */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2 text-xs font-bold hover:opacity-70 transition-opacity"
            style={{ color: 'rgba(37,36,80,0.4)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              className={cn('transition-transform', showFilters && 'rotate-180')}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {(profile.situations ?? []).length > 0
              ? `Filtered for your situation (${(profile.situations ?? []).length} selected)`
              : 'Personalise for your situation'}
          </button>

          {showFilters && (
            <div className="mt-4 p-5 rounded-2xl bg-white" style={{ border: '1px solid rgba(37,36,80,0.08)' }}>
              <p className="text-xs font-medium mb-4" style={{ color: 'rgba(37,36,80,0.4)' }}>
                Select all that apply — we'll show only what's relevant to you.
              </p>
              <div className="flex flex-wrap gap-2">
                {SITUATIONS.map(s => {
                  const active = (profile.situations ?? []).includes(s.id as SituationTag)
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSituation(s.id as SituationTag)}
                      className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                      style={active
                        ? { background: '#252450', color: '#F5ECD7' }
                        : { background: 'rgba(37,36,80,0.06)', color: 'rgba(37,36,80,0.5)' }
                      }>
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Category filter pills ─────────────────────────────────────────── */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className="shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
              style={activeCategory === 'all'
                ? { background: '#252450', color: '#F5ECD7' }
                : { background: 'rgba(37,36,80,0.06)', color: 'rgba(37,36,80,0.45)' }
              }>
              All ({filteredTasks.length})
            </button>
            {categories.map(cat => {
              const m     = CATEGORY_META[cat]
              const count = filteredTasks.filter(t => t.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
                  style={activeCategory === cat
                    ? { background: m.color, color: 'white' }
                    : { background: m.bg, color: m.color }
                  }>
                  {m.label} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* ── Task cards ───────────────────────────────────────────────────── */}
        {visibleTasks.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm mb-2" style={{ color: 'rgba(37,36,80,0.4)' }}>No tasks match your filters.</p>
            <button onClick={() => setActiveCategory('all')} className="text-xs font-bold hover:opacity-70"
              style={{ color: '#4744C8' }}>Show all tasks →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleTasks.map(task => {
              const done     = completedIds.includes(task.id)
              const expanded = expandedTask === task.id
              const m        = CATEGORY_META[task.category]

              return (
                <div key={task.id}
                  className={cn('rounded-2xl overflow-hidden transition-all duration-200', done && 'opacity-50')}
                  style={{ background: 'white', border: '1px solid rgba(37,36,80,0.07)' }}>

                  {/* Row */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Check */}
                    <button
                      onClick={() => toggleTaskDone(task.id)}
                      aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                      className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                      style={done
                        ? { background: m.color, borderColor: m.color }
                        : { borderColor: 'rgba(37,36,80,0.15)' }
                      }>
                      {done && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    {/* Content */}
                    <button className="flex-1 min-w-0 text-left" onClick={() => setExpandedTask(expanded ? null : task.id)}>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={cn('text-sm font-semibold', done ? 'line-through' : '')}
                          style={{ color: done ? 'rgba(37,36,80,0.35)' : '#252450' }}>
                          {task.title}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: m.bg, color: m.color }}>
                          {m.label.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs" style={{ color: 'rgba(37,36,80,0.35)' }}>
                          {task.estimatedTime}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: DIFFICULTY_DOT[task.difficulty] }} />
                      </div>
                    </button>

                    {/* Chevron */}
                    <button onClick={() => setExpandedTask(expanded ? null : task.id)}
                      className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-sand/30">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                        className={cn('transition-transform duration-200', expanded && 'rotate-180')}>
                        <path d="M3 5l4 4 4-4" stroke="rgba(37,36,80,0.35)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded */}
                  {expanded && (
                    <div className="px-5 pb-6 border-t" style={{ borderColor: 'rgba(37,36,80,0.06)' }}>
                      <p className="text-sm leading-relaxed mt-5 mb-5"
                        style={{ color: 'rgba(37,36,80,0.65)' }}>
                        {task.guide}
                      </p>

                      {task.steps.length > 0 && (
                        <div className="mb-6">
                          <p className="text-[10px] font-black tracking-widest uppercase mb-4"
                            style={{ color: 'rgba(37,36,80,0.3)' }}>Steps</p>
                          <ol className="space-y-4">
                            {task.steps.map((s, i) => (
                              <li key={i} className="flex gap-4">
                                <span className="shrink-0 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center text-white"
                                  style={{ background: m.color }}>
                                  {i + 1}
                                </span>
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: '#252450' }}>{s.step}</p>
                                  {s.detail && <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(37,36,80,0.5)' }}>{s.detail}</p>}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {task.tip && (
                        <div className="mb-6 rounded-xl p-4"
                          style={{ background: '#FAB40015', borderLeft: `3px solid #FAB400` }}>
                          <p className="text-[10px] font-black tracking-widest uppercase mb-1"
                            style={{ color: '#FAB400' }}>Pro tip</p>
                          <p className="text-sm leading-relaxed" style={{ color: 'rgba(37,36,80,0.65)' }}>{task.tip}</p>
                        </div>
                      )}

                      {task.links.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-2">
                          {task.links.map((link, i) => (
                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-70"
                              style={{ background: 'rgba(37,36,80,0.06)', color: 'rgba(37,36,80,0.6)' }}>
                              <span className="w-1.5 h-1.5 rounded-full"
                                style={{ background: link.type === 'official' ? '#4744C8' : link.type === 'affiliate' ? '#FAB400' : '#10B981' }} />
                              {link.label}
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleTaskDone(task.id)}
                          className="px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-90"
                          style={done
                            ? { background: 'rgba(37,36,80,0.07)', color: 'rgba(37,36,80,0.5)' }
                            : { background: m.color, color: 'white' }
                          }>
                          {done ? 'Mark incomplete' : 'Mark done ✓'}
                        </button>
                        <Link href={`/${city.id}/ask?task=${task.slug}`}
                          className="text-xs font-medium hover:opacity-70 transition-opacity"
                          style={{ color: '#4744C8' }}>
                          Ask about this →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* All done state */}
        {filteredTasks.length > 0 && doneCount === filteredTasks.length && (
          <div className="mt-8 p-8 rounded-2xl text-center"
            style={{ background: '#4744C810', border: '1px solid #4744C820' }}>
            <p className="font-display font-black text-2xl mb-2" style={{ color: '#4744C8' }}>
              Stage complete.
            </p>
            <p className="text-sm mb-5" style={{ color: 'rgba(37,36,80,0.55)' }}>
              Everything done for this stage. The city is yours — explore what&apos;s on or connect with people going through the same thing.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={`/${city.id}`}
                className="inline-flex px-6 py-3 rounded-full text-sm font-bold text-white hover:opacity-90 transition-opacity"
                style={{ background: '#252450' }}>
                Back to {city.name} →
              </Link>
              <Link href={`/${city.id}/connect`}
                className="inline-flex px-6 py-3 rounded-full text-sm font-bold hover:opacity-70 transition-opacity"
                style={{ color: '#4744C8' }}>
                Community →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
