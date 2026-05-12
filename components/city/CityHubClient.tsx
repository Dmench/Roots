'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import { OnboardingModal } from './OnboardingModal'
import { WelcomeTour } from '@/components/onboarding/WelcomeTour'

interface Props { cityName: string; cityId: string }

// Settler Card completion — the new "settle progress" surface. Five fields,
// each independent of the 60-task expat checklist (which is its own thing
// at /[city]/settle). Stage + situation come from onboarding for
// personalisation, NOT counted in card completion.
const CARD_FIELDS = ['name', 'neighborhood', 'arrival', 'flags', 'spots'] as const
const CARD_LABELS: Record<typeof CARD_FIELDS[number], string> = {
  name:         'name',
  neighborhood: 'neighborhood',
  arrival:      'arrival',
  flags:        'places lived',
  spots:        'a favourite spot',
}

export function CityHubClient({ cityName, cityId }: Props) {
  const { user } = useAuth()
  const { profile, hydrated } = useProfile()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showTour, setShowTour]             = useState(false)

  // Onboarding modal logic — fixed to handle multi-device / cleared-localStorage.
  // Old behaviour: relied only on localStorage 'roots:onboarded' flag. If a user
  // signed in on a new device or cleared storage, the modal would re-pop even
  // though they'd already answered in Supabase. New behaviour: if profile.stage
  // is already set (synced from DB), we mark them onboarded and skip the modal.
  useEffect(() => {
    if (!hydrated || !user) return
    // Already-onboarded signal — either flag is enough
    const flagged   = typeof window !== 'undefined' && localStorage.getItem('roots:onboarded') === '1'
    const seenStage = !!profile.stage
    if (flagged || seenStage) {
      // Keep the flag in sync so subsequent visits short-circuit without waiting
      // for the profile fetch.
      if (seenStage && !flagged) {
        try { localStorage.setItem('roots:onboarded', '1') } catch { /* private mode */ }
      }
      return
    }
    // Defer 1.2s so the editorial masthead lands before the commitment ask.
    const t = setTimeout(() => setShowOnboarding(true), 1200)
    return () => clearTimeout(t)
  }, [hydrated, user, profile.stage])

  function handleOnboardingDone() {
    try { localStorage.setItem('roots:onboarded', '1') } catch { /* private mode */ }
    setShowOnboarding(false)
  }

  // Welcome tour — fires once per user, after stage/situation onboarding is
  // complete. Separate localStorage key so users who onboarded before the
  // tour existed still get a chance to see it.
  useEffect(() => {
    if (!hydrated || !user) return
    if (showOnboarding) return                  // wait for the stage modal
    if (!profile.stage) return                  // not onboarded yet — onboarding modal will fire first
    const tourDone = typeof window !== 'undefined' && localStorage.getItem('roots:tour-complete') === '1'
    if (tourDone) return
    const t = setTimeout(() => setShowTour(true), 700)
    return () => clearTimeout(t)
  }, [hydrated, user, showOnboarding, profile.stage])

  function handleTourDone() {
    try { localStorage.setItem('roots:tour-complete', '1') } catch { /* private mode */ }
    setShowTour(false)
  }

  // ── Settler Card completion ──────────────────────────────────────────────
  // Five fields the user fills on /profile. Drives the only nudge that shows
  // on the hub. Independent of the 60-task expat checklist.
  const cardState = {
    name:         !!profile.displayName,
    neighborhood: !!profile.neighborhood,
    arrival:      !!profile.arrivalDate,
    flags:        (profile.flags ?? []).length > 0,
    spots:        (profile.spots ?? []).length > 0,
  }
  const cardDoneCount = CARD_FIELDS.filter(f => cardState[f]).length
  const cardTotal     = CARD_FIELDS.length
  const cardDone      = cardDoneCount === cardTotal
  const missing       = CARD_FIELDS.filter(f => !cardState[f])
  const showCardNudge = hydrated && !!user && !cardDone

  return (
    <>
      {/* Settler Card completion strip — the only persistent nudge on the hub.
          Pushes Profile card completion, not the 60-task expat checklist. */}
      {showCardNudge && (
        <div style={{ borderBottom: '1px solid rgba(10,10,10,0.08)', background: '#FAFAF7' }}>
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-3 flex items-center gap-5">
            {/* Progress ring */}
            <div className="shrink-0 relative w-10 h-10">
              <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
                <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(10,10,10,0.08)" strokeWidth="3" />
                <circle cx="20" cy="20" r="16" fill="none" stroke="#FF3EBA" strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - cardDoneCount / cardTotal)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black"
                style={{ color: '#FF3EBA' }}>
                {cardDoneCount}/{cardTotal}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-black leading-tight" style={{ color: '#0A0A0A' }}>
                {cardDoneCount === 0
                  ? 'Build your settler card'
                  : cardDoneCount === cardTotal - 1
                    ? `Almost there — add your ${CARD_LABELS[missing[0]]}`
                    : `Settler card — ${cardTotal - cardDoneCount} ${cardTotal - cardDoneCount === 1 ? 'thing' : 'things'} left`}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(10,10,10,0.45)' }}>
                {missing.map(f => CARD_LABELS[f]).join(' · ')}
              </p>
            </div>

            <Link href="/profile"
              className="shrink-0 px-4 py-2 text-[10px] font-black tracking-[0.14em] uppercase text-white hover:opacity-90 transition-opacity"
              style={{ background: '#FF3EBA' }}>
              Complete card →
            </Link>
          </div>
        </div>
      )}

      {/* Onboarding modal — stage + situation for downstream personalisation.
          Only fires once per user (localStorage + DB stage check above). */}
      {showOnboarding && (
        <OnboardingModal
          cityName={cityName}
          onDone={handleOnboardingDone}
        />
      )}

      {/* 5-step welcome tour — fires after onboarding for first-time users. */}
      {showTour && !showOnboarding && (
        <WelcomeTour cityName={cityName} onDone={handleTourDone} />
      )}
    </>
  )
}

/* The 60-task expat checklist lives at /[city]/settle and is intentionally
   NOT promoted here. It's a separate experience for users who want to dive
   into the admin/logistics layer. The settler-card completion above is what
   "settling in" means at first-touch — fill the card, you're set up. */
