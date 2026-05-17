import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import AuthGate from '@/components/auth/AuthGate'
import { ListingsPageClient } from '@/components/listings/ListingsPageClient'
import type { CityId } from '@/lib/types'

export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

export const metadata = {
  title: 'Listings — Settler housing + events | Roots',
  description:
    'Settler-posted housing listings and events in Brussels. Rooms, studios, gigs, dinners — by people who live here.',
}

interface SearchParamsShape { tab?: string }

export default async function ListingsPage({
  params,
  searchParams,
}: {
  params:        Promise<{ city: string }>
  searchParams:  Promise<SearchParamsShape>
}) {
  const { city: cityId } = await params
  const { tab }          = await searchParams
  const city = getCity(cityId)
  if (!city || !city.active) notFound()

  const initialTab: 'housing' | 'events' = tab === 'events' ? 'events' : 'housing'

  return (
    <AuthGate>
      <ListingsPageClient
        cityId={cityId as CityId}
        cityName={city.name}
        initialTab={initialTab} />
    </AuthGate>
  )
}
