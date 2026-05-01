'use client'
import { getCity } from '@/lib/data/cities'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { AuthModal } from '@/components/auth/AuthModal'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const { user, loading, signOut } = useAuth()
  const { profile } = useProfile()
  const [authOpen,    setAuthOpen]    = useState(false)
  const [memberCount, setMemberCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/settlers/brussels')
      .then(r => r.json())
      .then(d => { if (typeof d.total === 'number') setMemberCount(d.total) })
      .catch(() => {})
  }, [])

  const cityObj   = profile.cityId ? getCity(profile.cityId) : null
  const firstName = profile.displayName?.split(' ')[0]

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return <div className="min-h-screen" style={{ background: '#FFFFFF' }} />

  // ── Signed-in ────────────────────────────────────────────────────────────
  if (user) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>

        {/* Brand rule — 4px indigo across top */}
        <div style={{ height: 4, background: '#252450' }} />

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 md:px-14 py-5"
          style={{ borderBottom: '1px solid rgba(10,10,10,0.07)' }}>
          <span className="font-display font-black text-xl" style={{ color: '#0A0A0A' }}>Roots</span>
          <button
            onClick={signOut}
            className="text-xs font-medium hover:opacity-50 transition-opacity"
            style={{ color: 'rgba(10,10,10,0.28)' }}>
            Sign out
          </button>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-14 py-16">
          <div className="max-w-xl">

            <p className="text-[9px] font-black tracking-[0.32em] uppercase mb-8"
              style={{ color: 'rgba(10,10,10,0.28)' }}>
              Roots · Welcome back
            </p>

            <h1
              className="font-display font-black leading-[0.85]"
              style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', color: '#0A0A0A', letterSpacing: '-0.03em' }}>
              {firstName ? `Hey,\n${firstName}.` : 'Welcome\nback.'}
            </h1>

            {/* Short rule */}
            <div className="mt-8 mb-7" style={{ height: 2, background: '#0A0A0A', width: 48 }} />

            <p className="text-sm mb-10" style={{ color: 'rgba(10,10,10,0.45)', lineHeight: 1.65 }}>
              {cityObj
                ? `Your ${cityObj.name} guide is ready.`
                : 'Choose your city to get started.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {cityObj ? (
                <>
                  <Link
                    href={`/${cityObj.id}`}
                    className="inline-flex items-center justify-center px-8 py-4 text-white font-bold text-sm hover:opacity-90 transition-opacity"
                    style={{ background: '#252450' }}>
                    Open {cityObj.name} →
                  </Link>
                  <Link
                    href={`/${cityObj.id}/ask`}
                    className="inline-flex items-center justify-center px-8 py-4 font-bold text-sm hover:opacity-75 transition-opacity"
                    style={{ border: '2px solid #0A0A0A', color: '#0A0A0A' }}>
                    Ask anything
                  </Link>
                </>
              ) : (
                <Link
                  href="/cities"
                  className="inline-flex items-center justify-center px-8 py-4 text-white font-bold text-sm hover:opacity-90 transition-opacity"
                  style={{ background: '#252450' }}>
                  Choose your city →
                </Link>
              )}
            </div>

            <Link
              href="/profile"
              className="mt-8 inline-block text-xs font-medium hover:opacity-50 transition-opacity"
              style={{ color: 'rgba(10,10,10,0.28)' }}>
              Profile settings
            </Link>
          </div>
        </div>

        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    )
  }

  // ── Signed-out splash ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── LEFT PANEL — brand anchor ────────────────────────────────────── */}
      <div
        className="flex flex-col justify-between px-8 py-8 md:px-10 md:py-12 md:w-[38%] md:min-h-screen shrink-0"
        style={{ background: '#252450' }}>

        {/* Override width on md+ via a sibling trick — simpler: use className + inline */}
        {/* Top: wordmark */}
        <div className="flex items-center justify-between md:block">
          <span className="font-display font-black text-xl" style={{ color: '#FFFFFF' }}>Roots</span>
          {/* Mobile only: sign-in */}
          <button
            onClick={() => setAuthOpen(true)}
            className="md:hidden text-sm font-medium hover:opacity-60 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            Sign in
          </button>
        </div>

        {/* Middle: city anchor — hidden on mobile (compact strip) */}
        <div className="hidden md:block">
          <p className="text-[8px] font-black tracking-[0.32em] uppercase mb-4"
            style={{ color: 'rgba(255,255,255,0.28)' }}>
            Now live
          </p>
          <p className="font-display font-black leading-none mb-6"
            style={{ fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', color: '#FFFFFF', letterSpacing: '-0.025em' }}>
            Brussels
          </p>

          {/* Member count */}
          <div className="flex items-center gap-2.5 mb-10">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: '#FAB400' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#FAB400' }} />
            </span>
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {memberCount ?? 312} members settling in
            </p>
          </div>

          {/* Coming soon */}
          <div className="space-y-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
            <p className="text-[8px] font-black tracking-[0.28em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Coming soon
            </p>
            {['Berlin', 'Lisbon', 'Amsterdam', 'Barcelona'].map(city => (
              <p key={city} className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.22)' }}>
                {city}
              </p>
            ))}
          </div>
        </div>

        {/* Bottom: copyright */}
        <p className="hidden md:block text-[10px]" style={{ color: 'rgba(255,255,255,0.12)' }}>
          © 2025 Roots
        </p>
      </div>

      {/* ── RIGHT PANEL — editorial content ──────────────────────────────── */}
      <div
        className="flex-1 flex flex-col justify-center px-8 md:px-14 lg:px-20 py-16 relative"
        style={{ background: '#FFFFFF', minHeight: '100vh' }}>

        {/* Sign in — top right (desktop) */}
        <button
          onClick={() => setAuthOpen(true)}
          className="hidden md:block absolute top-10 right-10 text-sm font-medium hover:opacity-50 transition-opacity"
          style={{ color: 'rgba(10,10,10,0.35)' }}>
          Sign in
        </button>

        <div className="max-w-lg">

          {/* Eyebrow */}
          <p className="text-[9px] font-black tracking-[0.32em] uppercase mb-8"
            style={{ color: '#FAB400' }}>
            City membership
          </p>

          {/* Headline */}
          <h1
            className="font-display font-black leading-[0.85] mb-10"
            style={{ fontSize: 'clamp(4rem, 11vw, 8.5rem)', color: '#0A0A0A', letterSpacing: '-0.03em' }}>
            Put down<br />roots.
          </h1>

          {/* Sub copy */}
          <p className="text-base mb-10 leading-relaxed"
            style={{ color: 'rgba(10,10,10,0.5)', maxWidth: 380 }}>
            The city guide built by and for the people who actually live here — locals, settlers, and neighbours.
          </p>

          {/* Three pillars — vertical bars */}
          <div className="flex flex-col gap-4 mb-12"
            style={{ borderTop: '1px solid rgba(10,10,10,0.08)', paddingTop: 20 }}>
            {[
              { label: 'Guided settle-in checklist',  color: '#FAB400' },
              { label: 'Community of settlers',        color: '#4744C8' },
              { label: 'AI that knows the city',       color: '#38C0F0' },
            ].map(p => (
              <div key={p.label} className="flex items-center gap-3.5">
                <div className="shrink-0" style={{ width: 3, height: 18, background: p.color }} />
                <p className="text-sm font-medium" style={{ color: 'rgba(10,10,10,0.65)' }}>
                  {p.label}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => setAuthOpen(true)}
            className="inline-flex items-center justify-center px-10 py-4 text-white font-bold text-base hover:opacity-90 transition-opacity"
            style={{ background: '#252450' }}>
            Join Roots →
          </button>

        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} returnTo="/brussels" />
    </div>
  )
}
