'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Settler = {
  display_name: string
  stage:        string | null
  neighborhood: string | null
}

const STAGE_COLOR: Record<string, string> = {
  planning:     '#38C0F0',
  just_arrived: '#10B981',
  settling:     '#FAB400',
  settled:      '#3D3CAC',
}

export function SettlersStrip({ cityId }: { cityId: string }) {
  const [settlers, setSettlers] = useState<Settler[]>([])
  const [total,    setTotal]    = useState(0)
  const [ready,    setReady]    = useState(false)

  useEffect(() => {
    fetch(`/api/settlers/${cityId}`)
      .then(r => r.json())
      .then(d => { setSettlers(d.settlers ?? []); setTotal(d.total ?? 0); setReady(true) })
      .catch(() => setReady(true))
  }, [cityId])

  if (!ready || settlers.length === 0) return null

  const shown    = settlers.slice(0, 5)
  const overflow = total - shown.length

  return (
    <div
      className="mt-5 pt-4 flex items-center gap-4 flex-wrap"
      style={{ borderTop: '1px solid rgba(245,236,215,0.07)' }}
    >
      <span
        className="text-[8px] font-black tracking-[0.22em] uppercase shrink-0"
        style={{ color: 'rgba(245,236,215,0.18)' }}
      >
        New this month
      </span>

      <div className="flex items-center gap-3 flex-wrap">
        {shown.map((s, i) => {
          const color   = STAGE_COLOR[s.stage ?? ''] ?? '#3D3CAC'
          const initial = s.display_name.charAt(0).toUpperCase()
          const first   = s.display_name.split(' ')[0]
          // "Ixelles / Elsene" → "Ixelles"
          const hood    = s.neighborhood?.split(' /')[0]?.split('/')[0]?.trim()

          return (
            <div key={i} className="flex items-center gap-1.5">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                style={{ background: `${color}22`, color, border: `1px solid ${color}38` }}
              >
                {initial}
              </span>
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: 'rgba(245,236,215,0.5)' }}
              >
                {first}
                {hood && (
                  <span style={{ color: 'rgba(245,236,215,0.22)' }}> · {hood}</span>
                )}
              </span>
            </div>
          )
        })}

        {overflow > 0 && (
          <Link
            href={`/${cityId}/people`}
            className="text-[9px] font-black hover:opacity-60 transition-opacity"
            style={{ color: 'rgba(245,236,215,0.22)', letterSpacing: '0.05em' }}
          >
            +{overflow} more →
          </Link>
        )}
      </div>
    </div>
  )
}
