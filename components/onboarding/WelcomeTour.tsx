'use client'
import { useState } from 'react'

interface TourStep {
  eyebrow:        string
  headlinePart1:  string
  emphasis:       string
  body:           string
  /** Accent colour matching the section being introduced. */
  accent:         string
  /** Optional CTA label for the final step; defaults to "Next →". */
  ctaLabel?:      string
}

// 5-step welcome tour shown on first city-hub visit after the user finishes
// the stage/situation onboarding modal. Each step introduces one capability,
// colour-coded to the section it points to. Skippable at any time; saves a
// localStorage flag so it never re-pops.
//
// Designed to feel editorial, not SaaS: typographic, brand-coloured hero
// block per step, single emphasis word per headline mirroring the masthead
// pattern across the rest of the platform.
function steps(cityName: string): TourStep[] {
  return [
    {
      eyebrow:       'Welcome to Roots',
      headlinePart1: "You're in.",
      emphasis:      `${cityName} is yours.`,
      accent:        '#FF3EBA', // brand pink
      body:          "Quick tour — 30 seconds. We'll walk you through what's here. Or skip and start exploring; everything's where you'd expect.",
    },
    {
      eyebrow:       'The hub',
      headlinePart1: 'Your daily',
      emphasis:      `${cityName}.`,
      accent:        '#252450', // brand navy
      body:          "What's on this week, where to eat, what locals are talking about. The page you're on right now — Editor's Picks at the top, events, transport alerts, the Reddit pulse, your saved events.",
    },
    {
      eyebrow:       'Eat & Drink',
      headlinePart1: 'Where to',
      emphasis:      'actually eat.',
      accent:        '#E8612A', // terracotta
      body:          '82 venues, sorted by vibe — friends in town, fancy, cozy, dancing, wholesome. Not Yelp. Not TripAdvisor. People who live here picked these.',
    },
    {
      eyebrow:       'Your settler card',
      headlinePart1: 'Build your',
      emphasis:      'card.',
      accent:        '#4744C8', // brand purple
      body:          "Five things — name, neighbourhood, arrival year, places you've lived, a favourite spot. Then you've settled. The 60-task settling checklist is optional, sitting on your profile if you want admin help.",
    },
    {
      eyebrow:       'Community & Ask',
      headlinePart1: 'Tips, questions,',
      emphasis:      'AI.',
      accent:        '#FAB400', // amber
      body:          "Real settlers sharing real tips. And an AI that actually knows Brussels — ask anything about admin, healthcare, neighbourhoods, the 3-6-9 lease, whatever. Whether you moved from across the world or across town.",
      ctaLabel:      `Enter ${cityName}`,
    },
  ]
}

interface Props {
  cityName: string
  onDone:   () => void
}

export function WelcomeTour({ cityName, onDone }: Props) {
  const TOUR = steps(cityName)
  const [step, setStep] = useState(0)
  const current = TOUR[step]
  const isLast  = step === TOUR.length - 1

  function next() {
    if (isLast) onDone()
    else setStep(s => s + 1)
  }
  function back() {
    if (step > 0) setStep(s => s - 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: 'rgba(8,9,30,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full sm:max-w-md flex flex-col"
        style={{ background: '#FFFFFF', border: '2px solid #0A0A0A' }}>

        {/* 4px accent rule that shifts colour with each step */}
        <div style={{ height: 4, background: current.accent, transition: 'background 0.4s ease' }} />

        {/* Header — step counter + skip */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <span className="text-[9px] font-black tracking-[0.24em] uppercase"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            {step + 1} <span style={{ color: 'rgba(10,10,10,0.18)' }}>/</span> {TOUR.length}
          </span>
          <button onClick={onDone}
            className="text-[10px] font-bold tracking-wider uppercase hover:opacity-60 transition-opacity"
            style={{ color: 'rgba(10,10,10,0.45)' }}>
            Skip tour
          </button>
        </div>

        {/* Hero — colour block with brand circles inside it */}
        <div className="relative overflow-hidden mx-6 mt-3"
          style={{ background: current.accent, height: 140, transition: 'background 0.4s ease' }}>
          {/* Decorative geometric shapes — echo the brand thread on the rest of the platform */}
          <div className="absolute rounded-full pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.22)', width: 130, height: 130, top: -40, right: -30 }} />
          <div className="absolute rounded-full pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.13)', width: 56, height: 56, bottom: -10, left: '34%' }} />
          <div className="absolute rounded-full pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.18)', width: 28, height: 28, top: 18, left: 22 }} />

          {/* Eyebrow at the bottom of the hero */}
          <div className="absolute inset-0 flex items-end px-5 pb-3">
            <p className="text-[10px] font-black tracking-[0.28em] uppercase"
              style={{ color: 'rgba(255,255,255,0.92)' }}>
              {current.eyebrow}
            </p>
          </div>
        </div>

        {/* Body — editorial typography */}
        <div className="px-6 pt-5 pb-2">
          <h2 className="font-display font-black leading-[0.95] mb-4"
            style={{
              fontSize: 'clamp(1.8rem, 5.5vw, 2.4rem)',
              color: '#0A0A0A',
              letterSpacing: '-0.02em',
            }}>
            {current.headlinePart1}<br />
            <em className="not-italic" style={{ color: current.accent }}>{current.emphasis}</em>
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: 'rgba(10,10,10,0.7)' }}>
            {current.body}
          </p>
        </div>

        {/* Footer — progress dots + Back + Next */}
        <div className="flex items-center justify-between px-6 pb-5 pt-5">
          <div className="flex items-center gap-1.5">
            {TOUR.map((s, i) => (
              <span key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 14 : 6,
                  height: 6,
                  background: i <= step ? s.accent : 'rgba(10,10,10,0.15)',
                }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={back}
                className="px-3 py-2 text-[10px] font-black tracking-[0.16em] uppercase hover:opacity-60 transition-opacity"
                style={{ color: 'rgba(10,10,10,0.5)' }}>
                ← Back
              </button>
            )}
            <button onClick={next}
              className="px-6 py-2.5 text-[11px] font-black tracking-[0.16em] uppercase text-white hover:opacity-90 transition-opacity"
              style={{ background: current.accent }}>
              {isLast ? (current.ctaLabel ?? `Enter ${cityName}`) : 'Next'} →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
