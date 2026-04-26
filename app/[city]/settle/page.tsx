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

const CATEGORY_META: Record<TaskCategory, { label: string; color: string }> = {
  admin:     { label: 'Admin',      color: '#4744C8' },
  housing:   { label: 'Housing',    color: '#FAB400' },
  money:     { label: 'Money',      color: '#10B981' },
  health:    { label: 'Health',     color: '#FF3EBA' },
  transport: { label: 'Transport',  color: '#38C0F0' },
  community: { label: 'Community',  color: '#10B981' },
  work:      { label: 'Work',       color: '#FAB400' },
  daily:     { label: 'Daily life', color: '#8A7868' },
}

const STAGE_COLORS = ['#4744C8', '#38C0F0', '#FAB400', '#FF3EBA']

const DIFFICULTY: Record<string, string> = {
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
  if (authLoading || !hydrated) return <div className="min-h-screen bg-cream" />
  if (!user) return <AuthGate cityName={city.name} cityId={cityId}>{null}</AuthGate>

  const allTasks      = getTasksForCity(city.id)
  const filteredTasks = filterTasks(allTasks, profile.stage as Stage | undefined, profile.situations as SituationTag[] | undefined)
  const completedIds  = profile.completedTaskIds ?? []
  const doneCount     = completedIds.filter(id => filteredTasks.some(t => t.id === id)).length
  const pct           = filteredTasks.length > 0 ? Math.round((doneCount / filteredTasks.length) * 100) : 0
  const visibleTasks  = activeCategory === 'all' ? filteredTasks : filteredTasks.filter(t => t.category === activeCategory)
  const categories    = [...new Set(filteredTasks.map(t => t.category))] as TaskCategory[]

  /* ── Stage picker ──────────────────────────────────────────────────────── */
  if (!profile.stage) {
    return (
      <div className="min-h-screen" style={{ background: '#252450' }}>
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
            Your checklist filters to your stage — only what you actually need next.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STAGES.map((stage, i) => (
              <button
                key={stage.id}
                onClick={() => setStage(stage.id as Stage)}
                className="group text-left p-7 transition-all duration-200 hover:opacity-80"
                style={{ borderTop: `2px solid ${STAGE_COLORS[i]}` }}
              >
                <p className="text-[10px] font-black tracking-widest uppercase mb-3"
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

  /* ── Task list ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ background: '#F5F4F0', minHeight: '100vh' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '2px solid #252450' }}>
        <div className="max-w-3xl mx-auto px-6 md:px-12 pt-8 pb-6">
          <div className="flex items-end justify-between gap-6 mb-5">
            <div>
              <p className="text-[9px] font-black tracking-[0.28em] uppercase mb-2"
                style={{ color: 'rgba(37,36,80,0.3)' }}>
                Settle · {city.name}
              </p>
              <div className="flex items-baseline gap-3">
                <h1 className="font-display font-black leading-tight"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#252450' }}>
                  {currentStage.label}
                </h1>
                <button
                  onClick={() => setStage(undefined)}
                  className="text-[10px] font-bold hover:opacity-50 transition-opacity"
                  style={{ color: 'rgba(37,36,80,0.4)' }}>
                  change
                </button>
              </div>
            </div>
            {filteredTasks.length > 0 && (
              <div className="text-right shrink-0">
                <p className="font-display font-black text-3xl leading-none" style={{ color: '#252450' }}>
                  {pct}<span className="text-lg">%</span>
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(37,36,80,0.35)' }}>
                  {doneCount} of {filteredTasks.length} done
                </p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {filteredTasks.length > 0 && (
            <div className="h-0.5 w-full" style={{ background: 'rgba(37,36,80,0.1)' }}>
              <div className="h-full transition-all duration-700"
                style={{ width: `${pct}%`, background: stageColor }} />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-12 py-8">

        {/* ── Situation filter ──────────────────────────────────────────── */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2 text-xs font-semibold hover:opacity-60 transition-opacity"
            style={{ color: 'rgba(37,36,80,0.45)' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
              className={cn('transition-transform', showFilters && 'rotate-180')}>
              <path d="M1.5 3.5l3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {(profile.situations ?? []).length > 0
              ? `Personalised for your situation`
              : 'Personalise for your situation'}
          </button>

          {showFilters && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(37,36,80,0.1)' }}>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-3"
                style={{ color: 'rgba(37,36,80,0.3)' }}>
                Select all that apply
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {SITUATIONS.map(s => {
                  const active = (profile.situations ?? []).includes(s.id as SituationTag)
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSituation(s.id as SituationTag)}
                      className="flex items-center gap-2 py-1 text-sm transition-opacity hover:opacity-60"
                      style={{ color: active ? '#252450' : 'rgba(37,36,80,0.35)' }}>
                      <span
                        className="w-3 h-3 border flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          borderColor: active ? '#252450' : 'rgba(37,36,80,0.25)',
                          background: active ? '#252450' : 'transparent',
                        }}>
                        {active && (
                          <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path d="M1 2.5l1.5 1.5 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Category filter — underline tabs ─────────────────────────── */}
        {categories.length > 1 && (
          <div className="flex gap-0 overflow-x-auto mb-0 -mx-6 md:-mx-12 px-6 md:px-12"
            style={{ borderBottom: '1px solid rgba(37,36,80,0.1)' }}>
            {[{ id: 'all' as const, label: `All (${filteredTasks.length})`, color: '#252450' },
              ...categories.map(cat => ({ id: cat, label: `${CATEGORY_META[cat].label} (${filteredTasks.filter(t => t.category === cat).length})`, color: CATEGORY_META[cat].color }))
            ].map(tab => {
              const active = activeCategory === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className="shrink-0 px-3 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all"
                  style={{
                    color: active ? tab.color : 'rgba(37,36,80,0.35)',
                    borderBottomColor: active ? tab.color : 'transparent',
                    marginBottom: -1,
                  }}>
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Task list ─────────────────────────────────────────────────── */}
        {visibleTasks.length === 0 ? (
          <div className="py-16">
            <p className="text-sm" style={{ color: 'rgba(37,36,80,0.4)' }}>No tasks match your filters.</p>
            <button onClick={() => setActiveCategory('all')}
              className="text-xs font-bold mt-2 hover:opacity-60"
              style={{ color: '#4744C8' }}>
              Show all tasks →
            </button>
          </div>
        ) : (
          <div>
            {visibleTasks.map((task, idx) => {
              const done     = completedIds.includes(task.id)
              const expanded = expandedTask === task.id
              const m        = CATEGORY_META[task.category]
              const isLast   = idx === visibleTasks.length - 1

              return (
                <div key={task.id}
                  style={{ borderBottom: isLast ? 'none' : '1px solid rgba(37,36,80,0.08)' }}>

                  {/* Main row */}
                  <div className={cn('flex items-start gap-4 py-4 transition-opacity', done && 'opacity-40')}>

                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTaskDone(task.id)}
                      aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                      className="shrink-0 mt-0.5 w-5 h-5 border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: done ? m.color : 'rgba(37,36,80,0.2)',
                        background: done ? m.color : 'transparent',
                      }}>
                      {done && (
                        <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    {/* Content */}
                    <button className="flex-1 min-w-0 text-left"
                      onClick={() => setExpandedTask(expanded ? null : task.id)}>
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className={cn('text-sm font-semibold', done && 'line-through')}
                          style={{ color: '#252450' }}>
                          {task.title}
                        </span>
                        <span className="text-[9px] font-black tracking-widest uppercase"
                          style={{ color: m.color }}>
                          {m.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs" style={{ color: 'rgba(37,36,80,0.35)' }}>
                          {task.estimatedTime}
                        </span>
                        <span className="text-[9px]" style={{ color: DIFFICULTY[task.difficulty] }}>
                          {'●'}
                        </span>
                        <span className="text-[9px]" style={{ color: 'rgba(37,36,80,0.3)' }}>
                          {task.difficulty}
                        </span>
                      </div>
                    </button>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedTask(expanded ? null : task.id)}
                      className="shrink-0 mt-0.5 hover:opacity-50 transition-opacity">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                        className={cn('transition-transform duration-200', expanded && 'rotate-180')}>
                        <path d="M3 5l4 4 4-4" stroke="rgba(37,36,80,0.3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {expanded && (
                    <div className="pb-6 pl-9"
                      style={{ borderLeft: `2px solid ${m.color}`, marginLeft: '0.6rem' }}>
                      <div className="pl-4">
                        <p className="text-sm leading-relaxed mb-5"
                          style={{ color: 'rgba(37,36,80,0.65)' }}>
                          {task.guide}
                        </p>

                        {task.steps.length > 0 && (
                          <div className="mb-5">
                            <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-3"
                              style={{ color: 'rgba(37,36,80,0.3)' }}>
                              Steps
                            </p>
                            <ol className="space-y-3">
                              {task.steps.map((s, i) => (
                                <li key={i} className="flex gap-3">
                                  <span className="shrink-0 text-[10px] font-black mt-0.5 w-4"
                                    style={{ color: m.color }}>
                                    {i + 1}.
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold" style={{ color: '#252450' }}>{s.step}</p>
                                    {s.detail && (
                                      <p className="text-xs mt-0.5 leading-relaxed"
                                        style={{ color: 'rgba(37,36,80,0.5)' }}>
                                        {s.detail}
                                      </p>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {task.tip && (
                          <div className="mb-5 pl-3"
                            style={{ borderLeft: '2px solid #FAB400' }}>
                            <p className="text-[9px] font-black tracking-widest uppercase mb-1"
                              style={{ color: '#FAB400' }}>
                              Pro tip
                            </p>
                            <p className="text-sm leading-relaxed"
                              style={{ color: 'rgba(37,36,80,0.65)' }}>
                              {task.tip}
                            </p>
                          </div>
                        )}

                        {task.links.length > 0 && (
                          <div className="mb-5 flex flex-wrap gap-x-4 gap-y-1">
                            {task.links.map((link, i) => (
                              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs hover:opacity-60 transition-opacity"
                                style={{ color: '#4744C8' }}>
                                <span className="w-1 h-1 rounded-full"
                                  style={{ background: link.type === 'official' ? '#4744C8' : link.type === 'affiliate' ? '#FAB400' : '#10B981' }} />
                                {link.label} ↗
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-4">
                          <button
                            onClick={() => toggleTaskDone(task.id)}
                            className="text-xs font-bold hover:opacity-60 transition-opacity"
                            style={{ color: done ? 'rgba(37,36,80,0.4)' : m.color }}>
                            {done ? 'Mark incomplete' : 'Mark as done →'}
                          </button>
                          <Link href={`/${city.id}/ask?task=${task.slug}`}
                            className="text-xs hover:opacity-60 transition-opacity"
                            style={{ color: 'rgba(37,36,80,0.35)' }}>
                            Ask about this →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── All done ──────────────────────────────────────────────────── */}
        {filteredTasks.length > 0 && doneCount === filteredTasks.length && (
          <div className="mt-12 pt-8" style={{ borderTop: '2px solid #252450' }}>
            <p className="font-display font-black text-2xl mb-2" style={{ color: '#252450' }}>
              Stage complete.
            </p>
            <p className="text-sm mb-6" style={{ color: 'rgba(37,36,80,0.5)', maxWidth: 380 }}>
              Everything done for this stage. The city is yours.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link href={`/${city.id}`}
                className="text-sm font-bold hover:opacity-60 transition-opacity"
                style={{ color: '#252450' }}>
                Back to {city.name} →
              </Link>
              <Link href={`/${city.id}/connect`}
                className="text-sm font-bold hover:opacity-60 transition-opacity"
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
