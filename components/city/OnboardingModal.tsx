'use client'
import { useState } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'
import { STAGES } from '@/lib/data/cities'
import type { Stage, SituationTag } from '@/lib/types'


const STAGE_META: Record<string, { color: string; sub: string }> = {
  planning:     { color: '#6865CC', sub: 'Researching the move' },
  just_arrived: { color: '#B88A00', sub: 'Under 4 weeks in the city' },
  settling:     { color: '#1A8FAD', sub: '1–6 months — building routines' },
  settled:      { color: '#0E9B6B', sub: '6+ months — you know the city' },
}

const SITUATIONS: { id: SituationTag; label: string }[] = [
  { id: 'new_to_country',      label: 'New country'        },
  { id: 'new_to_city',         label: 'New city'           },
  { id: 'new_to_neighborhood', label: 'New neighbourhood'  },
  { id: 'local',               label: 'Local'              },
  { id: 'student',             label: 'Student'            },
  { id: 'employed',            label: 'Employee'           },
  { id: 'self_employed',       label: 'Freelancer'         },
  { id: 'digital_nomad',       label: 'Digital nomad'      },
  { id: 'renting',             label: 'Renting'            },
  { id: 'family',              label: 'With family'        },
]

interface Props { cityName: string; onDone: () => void }

export function OnboardingModal({ cityName, onDone }: Props) {
  const { updateProfile } = useProfile()
  const [step,       setStep]      = useState<'stage' | 'situation'>('stage')
  const [picked,     setPicked]    = useState<Stage | null>(null)
  const [sits,       setSits]      = useState<SituationTag[]>([])
  const [saving,     setSaving]    = useState(false)
  const [saveError,  setSaveError] = useState<string | null>(null)

  function toggleSit(id: SituationTag) {
    setSits(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  async function finish() {
    if (!picked) return
    setSaving(true)
    setSaveError(null)
    try {
      const updates: Parameters<typeof updateProfile>[0] = { stage: picked }
      if (sits.length) updates.situations = sits
      updateProfile(updates)
      onDone()
    } catch {
      setSaving(false)
      setSaveError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm" style={{ background: '#fff', border: '1px solid rgba(10,10,10,0.1)' }}>

        {/* Header */}
        <div className="px-6 pt-7 pb-5" style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-1.5"
            style={{ color: 'rgba(10,10,10,0.3)' }}>
            Welcome to {cityName}
          </p>
          <h2 className="font-display font-black text-xl leading-tight" style={{ color: '#0A0A0A' }}>
            {step === 'stage' ? 'What fits you best?' : 'Anything else?'}
          </h2>
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'rgba(10,10,10,0.4)' }}>
            {step === 'stage'
              ? 'Shapes your checklist — you can change it later.'
              : 'Optional. Helps filter what\'s relevant.'}
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
                      <div className="w-3 h-3 shrink-0 flex items-center justify-center transition-all"
                        style={{
                          border: `1.5px solid ${active ? '#4744C8' : 'rgba(10,10,10,0.2)'}`,
                          background: active ? '#4744C8' : 'transparent',
                        }}>
                        {active && <span style={{ color: '#fff', fontSize: '7px', lineHeight: 1, fontWeight: 900 }}>✓</span>}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: active ? '#4744C8' : '#0A0A0A' }}>
                        {s.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            {saveError && (
              <p className="px-6 pb-2 text-xs" style={{ color: '#C0392B' }}>{saveError}</p>
            )}
            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => setStep('stage')}
                className="px-4 py-3 text-sm"
                style={{ color: 'rgba(10,10,10,0.4)' }}>
                ← Back
              </button>
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 py-3 text-sm font-bold text-white transition-opacity"
                style={{ background: '#0A0A0A', opacity: saving ? 0.5 : 1 }}>
                {saving ? 'Saving…' : 'Done →'}
              </button>
            </div>
          </div>
        )}


      </div>
    </div>
  )
}
