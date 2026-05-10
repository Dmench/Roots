import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import { getTasksForCity, getTask } from '@/lib/data/tasks'
import type { CityId } from '@/lib/types'
import { GeometricThread } from '@/components/layout/GeometricThread'
import { ShareButtons } from '@/components/guide/ShareButtons'

/* ── Static params + metadata ────────────────────────────────────────────── */

export function generateStaticParams() {
  return ACTIVE_CITIES.flatMap(city =>
    getTasksForCity(city.id).map(task => ({
      city: city.id,
      slug: task.slug,
    })),
  )
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string; slug: string }> },
): Promise<Metadata> {
  const { city: cityId, slug } = await params
  const city = getCity(cityId)
  const task = getTask(cityId as CityId, slug)
  if (!city || !task) return { title: 'Guide not found' }
  const title = `${task.title} in ${city.name} — step-by-step guide`
  return {
    title,
    description: task.summary,
    alternates: { canonical: `/${cityId}/guide/${slug}` },
    openGraph: {
      title,
      description: task.summary,
      type: 'article',
    },
  }
}

/* ── Page — read-only public version of the settle task ─────────────────── */

export default async function GuideTaskPage(
  { params }: { params: Promise<{ city: string; slug: string }> },
) {
  const { city: cityId, slug } = await params
  const city = getCity(cityId)
  const task = getTask(cityId as CityId, slug)
  if (!city || !task) notFound()

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

  // JSON-LD HowTo schema for rich-result eligibility
  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: task.title,
    description: task.summary,
    totalTime: task.estimatedTime,
    step: task.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.step,
      text: s.detail ?? s.step,
    })),
  }

  return (
    <div className="relative overflow-hidden" style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <GeometricThread accent={catColor} intensity="quiet" />

      {/* JSON-LD for SEO */}
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />

      {/* 4px brand rule */}
      <div style={{ height: 4, background: '#252450' }} />

      <article className="max-w-2xl mx-auto px-6 md:px-12 pt-8 pb-24">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide uppercase mb-8"
          style={{ color: 'rgba(10,10,10,0.3)' }}>
          <Link href={`/${cityId}/guide`} className="hover:opacity-60 transition-opacity">
            {city.name} guide
          </Link>
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
        <h1 className="font-display font-black leading-[1.05] mb-4"
          style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', color: '#0A0A0A', letterSpacing: '-0.01em' }}>
            {task.title}
        </h1>

        {/* Summary */}
        <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(10,10,10,0.65)' }}>
          {task.summary}
        </p>

        {/* Share buttons — high-up, where intent is — so partners-moving-with-you
            and friends-googling-the-same-thing get the link in one tap. */}
        <div className="mb-10 pb-6" style={{ borderBottom: '1px solid rgba(10,10,10,0.06)' }}>
          <ShareButtons title={`${task.title} — ${city.name}`} summary={task.summary} />
        </div>

        {/* Inline soft CTA — show what they're missing */}
        <div className="px-4 py-3 mb-10 flex items-center justify-between gap-3 flex-wrap"
          style={{ background: 'rgba(71,68,200,0.04)', border: '1px solid rgba(71,68,200,0.12)' }}>
          <p className="text-xs flex-1 min-w-0" style={{ color: 'rgba(37,36,80,0.7)' }}>
            Want to tick this off as you go and ask follow-up questions?
          </p>
          <Link href={`/${cityId}/settle/${slug}`}
            className="text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-70 transition-opacity shrink-0"
            style={{ color: '#4744C8' }}>
            Save progress →
          </Link>
        </div>

        {/* Guide */}
        <h2 className="font-display font-black text-xl mb-4" style={{ color: '#0A0A0A' }}>
          The full guide
        </h2>
        <div className="text-sm leading-relaxed whitespace-pre-line mb-10"
          style={{ color: 'rgba(10,10,10,0.7)' }}>
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
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.55)' }}>
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
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(10,10,10,0.7)' }}>
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
            <div className="space-y-2 mb-12">
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

        {/* Bottom share — second touchpoint after the user has read the whole guide,
            highest-intent moment to forward to a partner / friend doing the same thing. */}
        <div className="mt-12 mb-12">
          <ShareButtons
            title={`${task.title} — ${city.name}`}
            summary={task.summary}
            label="Helpful? Send it on."
          />
        </div>

        {/* Big bottom CTA */}
        <div className="px-6 py-7" style={{ background: '#252450' }}>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-2.5"
            style={{ color: 'rgba(245,236,215,0.5)' }}>
            Free Roots account
          </p>
          <h3 className="font-display font-black leading-tight mb-3"
            style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', color: '#F5F4F0' }}>
            Tick this off.<br />
            <em className="not-italic" style={{ color: '#FF3EBA' }}>Ask the next question.</em>
          </h3>
          <p className="text-sm mb-5 max-w-md leading-relaxed"
            style={{ color: 'rgba(245,236,215,0.65)' }}>
            Save your progress, filter the playbook to your stage, and ask the {city.name}-aware AI anything else.
          </p>
          <Link href={`/${cityId}/settle/${slug}`}
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: '#F5F4F0', color: '#252450' }}>
            Start your settle-in →
          </Link>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(10,10,10,0.08)', paddingTop: 32, marginTop: 32 }}>
            <h2 className="font-display font-black text-lg mb-4" style={{ color: '#0A0A0A' }}>
              Related guides
            </h2>
            <div className="space-y-2">
              {related.map(t => (
                <Link key={t.id} href={`/${cityId}/guide/${t.slug}`}
                  className="flex items-center justify-between px-4 py-3 group transition-colors hover:bg-neutral-50"
                  style={{ border: '1px solid rgba(10,10,10,0.08)' }}>
                  <span className="text-sm font-medium" style={{ color: '#0A0A0A' }}>{t.title}</span>
                  <span className="text-xs" style={{ color: 'rgba(10,10,10,0.3)' }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to index */}
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}>
          <Link href={`/${cityId}/guide`}
            className="text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            ← All {city.name} guides
          </Link>
        </div>

      </article>
    </div>
  )
}
