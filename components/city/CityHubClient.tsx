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

  // User feedback (May 2026): nobody is asking for the settle checklist yet —
  // the draw is venues and community. The stage-aware hero strip + settler-card
  // nudge that previously sat above the masthead pushed Settle hard on every
  // visit. Both removed. Onboarding modal is kept (it only fires once per user
  // and captures stage/situation for personalisation downstream).
  // Variables above (hero, showCardNudge, cardPct, allTasks, etc.) intentionally
  // kept — re-enable the strips by uncommenting if Settle priority shifts.
  void hero; void showCardNudge; void cardDone; void cardPct; void allTasks
  return (
    <>
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
