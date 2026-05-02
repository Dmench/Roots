'use client'
import { useState } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'
import { STAGES } from '@/lib/data/cities'
import type { Stage, SituationTag } from '@/lib/types'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

const STAGE_META: Record<string, { color: string; sub: string }> = {
  planning:     { color: '#6865CC', sub: 'Before you arrive' },
  just_arrived: { color: '#B88A00', sub: 'First 0–3 months' },
  settling:     { color: '#1A8FAD', sub: '3–12 months in' },
  settled:      { color: '#0E9B6B', sub: 'You know the city' },
}

const SITUATIONS: { id: SituationTag; label: string; emoji: string }[] = [
  { id: 'student',       label: 'Student',        emoji: '🎓' },
  { id: 'employed',      label: 'Employee',        emoji: '💼' },
  { id: 'self_employed', label: 'Freelancer',      emoji: '💻' },
  { id: 'digital_nomad', label: 'Digital nomad',   emoji: '🌍' },
  { id: 'renting',       label: 'Renting',         emoji: '🏠' },
  { id: 'family',        label: 'With family',     emoji: '👨‍👩‍👧' },
  { id: 'eu_citizen',    label: 'EU citizen',      emoji: '🇪🇺' },
  { id: 'non_eu',        label: 'Non-EU',          emoji: '✈️' },
]

interface Props { cityName: string; onDone: () => void }

export function OnboardingModal({ cityName, onDone }: Props) {
  const { setStage, updateProfile } = useProfile()
  const [step,       setStep]      = useState<'stage' | 'situation' | 'arrival'>('stage')
  const [picked,     setPicked]    = useState<Stage | null>(null)
  const [sits,       setSits]      = useState<SituationTag[]>([])
  const [arrMonth,   setArrMonth]  = useState<number | null>(null)
  const [arrYear,    setArrYear]   = useState<number>(currentYear)
  const [saving,     setSaving]    = useState(false)

  function toggleSit(id: SituationTag) {
    setSits(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  async function finish() {
    if (!picked) return
    setSaving(true)
    const updates: Parameters<typeof updateProfile>[0] = { stage: picked }
    if (sits.length) updates.situations = sits
    if (arrMonth !== null) {
      updates.arrivalDate = `${arrYear}-${String(arrMonth + 1).padStart(2, '0')}`
    }
    updateProfile(updates)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm shadow-2xl" style={{ background: '#fff' }}>

        {/* Header */}
        <div className="px-6 pt-7 pb-5" style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-1.5"
            style={{ color: 'rgba(10,10,10,0.3)' }}>
            Welcome to {cityName}
          </p>
          <h2 className="font-display font-black text-xl leading-tight" style={{ color: '#0A0A0A' }}>
            {step === 'stage' ? 'Where are you in your move?' : step === 'situation' ? 'A bit about your situation' : 'When did you arrive?'}
          </h2>
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'rgba(10,10,10,0.4)' }}>
            {step === 'stage'
              ? 'We\'ll use this to personalise your checklist and recommendations.'
              : step === 'situation'
              ? 'Select all that apply — this filters your settle tasks.'
              : 'Helps us track your timeline and show the right tasks.'}
          </p>
        </div>

        {/* Step 1 — Stage */}
        {step === 'stage' && (
          <div>
            {STAGES.map((s, i) => {
              const meta   = STAGE_META[s.id]
              const active = picked === s.id
              return (
                <button key={s.id}
                  onClick={() => setPicked(s.id as Stage)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-neutral-50 transition-colors"
                  style={{ borderBottom: i < STAGES.length - 1 ? '1px solid rgba(10,10,10,0.06)' : 'none' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: active ? meta.color : '#0A0A0A' }}>
                      {s.label}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(10,10,10,0.35)' }}>{meta.sub}</p>
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 shrink-0 transition-all"
                    style={{
                      borderColor: active ? meta.color : 'rgba(10,10,10,0.2)',
                      background:  active ? meta.color : 'transparent',
                    }} />
                </button>
              )
            })}
            <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(10,10,10,0.06)' }}>
              <button
                onClick={() => picked && setStep('situation')}
                disabled={!picked}
                className="w-full py-3 text-sm font-bold text-white transition-opacity"
                style={{ background: picked ? (STAGE_META[picked]?.color ?? '#4744C8') : '#0A0A0A', opacity: picked ? 1 : 0.25 }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Situations */}
        {step === 'situation' && (
          <div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-2">
                {SITUATIONS.map(s => {
                  const active = sits.includes(s.id)
                  return (
                    <button key={s.id}
                      onClick={() => toggleSit(s.id)}
                      className="flex items-center gap-2.5 px-3.5 py-3 text-left transition-all"
                      style={{
                        border: `1.5px solid ${active ? '#4744C8' : 'rgba(10,10,10,0.12)'}`,
                        background: active ? 'rgba(71,68,200,0.06)' : 'transparent',
                      }}>
                      <span className="text-base">{s.emoji}</span>
                      <span className="text-xs font-semibold" style={{ color: active ? '#4744C8' : '#0A0A0A' }}>
                        {s.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => setStep('stage')}
                className="px-4 py-3 text-sm"
                style={{ color: 'rgba(10,10,10,0.4)' }}>
                ← Back
              </button>
              <button
                onClick={() => setStep('arrival')}
                className="flex-1 py-3 text-sm font-bold text-white"
                style={{ background: '#0A0A0A' }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Arrival date */}
        {step === 'arrival' && (
          <div>
            <div className="px-6 py-5">
              {/* Month grid */}
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {MONTHS.map((m, i) => {
                  const active = arrMonth === i
                  return (
                    <button key={m}
                      onClick={() => setArrMonth(i)}
                      className="py-2 text-xs font-semibold transition-all"
                      style={{
                        border: `1.5px solid ${active ? '#4744C8' : 'rgba(10,10,10,0.12)'}`,
                        background: active ? 'rgba(71,68,200,0.06)' : 'transparent',
                        color: active ? '#4744C8' : '#0A0A0A',
                      }}>
                      {m}
                    </button>
                  )
                })}
              </div>
              {/* Year selector */}
              <div className="flex gap-1.5">
                {YEARS.map(y => {
                  const active = arrYear === y
                  return (
                    <button key={y}
                      onClick={() => setArrYear(y)}
                      className="flex-1 py-2 text-xs font-semibold transition-all"
                      style={{
                        border: `1.5px solid ${active ? '#4744C8' : 'rgba(10,10,10,0.12)'}`,
                        background: active ? 'rgba(71,68,200,0.06)' : 'transparent',
                        color: active ? '#4744C8' : '#0A0A0A',
                      }}>
                      {y}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] mt-3" style={{ color: 'rgba(10,10,10,0.35)' }}>
                Skip if you prefer not to say.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-2" style={{ borderTop: '1px solid rgba(10,10,10,0.06)' }}>
              <button
                onClick={() => setStep('situation')}
                className="px-4 py-3 text-sm"
                style={{ color: 'rgba(10,10,10,0.4)' }}>
                ← Back
              </button>
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 py-3 text-sm font-bold text-white transition-opacity"
                style={{ background: '#0A0A0A', opacity: saving ? 0.5 : 1 }}>
                {saving ? 'Saving…' : 'Go to my checklist →'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
