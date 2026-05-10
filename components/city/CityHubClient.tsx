'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import { getTasksForCity } from '@/lib/data/tasks'
import { OnboardingModal } from './OnboardingModal'

const STAGE_HERO: Record<string, { headline: string; sub: (tasks: number, done: number) => string; color: string; cta: string }> = {
  planning: {
    headline: 'Get ready before you arrive',
    sub: (t, d) => `${t - d} tasks to do before you land`,
    color: '#6865CC',
    cta: 'Start checklist →',
  },
  just_arrived: {
    headline: 'You just landed — here\'s what to do first',
    sub: (t, d) => `${t - d} tasks left · most urgent in week 1`,
    color: '#B88A00',
    cta: 'See tasks →',
  },
  settling: {
    headline: 'Mid-settle',
    sub: (t, d) => `${t - d} tasks still to go`,
    color: '#1A8FAD',
    cta: 'Keep going →',
  },
}

interface Props { cityName: string; cityId: string }

export function CityHubClient({ cityName, cityId }: Props) {
  const { user } = useAuth()
  const { profile, hydrated } = useProfile()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!hydrated || !user) return
    // Don't show if user already completed onboarding (persisted across sessions)
    if (localStorage.getItem('roots:onboarded') === '1') return
    if (!profile.stage) {
      // Defer 1.2s so the editorial masthead lands before the commitment ask.
      const t = setTimeout(() => setShowOnboarding(true), 1200)
      return () => clearTimeout(t)
    }
  }, [hydrated, user, profile.stage])

  function handleOnboardingDone() {
    localStorage.setItem('roots:onboarded', '1')
    setShowOnboarding(false)
  }

  // Stage-aware hero strip (not shown for 'settled' or unauthenticated)
  const stage = profile.stage
  const hero  = stage && stage !== 'settled' ? STAGE_HERO[stage] : null

  const allTasks  = hero ? getTasksForCity(cityId as import('@/lib/types').CityId) : []
  const doneCount = allTasks.length > 0
    ? (profile.completedTaskIds ?? []).filter(id => allTasks.some(t => t.id === id)).length
    : 0
  const pct = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0

  // Card completion nudge — shown for settled users or when hero is hidden
  const showCardNudge = hydrated && user && stage && !hero
  const cardFields = [
    profile.displayName,
    profile.neighborhood,
    profile.arrivalDate,
    (profile.spots ?? []).length > 0 ? 'has-spots' : null,
  ]
  const cardComplete = cardFields.filter(Boolean).length
  const cardTotal    = cardFields.length
  const cardPct      = Math.round((cardComplete / cardTotal) * 100)
  const cardDone     = cardPct === 100

  return (
    <>
      {/* Stage-aware hero strip */}
      {hero && hydrated && user && (
        <div style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-4">
            <div className="flex items-center gap-5">
              {/* Progress ring */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <div className="relative w-10 h-10">
                  <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(10,10,10,0.08)" strokeWidth="3" />
                    <circle cx="20" cy="20" r="16" fill="none" stroke={hero.color} strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      strokeDashoffset={`${2 * Math.PI * 16 * (1 - pct / 100)}`}
                      strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black"
                    style={{ color: hero.color }}>
                    {pct}%
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-black leading-tight" style={{ color: '#0A0A0A' }}>
                  {hero.headline}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(10,10,10,0.4)' }}>
                  {hero.sub(allTasks.length, doneCount)}
                </p>
              </div>

              <Link href={`/${cityId}/settle`}
                className="shrink-0 px-4 py-2 text-[10px] font-black tracking-[0.12em] uppercase text-white hover:opacity-80 transition-opacity"
                style={{ background: hero.color }}>
                {hero.cta}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Settler card nudge — shown for settled users whose card is incomplete */}
      {showCardNudge && !cardDone && (
        <div style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-3 flex items-center gap-5">
            {/* Mini progress bar */}
            <div className="shrink-0 flex flex-col gap-1">
              <div className="w-16 h-1" style={{ background: 'rgba(10,10,10,0.08)' }}>
                <div className="h-full transition-all duration-500"
                  style={{ width: `${cardPct}%`, background: '#FAB400' }} />
              </div>
              <span className="text-[8px] font-black" style={{ color: 'rgba(10,10,10,0.3)' }}>
                {cardPct}%
              </span>
            </div>
            <p className="flex-1 text-xs" style={{ color: 'rgba(10,10,10,0.45)' }}>
              Your settler card is{' '}
              <span className="font-black" style={{ color: '#0A0A0A' }}>{cardPct}% complete</span>
              {' '}— add {!profile.neighborhood && 'a neighborhood, '}
              {!profile.arrivalDate && 'arrival date, '}
              {(profile.spots ?? []).length === 0 && 'your favourite spots'}
              {' '}to share it.
            </p>
            <Link href="/profile"
              className="shrink-0 text-[10px] font-black tracking-[0.12em] uppercase hover:opacity-60 transition-opacity"
              style={{ color: '#FAB400' }}>
              Complete card →
            </Link>
          </div>
        </div>
      )}

      {/* Onboarding modal */}
      {showOnboarding && (
        <OnboardingModal
          cityName={cityName}
          onDone={handleOnboardingDone}
        />
      )}
    </>
  )
}
