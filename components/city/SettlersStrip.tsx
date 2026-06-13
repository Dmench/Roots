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

export function SettlersStrip({
  cityId,
  variant = 'default',
  cityName = 'the city',
}: {
  cityId: string
  /** 'hero' weaves the cohort into a confident headline line under the masthead nameplate. */
  variant?: 'default' | 'hero'
  cityName?: string
}) {
  const [settlers, setSettlers] = useState<Settler[]>([])
  const [total,    setTotal]    = useState(0)
  const [ready,    setReady]    = useState(false)

  useEffect(() => {
    fetch(`/api/settlers/${cityId}`)
      .then(r => r.json())
      .then(d => { setSettlers(d.settlers ?? []); setTotal(d.recentTotal ?? d.total ?? 0); setReady(true) })
      .catch(() => setReady(true))
  }, [cityId])

  if (!ready || settlers.length === 0) return null

  const shown    = settlers.slice(0, 5)
  const overflow = total - shown.length

  // ── Hero variant ──────────────────────────────────────────────────────
  // The human layer, woven in: discovery stays the headline, but the first
  // human thing you read under the city name is "you're not doing this
  // alone." A confident aside, not a lonely-app banner. People-green accent
  // matches the People nav item.
  if (variant === 'hero') {
    const headline = total <= 1
      ? `You're one of the newest to find your way into ${cityName}`
      : `You and ${total} others found their way into ${cityName} this month`
    return (
      <Link
        href={`/${cityId}/people`}
        className="group mt-6 flex flex-col items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <span className="flex items-center gap-2 text-center">
          <span className="text-[11px] sm:text-xs font-black tracking-[0.02em]" style={{ color: '#0A0A0A' }}>
            {headline}
          </span>
          <span className="text-xs font-black transition-transform group-hover:translate-x-0.5"
            style={{ color: '#0E9B6B' }}>→</span>
        </span>

        <span className="flex items-center justify-center gap-3 flex-wrap">
          {shown.map((s, i) => {
            const color   = STAGE_COLOR[s.stage ?? ''] ?? '#3D3CAC'
            const initial = s.display_name.charAt(0).toUpperCase()
            const first   = s.display_name.split(' ')[0]
            const hood    = s.neighborhood?.split(' /')[0]?.split('/')[0]?.trim()
            return (
              <span key={i} className="flex items-center gap-1.5">
                <span className="w-5 h-5 flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                  {initial}
                </span>
                <span className="text-[10px] font-medium leading-none" style={{ color: 'rgba(10,10,10,0.45)' }}>
                  {first}
                  {hood && <span style={{ color: 'rgba(10,10,10,0.22)' }}> · {hood}</span>}
                </span>
              </span>
            )
          })}
          {overflow > 0 && (
            <span className="text-[10px] font-black" style={{ color: 'rgba(10,10,10,0.25)', letterSpacing: '0.05em' }}>
              +{overflow} more
            </span>
          )}
        </span>
      </Link>
    )
  }

  return (
    <div
      className="mt-5 pt-4 flex items-center gap-4 flex-wrap"
      style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}
    >
      <span
        className="text-[8px] font-black tracking-[0.22em] uppercase shrink-0"
        style={{ color: 'rgba(10,10,10,0.2)' }}
      >
        New this month
      </span>

      <div className="flex items-center gap-3 flex-wrap">
        {shown.map((s, i) => {
          const color   = STAGE_COLOR[s.stage ?? ''] ?? '#3D3CAC'
          const initial = s.display_name.charAt(0).toUpperCase()
          const first   = s.display_name.split(' ')[0]
          const hood    = s.neighborhood?.split(' /')[0]?.split('/')[0]?.trim()

          return (
            <div key={i} className="flex items-center gap-1.5">
              <span
                className="w-5 h-5 flex items-center justify-center text-[10px] font-black shrink-0"
                style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
              >
                {initial}
              </span>
              <span className="text-[10px] font-medium leading-none" style={{ color: 'rgba(10,10,10,0.45)' }}>
                {first}
                {hood && <span style={{ color: 'rgba(10,10,10,0.22)' }}> · {hood}</span>}
              </span>
            </div>
          )
        })}

        {overflow > 0 && (
          <Link
            href={`/${cityId}/people`}
            className="text-[10px] font-black hover:opacity-60 transition-opacity"
            style={{ color: 'rgba(10,10,10,0.25)', letterSpacing: '0.05em' }}
          >
            +{overflow} more →
          </Link>
        )}
      </div>
    </div>
  )
}
