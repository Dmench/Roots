import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import { getTasksForCity } from '@/lib/data/tasks'
import type { CityId, TaskCategory } from '@/lib/types'
import { GeometricThread } from '@/components/layout/GeometricThread'
import { PageMasthead } from '@/components/layout/PageMasthead'

/* ── Static params + metadata ────────────────────────────────────────────── */

export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> },
): Promise<Metadata> {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city) return { title: 'Guide not found' }
  const tasks = getTasksForCity(cityId as CityId)
  const desc  = `${tasks.length} step-by-step guides for settling into ${city.name}: admin, housing, healthcare, transport, daily life. Free, no signup required.`
  return {
    title: `Moving to ${city.name} — the complete playbook`,
    description: desc,
    alternates: { canonical: `/${cityId}/guide` },
    openGraph: {
      title: `Moving to ${city.name} — the complete playbook`,
      description: desc,
      type: 'website',
    },
  }
}

/* ── Category meta ───────────────────────────────────────────────────────── */

const CATEGORY_META: Record<TaskCategory, { label: string; color: string; sub: string }> = {
  admin:     { label: 'Admin & registration', color: '#4744C8', sub: 'Commune, eID, residence permits' },
  housing:   { label: 'Housing & leases',     color: '#FAB400', sub: 'Finding, signing, deposits' },
  money:     { label: 'Money & banking',      color: '#10B981', sub: 'Bank accounts, taxes, transfers' },
  health:    { label: 'Healthcare',           color: '#FF3EBA', sub: 'Mutuelle, GPs, pharmacies' },
  transport: { label: 'Transport',            color: '#38C0F0', sub: 'STIB, bikes, SNCB' },
  community: { label: 'Community',            color: '#10B981', sub: 'Language, meetups, neighbours' },
  work:      { label: 'Work',                 color: '#FAB400', sub: 'Jobs, freelancing, payroll' },
  daily:     { label: 'Daily life',           color: '#8A7868', sub: 'Phone, internet, post' },
}

const CATEGORY_ORDER: TaskCategory[] = [
  'admin', 'housing', 'money', 'health', 'transport', 'work', 'community', 'daily',
]

/* ── Page ────────────────────────────────────────────────────────────────── */

export default async function GuideIndex(
  { params }: { params: Promise<{ city: string }> },
) {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city || !city.active) notFound()

  const tasks = getTasksForCity(cityId as CityId)
  const byCategory: Partial<Record<TaskCategory, typeof tasks>> = {}
  for (const t of tasks) {
    (byCategory[t.category] ||= []).push(t)
  }

  return (
    <div className="relative overflow-hidden" style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <GeometricThread accent="#FAB400" />

      <PageMasthead
        eyebrow={`The ${city.name} Playbook`}
        headline="Moving to"
        emphasis={`${city.name}.`}
        emphasisColor="#FAB400"
        tagline={`The complete settle-in guide — ${tasks.length} step-by-step tasks. Admin, housing, healthcare, transport, daily life. Free, no signup.`}
      >
        <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: '#FAB400' }}>
          {tasks.length} guides
        </span>
        <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: '#10B981' }}>
          Free · No signup
        </span>
        <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: '#4744C8' }}>
          Save progress with an account
        </span>
      </PageMasthead>

      <div className="max-w-3xl mx-auto px-6 md:px-12 pt-10 pb-20">

        {/* Cross-link to the neighbourhood guide — the other half of the
            public/SEO surface. Putting this above the editorial intro so
            cold visitors discover both arms of the playbook. */}
        <Link href={`/${cityId}/neighbourhoods`}
          className="flex items-center justify-between gap-4 mb-10 px-5 py-4 hover:opacity-80 transition-opacity"
          style={{ background: 'rgba(71,68,200,0.06)', border: '1px solid rgba(71,68,200,0.2)' }}>
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-1"
              style={{ color: '#4744C8' }}>
              Where to live in {city.name}
            </p>
            <p className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>
              Neighbourhood guide — 12 profiles + side-by-side comparisons
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-black tracking-[0.18em] uppercase"
            style={{ color: '#4744C8' }}>
            Open →
          </span>
        </Link>

        {/* Editorial intro */}
        <p className="text-base leading-relaxed mb-12 max-w-2xl" style={{ color: 'rgba(10,10,10,0.7)' }}>
          Settling into a new city is sixty things, and almost no one tells you the order they need to happen in.
          We did it the hard way and wrote it all down for {city.name} — every form, every office, every gotcha,
          every &quot;everyone else figured this out except you&quot; moment. The interactive checklist — with stage
          and situation filters — lives in Settle.
        </p>

        {/* Categories */}
        {CATEGORY_ORDER.map(cat => {
          const list = byCategory[cat]
          if (!list || list.length === 0) return null
          const meta = CATEGORY_META[cat]
          return (
            <section key={cat} className="mb-14">
              <div className="mb-5 pb-3 flex items-baseline justify-between gap-4"
                style={{ borderBottom: `2px solid ${meta.color}` }}>
                <div>
                  <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-1"
                    style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(10,10,10,0.45)' }}>{meta.sub}</p>
                </div>
                <span className="text-[10px] shrink-0" style={{ color: 'rgba(10,10,10,0.3)' }}>
                  {list.length} {list.length === 1 ? 'guide' : 'guides'}
                </span>
              </div>
              <div>
                {list.map(t => (
                  <Link key={t.id} href={`/${cityId}/guide/${t.slug}`}
                    className="flex items-start justify-between gap-4 py-3.5 group hover:bg-neutral-50 -mx-2 px-2 transition-colors"
                    style={{ borderBottom: '1px solid rgba(10,10,10,0.06)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug" style={{ color: '#0A0A0A' }}>
                        {t.title}
                      </p>
                      <p className="text-xs leading-snug mt-1 line-clamp-2"
                        style={{ color: 'rgba(10,10,10,0.5)' }}>
                        {t.summary}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
                      <span className="text-[10px] font-medium" style={{ color: 'rgba(10,10,10,0.4)' }}>
                        {t.estimatedTime}
                      </span>
                      <span className="text-[10px] font-black tracking-wider uppercase opacity-0 group-hover:opacity-60 transition-opacity"
                        style={{ color: meta.color }}>
                        Read →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}

        {/* CTA — save progress */}
        <div className="mt-16 px-6 md:px-8 py-7 md:py-9" style={{ background: '#252450' }}>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-3"
            style={{ color: 'rgba(245,236,215,0.5)' }}>
            Doing this for real?
          </p>
          <h3 className="font-display font-black leading-tight mb-3"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', color: '#F5F4F0', letterSpacing: '-0.01em' }}>
            Save your progress.<br />
            <em className="not-italic" style={{ color: '#FF3EBA' }}>Ask anything.</em>
          </h3>
          <p className="text-sm md:text-base mb-6 max-w-md leading-relaxed"
            style={{ color: 'rgba(245,236,215,0.65)' }}>
            Free Roots account: tick tasks off as you complete them, filter by your stage and situation,
            and ask the {city.name}-aware AI any question.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${cityId}/settle`}
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ background: '#F5F4F0', color: '#252450' }}>
              Start your settle-in →
            </Link>
            <Link href={`/${cityId}`}
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'rgba(245,236,215,0.55)', border: '1px solid rgba(245,236,215,0.2)' }}>
              See {city.name} hub
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
