'use client'
import { useState } from 'react'

interface Props {
  /** Current arrival date in "YYYY-MM" or "YYYY-MM-DD" form (we only use Y+M). */
  value:    string | undefined
  /** Called with "YYYY-MM" when the user confirms. */
  onChange: (yearMonth: string) => void
  onClose:  () => void
}

const MONTHS = [
  { code: '01', label: 'Jan' }, { code: '02', label: 'Feb' }, { code: '03', label: 'Mar' },
  { code: '04', label: 'Apr' }, { code: '05', label: 'May' }, { code: '06', label: 'Jun' },
  { code: '07', label: 'Jul' }, { code: '08', label: 'Aug' }, { code: '09', label: 'Sep' },
  { code: '10', label: 'Oct' }, { code: '11', label: 'Nov' }, { code: '12', label: 'Dec' },
]

// Custom arrival-month picker. Replaces the previous hidden <input type="month">
// + showPicker() approach which (a) rendered a tiny native widget in the
// page corner instead of anchored to the chip, and (b) didn't fire reliably
// across Safari / mobile. Two-column modal — years on the left, months on
// the right. Same idiom as the neighbourhood / situation / flags pickers.
export function ArrivalPicker({ value, onChange, onClose }: Props) {
  const currentYear = new Date().getFullYear()
  // Show ~15 years back, plus the next year (someone planning to move).
  const years = Array.from({ length: 16 }, (_, i) => currentYear + 1 - i)

  const [year, setYear]   = useState<number>(value ? parseInt(value.slice(0, 4)) : currentYear)
  const [month, setMonth] = useState<string>(value ? value.slice(5, 7) : '01')

  function save() {
    onChange(`${year}-${month}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full sm:max-w-md flex flex-col"
        style={{ background: '#FFFFFF', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 pt-5 pb-3"
          style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            When did you arrive?
          </p>
          <p className="text-sm mt-1" style={{ color: 'rgba(10,10,10,0.55)' }}>
            Pick the year and month. Use your best guess — you can edit later.
          </p>
        </div>

        {/* Pickers — two columns */}
        <div className="grid grid-cols-[1fr_1fr] gap-px flex-1 overflow-hidden"
          style={{ background: 'rgba(10,10,10,0.08)' }}>

          {/* Years column */}
          <div className="overflow-y-auto" style={{ background: '#FFFFFF' }}>
            <p className="sticky top-0 px-4 py-2 text-[9px] font-black tracking-[0.22em] uppercase"
              style={{ color: 'rgba(10,10,10,0.4)', background: '#FAFAF7', borderBottom: '1px solid rgba(10,10,10,0.06)' }}>
              Year
            </p>
            {years.map(y => {
              const active = y === year
              return (
                <button key={y}
                  onClick={() => setYear(y)}
                  className="w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors"
                  style={{
                    background: active ? 'rgba(71,68,200,0.05)' : 'transparent',
                    borderBottom: '1px solid rgba(10,10,10,0.04)',
                  }}>
                  <span className="text-sm font-bold"
                    style={{ color: active ? '#4744C8' : '#0A0A0A' }}>
                    {y}{active && <span className="ml-2 text-[10px]">✓</span>}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Months column */}
          <div className="overflow-y-auto" style={{ background: '#FFFFFF' }}>
            <p className="sticky top-0 px-4 py-2 text-[9px] font-black tracking-[0.22em] uppercase"
              style={{ color: 'rgba(10,10,10,0.4)', background: '#FAFAF7', borderBottom: '1px solid rgba(10,10,10,0.06)' }}>
              Month
            </p>
            {MONTHS.map(m => {
              const active = m.code === month
              return (
                <button key={m.code}
                  onClick={() => setMonth(m.code)}
                  className="w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors"
                  style={{
                    background: active ? 'rgba(71,68,200,0.05)' : 'transparent',
                    borderBottom: '1px solid rgba(10,10,10,0.04)',
                  }}>
                  <span className="text-sm font-bold"
                    style={{ color: active ? '#4744C8' : '#0A0A0A' }}>
                    {m.label}{active && <span className="ml-2 text-[10px]">✓</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer — confirm */}
        <button onClick={save}
          className="shrink-0 w-full py-4 text-sm font-bold"
          style={{ background: '#0A0A0A', color: '#FFFFFF', borderTop: '1px solid rgba(10,10,10,0.08)' }}>
          Save · {MONTHS.find(m => m.code === month)?.label} {year}
        </button>
      </div>
    </div>
  )
}
