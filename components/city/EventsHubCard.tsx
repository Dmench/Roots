import Link from 'next/link'
import { createAnonClient } from '@/lib/supabase/server'

interface Props {
  cityId: string
}

// Hub promotion for settler-posted Events. Sibling to HousingHubCard.
// Counts upcoming events posted in the next 7 days; reads "What's on this
// week" as the live signal. Links to /[city]/events.
export async function EventsHubCard({ cityId }: Props) {
  let upcomingWeek = 0
  let upcomingTotal = 0

  try {
    const sb = createAnonClient()
    const now    = new Date().toISOString()
    const week   = new Date(Date.now() + 7 * 86_400_000).toISOString()

    const [{ count: wc }, { count: tc }] = await Promise.all([
      sb.from('posts').select('id', { count: 'exact', head: true })
        .eq('city_id', cityId).eq('category', 'event')
        .gte('event_date', now).lt('event_date', week),
      sb.from('posts').select('id', { count: 'exact', head: true })
        .eq('city_id', cityId).eq('category', 'event')
        .gte('event_date', now),
    ])
    upcomingWeek  = wc ?? 0
    upcomingTotal = tc ?? 0
  } catch {
    /* Migration not run / transient — render the empty pitch. */
  }

  const headline = upcomingWeek > 0
    ? `${upcomingWeek} settler-hosted this week`
    : upcomingTotal > 0
      ? `${upcomingTotal} settler-hosted upcoming`
      : 'Host an event — be the first this week'

  const sub = upcomingTotal > 0
    ? 'Gigs, dinners, classes, meetups. Hosted by people who live here.'
    : 'Gigs, dinners, classes, meetups. Nothing scraped — only settlers.'

  return (
    <Link href={`/${cityId}/events`}
      className="block group hover:opacity-90 transition-opacity"
      style={{ background: '#FFFFFF', border: '2px solid #E8612A' }}>
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-6 md:py-5">
        <div className="min-w-0 flex items-center gap-4">
          <span className="shrink-0 inline-flex items-center justify-center"
            style={{ width: 44, height: 44, borderRadius: '50%', background: '#E8612A' }}>
            <span className="font-display font-black text-lg" style={{ color: '#FFFFFF' }}>
              E
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-0.5"
              style={{ color: '#E8612A' }}>
              Events
            </p>
            <p className="text-sm md:text-base font-semibold truncate" style={{ color: '#0A0A0A' }}>
              {headline}
            </p>
            <p className="text-[11px] md:text-xs truncate" style={{ color: 'rgba(10,10,10,0.55)' }}>
              {sub}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-black tracking-[0.18em] uppercase"
          style={{ color: '#E8612A' }}>
          Open →
        </span>
      </div>
    </Link>
  )
}
