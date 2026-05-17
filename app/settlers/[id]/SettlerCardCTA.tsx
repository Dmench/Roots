'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'

interface Props {
  cityId?:    string  // undefined when the settler has no city set
  cityName?:  string
  settlerId:  string  // the profile id whose card is being viewed
}

// Auth-aware CTA at the foot of a public settler card. Swaps copy based
// on whether the viewer is signed in — fixes the "logged-in user sees
// 'Join Roots' on every settler page" bug.
export function SettlerCardCTA({ cityId, cityName, settlerId }: Props) {
  const { user, loading } = useAuth()
  const isOwn = !!user && user.id === settlerId

  // While auth state resolves, render an unstyled placeholder so layout
  // doesn't jump. ~100ms from localStorage.
  if (loading) {
    return <div className="block text-center py-3 text-[11px] tracking-[0.18em] uppercase"
      style={{ background: 'rgba(10,10,10,0.06)' }}>&nbsp;</div>
  }

  // Viewer is signed in — different copy, different destination.
  if (user) {
    if (isOwn) {
      return (
        <Link href="/profile"
          className="block text-center py-3 text-[11px] font-black tracking-[0.18em] uppercase text-white hover:opacity-90 transition-opacity"
          style={{ background: '#4744C8' }}>
          Edit your card →
        </Link>
      )
    }
    return (
      <Link href={cityId ? `/${cityId}/people` : '/cities'}
        className="block text-center py-3 text-[11px] font-black tracking-[0.18em] uppercase text-white hover:opacity-90 transition-opacity"
        style={{ background: '#4744C8' }}>
        {cityId ? `More settlers in ${cityName ?? 'this city'} →` : 'Browse cities →'}
      </Link>
    )
  }

  // Anon viewer — original "Join Roots" CTA.
  return (
    <Link href={cityId ? `/${cityId}` : '/cities'}
      className="block text-center py-3 text-[11px] font-black tracking-[0.18em] uppercase text-white hover:opacity-90 transition-opacity"
      style={{ background: '#4744C8' }}>
      Join Roots →
    </Link>
  )
}

// Pitch copy above the CTA — also auth-aware.
export function SettlerCardCTAPitch({ cityName, settlerId }: { cityName?: string; settlerId: string }) {
  const { user, loading } = useAuth()
  if (loading) return null
  const isOwn = !!user && user.id === settlerId
  if (user) {
    if (isOwn) {
      return (
        <p className="text-[11px] mb-4 text-center" style={{ color: 'rgba(10,10,10,0.4)' }}>
          This is your public card. Anyone with the link can see it.
        </p>
      )
    }
    return (
      <p className="text-[11px] mb-4 text-center" style={{ color: 'rgba(10,10,10,0.4)' }}>
        {cityName ? `Connect with other settlers in ${cityName}.` : 'See who else is settling near you.'}
      </p>
    )
  }
  return (
    <p className="text-[11px] mb-4 text-center" style={{ color: 'rgba(10,10,10,0.4)' }}>
      Settling in {cityName ?? 'a new city'}? Build your settler card.
    </p>
  )
}
