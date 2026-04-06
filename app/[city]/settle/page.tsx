'use client'
import { use, useState } from 'react'
import Link from 'next/link'
import { useProfile } from '@/lib/hooks/use-profile'
import { getCity, STAGES, SITUATIONS } from '@/lib/data/cities'
import { getTasksForCity, filterTasks } from '@/lib/data/tasks'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { Stage, SituationTag, TaskCategory } from '@/lib/types'

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  admin:     'Admin',
  housing:   'Housing',
  money:     'Money',
  health:    'Health',
  transport: 'Transport',
  community: 'Community',
  work:      'Work',
  daily:     'Daily life',
}

const CATEGORY_VARIANTS: Record<TaskCategory, 'default' | 'terracotta' | 'sage' | 'sky' | 'coral' | 'amber' | 'stone'> = {
  admin:     'sky',
  housing:   'terracotta',
  money:     'sage',
  health:    'coral',
  transport: 'default',
  community: 'sage',
  work:      'amber',
  daily:     'default',
}

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Takes effort', hard: 'Complex' }

export default function SettlePage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = use(params)
  const city = getCity(cityId)
  const { profile, setStage, toggleSituation } = useProfile()
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  if (!city) return null

  const allTasks = getTasksForCity(city.id)
  const filteredTasks = filterTasks(
    allTasks,
    profile.stage as Stage | undefined,
    profile.situations as SituationTag[] | undefined,
  )

  const completedIds = profile.completedTaskIds ?? []

  // Stage not set — show stage selector
  if (!profile.stage) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-walnut/50 mb-4">Settle · {city.name}</p>
        <h1 className="font-display font-bold text-espresso mb-3"
          style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 0.92 }}>
          Where are you<br />in the journey?
        </h1>
        <p className="text-walnut mb-10 max-w-md">We&apos;ll show you exactly what&apos;s relevant to you — nothing you don&apos;t need.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {STAGES.map(stage => (
            <button
              key={stage.id}
              onClick={() => setStage(stage.id as Stage)}
              className="text-left bg-ivory border border-sand rounded-3xl p-7 hover:border-terracotta/40 hover:bg-white transition-all duration-300 group"
            >
              <p className="text-xs uppercase tracking-widest text-walnut/50 mb-2 font-medium">{stage.months}</p>
              <h3 className="font-display font-bold text-espresso text-xl mb-1 group-hover:text-terracotta transition-colors">{stage.label}</h3>
              <p className="text-walnut text-sm">{stage.sublabel}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const currentStage = STAGES.find(s => s.id === profile.stage)

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-walnut/50 mb-3">Settle · {city.name}</p>
          <h1 className="font-display font-bold text-espresso"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 0.92 }}>
            {currentStage?.label}
          </h1>
        </div>
        <button
          onClick={() => setStage(undefined as unknown as Stage)}
          className="text-sm text-walnut hover:text-espresso transition-colors mt-1 shrink-0"
        >
          Change stage
        </button>
      </div>

      {/* Situation tags */}
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-walnut/50 mb-3 font-medium">Your situation</p>
        <div className="flex flex-wrap gap-2">
          {SITUATIONS.map(s => {
            const active = (profile.situations ?? []).includes(s.id)
            return (
              <button
                key={s.id}
                onClick={() => toggleSituation(s.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-espresso text-cream'
                    : 'bg-ivory border border-sand text-walnut hover:border-espresso/30 hover:text-espresso'
                )}
              >
                {s.icon} {s.label}
              </button>
            )
          })}
        </div>
        {(profile.situations ?? []).length > 0 && (
          <p className="text-xs text-walnut/40 mt-2">{filteredTasks.length} tasks for your situation</p>
        )}
      </div>

      {/* Progress */}
      {filteredTasks.length > 0 && (
        <div className="mb-8 p-5 bg-ivory border border-sand rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-espresso">
              {completedIds.filter(id => filteredTasks.some(t => t.id === id)).length} of {filteredTasks.length} done
            </p>
            <p className="text-xs text-walnut/50">{Math.round((completedIds.filter(id => filteredTasks.some(t => t.id === id)).length / filteredTasks.length) * 100)}%</p>
          </div>
          <div className="h-1.5 bg-sand/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-terracotta rounded-full transition-all duration-500"
              style={{ width: `${(completedIds.filter(id => filteredTasks.some(t => t.id === id)).length / filteredTasks.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Tasks */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-walnut mb-2">No tasks match your current filters.</p>
            <p className="text-walnut/50 text-sm">Try adjusting your situation tags above.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const done = completedIds.includes(task.id)
            const expanded = expandedTask === task.id

            return (
              <div
                key={task.id}
                className={cn(
                  'bg-ivory border rounded-2xl overflow-hidden transition-all duration-300',
                  done ? 'border-sage/30 opacity-70' : 'border-sand hover:border-espresso/20',
                )}
              >
                {/* Task header */}
                <button
                  className="w-full text-left px-6 py-5 flex items-center gap-4"
                  onClick={() => setExpandedTask(expanded ? null : task.id)}
                >
                  {/* Done indicator */}
                  <span className={cn(
                    'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                    done ? 'bg-sage border-sage' : 'border-sand'
                  )}>
                    {done && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn('font-medium text-sm', done ? 'line-through text-walnut/50' : 'text-espresso')}>
                        {task.title}
                      </span>
                      <Badge variant={CATEGORY_VARIANTS[task.category]}>{CATEGORY_LABELS[task.category]}</Badge>
                    </div>
                    <p className="text-xs text-walnut/60">{task.estimatedTime} · {DIFFICULTY_LABELS[task.difficulty]}</p>
                  </div>

                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    className={cn('shrink-0 text-walnut/40 transition-transform duration-200', expanded && 'rotate-180')}
                  >
                    <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Expanded content */}
                {expanded && (
                  <div className="px-6 pb-6 pt-0 border-t border-sand/60">
                    <p className="text-walnut text-sm leading-relaxed mt-4 mb-5">{task.guide}</p>

                    {task.steps.length > 0 && (
                      <div className="mb-5">
                        <p className="text-xs uppercase tracking-widest text-walnut/50 mb-3 font-medium">Steps</p>
                        <ol className="space-y-3">
                          {task.steps.map((s, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-sand text-espresso text-xs font-bold flex items-center justify-center mt-0.5">
                                {i + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-espresso">{s.step}</p>
                                {s.detail && <p className="text-xs text-walnut/70 mt-0.5">{s.detail}</p>}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {task.tip && (
                      <div className="mb-5 bg-sage-light/40 border border-sage/20 rounded-xl px-5 py-4">
                        <p className="text-xs uppercase tracking-widest text-sage-dark font-medium mb-1">Pro tip</p>
                        <p className="text-sm text-espresso leading-relaxed">{task.tip}</p>
                      </div>
                    )}

                    {task.links.length > 0 && (
                      <div className="mb-5">
                        <p className="text-xs uppercase tracking-widest text-walnut/50 mb-3 font-medium">Sources & links</p>
                        <div className="flex flex-wrap gap-2">
                          {task.links.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-sand rounded-full text-xs text-espresso hover:border-terracotta/40 hover:text-terracotta transition-colors"
                            >
                              {link.type === 'official' && <span className="w-1.5 h-1.5 rounded-full bg-sky inline-block" />}
                              {link.type === 'affiliate' && <span className="w-1.5 h-1.5 rounded-full bg-terracotta inline-block" />}
                              {link.type === 'community' && <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />}
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/${city.id}/ask?task=${task.slug}`}
                        className="text-xs text-walnut hover:text-terracotta transition-colors link-hover"
                      >
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
