'use client'
import { useEffect, useState } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'
import { STAGES } from '@/lib/data/cities'
import type { CityId, Stage } from '@/lib/types'

interface Props {
  cityId: string
  cityName: string
}

const DISMISSED_KEY = 'roots:onboarding-dismissed'

export default function OnboardingPrompt({ cityId, cityName }: Props) {
  const { profile, hydrated, setCity, setStage } = useProfile()
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === '1')
  }, [])

  // Auto-set city from URL
  useEffect(() => {
    if (!hydrated) return
    if (!profile.cityId) setCity(cityId as CityId)
  }, [hydrated, profile.cityId, cityId, setCity])

  if (!hydrated) return null
  if (dismissed) return null
  if (profile.cityId && profile.stage) return null

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  // Prompt: pick your stage
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:px-8 md:pb-6 pointer-events-none">
      <div className="max-w-xl mx-auto pointer-events-auto">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#0F0E1E', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 -4px 40px rgba(0,0,0,0.4)' }}>

          <div className="flex items-start justify-between px-5 pt-4 pb-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-[9px] font-black tracking-[0.28em] uppercase" style={{ color: '#FAB400' }}>
                Welcome to {cityName}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(245,244,240,0.6)' }}>
                Where are you in your move?
              </p>
            </div>
            <button
              onClick={dismiss}
              className="text-[10px] mt-0.5 hover:opacity-60 transition-opacity"
              style={{ color: 'rgba(245,244,240,0.3)' }}>
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            {STAGES.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setStage(s.id as Stage)
                  setDismissed(true)
                }}
                className="text-left px-4 py-3 rounded-xl transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[9px] font-black tracking-widest uppercase mb-0.5" style={{ color: 'rgba(245,244,240,0.35)' }}>
                  {s.months}
                </p>
                <p className="text-xs font-bold" style={{ color: '#F5F4F0' }}>
                  {s.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
