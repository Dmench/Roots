'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CITIES } from '@/lib/data/cities'
import { useProfile } from '@/lib/hooks/use-profile'
import { Nav } from '@/components/layout/Nav'
import type { CityId } from '@/lib/types'

const CITY_CONFIG: Record<string, { bg: string; shape1: string; shape2: string }> = {
  brussels:  { bg: '#4744C8', shape1: '#38C0F0', shape2: '#FAB400' },
  lisbon:    { bg: '#252450', shape1: '#FF3EBA', shape2: '#38C0F0' },
  berlin:    { bg: '#38C0F0', shape1: '#4744C8', shape2: '#FAB400' },
  barcelona: { bg: '#FF3EBA', shape1: '#FAB400', shape2: '#4744C8' },
  amsterdam: { bg: '#252450', shape1: '#38C0F0', shape2: '#FF3EBA' },
  prague:    { bg: '#4744C8', shape1: '#FF3EBA', shape2: '#38C0F0' },
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
    if (fromProfile) {
      setCity(cityId as CityId)
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
      <section className="relative overflow-hidden px-6 md:px-10 pt-16 md:pt-24 pb-20 md:pb-28" style={{ background: '#F5F4F0' }}>
        <div className="absolute rounded-full pointer-events-none"
          style={{ background: '#4744C8', width: '36vw', height: '36vw', maxWidth: 480, maxHeight: 480, top: '-22%', right: '-10%' }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ background: '#38C0F0', width: '18vw', height: '18vw', maxWidth: 240, maxHeight: 240, bottom: '5%', right: '18%' }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ background: '#FAB400', width: '10vw', height: '10vw', maxWidth: 140, maxHeight: 140, bottom: '-5%', left: '5%' }} />
        <div className="absolute pointer-events-none overflow-hidden" style={{ width: 100, height: 50, bottom: 0, right: '42%' }}>
          <div className="w-full rounded-full" style={{ background: '#FF3EBA', height: 100, marginTop: -50 }} />
        </div>

        <div className="max-w-6xl mx-auto relative">
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
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-espresso/15 text-left w-full"
                style={{ background: cfg.bg, minHeight: 240 }}
              >
                <div className="absolute rounded-full pointer-events-none"
                  style={{ background: cfg.shape1, opacity: 0.3, width: 200, height: 200, bottom: -60, right: -40 }} />
                <div className="absolute rounded-full pointer-events-none"
                  style={{ background: cfg.shape2, opacity: 0.35, width: 80, height: 80, top: 20, right: 24 }} />
                <div className="absolute pointer-events-none"
                  style={{ background: 'rgba(255,255,255,0.12)', width: 60, height: 60, top: '50%', left: 24, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />

                <div className="relative p-8 flex flex-col justify-between h-full" style={{ minHeight: 240 }}>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-3" style={{ color: 'rgba(245,236,215,0.5)' }}>
                      {city.country}
                    </p>
                    <h2 className="font-display font-black text-white leading-[0.88] mb-3"
                      style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
                      {city.name}
                    </h2>
                    <p className="text-sm leading-relaxed line-clamp-2 max-w-xs" style={{ color: 'rgba(245,236,215,0.65)' }}>
                      {city.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-8">
                    <span className="flex items-center gap-2 text-xs font-medium" style={{ color: 'rgba(245,236,215,0.5)' }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: '#38C0F0' }} />
                      {city.settlerCount} settling now
                    </span>
                    <span className="text-sm font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      {fromProfile ? 'Select →' : 'Enter →'}
                    </span>
                  </div>
                </div>
              </button>
            ) : (
              <div key={city.id}
                className="relative rounded-2xl overflow-hidden border border-sand/30 opacity-55"
                style={{ background: '#F5F4F0', minHeight: 240 }}>
                <div className="absolute rounded-full pointer-events-none"
                  style={{ background: '#D8CABB', opacity: 0.35, width: 120, height: 120, bottom: -30, right: -20 }} />
                <div className="relative p-8 flex flex-col justify-between h-full" style={{ minHeight: 240 }}>
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
                          className="w-full px-3 py-2 bg-white border border-sand rounded-lg text-sm text-espresso placeholder:text-stone/60 focus:outline-none focus:border-terracotta/50"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => joinWaitlist(city.id)}
                            disabled={!waitlistEmail.trim() || loading}
                            className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
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

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="px-6 md:px-10 py-12 border-t border-sand/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-display font-black text-xl mb-1" style={{ color: '#252450' }}>Roots</p>
            <p className="text-sm text-stone">Put down roots, anywhere.</p>
          </div>
          <div className="flex flex-wrap gap-8 text-sm text-stone">
            <Link href="/" className="hover:text-espresso transition-colors">Home</Link>
            <Link href="/brussels" className="hover:text-espresso transition-colors">Brussels</Link>
            <Link href="/lisbon" className="hover:text-espresso transition-colors">Lisbon</Link>
            <a href="mailto:hello@roots.so" className="hover:text-espresso transition-colors">Contact</a>
          </div>
        </div>
      </footer>
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
