'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CITIES } from '@/lib/data/cities'
import { useProfile } from '@/lib/hooks/use-profile'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { LiveSettlerCount } from '@/components/city/LiveSettlerCount'
import type { CityId } from '@/lib/types'

const CITY_CONFIG: Record<string, { color: string }> = {
  brussels:  { color: '#4744C8' },
  lisbon:    { color: '#FF3EBA' },
  berlin:    { color: '#38C0F0' },
  barcelona: { color: '#E8612A' },
  amsterdam: { color: '#10B981' },
  prague:    { color: '#FAB400' },
}

/* ── Inner component that reads useSearchParams ──────────────────────────── */

function CitiesInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const fromProfile  = searchParams.get('from') === 'profile'
  const { setCity }  = useProfile()

  const [waitlistCity,  setWaitlistCity]  = useState<string | null>(null)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [submitted,     setSubmitted]     = useState<Record<string, boolean>>({})
  const [loading,       setLoading]       = useState(false)

  function handleCitySelect(cityId: string) {
    // Always persist the city — regardless of where we came from
    setCity(cityId as CityId)
    if (fromProfile) {
      router.push('/profile')
    } else {
      router.push(`/${cityId}`)
    }
  }

  const joinWaitlist = async (cityId: string) => {
    if (!waitlistEmail.trim() || loading) return
    setLoading(true)
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail.trim(), cityId }),
      })
      setSubmitted(prev => ({ ...prev, [cityId]: true }))
      setWaitlistEmail('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
      <Nav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pt-16 md:pt-24 pb-20 md:pb-28 border-b border-neutral-200" style={{ background: '#F5F4F0' }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] mb-6 font-semibold" style={{ color: '#252450', opacity: 0.45 }}>
            {fromProfile ? '← Profile · Choose your city' : 'Cities'}
          </p>
          <h1 className="font-display font-black leading-[0.85] tracking-tight mb-6"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 9rem)', color: '#252450' }}>
            {fromProfile
              ? <><span>Which city</span><br /><em className="not-italic" style={{ color: '#4744C8' }}>is home?</em></>
              : <><span>Where are</span><br /><em className="not-italic" style={{ color: '#4744C8' }}>you going?</em></>}
          </h1>
          <p className="text-lg leading-relaxed max-w-sm mb-2" style={{ color: '#252450', opacity: 0.6 }}>
            {fromProfile ? 'Pick your city to personalise your digest and checklist.' : 'Pick your city. We walk you through every step.'}
          </p>
        </div>
      </section>

      {/* ── City grid ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CITIES.map(city => {
            const cfg = CITY_CONFIG[city.id] ?? CITY_CONFIG.brussels
            return city.active ? (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city.id)}
                className="group bg-white hover:bg-neutral-50 transition-colors text-left w-full border border-neutral-200 hover:border-neutral-300"
                style={{ borderTop: `4px solid ${cfg.color}`, minHeight: 200 }}
              >
                <div className="p-8 flex flex-col justify-between h-full" style={{ minHeight: 200 }}>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3" style={{ color: 'rgba(37,36,80,0.35)' }}>
                      {city.country}
                    </p>
                    <h2 className="font-display font-black leading-[0.88] mb-3"
                      style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: '#252450' }}>
                      {city.name}
                    </h2>
                    <p className="text-sm leading-relaxed line-clamp-2 max-w-xs" style={{ color: 'rgba(37,36,80,0.5)' }}>
                      {city.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-8">
                    <span className="flex items-center gap-2 text-xs font-medium" style={{ color: 'rgba(37,36,80,0.35)' }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: cfg.color }} />
                      <LiveSettlerCount cityId={city.id} fallback={city.settlerCount} /> settling now
                    </span>
                    <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0"
                      style={{ color: cfg.color }}>
                      {fromProfile ? 'Select →' : 'Enter →'}
                    </span>
                  </div>
                </div>
              </button>
            ) : (
              <div key={city.id}
                className="border border-neutral-200 opacity-50"
                style={{ background: '#FAFAF8', minHeight: 200, borderTop: '4px solid rgba(37,36,80,0.15)' }}>
                <div className="p-8 flex flex-col justify-between h-full" style={{ minHeight: 200 }}>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone mb-3 font-medium">{city.country}</p>
                    <h2 className="font-display font-black leading-[0.88] mb-6"
                      style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: 'rgba(37,36,80,0.35)' }}>
                      {city.name}
                    </h2>
                  </div>
                  <div>
                    {submitted[city.id] ? (
                      <p className="text-sm text-stone flex items-center gap-2">
                        <span style={{ color: '#10B981' }}>✓</span> On the list
                      </p>
                    ) : waitlistCity === city.id ? (
                      <div className="space-y-2">
                        <input
                          type="email"
                          value={waitlistEmail}
                          onChange={e => setWaitlistEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && joinWaitlist(city.id)}
                          placeholder="your@email.com"
                          autoFocus
                          className="w-full px-3 py-2 bg-white border border-sand rounded-none text-sm text-espresso placeholder:text-stone/60 focus:outline-none focus:border-terracotta/50"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => joinWaitlist(city.id)}
                            disabled={!waitlistEmail.trim() || loading}
                            className="px-4 py-1.5 text-xs font-semibold text-white rounded-none disabled:opacity-40 hover:opacity-90 transition-opacity"
                            style={{ background: '#4744C8' }}>
                            {loading ? '…' : 'Notify me'}
                          </button>
                          <button onClick={() => setWaitlistCity(null)} className="text-xs text-stone hover:text-walnut transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setWaitlistCity(city.id)}
                        className="text-sm font-medium text-stone hover:text-walnut transition-colors underline underline-offset-2">
                        Coming soon — notify me
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Footer />
    </div>
  )
}

/* ── Page export — wraps inner in Suspense ───────────────────────────────── */

export default function CitiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#F5F4F0' }} />}>
      <CitiesInner />
    </Suspense>
  )
}
