import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import { BRUSSELS_NEIGHBOURHOODS, getNeighbourhood } from '@/lib/data/neighbourhoods/brussels'
import { getTasksForCity } from '@/lib/data/tasks'
import brusselsVenues from '@/lib/data/static/brussels-venues.json'
import type { CityId } from '@/lib/types'
import { GeometricThread } from '@/components/layout/GeometricThread'
import { PageMasthead } from '@/components/layout/PageMasthead'
import { HoodGlyph } from '@/components/neighbourhoods/HoodGlyph'

interface VenueRow {
  id: string
  name: string
  category: string
  broadType: string
  neighborhood: string
  price?: string
  vibe?: string
  why?: string
  address?: string
  website?: string
}

export function generateStaticParams() {
  return ACTIVE_CITIES.flatMap(c =>
    BRUSSELS_NEIGHBOURHOODS.filter(n => n.cityId === c.id).map(n => ({
      city: c.id, slug: n.slug,
    }))
  )
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string; slug: string }> },
): Promise<Metadata> {
  const { city: cityId, slug } = await params
  const city = getCity(cityId)
  const hood = getNeighbourhood(slug)
  if (!city || !hood) return { title: 'Not found' }

  const title = `Living in ${hood.name}, ${city.name} — neighbourhood guide`
  const description = hood.oneLiner.length <= 155
    ? hood.oneLiner
    : hood.oneLiner.slice(0, 152).trim() + '…'

  return {
    title,
    description,
    alternates: { canonical: `/${cityId}/neighbourhoods/${slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
    },
  }
}

function findVenues(neighborhoodName: string, aka?: string): VenueRow[] {
  const names = [neighborhoodName, aka].filter(Boolean).map(n => n!.toLowerCase())
  const all = brusselsVenues as unknown as VenueRow[]
  return all.filter(v => {
    const hood = v.neighborhood?.toLowerCase() ?? ''
    return names.some(n => hood.includes(n) || n.includes(hood))
  }).slice(0, 8)
}

export default async function NeighbourhoodPage(
  { params }: { params: Promise<{ city: string; slug: string }> },
) {
  const { city: cityId, slug } = await params
  const city = getCity(cityId)
  const hood = getNeighbourhood(slug)
  if (!city || !city.active || !hood) notFound()

  const venues = findVenues(hood.name, hood.aka)
  const allTasks = getTasksForCity(cityId as CityId)
  const relatedTasks = (hood.relatedTaskSlugs ?? [])
    .map(s => allTasks.find(t => t.slug === s))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)

  // JSON-LD structured data for SEO — Place + BreadcrumbList
  const ldJson = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Place',
        name: `${hood.name}, ${city.name}`,
        description: hood.oneLiner,
        containedInPlace: {
          '@type': 'City',
          name: city.name,
          containedInPlace: { '@type': 'Country', name: city.country },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: city.name, item: `/${cityId}` },
          { '@type': 'ListItem', position: 2, name: 'Neighbourhoods', item: `/${cityId}/neighbourhoods` },
          { '@type': 'ListItem', position: 3, name: hood.name, item: `/${cityId}/neighbourhoods/${slug}` },
        ],
      },
    ],
  }

  return (
    <div className="relative overflow-hidden" style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }} />

      <GeometricThread accent="#4744C8" />

      <PageMasthead
        eyebrow={`${city.name} · Neighbourhood`}
        headline={`Living in`}
        emphasis={`${hood.name}.`}
        emphasisColor="#4744C8"
        tagline={hood.oneLiner}
        backHref={`/${cityId}/neighbourhoods`}
        backLabel="← All neighbourhoods"
      >
        <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: '#4744C8' }}>
          {hood.rentBallpark}
        </span>
        {hood.aka && (
          <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: 'rgba(10,10,10,0.4)' }}>
            Also: {hood.aka}
          </span>
        )}
      </PageMasthead>

      <article className="max-w-3xl mx-auto px-6 md:px-12 pt-10 pb-20">

        {/* Neighbourhood glyph — placeholder geometric mark per hood.
            Replaceable with commissioned illustrator art (see HoodGlyph.tsx). */}
        <div className="mb-8 flex justify-center">
          <HoodGlyph slug={slug} size={96} color="#4744C8" />
        </div>

        {/* The feel — drop cap opens the article like a magazine feature */}
        <section className="mb-12">
          <p className="flex items-baseline gap-2.5 text-[10px] font-black tracking-[0.22em] uppercase mb-3"
            style={{ color: '#4744C8' }}>
            <span className="text-[9px] tracking-[0.32em]" style={{ color: '#252450' }}>№ 01</span>
            What it feels like
          </p>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(10,10,10,0.78)' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: '5.5rem',
              lineHeight: 0.85,
              float: 'left',
              marginRight: '0.5rem',
              marginTop: '0.4rem',
              color: '#4744C8',
            }}>
              {hood.feels.charAt(0)}
            </span>
            {hood.feels.slice(1)}
          </p>
        </section>

        {/* Who lives here */}
        <section className="mb-12">
          <p className="flex items-baseline gap-2.5 text-[10px] font-black tracking-[0.22em] uppercase mb-3"
            style={{ color: '#FF3EBA' }}>
            <span className="text-[9px] tracking-[0.32em]" style={{ color: '#252450' }}>№ 02</span>
            Who lives here
          </p>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(10,10,10,0.75)' }}>
            {hood.whoLivesHere}
          </p>
        </section>

        {/* Practical */}
        <section className="mb-12">
          <p className="flex items-baseline gap-2.5 text-[10px] font-black tracking-[0.22em] uppercase mb-3"
            style={{ color: '#10B981' }}>
            <span className="text-[9px] tracking-[0.32em]" style={{ color: '#252450' }}>№ 03</span>
            The practical bit
          </p>
          <p className="text-base leading-relaxed mb-4" style={{ color: 'rgba(10,10,10,0.75)' }}>
            {hood.practical}
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px"
            style={{ background: 'rgba(10,10,10,0.08)' }}>
            <div style={{ background: '#fff' }} className="p-4">
              <dt className="text-[10px] font-black tracking-[0.18em] uppercase mb-1"
                style={{ color: 'rgba(10,10,10,0.4)' }}>Rent</dt>
              <dd className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>{hood.rentBallpark}</dd>
            </div>
            <div style={{ background: '#fff' }} className="p-4">
              <dt className="text-[10px] font-black tracking-[0.18em] uppercase mb-1"
                style={{ color: 'rgba(10,10,10,0.4)' }}>Transport</dt>
              <dd className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>{hood.transport}</dd>
            </div>
          </dl>
        </section>

        {/* Best for / Not ideal if */}
        <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-3"
              style={{ color: '#0E9B6B' }}>
              Best for
            </p>
            <ul className="space-y-2">
              {hood.bestFor.map(b => (
                <li key={b} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(10,10,10,0.75)' }}>
                  <span className="mt-2 w-1 h-1 rounded-full shrink-0" style={{ background: '#0E9B6B' }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-3"
              style={{ color: '#C0392B' }}>
              Not ideal if
            </p>
            <ul className="space-y-2">
              {hood.notIdealIf.map(b => (
                <li key={b} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(10,10,10,0.75)' }}>
                  <span className="mt-2 w-1 h-1 rounded-full shrink-0" style={{ background: '#C0392B' }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Anchor venues */}
        {venues.length > 0 && (
          <section className="mb-12">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-4"
              style={{ color: '#E8612A' }}>
              Where to eat &amp; drink in {hood.name}
            </p>
            <div className="space-y-px" style={{ background: 'rgba(10,10,10,0.08)' }}>
              {venues.map(v => (
                <div key={v.id} className="px-4 py-3 flex items-start gap-3" style={{ background: '#fff' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: '#0A0A0A' }}>
                      {v.name} <span className="text-[10px] font-medium ml-1"
                        style={{ color: 'rgba(10,10,10,0.4)' }}>· {v.category}</span>
                    </p>
                    {v.vibe && (
                      <p className="text-xs leading-snug mt-1" style={{ color: 'rgba(10,10,10,0.55)' }}>
                        {v.vibe}
                      </p>
                    )}
                  </div>
                  {v.price && (
                    <span className="text-[10px] font-bold shrink-0" style={{ color: '#E8612A' }}>
                      {v.price}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <Link href={`/${cityId}/eat`}
              className="inline-flex items-center gap-2 mt-4 text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
              style={{ color: '#E8612A' }}>
              All {city.name} venues →
            </Link>
          </section>
        )}

        {/* Related tasks */}
        {relatedTasks.length > 0 && (
          <section className="mb-12">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-4"
              style={{ color: '#FAB400' }}>
              If you&apos;re moving to {hood.name}
            </p>
            <div className="space-y-px" style={{ background: 'rgba(10,10,10,0.08)' }}>
              {relatedTasks.map(t => (
                <Link key={t.id} href={`/${cityId}/guide/${t.slug}`}
                  className="block px-4 py-3 hover:opacity-80 transition-opacity"
                  style={{ background: '#fff' }}>
                  <p className="text-sm font-bold" style={{ color: '#0A0A0A' }}>{t.title}</p>
                  <p className="text-xs leading-snug mt-1 line-clamp-1" style={{ color: 'rgba(10,10,10,0.5)' }}>
                    {t.summary}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-16 px-6 md:px-8 py-7 md:py-9" style={{ background: '#252450' }}>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-3"
            style={{ color: 'rgba(245,236,215,0.5)' }}>
            Moving to {hood.name}?
          </p>
          <h3 className="font-display font-black leading-tight mb-3"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', color: '#F5F4F0', letterSpacing: '-0.01em' }}>
            Make {hood.name}<br />
            <em className="not-italic" style={{ color: '#FF3EBA' }}>your roots.</em>
          </h3>
          <p className="text-sm md:text-base mb-6 max-w-md leading-relaxed"
            style={{ color: 'rgba(245,236,215,0.65)' }}>
            Free Roots account: get the settle-in checklist, save your favourite venues, ask the
            {' '}{city.name}-aware AI anything about life in {hood.name}.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${cityId}/settle`}
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ background: '#F5F4F0', color: '#252450' }}>
              Start your settle-in →
            </Link>
            <Link href={`/${cityId}/ask`}
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'rgba(245,236,215,0.55)', border: '1px solid rgba(245,236,215,0.2)' }}>
              Ask about {hood.name} →
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
