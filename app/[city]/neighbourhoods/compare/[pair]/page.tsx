import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import {
  BRUSSELS_NEIGHBOURHOODS,
  getNeighbourhood,
} from '@/lib/data/neighbourhoods/brussels'
import type { Neighbourhood } from '@/lib/data/neighbourhoods/brussels'
import { GeometricThread } from '@/components/layout/GeometricThread'
import { PageMasthead } from '@/components/layout/PageMasthead'

// Programmatic SEO surface: every ordered pair of neighbourhoods gets a
// comparison landing page. With 12 neighbourhoods that's 66 unique pages,
// and the keyword family ("ixelles vs saint-gilles brussels", "uccle or
// etterbeek for families") is the highest-intent long-tail in the relocation
// search graph. We use slug-vs-slug in the URL for readability and SEO match.

function pairToSlugs(pair: string): [string, string] | null {
  const parts = pair.split('-vs-')
  if (parts.length !== 2) return null
  return [parts[0], parts[1]] as [string, string]
}

export function generateStaticParams() {
  return ACTIVE_CITIES.flatMap(city => {
    const hoods = BRUSSELS_NEIGHBOURHOODS.filter(n => n.cityId === city.id)
    const pairs: { city: string; pair: string }[] = []
    for (let i = 0; i < hoods.length; i++) {
      for (let j = 0; j < hoods.length; j++) {
        if (i === j) continue
        pairs.push({ city: city.id, pair: `${hoods[i].slug}-vs-${hoods[j].slug}` })
      }
    }
    return pairs
  })
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string; pair: string }> },
): Promise<Metadata> {
  const { city: cityId, pair } = await params
  const city = getCity(cityId)
  const slugs = pairToSlugs(pair)
  if (!city || !slugs) return { title: 'Not found' }
  const a = getNeighbourhood(slugs[0])
  const b = getNeighbourhood(slugs[1])
  if (!a || !b) return { title: 'Not found' }

  const title = `${a.name} vs ${b.name} — which ${city.name} neighbourhood fits you?`
  const description = `Comparing ${a.name} and ${b.name}: rent, transport, who lives there, and what each one actually feels like. Honest picks for newcomers to ${city.name}.`
  return {
    title,
    description: description.slice(0, 158),
    alternates: { canonical: `/${cityId}/neighbourhoods/compare/${pair}` },
    openGraph: { title, description: description.slice(0, 158), type: 'article' },
  }
}

function VerdictRow({ a, b, label, getA, getB }: {
  a: Neighbourhood; b: Neighbourhood; label: string;
  getA: (n: Neighbourhood) => string; getB?: (n: Neighbourhood) => string
}) {
  return (
    <div className="py-4" style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}>
      <p className="text-[10px] font-black tracking-[0.18em] uppercase mb-2 md:mb-0 md:pt-1"
        style={{ color: 'rgba(10,10,10,0.4)' }}>
        {label}
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[120px_1fr_1fr] md:gap-4">
        <div className="hidden md:block" />
        <div>
          <p className="text-[10px] font-black tracking-[0.18em] uppercase mb-1 md:hidden"
            style={{ color: '#4744C8' }}>
            {a.name}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#0A0A0A' }}>{getA(a)}</p>
        </div>
        <div>
          <p className="text-[10px] font-black tracking-[0.18em] uppercase mb-1 md:hidden"
            style={{ color: '#FF3EBA' }}>
            {b.name}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#0A0A0A' }}>{(getB ?? getA)(b)}</p>
        </div>
      </div>
    </div>
  )
}

export default async function CompareNeighbourhoodsPage(
  { params }: { params: Promise<{ city: string; pair: string }> },
) {
  const { city: cityId, pair } = await params
  const city = getCity(cityId)
  if (!city || !city.active) notFound()
  const slugs = pairToSlugs(pair)
  if (!slugs) notFound()
  const a = getNeighbourhood(slugs[0])
  const b = getNeighbourhood(slugs[1])
  if (!a || !b || a.slug === b.slug) notFound()

  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${a.name} vs ${b.name} — a Brussels neighbourhood comparison`,
    about: [
      { '@type': 'Place', name: `${a.name}, ${city.name}` },
      { '@type': 'Place', name: `${b.name}, ${city.name}` },
    ],
  }

  return (
    <div className="relative overflow-hidden" style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }} />
      <GeometricThread accent="#4744C8" />

      <PageMasthead
        eyebrow={`${city.name} · Side by side`}
        headline={`${a.name} vs`}
        emphasis={`${b.name}.`}
        emphasisColor="#FF3EBA"
        tagline={`Two of the neighbourhoods newcomers compare most. Same rent ballpark, very different feel — here's the honest read.`}
        backHref={`/${cityId}/neighbourhoods`}
        backLabel="← All neighbourhoods"
      />

      <article className="max-w-4xl mx-auto px-6 md:px-12 pt-10 pb-20">
        {/* Headline takes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px mb-12"
          style={{ background: 'rgba(10,10,10,0.1)' }}>
          {[a, b].map(n => (
            <div key={n.slug} className="p-6" style={{ background: '#fff' }}>
              <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
                style={{ color: '#4744C8' }}>
                {n.aka ?? n.name}
              </p>
              <h2 className="font-display font-black text-3xl mb-3 leading-tight"
                style={{ color: '#0A0A0A' }}>
                {n.name}
              </h2>
              <p className="text-sm leading-snug mb-4" style={{ color: 'rgba(10,10,10,0.65)' }}>
                {n.oneLiner}
              </p>
              <Link href={`/${cityId}/neighbourhoods/${n.slug}`}
                className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
                style={{ color: '#4744C8' }}>
                Full {n.name} guide →
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison rows */}
        <section className="mb-12">
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-4"
            style={{ color: '#FF3EBA' }}>
            Side by side
          </p>
          <div style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
            <VerdictRow a={a} b={b} label="Who lives there"  getA={n => n.whoLivesHere} />
            <VerdictRow a={a} b={b} label="Rent"             getA={n => n.rentBallpark} />
            <VerdictRow a={a} b={b} label="Transport"        getA={n => n.transport} />
            <VerdictRow a={a} b={b} label="Best for"         getA={n => n.bestFor.slice(0, 3).join(' · ')} />
            <VerdictRow a={a} b={b} label="Not ideal if"     getA={n => n.notIdealIf.slice(0, 2).join(' · ')} />
          </div>
        </section>

        {/* The pick — generic honest disclaimer */}
        <section className="mb-12 px-6 py-6"
          style={{ background: 'rgba(71,68,200,0.04)', border: '1px solid rgba(71,68,200,0.2)' }}>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
            style={{ color: '#4744C8' }}>
            Honest take
          </p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(10,10,10,0.75)' }}>
            Both are good. People who pick {a.name} usually want {a.bestFor[0].toLowerCase()};
            people who pick {b.name} usually want {b.bestFor[0].toLowerCase()}. If you can,
            walk both on the same Saturday morning — markets up, terraces full, locals out.
            You will know within an hour.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(10,10,10,0.75)' }}>
            And ask. Roots&apos; {city.name} AI knows both — commute times, school catchments,
            night quiet, weekend energy. It will not pick for you, but it will pick the right
            question.
          </p>
          <Link href={`/${cityId}/ask`}
            className="inline-flex items-center gap-2 mt-4 text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
            style={{ color: '#4744C8' }}>
            Ask the {city.name} AI →
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
            Whichever you pick.<br />
            <em className="not-italic" style={{ color: '#FF3EBA' }}>Roots handles the rest.</em>
          </h3>
          <p className="text-sm md:text-base mb-6 max-w-md leading-relaxed"
            style={{ color: 'rgba(245,236,215,0.65)' }}>
            Free account: get the settle-in checklist, save your favourite spots, ask the
            {city.name}-aware AI anything.
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
