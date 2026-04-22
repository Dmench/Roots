import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import { getVenues } from '@/lib/data/venues'
import { getRedditPosts } from '@/lib/data/reddit'
import EatSection from '@/components/city/EatSection'

export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

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

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 md:px-12 pt-12 pb-0">

        <Link href={`/${cityId}`}
          className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-[0.28em] uppercase mb-10 hover:opacity-40 transition-opacity"
          style={{ color: 'rgba(15,14,30,0.35)' }}>
          ← {city.name}
        </Link>

        <div className="mb-12">
          <p className="text-[9px] font-black tracking-[0.28em] uppercase mb-4"
            style={{ color: 'rgba(15,14,30,0.35)' }}>
            {city.name} — Eat &amp; Drink
          </p>
          <h1 className="font-display font-black leading-none"
            style={{ fontSize: 'clamp(3rem, 10vw, 6.5rem)', color: '#0F0E1E', letterSpacing: '-0.025em' }}>
            Where to eat,<br />drink &amp; be.
          </h1>
        </div>

        <div className="h-px mb-12" style={{ background: 'rgba(15,14,30,0.12)' }} />
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 md:px-12 pb-20">
        <EatSection venues={venues} reddit={reddit} cityId={cityId} />
      </div>
    </div>
  )
}
