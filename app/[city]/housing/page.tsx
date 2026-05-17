import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import AuthGate from '@/components/auth/AuthGate'
import { HousingPageClient } from '@/components/housing/HousingPageClient'
import type { CityId } from '@/lib/types'

export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

export const metadata = {
  title: 'Housing — Settler listings | Roots',
  description:
    'Settler-posted housing listings — rooms, studios, and wanted ads in Brussels. No agencies.',
}

export default async function HousingPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city || !city.active) notFound()

  return (
    <AuthGate>
      <HousingPageClient cityId={cityId as CityId} cityName={city.name} />
    </AuthGate>
  )
}
