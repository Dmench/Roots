import Link from 'next/link'
import { getRentalData } from '@/lib/data/rentals'
import type { RentalStats } from '@/lib/data/rentals'

interface Props {
  cityId: string
}

// Top 8 communes most relevant to expats settling in Brussels
const FEATURED_COMMUNES = [
  'Ixelles', 'Saint-Gilles', 'Etterbeek', 'Schaerbeek',
  'Forest', 'Uccle', 'Woluwe-Saint-Lambert', 'Bruxelles',
]

export async function RentalsWidget({ cityId }: Props) {
  if (cityId !== 'brussels') return null
  const data = await getRentalData(cityId)
  if (!data) return null

  const featured = FEATURED_COMMUNES
    .map(name => data.communes.find(c => c.commune === name))
    .filter((c): c is RentalStats => !!c)
    .slice(0, 6)

  if (!featured.length) return null

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between pb-3 mb-1"
        style={{ borderBottom: '1px solid rgba(10,10,10,0.12)' }}>
        <span className="text-xs font-black tracking-[0.16em] uppercase"
          style={{ color: 'rgba(10,10,10,0.5)' }}>
          Rent prices
        </span>
        <Link href={`/${cityId}/settle`}
          className="text-[10px] font-black tracking-widest uppercase hover:opacity-50 transition-opacity"
          style={{ color: '#FAB400' }}>
          Settle in →
        </Link>
      </div>

      {/* City average pill */}
      {data.cityAvg1BR && (
        <div className="flex items-center gap-2 py-2.5 mb-1"
          style={{ borderBottom: '1px solid rgba(10,10,10,0.06)' }}>
          <span className="text-[9px] font-black tracking-wide uppercase"
            style={{ color: 'rgba(10,10,10,0.35)' }}>
            City avg
          </span>
          <span className="flex-1" />
          <span className="text-[10px] font-bold" style={{ color: '#FAB400' }}>
            1BR €{data.cityAvg1BR}
          </span>
          {data.cityAvg2BR && (
            <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.35)' }}>
              · 2BR €{data.cityAvg2BR}
            </span>
          )}
        </div>
      )}

      {/* Commune rows */}
      {featured.map((c: RentalStats, i: number) => (
        <div key={c.commune}
          className="flex items-baseline gap-2 py-2"
          style={{ borderTop: i > 0 ? '1px solid rgba(10,10,10,0.05)' : 'none' }}>
          <span className="text-[10px] font-medium flex-1 truncate"
            style={{ color: '#0A0A0A' }}>
            {c.commune}
          </span>
          {c.avgRent1BR && (
            <span className="text-[10px] font-bold shrink-0"
              style={{ color: 'rgba(10,10,10,0.7)' }}>
              €{c.avgRent1BR}
            </span>
          )}
          {c.avgRent2BR && (
            <span className="text-[10px] shrink-0"
              style={{ color: 'rgba(10,10,10,0.3)' }}>
              / €{c.avgRent2BR}
            </span>
          )}
        </div>
      ))}

      <p className="text-[9px] mt-2" style={{ color: 'rgba(10,10,10,0.2)' }}>
        Source: StatBel {featured[0]?.year ?? '2023'} · avg/month
      </p>
    </section>
  )
}
