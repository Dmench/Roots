import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import { getTasksForCity, getTask } from '@/lib/data/tasks'
import type { CityId } from '@/lib/types'
import { TaskClient } from './TaskClient'

/* ── Static params — pre-render every task page ──────────────────────────── */

export function generateStaticParams() {
  return ACTIVE_CITIES.flatMap(city =>
    getTasksForCity(city.id).map(task => ({
      city: city.id,
      slug: task.slug,
    }))
  )
}

/* ── Metadata ────────────────────────────────────────────────────────────── */

export async function generateMetadata(
  { params }: { params: Promise<{ city: string; slug: string }> }
): Promise<Metadata> {
  const { city: cityId, slug } = await params
  const city = getCity(cityId)
  const task = getTask(cityId as CityId, slug)
  if (!city || !task) return { title: 'Task not found' }

  return {
    title: `${task.title} in ${city.name}`,
    description: task.summary,
    openGraph: {
      title: `${task.title} — ${city.name} Settle Guide`,
      description: task.summary,
    },
  }
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default async function TaskPage(
  { params }: { params: Promise<{ city: string; slug: string }> }
) {
  const { city: cityId, slug } = await params
  const city = getCity(cityId)
  const task = getTask(cityId as CityId, slug)
  if (!city || !task) notFound()

  // Related tasks — same category, different slug
  const related = getTasksForCity(cityId as CityId)
    .filter(t => t.category === task.category && t.slug !== slug)
    .slice(0, 3)

  const DIFFICULTY_COLOR = { easy: '#10B981', medium: '#FAB400', hard: '#FF3EBA' }
  const CATEGORY_COLOR: Record<string, string> = {
    admin: '#4744C8', housing: '#FAB400', money: '#10B981', health: '#FF3EBA',
    transport: '#38C0F0', community: '#10B981', work: '#FAB400', daily: '#8A7868',
  }

  const catColor  = CATEGORY_COLOR[task.category] ?? '#4744C8'
  const diffColor = DIFFICULTY_COLOR[task.difficulty]

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-6 md:px-12 pt-8 pb-24">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide uppercase mb-8"
          style={{ color: 'rgba(10,10,10,0.3)' }}>
          <Link href={`/${cityId}`} className="hover:opacity-60 transition-opacity">{city.name}</Link>
          <span>/</span>
          <Link href={`/${cityId}/settle`} className="hover:opacity-60 transition-opacity">Settle</Link>
          <span>/</span>
          <span style={{ color: catColor }}>{task.title}</span>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-[10px] font-black tracking-[0.18em] uppercase px-2.5 py-1"
            style={{ background: catColor + '12', color: catColor }}>
            {task.category}
          </span>
          <span className="text-[10px] font-black tracking-[0.18em] uppercase px-2.5 py-1"
            style={{ background: diffColor + '12', color: diffColor }}>
            {task.difficulty}
          </span>
          <span className="text-[10px] font-medium px-2.5 py-1"
            style={{ background: 'rgba(10,10,10,0.05)', color: 'rgba(10,10,10,0.4)' }}>
            {task.estimatedTime}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display font-black leading-tight mb-4"
          style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)', color: '#0A0A0A' }}>
          {task.title}
        </h1>

        {/* Summary */}
        <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(10,10,10,0.6)' }}>
          {task.summary}
        </p>

        {/* Checkbox — client component */}
        <TaskClient taskId={task.id} cityId={cityId} />

        <div style={{ borderTop: '1px solid rgba(10,10,10,0.08)', marginTop: 32, paddingTop: 32 }} />

        {/* Guide */}
        <h2 className="font-display font-black text-xl mb-4" style={{ color: '#0A0A0A' }}>
          The full guide
        </h2>
        <div className="text-sm leading-relaxed whitespace-pre-line mb-10"
          style={{ color: 'rgba(10,10,10,0.65)' }}>
          {task.guide}
        </div>

        {/* Steps */}
        <h2 className="font-display font-black text-xl mb-5" style={{ color: '#0A0A0A' }}>
          Step by step
        </h2>
        <ol className="space-y-5 mb-10">
          {task.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 w-6 h-6 flex items-center justify-center text-[10px] font-black"
                style={{ background: catColor, color: '#fff' }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-semibold mb-1" style={{ color: '#0A0A0A' }}>{step.step}</p>
                {step.detail && (
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.5)' }}>
                    {step.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>

        {/* Pro tip */}
        {task.tip && (
          <div className="px-4 py-4 mb-10"
            style={{ background: catColor + '08', borderLeft: `3px solid ${catColor}` }}>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1.5"
              style={{ color: catColor }}>
              Pro tip
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(10,10,10,0.65)' }}>
              {task.tip}
            </p>
          </div>
        )}

        {/* Links */}
        {task.links.length > 0 && (
          <>
            <h2 className="font-display font-black text-lg mb-4" style={{ color: '#0A0A0A' }}>
              Useful links
            </h2>
            <div className="space-y-2 mb-10">
              {task.links.map(link => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 group transition-colors"
                  style={{ border: '1px solid rgba(10,10,10,0.1)', color: '#0A0A0A' }}>
                  <span className="text-sm font-medium group-hover:opacity-60 transition-opacity">
                    {link.label}
                  </span>
                  <span className="text-xs" style={{ color: 'rgba(10,10,10,0.3)' }}>↗</span>
                </a>
              ))}
            </div>
          </>
        )}

        {/* Related tasks */}
        {related.length > 0 && (
          <>
            <div style={{ borderTop: '1px solid rgba(10,10,10,0.08)', paddingTop: 32, marginTop: 8 }}>
              <h2 className="font-display font-black text-lg mb-4" style={{ color: '#0A0A0A' }}>
                Related tasks
              </h2>
              <div className="space-y-2">
                {related.map(t => (
                  <Link key={t.id} href={`/${cityId}/settle/${t.slug}`}
                    className="flex items-center justify-between px-4 py-3 group transition-colors hover:bg-neutral-50"
                    style={{ border: '1px solid rgba(10,10,10,0.08)' }}>
                    <span className="text-sm font-medium" style={{ color: '#0A0A0A' }}>
                      {t.title}
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(10,10,10,0.3)' }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Ask CTA */}
        <div className="mt-12 px-5 py-5"
          style={{ background: 'rgba(56,192,240,0.06)', border: '1px solid rgba(56,192,240,0.2)' }}>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1.5"
            style={{ color: '#38C0F0' }}>
            Still have questions?
          </p>
          <p className="text-sm mb-3" style={{ color: 'rgba(10,10,10,0.6)' }}>
            Ask the Brussels AI — trained on local knowledge, expat forums, and official sources.
          </p>
          <Link href={`/${cityId}/ask`}
            className="inline-flex items-center gap-1.5 text-xs font-black tracking-wide uppercase hover:opacity-70 transition-opacity"
            style={{ color: '#38C0F0' }}>
            Ask anything →
          </Link>
        </div>

      </div>
    </div>
  )
}
