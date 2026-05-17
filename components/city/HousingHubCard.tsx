import Link from 'next/link'
import { createAnonClient } from '@/lib/supabase/server'

interface Props {
  cityId: string
}

// Hub promotion for the Housing channel. Design council voted this in
// (unanimous, brand+growth+IA) as the way to surface Housing without
// adding it to the global nav: editorial card, live count, links to the
// dedicated /[city]/housing route. Above the fold on mobile.
export async function HousingHubCard({ cityId }: Props) {
  let total = 0
  let offers = 0
  let wanted = 0

  try {
    const sb = createAnonClient()
    // Live count of all active housing posts. Two HEAD queries is cheap.
    const [{ count: oc }, { count: wc }] = await Promise.all([
      sb.from('posts').select('id', { count: 'exact', head: true })
        .eq('city_id', cityId).eq('category', 'housing-offer'),
      sb.from('posts').select('id', { count: 'exact', head: true })
        .eq('city_id', cityId).eq('category', 'housing-wanted'),
    ])
    offers = oc ?? 0
    wanted = wc ?? 0
    total  = offers + wanted
  } catch {
    /* Migration not yet run or transient error — render the empty pitch. */
  }

  const headline = total > 0
    ? `${total} settler listing${total === 1 ? '' : 's'}`
    : 'Settler listings — yours could be the first'

  const sub = total > 0
    ? `${offers} for rent · ${wanted} wanted`
    : 'Rooms, studios, wanted ads. No agencies, no scrapers.'

  return (
    <Link href={`/${cityId}/listings?tab=housing`}
      className="block group relative transition-all overflow-hidden"
      style={{ background: '#FFFFFF', border: '2px solid #FAB400' }}>
      {/* Dynamic accent bar — slides full-width on hover, idle as a thin stub */}
      <span aria-hidden
        className="absolute left-0 bottom-0 h-[3px] w-3 group-hover:w-full transition-[width] duration-500 ease-out"
        style={{ background: '#FAB400' }} />
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-6 md:py-5">
        <div className="min-w-0 flex items-center gap-4">
          <span className="shrink-0 inline-flex items-center justify-center"
            style={{ width: 44, height: 44, borderRadius: '50%', background: '#FAB400' }}>
            <span className="font-display font-black text-lg" style={{ color: '#FFFFFF' }}>
              H
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-0.5"
              style={{ color: '#FAB400' }}>
              Housing
            </p>
            <p className="text-sm md:text-base font-semibold truncate" style={{ color: '#0A0A0A' }}>
              {headline}
            </p>
            <p className="text-[11px] md:text-xs truncate" style={{ color: 'rgba(10,10,10,0.55)' }}>
              {sub}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-black tracking-[0.18em] uppercase inline-flex items-center gap-1"
          style={{ color: '#FAB400' }}>
          Open
          <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  )
}
