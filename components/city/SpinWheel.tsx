'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'

const APP_URL = 'https://roots.so'

async function shareResult(result: Result, cityId: string) {
  const text = result.type === 'event'
    ? `Roots picked "${result.title}" for me tonight in Brussels — spin for yourself`
    : `Roots picked ${result.title} for me tonight in Brussels — spin for yours`
  const url  = `${APP_URL}/${cityId}`

  if (typeof navigator !== 'undefined' && navigator.share) {
    try { await navigator.share({ text, url }); return } catch { /* cancelled */ }
  }
  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(`${text}: ${url}`)
    return 'copied'
  } catch { return 'error' }
}

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
  dark?:  boolean
}

type PickType = 'eat' | 'drink' | 'event'

interface Result {
  type:     PickType
  label:    string
  title:    string
  sub:      string
  color:    string
  href:     string
  external: boolean
}

/* ── Category selector config ─────────────────────────────────────────────── */

const CATS: { type: PickType; label: string; icon: string; color: string }[] = [
  { type: 'eat',   label: 'Eat',   icon: '🍽',  color: '#E8612A' },
  { type: 'drink', label: 'Drink', icon: '🍺',  color: '#38C0F0' },
  { type: 'event', label: 'Event', icon: '✦',   color: '#FF3EBA' },
]

/* ── Wheel segments ───────────────────────────────────────────────────────── */

const SEGS: { label: string; color: string; type: PickType }[] = [
  { label: 'EAT',   color: '#E8612A', type: 'eat'   },
  { label: 'EVENT', color: '#FF3EBA', type: 'event'  },
  { label: 'DRINK', color: '#38C0F0', type: 'drink'  },
  { label: 'EVENT', color: '#4744C8', type: 'event'  },
  { label: 'EAT',   color: '#FAB400', type: 'eat'    },
  { label: 'EVENT', color: '#10B981', type: 'event'  },
]

const N   = SEGS.length   // 6
const DEG = 360 / N       // 60°
const R   = 110
const CX  = 120
const CY  = 120

function pt(deg: number, r = R) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

/* ── SVG pie ──────────────────────────────────────────────────────────────── */

const SPIN_DURATION_MS = 3200 // keep in sync with CSS transition below

function Wheel({ rotation, spinning, selected }: {
  rotation: number
  spinning:  boolean
  selected:  PickType | null
}) {
  const cat = selected ? CATS.find(c => c.type === selected) : null

  return (
    <div style={{
      transform:  `rotate(${rotation}deg)`,
      transition: spinning ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.22, 0.61, 0.14, 1)` : 'none',
      willChange: 'transform',
    }}>
      <svg width="240" height="240" viewBox="0 0 240 240" style={{ display: 'block' }}>
        {/* Segments — dim non-matching when a category is chosen */}
        {SEGS.map((seg, i) => {
          const a0     = i * DEG
          const a1     = (i + 1) * DEG
          const p0     = pt(a0)
          const p1     = pt(a1)
          const active = !selected || seg.type === selected
          return (
            <path
              key={i}
              d={`M ${CX} ${CY} L ${p0.x} ${p0.y} A ${R} ${R} 0 0 1 ${p1.x} ${p1.y} Z`}
              fill={seg.color}
              opacity={active ? 1 : 0.18}
              style={{ transition: 'opacity 0.3s' }}
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
          const mid    = i * DEG + DEG / 2
          const pos    = pt(mid, R * 0.62)
          const active = !selected || seg.type === selected
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
              opacity={active ? 1 : 0.3}
              transform={`rotate(${mid}, ${pos.x}, ${pos.y})`}
              style={{ fontFamily: 'var(--font-inter), sans-serif', userSelect: 'none', transition: 'opacity 0.3s' }}
            >
              {seg.label}
            </text>
          )
        })}

        {/* Center circle */}
        <circle cx={CX} cy={CY} r="28" fill="white" />
        <circle cx={CX} cy={CY} r="24" fill="none" stroke="rgba(10,10,10,0.07)" strokeWidth="1" />
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fontWeight="900" letterSpacing="0.08em"
          fill={cat ? cat.color : 'rgba(10,10,10,0.3)'}
          style={{ fontFamily: 'var(--font-inter), sans-serif', userSelect: 'none', transition: 'fill 0.25s' }}>
          {cat ? cat.label.toUpperCase() : 'SPIN'}
        </text>
      </svg>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function SpinWheel({ venues, events, cityId, dark = false }: Props) {
  const [selected, setSelected] = useState<PickType | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [result,   setResult]   = useState<Result | null>(null)
  const rotRef = useRef(0)

  const restaurants = venues.filter(v => v.broadType === 'restaurant' || v.broadType === 'cafe')
  const bars        = venues.filter(v => v.broadType === 'bar')
  const upcoming    = events.slice(0, 30)

  function pickItem(type: PickType): Result | null {
    if (type === 'event') {
      if (!upcoming.length) return null
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
    const pool = type === 'drink'
      ? (bars.length ? bars : venues)
      : (restaurants.length ? restaurants : venues)
    if (!pool.length) return null
    const v = pool[Math.floor(Math.random() * pool.length)]
    return {
      type,
      label:    type === 'drink' ? 'Get a drink here' : 'Eat here tonight',
      title:    v.name,
      sub:      `${v.neighborhood} · ${v.category}`,
      color:    type === 'drink' ? '#38C0F0' : '#E8612A',
      href:     `/${cityId}/eat`,
      external: false,
    }
  }

  function spin() {
    if (spinning || !selected) return

    // Pick only from matching segments
    const matchingSegs = SEGS
      .map((seg, i) => ({ seg, i }))
      .filter(({ seg }) => seg.type === selected)

    // For 'event' with no events, fall back to eat
    const effectiveType: PickType = (selected === 'event' && !upcoming.length) ? 'eat' : selected
    const pool = SEGS
      .map((seg, i) => ({ seg, i }))
      .filter(({ seg }) => seg.type === (effectiveType === selected ? selected : effectiveType))

    const { i: segIdx } = pool[Math.floor(Math.random() * pool.length)] ?? matchingSegs[0]
    const item = pickItem(effectiveType)
    if (!item) return

    const segCenter  = DEG * segIdx + DEG / 2
    const currentMod = ((rotRef.current % 360) + 360) % 360
    const delta      = ((360 - segCenter - currentMod) % 360 + 360) % 360
    rotRef.current  += 1440 + delta

    setResult(null)
    setSpinning(true)

    setTimeout(() => {
      setSpinning(false)
      setResult(item)
    }, SPIN_DURATION_MS + 200) // +200ms buffer so wheel finishes before reveal
  }

  const cat = selected ? CATS.find(c => c.type === selected)! : null

  return (
    <div className="flex flex-col items-center gap-7">

      {/* ── Category selector ───────────────────────────────────────────── */}
      <div className="flex gap-2">
        {CATS.map(c => {
          const active = selected === c.type
          return (
            <button
              key={c.type}
              onClick={() => {
                setSelected(active ? null : c.type)
                setResult(null)
              }}
              disabled={spinning}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-all duration-200 disabled:opacity-40"
              style={{
                background: active ? c.color : dark ? 'rgba(255,255,255,0.08)' : 'transparent',
                color:      active ? '#fff'  : dark ? 'rgba(245,244,240,0.7)' : c.color,
                border:     active ? `2px solid ${c.color}` : dark ? '2px solid rgba(255,255,255,0.15)' : `2px solid ${c.color}`,
                transform:  active ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: 15 }}>{c.icon}</span>
              {c.label}
            </button>
          )
        })}
      </div>

      {/* ── Wheel + pointer ─────────────────────────────────────────────── */}
      <div className="relative" style={{ width: 240, height: 262 }}>
        {/* Pointer */}
        <div className="absolute left-1/2 -translate-x-1/2 z-10"
          style={{
            top: 0, width: 0, height: 0,
            borderLeft:  '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop:   `22px solid ${cat ? cat.color : '#0A0A0A'}`,
            transition:  'border-top-color 0.25s',
          }} />
        <div className="absolute" style={{ top: 22, left: 0 }}>
          <Wheel rotation={rotRef.current} spinning={spinning} selected={selected} />
        </div>
      </div>

      {/* ── Spin button ─────────────────────────────────────────────────── */}
      <button
        onClick={spin}
        disabled={spinning || !selected}
        className="px-12 py-3.5 font-display font-black text-base text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-30"
        style={{ background: cat ? cat.color : dark ? 'rgba(255,255,255,0.15)' : '#0A0A0A', letterSpacing: '-0.01em', transition: 'background 0.25s, opacity 0.2s' }}
      >
        {spinning
          ? 'Spinning…'
          : !selected
            ? 'Pick a vibe first'
            : result
              ? `Spin again →`
              : `Spin for ${cat!.label} →`}
      </button>

      {/* ── Result card ─────────────────────────────────────────────────── */}
      {result && !spinning && (
        <div
          className="w-full max-w-xs"
          style={{ animation: 'spinReveal 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
        >
          {result.external ? (
            <a href={result.href} target="_blank" rel="noopener noreferrer"
              className="block p-5 bg-white hover:bg-neutral-50 transition-colors"
              style={{ border: '1px solid rgba(10,10,10,0.1)', borderLeft: `4px solid ${result.color}` }}>
              <ResultCard result={result} cityId={cityId} />
            </a>
          ) : (
            <Link href={result.href}
              className="block p-5 bg-white hover:bg-neutral-50 transition-colors"
              style={{ border: '1px solid rgba(10,10,10,0.1)', borderLeft: `4px solid ${result.color}` }}>
              <ResultCard result={result} cityId={cityId} />
            </Link>
          )}
        </div>
      )}

      <style>{`
        @keyframes spinReveal {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  )
}

function ResultCard({ result, cityId }: { result: Result; cityId: string }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const status = await shareResult(result, cityId)
    if (status === 'copied') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-2" style={{ color: result.color }}>
        {result.label}
      </p>
      <p className="font-display font-black text-xl leading-tight mb-1" style={{ color: '#0A0A0A' }}>
        {result.title}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.45)' }}>
        {result.sub}
      </p>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs font-bold" style={{ color: result.color }}>
          View details →
        </p>
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); handleShare() }}
          className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide hover:opacity-60 transition-opacity"
          style={{ color: 'rgba(10,10,10,0.35)' }}
        >
          {copied ? (
            <>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 5.5l2.5 2.5 4.5-5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ color: '#10B981' }}>Copied!</span>
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share this pick
            </>
          )}
        </button>
      </div>
    </>
  )
}
