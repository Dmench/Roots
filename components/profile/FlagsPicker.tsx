'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Flag } from '@/components/ui/Flag'
import { rankedCountries, getCountry } from '@/lib/data/countries'

interface Props {
  /** Currently selected country codes. */
  selected: string[]
  /** Called whenever the selection changes. */
  onChange: (codes: string[]) => void
  /** Close the modal — caller controls visibility. */
  onClose: () => void
  /** Hard cap on selection size. Default 8. */
  max?: number
}

// Modal-style multi-select picker for "where you've called home." Same idiom
// as the neighbourhood + situation pickers in /profile, with three additions
// the others don't need: a search input (250 countries is too many to scroll),
// a selected-chips strip at the top, and the live cap counter.
//
// Persistence is the caller's responsibility — this component just emits the
// next codes array on every change. Keep the modal open so the user can see
// their picks accumulate; "Done" closes.
export function FlagsPicker({ selected, onChange, onClose, max = 8 }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const ranked   = useMemo(() => rankedCountries(), [])

  useEffect(() => { inputRef.current?.focus() }, [])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? ranked.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().startsWith(q))
    : ranked

  function toggle(code: string) {
    if (selected.includes(code)) {
      onChange(selected.filter(c => c !== code))
    } else if (selected.length < max) {
      onChange([...selected, code])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full sm:max-w-md flex flex-col"
        style={{ background: '#fff', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header — sticky */}
        <div className="px-5 pt-5 pb-3 shrink-0 sticky top-0 z-10"
          style={{ background: '#fff', borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase"
              style={{ color: 'rgba(10,10,10,0.4)' }}>
              Where you&apos;ve called home
            </p>
            <span className="text-[10px] font-bold"
              style={{ color: selected.length >= max ? '#FF3EBA' : 'rgba(10,10,10,0.4)' }}>
              {selected.length} / {max}
            </span>
          </div>

          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search countries…"
            className="w-full px-3 py-2.5 text-sm focus:outline-none"
            style={{ border: '1px solid rgba(10,10,10,0.15)', color: '#0A0A0A', background: '#FFFFFF' }}
          />

          {/* Selected chips strip — only when something's picked */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selected.map(code => {
                const c = getCountry(code)
                return (
                  <button key={code} onClick={() => toggle(code)}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-black tracking-[0.1em] uppercase hover:opacity-70 transition-opacity"
                    style={{ background: 'rgba(71,68,200,0.08)', color: '#4744C8', border: '1px solid rgba(71,68,200,0.15)' }}>
                    <Flag code={code} size={14} />
                    <span>{c?.name ?? code}</span>
                    <span style={{ color: 'rgba(71,68,200,0.5)', fontSize: 12, lineHeight: 1 }}>×</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-xs px-5 py-8 text-center" style={{ color: 'rgba(10,10,10,0.4)' }}>
              No countries match &ldquo;{query}&rdquo;.
            </p>
          )}
          {filtered.map((c, i) => {
            const active   = selected.includes(c.code)
            const disabled = !active && selected.length >= max
            return (
              <button key={c.code}
                onClick={() => toggle(c.code)}
                disabled={disabled}
                className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(10,10,10,0.05)' : 'none',
                  background: active ? 'rgba(71,68,200,0.04)' : 'transparent',
                }}>
                <Flag code={c.code} size={22} />
                <span className="flex-1 text-sm"
                  style={{ color: active ? '#4744C8' : '#0A0A0A', fontWeight: active ? 700 : 400 }}>
                  {c.name}
                </span>
                {active && (
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#4744C8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer — sticky */}
        <button onClick={onClose}
          className="shrink-0 w-full py-4 text-sm font-bold transition-colors"
          style={{
            background: '#0A0A0A',
            color: '#FFFFFF',
            borderTop: '1px solid rgba(10,10,10,0.08)',
          }}>
          Done
        </button>
      </div>
    </div>
  )
}
