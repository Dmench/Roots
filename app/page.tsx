'use client'
import { getCity } from '@/lib/data/cities'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { AuthModal } from '@/components/auth/AuthModal'
import { useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const { user, loading, signOut } = useAuth()
  const { profile } = useProfile()
  const [authOpen, setAuthOpen] = useState(false)

  const cityObj   = profile.cityId ? getCity(profile.cityId) : null
  const firstName = profile.displayName?.split(' ')[0]

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="min-h-screen" style={{ background: '#252450' }} />
  }

  // ── Signed-in ────────────────────────────────────────────────────────────
  if (user) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#F5F4F0' }}>
        {/* Shapes */}
        <div className="fixed rounded-full pointer-events-none"
          style={{ background: '#4744C8', width: 400, height: 400, top: -160, right: -100, opacity: 0.85 }} />
        <div className="fixed rounded-full pointer-events-none"
          style={{ background: '#38C0F0', width: 120, height: 120, bottom: 60, right: '18%', opacity: 0.5 }} />
        <div className="fixed pointer-events-none overflow-hidden"
          style={{ width: 90, height: 45, bottom: 0, left: '38%' }}>
          <div className="w-full rounded-full" style={{ background: '#FF3EBA', height: 90, marginTop: -45, opacity: 0.65 }} />
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 relative">
          <div className="max-w-lg">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-6"
              style={{ color: 'rgba(37,36,80,0.3)' }}>
              Roots · Welcome back
            </p>
            <h1 className="font-display font-black leading-[0.85] mb-5"
              style={{ fontSize: 'clamp(3.5rem, 10vw, 8rem)', color: '#252450' }}>
              {firstName ? `Hey,\n${firstName}.` : 'Welcome\nback.'}
            </h1>
            <p className="text-base mb-10" style={{ color: 'rgba(37,36,80,0.5)', maxWidth: 300 }}>
              {cityObj ? `Your ${cityObj.name} home is ready.` : 'Pick up where you left off.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {cityObj ? (
                <>
                  <Link href={`/${cityObj.id}`}
                    className="inline-flex items-center justify-center px-8 py-4 text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                    style={{ background: '#4744C8' }}>
                    Open {cityObj.name} →
                  </Link>
                  <Link href={`/${cityObj.id}/ask`}
                    className="inline-flex items-center justify-center px-8 py-4 rounded-full font-bold text-sm hover:opacity-80 transition-opacity"
                    style={{ border: '2px solid rgba(37,36,80,0.15)', color: '#252450' }}>
                    Ask anything
                  </Link>
                </>
              ) : (
                <Link href="/cities"
                  className="inline-flex items-center justify-center px-8 py-4 text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                  style={{ background: '#4744C8' }}>
                  Choose your city →
                </Link>
              )}
              <Link href="/profile"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full font-medium text-sm hover:opacity-70 transition-opacity"
                style={{ color: 'rgba(37,36,80,0.4)' }}>
                Profile
              </Link>
            </div>

            <button onClick={signOut}
              className="mt-10 text-xs hover:opacity-60 transition-opacity"
              style={{ color: 'rgba(37,36,80,0.25)' }}>
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
        <span className="font-display font-black text-lg" style={{ color: '#F5ECD7' }}>Roots</span>
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
            City intelligence · Starting with Brussels
          </p>

          <h1 className="font-display font-black leading-[0.82] mb-8"
            style={{ fontSize: 'clamp(4.5rem, 14vw, 12rem)', color: '#F5ECD7' }}>
            Know your<br />
            <em className="not-italic" style={{ color: '#FF3EBA' }}>city.</em>
          </h1>

          <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-sm"
            style={{ color: 'rgba(245,236,215,0.6)' }}>
            Every event, venue, headline, and community signal — structured, curated, and useful. City by city.
          </p>

          {/* Three pillars */}
          <div className="flex flex-wrap gap-2 mb-12">
            {[
              { label: 'Events from every venue', color: '#FF3EBA' },
              { label: 'Local news & Reddit signal', color: '#38C0F0' },
              { label: 'AI that knows the city', color: '#FAB400' },
            ].map(p => (
              <span key={p.label}
                className="px-4 py-2 rounded-full text-xs font-bold"
                style={{ background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40` }}>
                {p.label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <button
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center justify-center px-10 py-4 text-base font-bold rounded-full hover:opacity-90 transition-opacity"
              style={{ background: '#F5F4F0', color: '#252450' }}>
              Open Brussels →
            </button>
            <Link href="/brussels"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full hover:opacity-60 transition-opacity"
              style={{ color: 'rgba(245,236,215,0.4)' }}>
              Browse first
            </Link>
          </div>

          <p className="mt-6 text-xs" style={{ color: 'rgba(245,236,215,0.25)' }}>
            Free to join. Your city, your data.
          </p>
        </div>
      </div>

      {/* Footer strip */}
      <div className="relative px-8 md:px-12 pb-8 flex items-center justify-between">
        <p className="text-xs" style={{ color: 'rgba(245,236,215,0.2)' }}>
          312 people settling in Brussels
        </p>
        <Link href="/brussels"
          className="text-xs font-medium hover:opacity-70 transition-opacity"
          style={{ color: 'rgba(245,236,215,0.3)' }}>
          Explore Brussels →
        </Link>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} returnTo="/brussels" />
    </div>
  )
}
