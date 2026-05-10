'use client'
import { getCity } from '@/lib/data/cities'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { AuthModal } from '@/components/auth/AuthModal'
import { GeometricThread } from '@/components/layout/GeometricThread'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const { user, loading, signOut } = useAuth()
  const { profile } = useProfile()
  const [authOpen,      setAuthOpen]      = useState(false)
  const [memberCount,   setMemberCount]   = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/settlers/brussels')
      .then(r => r.json())
      .then(d => { if (typeof d.total === 'number') setMemberCount(d.total) })
      .catch(() => {})
  }, [])

  const cityObj   = profile.cityId ? getCity(profile.cityId) : null
  const firstName = profile.displayName?.split(' ')[0]

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="min-h-screen bg-cream" />
  }

  // ── Signed-in ────────────────────────────────────────────────────────────
  if (user) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#FFFFFF' }}>
        {/* 4px brand rule — consistent with city hub */}
        <div style={{ height: 4, background: '#252450' }} />

        <GeometricThread accent="#FF3EBA" intensity="bold" />

        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 relative py-16">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black tracking-[0.28em] uppercase mb-6"
              style={{ color: 'rgba(10,10,10,0.4)' }}>
              Roots · Welcome back
            </p>

            {firstName ? (
              <h1 className="font-display font-black leading-[0.85] mb-5"
                style={{ fontSize: 'clamp(3.5rem, 11vw, 9rem)', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
                Hey,<br />
                <em className="not-italic" style={{ color: '#FF3EBA' }}>{firstName}.</em>
              </h1>
            ) : (
              <h1 className="font-display font-black leading-[0.85] mb-5"
                style={{ fontSize: 'clamp(3.5rem, 11vw, 9rem)', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
                Welcome<br />
                <em className="not-italic" style={{ color: '#FF3EBA' }}>back.</em>
              </h1>
            )}

            <p className="text-base md:text-lg mb-8 max-w-md leading-relaxed"
              style={{ color: 'rgba(10,10,10,0.55)' }}>
              {cityObj ? `Your ${cityObj.name} home is ready. Pick up wherever you left off.` : 'Pick up where you left off — settle, ask, or wander.'}
            </p>

            {/* Signal strip — small editorial chips */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-10 pt-5"
              style={{ borderTop: '1px solid rgba(10,10,10,0.1)' }}>
              {cityObj && (
                <span className="text-[10px] font-black tracking-[0.18em] uppercase"
                  style={{ color: '#4744C8' }}>
                  Settling in {cityObj.name}
                </span>
              )}
              {profile.stage && (
                <span className="text-[10px] font-black tracking-[0.18em] uppercase"
                  style={{ color: '#FAB400' }}>
                  {profile.stage.replace(/_/g, ' ')}
                </span>
              )}
              {profile.neighborhood && (
                <span className="text-[10px] font-black tracking-[0.18em] uppercase"
                  style={{ color: '#10B981' }}>
                  {profile.neighborhood.split(' / ')[0]}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {cityObj ? (
                <>
                  <Link href={`/${cityObj.id}`}
                    className="inline-flex items-center justify-center px-8 py-4 text-white font-bold text-sm hover:opacity-90 transition-opacity"
                    style={{ background: '#4744C8' }}>
                    Open {cityObj.name} →
                  </Link>
                  <Link href={`/${cityObj.id}/ask`}
                    className="inline-flex items-center justify-center px-8 py-4 font-bold text-sm hover:opacity-80 transition-opacity"
                    style={{ border: '2px solid rgba(10,10,10,0.15)', color: '#0A0A0A' }}>
                    Ask anything
                  </Link>
                </>
              ) : (
                <Link href="/cities"
                  className="inline-flex items-center justify-center px-8 py-4 text-white font-bold text-sm hover:opacity-90 transition-opacity"
                  style={{ background: '#4744C8' }}>
                  Choose your city →
                </Link>
              )}
              <Link href="/profile"
                className="inline-flex items-center justify-center px-8 py-4 font-medium text-sm hover:opacity-70 transition-opacity"
                style={{ color: 'rgba(10,10,10,0.4)' }}>
                Profile
              </Link>
            </div>

            <button onClick={signOut}
              className="mt-10 text-xs hover:opacity-60 transition-opacity"
              style={{ color: 'rgba(10,10,10,0.25)' }}>
              Sign out
            </button>
          </div>
        </div>

        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    )
  }

  // ── Signed-out splash ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#252450' }}>

      {/* Geometric shapes */}
      <div className="fixed rounded-full pointer-events-none"
        style={{ background: '#4744C8', width: '55vw', height: '55vw', maxWidth: 640, maxHeight: 640, top: '-20%', right: '-15%', opacity: 0.7 }} />
      <div className="fixed rounded-full pointer-events-none"
        style={{ background: '#FF3EBA', width: '18vw', height: '18vw', maxWidth: 200, maxHeight: 200, bottom: '12%', left: '6%', opacity: 0.5 }} />
      <div className="fixed pointer-events-none overflow-hidden"
        style={{ width: '12vw', height: '6vw', maxWidth: 140, maxHeight: 70, bottom: 0, right: '28%' }}>
        <div className="w-full rounded-full" style={{ background: '#FAB400', height: '12vw', maxHeight: 140, marginTop: '-6vw', opacity: 0.6 }} />
      </div>
      <div className="fixed rounded-full pointer-events-none"
        style={{ background: '#38C0F0', width: '8vw', height: '8vw', maxWidth: 90, maxHeight: 90, top: '40%', left: '3%', opacity: 0.4 }} />

      {/* Header */}
      <div className="relative px-8 md:px-12 pt-8 flex items-center justify-between">
        <span className="font-display font-black text-lg" style={{ color: '#F5F4F0' }}>Roots</span>
        <button
          onClick={() => setAuthOpen(true)}
          className="text-sm font-medium hover:opacity-70 transition-opacity"
          style={{ color: 'rgba(245,236,215,0.45)' }}>
          Sign in
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 relative py-12">
        <div className="max-w-2xl">

          <p className="text-[10px] font-black tracking-[0.28em] uppercase mb-6"
            style={{ color: 'rgba(245,236,215,0.35)' }}>
            Settle-in playbook · Brussels live
          </p>

          <h1 className="font-display font-black leading-[0.82] mb-8"
            style={{ fontSize: 'clamp(4.5rem, 14vw, 12rem)', color: '#F5F4F0' }}>
            Put down<br />
            <em className="not-italic" style={{ color: '#FF3EBA' }}>roots.</em>
          </h1>

          <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-md"
            style={{ color: 'rgba(245,236,215,0.65)' }}>
            Moving cities is sixty unwritten things in the right order. We&apos;ve written them down for Brussels —
            every form, every office, every gotcha — plus a community of people doing it at the same time as you.
          </p>

          {/* Three pillars */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-12"
            style={{ borderTop: '1px solid rgba(245,236,215,0.12)', paddingTop: 16 }}>
            {[
              { label: '60+ settle-in guides', color: '#FF3EBA' },
              { label: 'Live community feed',  color: '#38C0F0' },
              { label: 'Brussels-aware AI',    color: '#FAB400' },
            ].map(p => (
              <span key={p.label}
                className="text-[10px] font-black tracking-[0.18em] uppercase"
                style={{ color: p.color }}>
                {p.label}
              </span>
            ))}
          </div>

          {/* CTA pair — read first, sign up if you like it */}
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <Link
              href="/brussels/guide"
              className="inline-flex items-center justify-center px-10 py-4 text-base font-bold hover:opacity-90 transition-opacity"
              style={{ background: '#F5F4F0', color: '#252450' }}>
              Read the Brussels playbook →
            </Link>
            <button
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center justify-center px-10 py-4 text-base font-medium hover:opacity-100 transition-opacity"
              style={{ color: 'rgba(245,236,215,0.7)', border: '1px solid rgba(245,236,215,0.3)' }}>
              Join Roots
            </button>
          </div>

          <p className="mt-6 text-xs" style={{ color: 'rgba(245,236,215,0.25)' }}>
            60+ guides free, no signup. Sign up to save progress, ask the AI, join the community.
          </p>
        </div>
      </div>

      {/* Footer strip */}
      <div className="relative px-8 md:px-12 pb-8 flex items-center justify-between">
        <p className="text-xs" style={{ color: 'rgba(245,236,215,0.2)' }}>
          {memberCount !== null ? memberCount : 312} people settling in Brussels
        </p>
        <Link href="/cities"
          className="text-xs font-medium hover:opacity-70 transition-opacity"
          style={{ color: 'rgba(245,236,215,0.3)' }}>
          Explore cities →
        </Link>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} returnTo="/brussels" />
    </div>
  )
}
