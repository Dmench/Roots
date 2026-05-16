import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import { CURATED_BRUSSELS, getCuratedForChannel } from '@/lib/data/connect/curated-brussels'
import type { CuratedNote, CuratedKind } from '@/lib/data/connect/curated-brussels'
import { GeometricThread } from '@/components/layout/GeometricThread'
import { PageMasthead } from '@/components/layout/PageMasthead'

export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> },
): Promise<Metadata> {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city) return { title: 'Not found' }
  const total = CURATED_BRUSSELS.length
  const desc = `${total} hand-written tips, questions, and heads-ups for newcomers to ${city.name}. Commune registration, mutuelle, housing, transport, daily life — no fluff, no SEO spam.`
  return {
    title: `${total} tips for newcomers to ${city.name}`,
    description: desc.slice(0, 158),
    alternates: { canonical: `/${cityId}/tips` },
    openGraph: {
      title: `${total} tips for newcomers to ${city.name}`,
      description: desc.slice(0, 158),
      type: 'website',
    },
  }
}

const KIND_META: Record<CuratedKind, { label: string; color: string; sub: string }> = {
  'tip':      { label: 'Tips',      color: '#0E9B6B', sub: 'What works' },
  'question': { label: 'Questions', color: '#1A8FAD', sub: 'Things newcomers ask' },
  'heads-up': { label: 'Heads-up',  color: '#FAB400', sub: 'Things worth knowing' },
}

const KIND_ORDER: CuratedKind[] = ['tip', 'question', 'heads-up']

function TipCard({ note, cityId, hero = false }: { note: CuratedNote; cityId: string; hero?: boolean }) {
  const meta = KIND_META[note.kind]
  return (
    <Link
      href={`/${cityId}/tips/${note.slug}`}
      className="block group transition-opacity hover:opacity-90"
      style={{
        background: '#FFFFFF',
        border: `1px solid rgba(10,10,10,0.1)`,
        padding: hero ? '28px 28px 24px' : '20px 20px 18px',
      }}>
      <div style={{
        height: hero ? 5 : 4,
        background: meta.color,
        marginBottom: hero ? 16 : 12,
        marginLeft: hero ? -28 : -20,
        marginRight: hero ? -28 : -20,
        marginTop: hero ? -28 : -20,
      }} />
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-black tracking-[0.22em] uppercase"
          style={{ color: meta.color }}>
          {meta.label}
        </span>
        {note.neighbourhood && (
          <span className="text-[10px] font-black tracking-[0.18em] uppercase"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            · {note.neighbourhood.replace(/-/g, ' ')}
          </span>
        )}
      </div>
      <h3 className={hero ? 'font-display font-black leading-tight mb-3' : 'font-bold leading-tight mb-2'}
        style={{
          color: '#0A0A0A',
          fontSize: hero ? '1.5rem' : '1rem',
          letterSpacing: hero ? '-0.015em' : '-0.005em',
        }}>
        {note.title}
      </h3>
      <p className="text-sm leading-snug line-clamp-3"
        style={{ color: 'rgba(10,10,10,0.6)' }}>
        {note.body}
      </p>
      <p className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.18em] uppercase opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: meta.color }}>
        Read full tip →
      </p>
    </Link>
  )
}

export default async function TipsIndex(
  { params }: { params: Promise<{ city: string }> },
) {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city || !city.active) notFound()

  // For now Lisbon has no curated content — only Brussels.
  if (cityId !== 'brussels') notFound()

  const grouped: Record<CuratedKind, CuratedNote[]> = {
    'tip':      getCuratedForChannel('tip'),
    'question': getCuratedForChannel('question'),
    'heads-up': getCuratedForChannel('heads-up'),
  }
  const total = CURATED_BRUSSELS.length

  return (
    <div className="relative overflow-hidden" style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <GeometricThread accent="#FF3EBA" />

      <PageMasthead
        eyebrow={`${city.name} · Tips for newcomers`}
        headline={`${total} tips,`}
        emphasis="hand-written."
        emphasisColor="#FF3EBA"
        tagline={`No SEO spam, no AI slop. Specific, opinionated, written by people who actually live in ${city.name}.`}
      >
        <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: '#0E9B6B' }}>
          {grouped.tip.length} tips
        </span>
        <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: '#1A8FAD' }}>
          {grouped.question.length} questions
        </span>
        <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: '#FAB400' }}>
          {grouped['heads-up'].length} heads-up
        </span>
      </PageMasthead>

      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-10 pb-20">

        {KIND_ORDER.map(kind => {
          const notes = grouped[kind]
          if (notes.length === 0) return null
          const meta = KIND_META[kind]
          const [first, ...rest] = notes
          return (
            <section key={kind} className="mb-16">
              <div className="mb-6 pb-3 flex items-baseline justify-between gap-4"
                style={{ borderBottom: `2px solid ${meta.color}` }}>
                <div>
                  <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-1"
                    style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(10,10,10,0.45)' }}>{meta.sub}</p>
                </div>
                <span className="text-[10px] shrink-0" style={{ color: 'rgba(10,10,10,0.3)' }}>
                  {notes.length}
                </span>
              </div>

              {/* Hero card + 2-col grid for the rest */}
              <TipCard note={first} cityId={cityId} hero />
              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {rest.map(n => <TipCard key={n.slug} note={n} cityId={cityId} />)}
                </div>
              )}
            </section>
          )
        })}

        {/* CTA */}
        <div className="mt-12 px-6 md:px-8 py-7 md:py-9" style={{ background: '#252450' }}>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-3"
            style={{ color: 'rgba(245,236,215,0.5)' }}>
            Want the rest?
          </p>
          <h3 className="font-display font-black leading-tight mb-3"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', color: '#F5F4F0', letterSpacing: '-0.01em' }}>
            Save your progress.<br />
            <em className="not-italic" style={{ color: '#FF3EBA' }}>Ask anything.</em>
          </h3>
          <p className="text-sm md:text-base mb-6 max-w-md leading-relaxed"
            style={{ color: 'rgba(245,236,215,0.65)' }}>
            Free Roots account: the {city.name}-aware AI, the 25-task settle-in checklist, neighbourhood
            comparisons, and the community feed where these tips come from.
          </p>
          <Link href={`/${cityId}/settle`}
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: '#F5F4F0', color: '#252450' }}>
            Start your settle-in →
          </Link>
        </div>
      </div>
    </div>
  )
}
