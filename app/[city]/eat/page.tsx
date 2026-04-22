import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import { getVenues } from '@/lib/data/venues'
import { getRedditPosts } from '@/lib/data/reddit'
import EatSection from '@/components/city/EatSection'

export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

// Fully static — rebuilt on each deployment. Venue data doesn't change minute to minute.
export const dynamic = 'force-static'

export default async function EatPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city || !city.active) notFound()

  const [venues, reddit] = await Promise.all([
    getVenues(cityId),
    getRedditPosts(cityId),
  ])

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh' }}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ background: '#F5ECD7', borderBottom: '1px solid rgba(37,36,80,0.08)' }}>
        <div className="max-w-5xl mx-auto px-6 md:px-12 pt-10 pb-8">
          <Link href={`/${cityId}`}
            className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase mb-6 hover:opacity-50 transition-opacity"
            style={{ color: 'rgba(37,36,80,0.35)' }}>
            ← {city.name}
          </Link>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-black leading-none"
                style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', color: '#0F0E1E' }}>
                Eat & Drink
              </h1>
              <p className="text-sm mt-2" style={{ color: 'rgba(37,36,80,0.45)' }}>
                The best restaurants, bars, and cafés in {city.name} — ranked by popularity
              </p>
            </div>
            {venues.length > 0 && (
              <p className="text-xs font-medium shrink-0" style={{ color: 'rgba(37,36,80,0.3)' }}>
                {venues.length} places
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-10">
        <EatSection venues={venues} reddit={reddit} cityId={cityId} />
      </div>
    </div>
  )
}
