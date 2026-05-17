import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import {
  CURATED_BRUSSELS,
  getCuratedTip,
  getCuratedForChannel,
} from '@/lib/data/connect/curated-brussels'
import type { CuratedKind } from '@/lib/data/connect/curated-brussels'
import { getNeighbourhood } from '@/lib/data/neighbourhoods/brussels'
import { getTasksForCity } from '@/lib/data/tasks'
import type { CityId } from '@/lib/types'
import { GeometricThread } from '@/components/layout/GeometricThread'
import { PageMasthead } from '@/components/layout/PageMasthead'
import { ShareRow } from '@/components/connect/ShareRow'
import { SaveTipButton } from '@/components/tips/SaveTipButton'
import { PersonalisedListCTA } from '@/components/tips/PersonalisedListCTA'
import { GeometricOrnament } from '@/components/layout/GeometricOrnament'

const KIND_META: Record<CuratedKind, { label: string; color: string }> = {
  'tip':      { label: 'Tip',       color: '#0E9B6B' },
  'question': { label: 'Question',  color: '#1A8FAD' },
  'heads-up': { label: 'Heads-up',  color: '#FAB400' },
}

export function generateStaticParams() {
  return ACTIVE_CITIES.flatMap(c =>
    CURATED_BRUSSELS.filter(n => n.cityId === c.id).map(n => ({
      city: c.id, slug: n.slug,
    }))
  )
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string; slug: string }> },
): Promise<Metadata> {
  const { city: cityId, slug } = await params
  const city = getCity(cityId)
  const note = getCuratedTip(slug)
  if (!city || !note) return { title: 'Not found' }

  const title = `${note.title} — ${city.name}`
  const description = note.body.length <= 158 ? note.body : note.body.slice(0, 155).trim() + '…'

  return {
    title,
    description,
    alternates: { canonical: `/${cityId}/tips/${slug}` },
    openGraph: { title, description, type: 'article' },
  }
}

export default async function TipDetailPage(
  { params }: { params: Promise<{ city: string; slug: string }> },
) {
  const { city: cityId, slug } = await params
  const city = getCity(cityId)
  const note = getCuratedTip(slug)
  if (!city || !city.active || !note || note.cityId !== cityId) notFound()

  const meta = KIND_META[note.kind]

  // Cross-links
  const hood = note.neighbourhood ? getNeighbourhood(note.neighbourhood) : null
  const allTasks = getTasksForCity(cityId as CityId)
  const relatedTasks = (note.relatedTaskSlugs ?? [])
    .map(s => allTasks.find(t => t.slug === s))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
  const relatedTips = (note.relatedTipSlugs ?? [])
    .map(s => getCuratedTip(s))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
  // "More tips" — same kind, exclude current, up to 4
  const moreOfKind = getCuratedForChannel(note.kind)
    .filter(n => n.slug !== slug)
    .slice(0, 4)

  // JSON-LD Article schema for SEO
  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: note.title,
    description: note.body,
    articleBody: note.expansion,
    about: { '@type': 'Place', name: city.name },
    inLanguage: 'en',
  }

  return (
    <div className="relative overflow-hidden" style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }} />

      <GeometricThread accent={meta.color} />

      <PageMasthead
        eyebrow={`${city.name} · ${meta.label}`}
        headline={note.title.split(' ').slice(0, 4).join(' ')}
        emphasis={note.title.split(' ').slice(4).join(' ') || '.'}
        emphasisColor={meta.color}
        tagline={note.body}
        backHref={`/${cityId}/tips`}
        backLabel="← All tips"
      />

      <article className="max-w-2xl mx-auto px-6 md:px-12 pt-10 pb-20">

        {/* Expansion — the real content for SEO.
            Editorial moves:
              - First paragraph gets a drop cap in the section colour (magazine
                opening style)
              - After the second paragraph, a wide outdent pull quote breaks
                the column (uses the first sentence of paragraph 3 — fall back
                to the body if expansion is short) */}
        {(() => {
          const paras = note.expansion.split('\n\n')
          const pullQuoteText = paras[2]
            ? paras[2].split(/(?<=[.!?])\s+/)[0]
            : note.body
          return (
            <section className="mb-10">
              {paras.map((para, i) => {
                const isFirst = i === 0
                return (
                  <p key={i}
                    className={isFirst
                      ? 'text-base leading-relaxed mb-5 first-letter:font-display first-letter:font-black first-letter:text-[5.5rem] first-letter:leading-[0.85] first-letter:float-left first-letter:mr-3 first-letter:mt-1.5'
                      : 'text-base leading-relaxed mb-5'}
                    style={{
                      color: 'rgba(10,10,10,0.78)',
                      ...(isFirst ? ({ ['--tw-first-letter-color' as never]: meta.color }) : {}),
                    }}>
                    {isFirst ? (
                      <>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 900,
                          fontSize: '5.5rem',
                          lineHeight: 0.85,
                          float: 'left',
                          marginRight: '0.5rem',
                          marginTop: '0.4rem',
                          color: meta.color,
                        }}>{para.charAt(0)}</span>
                        {para.slice(1)}
                      </>
                    ) : para}
                  </p>
                )
              })}
              {paras.length >= 3 && pullQuoteText && (
                <aside className="-mx-6 md:-mx-16 my-10 py-7 px-6 md:px-12"
                  style={{
                    borderTop:    `2px solid #0A0A0A`,
                    borderBottom: `2px solid #0A0A0A`,
                  }}>
                  <span style={{
                    color: meta.color,
                    fontSize: '4.5rem',
                    lineHeight: 0.6,
                    float: 'left',
                    marginRight: '0.75rem',
                    marginTop: '0.4rem',
                    fontWeight: 900,
                  }}>&ldquo;</span>
                  <p className="font-display font-black text-2xl md:text-3xl leading-[1.1]"
                    style={{ color: '#0A0A0A', letterSpacing: '-0.015em' }}>
                    {pullQuoteText}
                  </p>
                </aside>
              )}
            </section>
          )
        })()}

        {/* Geometric ornament — colour-via-shape section break */}
        <GeometricOrnament accent={meta.color} />

        {/* Save + Share row */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
          <SaveTipButton slug={slug} title={note.title} />
        </div>
        <ShareRow
          url={`/${cityId}/tips/${slug}`}
          title={note.title}
          summary={note.body}
        />

        {/* Personalised list — friction-free signup wedge */}
        <PersonalisedListCTA cityId={cityId} cityName={city.name} />

        {/* Cross-links */}
        {(hood || relatedTasks.length > 0 || relatedTips.length > 0) && (
          <section className="mt-12 mb-12">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-4"
              style={{ color: '#4744C8' }}>
              Related
            </p>

            {hood && (
              <Link href={`/${cityId}/neighbourhoods/${hood.slug}`}
                className="block px-4 py-3 mb-2 hover:opacity-80 transition-opacity"
                style={{ background: 'rgba(71,68,200,0.04)', border: '1px solid rgba(71,68,200,0.15)' }}>
                <p className="text-[10px] font-black tracking-[0.18em] uppercase mb-1"
                  style={{ color: '#4744C8' }}>
                  Neighbourhood
                </p>
                <p className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>
                  Living in {hood.name} — full guide
                </p>
              </Link>
            )}

            {relatedTasks.map(t => (
              <Link key={t.slug} href={`/${cityId}/guide/${t.slug}`}
                className="block px-4 py-3 mb-2 hover:opacity-80 transition-opacity"
                style={{ background: 'rgba(250,180,0,0.05)', border: '1px solid rgba(250,180,0,0.2)' }}>
                <p className="text-[10px] font-black tracking-[0.18em] uppercase mb-1"
                  style={{ color: '#A07000' }}>
                  Guide
                </p>
                <p className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>
                  {t.title}
                </p>
              </Link>
            ))}

            {relatedTips.map(t => {
              const tm = KIND_META[t.kind]
              return (
                <Link key={t.slug} href={`/${cityId}/tips/${t.slug}`}
                  className="block px-4 py-3 mb-2 hover:opacity-80 transition-opacity"
                  style={{ background: `${tm.color}0a`, border: `1px solid ${tm.color}30` }}>
                  <p className="text-[10px] font-black tracking-[0.18em] uppercase mb-1"
                    style={{ color: tm.color }}>
                    {tm.label}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>
                    {t.title}
                  </p>
                </Link>
              )
            })}
          </section>
        )}

        {/* Read next — one hand-picked next read, not a buffet.
            Picks the first curated relatedTipSlug; falls back to the first
            moreOfKind if no curation. A magazine never ends a feature with
            a four-card grid — it ends with one editorial line and a single
            next piece. */}
        {(() => {
          const readNext = relatedTips[0] ?? moreOfKind[0]
          if (!readNext) return null
          const nm = KIND_META[readNext.kind]
          return (
            <section className="mt-12 mb-12">
              <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-3"
                style={{ color: meta.color }}>
                Read next
              </p>
              <Link href={`/${cityId}/tips/${readNext.slug}`}
                className="block group transition-opacity hover:opacity-90"
                style={{ background: '#FFFFFF', border: '1px solid rgba(10,10,10,0.12)' }}>
                {/* Colored top bar (same idiom as tips index hero cards) */}
                <div style={{ height: 5, background: nm.color }} />
                <div className="px-6 pt-5 pb-5">
                  <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
                    style={{ color: nm.color }}>
                    {nm.label}
                  </p>
                  <h3 className="font-display font-black text-xl md:text-2xl leading-tight mb-2"
                    style={{ color: '#0A0A0A', letterSpacing: '-0.01em' }}>
                    {readNext.title}
                  </h3>
                  <p className="text-sm leading-snug mb-3" style={{ color: 'rgba(10,10,10,0.6)' }}>
                    {readNext.body}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.18em] uppercase"
                    style={{ color: nm.color }}>
                    Read this next →
                  </span>
                </div>
              </Link>
            </section>
          )
        })()}

        {/* Ask AI — natural next move after reading a how-to */}
        <section className="mb-12 px-5 py-4"
          style={{
            background: 'rgba(56,192,240,0.06)',
            borderTop: '1px solid rgba(56,192,240,0.25)',
            borderBottom: '1px solid rgba(56,192,240,0.25)',
          }}>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-1.5"
            style={{ color: '#38C0F0' }}>
            Have a follow-up?
          </p>
          <Link href={`/${cityId}/ask?prompt=${encodeURIComponent(note.title)}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-70 transition-opacity"
            style={{ color: '#0A0A0A' }}>
            Ask the {city.name}-aware AI about this →
          </Link>
        </section>

        {/* CTA */}
        <div className="mt-16 px-6 md:px-8 py-7 md:py-9" style={{ background: '#252450' }}>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-3"
            style={{ color: 'rgba(245,236,215,0.5)' }}>
            Settling in {city.name}?
          </p>
          <h3 className="font-display font-black leading-tight mb-3"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', color: '#F5F4F0', letterSpacing: '-0.01em' }}>
            More tips like this.<br />
            <em className="not-italic" style={{ color: meta.color }}>One free account.</em>
          </h3>
          <p className="text-sm md:text-base mb-6 max-w-md leading-relaxed"
            style={{ color: 'rgba(245,236,215,0.65)' }}>
            Free Roots account: the {city.name}-aware AI, the settle-in checklist, neighbourhood
            comparisons, the community feed.
          </p>
          <Link href={`/${cityId}/settle`}
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: '#F5F4F0', color: '#252450' }}>
            Start your settle-in →
          </Link>
        </div>
      </article>
    </div>
  )
}
