'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { AuthModal } from '@/components/auth/AuthModal'

interface Props {
  children: React.ReactNode
  cityName?: string
  cityId?:   string
}

export default function AuthGate({ children, cityName = 'Brussels', cityId = 'brussels' }: Props) {
  const { user, loading } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  // Auth context lives in the layout and persists across navigations.
  // loading=true only on the very first app load (sub-100ms from localStorage).
  if (loading) {
    return <div className="min-h-screen bg-cream" />
  }

  // Authenticated — render the page
  if (user) return <>{children}</>

  // Gate
  return (
    <>
      <div className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: '#0F0E1E' }}>

        {/* Background geometry */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute rounded-full"
            style={{ width: 600, height: 600, top: -200, right: -150, background: '#4744C8', opacity: 0.18, filter: 'blur(80px)' }} />
          <div className="absolute rounded-full"
            style={{ width: 300, height: 300, bottom: -80, left: -80, background: '#FF3EBA', opacity: 0.12, filter: 'blur(60px)' }} />
          <div className="absolute rounded-full"
            style={{ width: 200, height: 200, bottom: '20%', right: '10%', background: '#FAB400', opacity: 0.08, filter: 'blur(50px)' }} />
        </div>

        {/* Top bar */}
        <div className="relative flex items-center justify-between px-8 md:px-12 pt-8">
          <span className="font-display font-black text-lg" style={{ color: '#F5F4F0' }}>Roots</span>
          <button
            onClick={() => setAuthOpen(true)}
            className="text-xs font-black tracking-widest uppercase hover:opacity-60 transition-opacity"
            style={{ color: 'rgba(245,244,240,0.4)' }}>
            Sign in
          </button>
        </div>

        {/* Main gate content */}
        <div className="relative flex-1 flex flex-col justify-center px-8 md:px-16 py-16">
          <div className="max-w-2xl">

            {/* Eyebrow */}
            <p className="text-[9px] font-black tracking-[0.32em] uppercase mb-6"
              style={{ color: 'rgba(245,244,240,0.3)' }}>
              Members only · {cityName}
            </p>

            {/* City name — huge */}
            <h1 className="font-display font-black leading-none mb-6"
              style={{
                fontSize: 'clamp(4rem, 13vw, 10rem)',
                color: '#F5F4F0',
                letterSpacing: '-0.03em',
              }}>
              {cityName}.
            </h1>

            {/* Value prop */}
            <p className="text-base md:text-lg mb-3 leading-relaxed max-w-md"
              style={{ color: 'rgba(245,244,240,0.55)', fontWeight: 400 }}>
              Events, venues, news, community — everything a city has to offer, curated for people who actually live there.
            </p>

            <p className="text-sm mb-10"
              style={{ color: 'rgba(245,244,240,0.28)' }}>
              Not a tourist guide. Built for people who are here for real.
            </p>

            {/* What's inside — pill hints */}
            <div className="flex flex-wrap gap-2 mb-10">
              {[
                { label: 'Tonight\'s events',  color: '#FF3EBA' },
                { label: 'Curated venues',      color: '#E8612A' },
                { label: 'Local news',          color: '#38C0F0' },
                { label: 'Ask the city AI',     color: '#FAB400' },
                { label: 'Find your people',    color: '#4744C8' },
              ].map(p => (
                <span key={p.label}
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold"
                  style={{ background: `${p.color}12`, color: p.color, border: `1px solid ${p.color}25` }}>
                  {p.label}
                </span>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-base hover:opacity-90 transition-opacity"
              style={{ background: '#F5F4F0', color: '#0F0E1E' }}>
              Join Roots
              <span className="text-sm opacity-40">→</span>
            </button>

            {/* Social proof */}
            <p className="mt-5 text-xs" style={{ color: 'rgba(245,244,240,0.2)' }}>
              Free to join · Your city, your data
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative px-8 md:px-12 pb-8">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(245,244,240,0.06)' }} />
            <span className="text-[8px] font-black tracking-[0.3em] uppercase"
              style={{ color: 'rgba(245,244,240,0.12)' }}>
              Free to join · Your city, your data
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(245,244,240,0.06)' }} />
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </>
  )
}
