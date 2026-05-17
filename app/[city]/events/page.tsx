import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import AuthGate from '@/components/auth/AuthGate'
import { EventsPageClient } from '@/components/events/EventsPageClient'
import type { CityId } from '@/lib/types'

export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

export const metadata = {
  title: 'Events — Settler-posted | Roots',
  description:
    'Gigs, classes, dinners, meetups posted by settlers. What\'s on this week in Brussels — by people who live here.',
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city || !city.active) notFound()

  return (
    <AuthGate>
      <EventsPageClient cityId={cityId as CityId} cityName={city.name} />
    </AuthGate>
  )
}
