'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'

export interface SpinVenue {
  id:           string
  name:         string
  category:     string
  broadType:    string
  neighborhood: string
  vibe:         string
  website?:     string
}

export interface SpinEvent {
  title: string
  date:  string
  venue: string
  url:   string
}

interface Props {
  venues: SpinVenue[]
  events: SpinEvent[]
  cityId: string
}

type PickType = 'eat' | 'drink' | 'event'

interface Result {
  type:  PickType
  label: string
  title: string
  sub:   string
  color: string
  href:  string
  external: boolean
}

/* ── Segments ─────────────────────────────────────────────────────────────── */

const SEGS: { label: string; color: string; type: PickType }[] = [
  { label: 'EAT',   color: '#E8612A', type: 'eat'   },
  { label: 'EVENT', color: '#FF3EBA', type: 'event'  },
  { label: 'DRINK', color: '#38C0F0', type: 'drink'  },
  { label: 'EVENT', color: '#4744C8', type: 'event'  },
  { label: 'EAT',   color: '#FAB400', type: 'eat'    },
  { label: 'EVENT', color: '#10B981', type: 'event'  },
]

const N     = SEGS.length   // 6
const DEG   = 360 / N       // 60°
const R     = 110           // wheel radius
const CX    = 120
const CY    = 120

/* Convert degrees (clockwise from top) to SVG x/y */
function pt(deg: number, r = R) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

/* ── SVG pie ──────────────────────────────────────────────────────────────── */

function Wheel({ rotation, spinning }: { rotation: number; spinning: boolean }) {
  return (
    <div
      style={{
        transform:  `rotate(${rotation}deg)`,
        transition: spinning ? 'transform 3.2s cubic-bezier(0.22, 0.61, 0.14, 1)' : 'none',
        willChange: 'transform',
      }}
    >
      <svg width="240" height="240" viewBox="0 0 240 240" style={{ display: 'block' }}>
        {/* Segments */}
        {SEGS.map((seg, i) => {
          const a0 = i * DEG
          const a1 = (i + 1) * DEG
          const p0 = pt(a0)
          const p1 = pt(a1)
          return (
            <path
              key={i}
              d={`M ${CX} ${CY} L ${p0.x} ${p0.y} A ${R} ${R} 0 0 1 ${p1.x} ${p1.y} Z`}
              fill={seg.color}
            />
          )
        })}

        {/* White divider lines */}
        {SEGS.map((_, i) => {
          const edge = pt(i * DEG)
          return (
            <line key={i} x1={CX} y1={CY} x2={edge.x} y2={edge.y}
              stroke="white" strokeWidth="2.5" />
          )
        })}

        {/* Segment labels */}
        {SEGS.map((seg, i) => {
          const mid  = i * DEG + DEG / 2
          const pos  = pt(mid, R * 0.62)
          return (
            <text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.85)"
              fontSize="8"
              fontWeight="900"
              letterSpacing="0.12em"
              transform={`rotate(${mid}, ${pos.x}, ${pos.y})`}
              style={{ fontFamily: 'var(--font-inter), sans-serif', userSelect: 'none' }}
            >
              {seg.label}
            </text>
          )
        })}

        {/* Center circle */}
        <circle cx={CX} cy={CY} r="26" fill="white" />
        <circle cx={CX} cy={CY} r="22" fill="none" stroke="rgba(10,10,10,0.08)" strokeWidth="1" />
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
          fontSize="11" fontWeight="900" letterSpacing="0.06em" fill="rgba(10,10,10,0.5)"
          style={{ fontFamily: 'var(--font-inter), sans-serif', userSelect: 'none' }}>
          SPIN
        </text>
      </svg>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function SpinWheel({ venues, events, cityId }: Props) {
  const [spinning,  setSpinning]  = useState(false)
  const [result,    setResult]    = useState<Result | null>(null)
  const [prevResult, setPrevResult] = useState<Result | null>(null)
  const rotRef = useRef(0)    // tracks cumulative rotation (never resets)

  const restaurants = venues.filter(v => v.broadType === 'restaurant' || v.broadType === 'cafe')
  const bars        = venues.filter(v => v.broadType === 'bar')
  const upcoming    = events.slice(0, 30)

  function pickItem(type: PickType): Result | null {
    if (type === 'event' && upcoming.length > 0) {
      const ev = upcoming[Math.floor(Math.random() * upcoming.length)]
      return {
        type, label: 'Tonight / this week',
        title: ev.title,
        sub:   `${ev.venue} · ${ev.date}`,
        color: '#FF3EBA',
        href:  ev.url,
        external: true,
      }
    }
    // fall back to venue if no events
    const pool = type === 'drink'
      ? (bars.length ? bars : venues)
      : (restaurants.length ? restaurants : venues)
    if (!pool.length) return null
    const v = pool[Math.floor(Math.random() * pool.length)]
    return {
      type:     type === 'drink' ? 'drink' : 'eat',
      label:    type === 'drink' ? 'Get a drink here' : 'Eat here tonight',
      title:    v.name,
      sub:      `${v.neighborhood} · ${v.category}`,
      color:    type === 'drink' ? '#38C0F0' : '#E8612A',
      href:     `/${cityId}/eat`,
      external: false,
    }
  }

  function spin() {
    if (spinning) return

    // Pick the winner first, then engineer the rotation to land there
    let segIdx = Math.floor(Math.random() * N)
    let item = pickItem(SEGS[segIdx].type)

    // retry once if pool empty (e.g. no events)
    if (!item) {
      segIdx = (segIdx + 2) % N
      item = pickItem(SEGS[segIdx].type)
    }
    if (!item) return

    // Segment segIdx center is DEG * segIdx + DEG/2 degrees clockwise from top.
    // We need that center to end up at 0° (top), so:
    // currentAngle of seg center = DEG * segIdx + DEG/2
    // We want it at 0 → rotate wheel by -(segCenter) + multiple full turns
    const segCenter    = DEG * segIdx + DEG / 2
    const currentMod   = ((rotRef.current % 360) + 360) % 360
    const delta        = ((360 - segCenter - currentMod) % 360 + 360) % 360
    const totalSpin    = 1440 + delta   // ≥4 full rotations + landing

    rotRef.current += totalSpin
    setResult(null)
    setPrevResult(null)
    setSpinning(true)

    setTimeout(() => {
      setSpinning(false)
      setResult(item)
    }, 3400)
  }

  return (
    <div className="flex flex-col items-center gap-6">

      {/* Wheel + pointer */}
      <div className="relative" style={{ width: 240, height: 260 }}>
        {/* Pointer triangle */}
        <div className="absolute left-1/2 -translate-x-1/2 z-10"
          style={{ top: 0, width: 0, height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '22px solid #0A0A0A' }} />
        {/* Wheel */}
        <div className="absolute" style={{ top: 20, left: 0 }}>
          <Wheel rotation={rotRef.current} spinning={spinning} />
        </div>
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning}
        className="px-10 py-3 font-display font-black text-base text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
        style={{ background: '#0A0A0A', letterSpacing: '-0.01em' }}
      >
        {spinning ? 'Spinning…' : result ? 'Spin again →' : 'Spin →'}
      </button>

      {/* Result card */}
      {result && !spinning && (
        <div
          className="w-full max-w-xs"
          style={{ animation: 'spinReveal 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
        >
          {result.external ? (
            <a href={result.href} target="_blank" rel="noopener noreferrer"
              className="block p-5 bg-white hover:bg-neutral-50 transition-colors"
              style={{ border: '1px solid rgba(10,10,10,0.1)', borderLeft: `4px solid ${result.color}` }}>
              <ResultInner result={result} />
            </a>
          ) : (
            <Link href={result.href}
              className="block p-5 bg-white hover:bg-neutral-50 transition-colors"
              style={{ border: '1px solid rgba(10,10,10,0.1)', borderLeft: `4px solid ${result.color}` }}>
              <ResultInner result={result} />
            </Link>
          )}
        </div>
      )}

      <style>{`
        @keyframes spinReveal {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

function ResultInner({ result }: { result: Result }) {
  return (
    <>
      <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-2"
        style={{ color: result.color }}>
        {result.label}
      </p>
      <p className="font-display font-black text-xl leading-tight mb-1" style={{ color: '#0A0A0A' }}>
        {result.title}
      </p>
      <p className="text-xs" style={{ color: 'rgba(10,10,10,0.45)', lineHeight: 1.5 }}>
        {result.sub}
      </p>
      <p className="text-xs font-bold mt-3" style={{ color: result.color }}>
        View details →
      </p>
    </>
  )
}
