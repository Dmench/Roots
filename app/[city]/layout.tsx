import { notFound } from 'next/navigation'
import { Nav } from '@/components/layout/Nav'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'

export function generateStaticParams() {
  return ACTIVE_CITIES.map(city => ({ city: city.id }))
}

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ city: string }>
}) {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city || !city.active) notFound()

  return (
    <>
      <Nav />
      <main>{children}</main>
    </>
  )
}
