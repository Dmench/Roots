'use client'
import { use, useState } from 'react'
import Link from 'next/link'
import { useProfile } from '@/lib/hooks/use-profile'
import { getCity, STAGES, SITUATIONS } from '@/lib/data/cities'
import { getTasksForCity, filterTasks } from '@/lib/data/tasks'
import { cn } from '@/lib/utils'
import type { Stage, SituationTag, TaskCategory } from '@/lib/types'

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  admin: 'Admin', housing: 'Housing', money: 'Money', health: 'Health',
  transport: 'Transport', community: 'Community', work: 'Work', daily: 'Daily life',
}

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  admin:     '#3D3CAC',
  housing:   '#FDB833',
  money:     '#10B981',
  health:    '#FF3EBA',
  transport: '#00BAFF',
  community: '#10B981',
  work:      '#FDB833',
  daily:     '#8A7868',
}

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Takes effort', hard: 'Complex' }

export default function SettlePage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = use(params)
  const city = getCity(cityId)
  const { profile, hydrated, setStage, toggleSituation, toggleTaskDone } = useProfile()
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  if (!city) return null
  if (!hydrated) return <div className="max-w-4xl mx-auto px-6 py-16" />

  const allTasks      = getTasksForCity(city.id)
  const filteredTasks = filterTasks(allTasks, profile.stage as Stage | undefined, profile.situations as SituationTag[] | undefined)
  const completedIds  = profile.completedTaskIds ?? []
  const doneInView    = completedIds.filter(id => filteredTasks.some(t => t.id === id)).length

  if (!profile.stage) {
    return (
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-14 md:py-20">
        <p className="text-xs uppercase tracking-[0.25em] text-stone mb-5 font-medium">Settle · {city.name}</p>
        <h1 className="font-display font-bold text-espresso mb-3 leading-tight" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
          Where are you<br />in the journey?
        </h1>
        <p className="text-walnut/60 mb-12 max-w-md text-sm leading-relaxed">
          We&apos;ll show exactly what&apos;s relevant — nothing you don&apos;t need.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {STAGES.map((stage, i) => {
            const colors = ['#3D3CAC', '#00BAFF', '#FDB833', '#FF3EBA']
            return (
              <button
                key={stage.id}
                onClick={() => setStage(stage.id as Stage)}
                className="text-left p-7 bg-white rounded-xl border border-sand/50 hover:border-terracotta/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-espresso/6 transition-all duration-200 group"
              >
                <div className="w-8 h-1 rounded-full mb-5" style={{ background: colors[i] }} />
                <p className="text-xs text-stone mb-2 uppercase tracking-widest font-medium">{stage.months}</p>
                <h3 className="font-display font-bold text-espresso text-xl mb-1">{stage.label}</h3>
                <p className="text-walnut/55 text-sm">{stage.sublabel}</p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const currentStage = STAGES.find(s => s.id === profile.stage)

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-14 md:py-20">

      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone mb-4 font-medium">Settle · {city.name}</p>
          <h1 className="font-display font-bold text-espresso leading-tight" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            {currentStage?.label}
          </h1>
        </div>
        <button onClick={() => setStage(undefined)} className="text-xs text-stone hover:text-walnut transition-colors mt-1 shrink-0 underline underline-offset-2">
          Change stage
        </button>
      </div>

      {/* Situation tags */}
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-stone mb-4 font-medium">Your situation</p>
        <div className="flex flex-wrap gap-2">
          {SITUATIONS.map(s => {
            const active = (profile.situations ?? []).includes(s.id as SituationTag)
            return (
              <button
                key={s.id}
                onClick={() => toggleSituation(s.id as SituationTag)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 border',
                  active ? 'text-white border-transparent' : 'bg-white border-sand/60 text-walnut/70 hover:border-terracotta/30 hover:text-espresso'
                )}
                style={active ? { background: '#3D3CAC' } : {}}
              >
                {s.icon} {s.label}
              </button>
            )
          })}
        </div>
        {(profile.situations ?? []).length > 0 && (
          <p className="text-xs text-stone mt-3">{filteredTasks.length} tasks for your situation</p>
        )}
      </div>

      {/* Progress bar */}
      {filteredTasks.length > 0 && (
        <div className="mb-8 bg-white rounded-xl border border-sand/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-espresso">{doneInView} of {filteredTasks.length} done</p>
            <p className="text-sm font-bold" style={{ color: '#3D3CAC' }}>{Math.round((doneInView / filteredTasks.length) * 100)}%</p>
          </div>
          <div className="h-2 bg-ivory rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(doneInView / filteredTasks.length) * 100}%`, background: 'linear-gradient(90deg, #3D3CAC, #00BAFF)' }}
            />
          </div>
        </div>
      )}

      {/* Tasks */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-sand/50">
            <p className="text-walnut/60 mb-1">No tasks match your filters.</p>
            <p className="text-stone text-sm">Try adjusting your situation tags above.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const done     = completedIds.includes(task.id)
            const expanded = expandedTask === task.id
            return (
              <div
                key={task.id}
                className={cn(
                  'bg-white rounded-xl border transition-all duration-200',
                  done ? 'border-sand/30 opacity-55' : 'border-sand/50',
                  expanded ? 'border-terracotta/20 shadow-lg shadow-espresso/5' : ''
                )}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  <button
                    onClick={() => toggleTaskDone(task.id)}
                    aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                    className={cn(
                      'shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                      done ? 'border-transparent' : 'border-sand hover:border-gold'
                    )}
                    style={done ? { background: '#FDB833' } : {}}
                  >
                    {done && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  <button className="flex-1 min-w-0 text-left" onClick={() => setExpandedTask(expanded ? null : task.id)}>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={cn('text-sm font-medium', done ? 'line-through text-stone' : 'text-espresso')}>
                        {task.title}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: CATEGORY_COLORS[task.category] + '18', color: CATEGORY_COLORS[task.category] }}
                      >
                        {CATEGORY_LABELS[task.category]}
                      </span>
                    </div>
                    <p className="text-xs text-stone mt-0.5">{task.estimatedTime} · {DIFFICULTY_LABELS[task.difficulty]}</p>
                  </button>

                  <button onClick={() => setExpandedTask(expanded ? null : task.id)} className="shrink-0 p-1">
                    <svg
                      width="14" height="14" viewBox="0 0 14 14" fill="none"
                      className={cn('text-stone/60 transition-transform duration-200', expanded && 'rotate-180')}
                    >
                      <path d="M2.5 5l4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {expanded && (
                  <div className="px-5 pb-6 pt-1 border-t border-sand/40">
                    <p className="text-walnut/70 text-sm leading-relaxed mt-4 mb-6">{task.guide}</p>

                    {task.steps.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone mb-4 font-medium">Steps</p>
                        <ol className="space-y-4">
                          {task.steps.map((s, i) => (
                            <li key={i} className="flex gap-4">
                              <span className="shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 text-white" style={{ background: '#3D3CAC' }}>
                                {i + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-espresso/85">{s.step}</p>
                                {s.detail && <p className="text-xs text-stone mt-1 leading-relaxed">{s.detail}</p>}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {task.tip && (
                      <div className="mb-6 rounded-lg p-4" style={{ background: '#FFF5D6', borderLeft: '3px solid #FDB833' }}>
                        <p className="text-xs uppercase tracking-widest mb-1 font-semibold" style={{ color: '#E5A21F' }}>Pro tip</p>
                        <p className="text-sm text-walnut/70 leading-relaxed">{task.tip}</p>
                      </div>
                    )}

                    {task.links.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone mb-3 font-medium">Sources</p>
                        <div className="flex flex-wrap gap-2">
                          {task.links.map((link, i) => (
                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ivory rounded-lg border border-sand/60 text-xs text-walnut/70 hover:border-terracotta/30 hover:text-espresso transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{
                                background: link.type === 'official' ? '#3D3CAC' : link.type === 'affiliate' ? '#FDB833' : '#10B981'
                              }} />
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-2">
                      <button
                        onClick={() => toggleTaskDone(task.id)}
                        className={cn('text-xs font-semibold px-4 py-2 rounded-lg transition-all', done ? 'bg-ivory border border-sand/60 text-walnut/60 hover:border-walnut/30' : 'text-white hover:opacity-90')}
                        style={!done ? { background: '#FDB833' } : {}}
                      >
                        {done ? 'Mark incomplete' : 'Mark done'}
                      </button>
                      <Link href={`/${city.id}/ask?task=${task.slug}`} className="text-xs text-stone hover:text-terracotta transition-colors">
                        Ask about this →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
