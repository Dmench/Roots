import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import { getNeighbourhoodsForCity } from '@/lib/data/neighbourhoods/brussels'
import type { CityId } from '@/lib/types'
import { GeometricThread } from '@/components/layout/GeometricThread'
import { PageMasthead } from '@/components/layout/PageMasthead'
import { HoodGlyph } from '@/components/neighbourhoods/HoodGlyph'

export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> },
): Promise<Metadata> {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city) return { title: 'Not found' }
  const hoods = getNeighbourhoodsForCity(cityId as CityId)
  const desc  = `Brussels neighbourhood guide for newcomers — ${hoods.length} editorial profiles covering Ixelles, Saint-Gilles, Dansaert, Flagey, Marolles, and the EU Quarter. Rent ballparks, transport, who lives there, and what each one actually feels like.`
  return {
    title: `Where to live in ${city.name} — a newcomer's neighbourhood guide`,
    description: desc.slice(0, 158),
    alternates: { canonical: `/${cityId}/neighbourhoods` },
    openGraph: {
      title: `Where to live in ${city.name} — a newcomer's neighbourhood guide`,
      description: desc.slice(0, 158),
      type: 'website',
    },
  }
}

export default async function NeighbourhoodsIndex(
  { params }: { params: Promise<{ city: string }> },
) {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city || !city.active) notFound()

  const hoods = getNeighbourhoodsForCity(cityId as CityId)
  if (hoods.length === 0) notFound()

  return (
    <div className="relative overflow-hidden" style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <GeometricThread accent="#4744C8" />

      <PageMasthead
        eyebrow={`${city.name} · Neighbourhood guide`}
        headline="Where to"
        emphasis="actually live."
        emphasisColor="#4744C8"
        tagline={`${hoods.length} editorial profiles of the neighbourhoods most people end up choosing between — rent ballparks, transport, who lives there, what it actually feels like.`}
      >
        <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: '#4744C8' }}>
          {hoods.length} guides
        </span>
        <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: '#10B981' }}>
          Free · No signup
        </span>
      </PageMasthead>

      <div className="max-w-4xl mx-auto px-6 md:px-12 pt-10 pb-20">

        <p className="text-base leading-relaxed mb-12 max-w-2xl" style={{ color: 'rgba(10,10,10,0.7)' }}>
          Brussels has 19 communes and roughly 30 named neighbourhoods inside them. Most newcomers
          spend weeks comparing them based on apartment listings, then move and discover the data they
          actually needed — what the streets feel like at 7pm, who lives next door, where the Saturday
          market is. Below is what we wish someone had written for us.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px"
          style={{ background: 'rgba(10,10,10,0.1)' }}>
          {hoods.map(h => (
            <Link key={h.slug} href={`/${cityId}/neighbourhoods/${h.slug}`}
              className="block px-6 py-7 hover:opacity-80 transition-opacity relative"
              style={{ background: '#fff' }}>
              {/* Placeholder geometric glyph — replaceable with commissioned art */}
              <div className="absolute top-5 right-5 opacity-50">
                <HoodGlyph slug={h.slug} size={44} color="#4744C8" />
              </div>
              <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
                style={{ color: '#4744C8' }}>
                {h.aka ?? h.name}
              </p>
              <h2 className="font-display font-black text-2xl mb-3 leading-tight"
                style={{ color: '#0A0A0A' }}>
                {h.name}
              </h2>
              <p className="text-sm leading-snug mb-4 pr-12" style={{ color: 'rgba(10,10,10,0.65)' }}>
                {h.oneLiner}
              </p>
              <div className="flex items-center gap-3 text-[10px] font-bold tracking-wide"
                style={{ color: 'rgba(10,10,10,0.4)' }}>
                <span>{h.rentBallpark}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 px-6 md:px-8 py-7 md:py-9" style={{ background: '#252450' }}>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-3"
            style={{ color: 'rgba(245,236,215,0.5)' }}>
            Picking where to live
          </p>
          <h3 className="font-display font-black leading-tight mb-3"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', color: '#F5F4F0', letterSpacing: '-0.01em' }}>
            Ask anything about<br />
            <em className="not-italic" style={{ color: '#FF3EBA' }}>where to land.</em>
          </h3>
          <p className="text-sm md:text-base mb-6 max-w-md leading-relaxed"
            style={{ color: 'rgba(245,236,215,0.65)' }}>
            Free Roots account: ask the {city.name}-aware AI about commute times, school catchments,
            night quiet, or which commune fits your situation.
          </p>
          <Link href={`/${cityId}/ask`}
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: '#F5F4F0', color: '#252450' }}>
            Ask the {city.name} AI →
          </Link>
        </div>
      </div>
    </div>
  )
}
