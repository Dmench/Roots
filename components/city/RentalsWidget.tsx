import { getRentalData } from '@/lib/data/rentals'
import { RentalsClient } from './RentalsClient'

interface Props {
  cityId: string
}

// Server-side fetch of the full city rental dataset; the client child
// reads the user's profile.neighborhood and renders the commune-aware
// view (with delta vs city avg + a comparison dropdown). When the user
// hasn't picked a neighborhood, the client falls back to the original
// featured-commune list.
export async function RentalsWidget({ cityId }: Props) {
  if (cityId !== 'brussels') return null
  const data = await getRentalData(cityId)
  if (!data) return null
  return <RentalsClient cityId={cityId} data={data} />
}
