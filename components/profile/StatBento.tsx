'use client'

interface Stat {
  /** Big number — what the eye lands on. */
  value:  string | number
  /** Optional faint denominator (e.g. "/ 27"). */
  total?: string | number
  /** Tracked-out small-caps label below the number. */
  label:  string
  /** Section accent that tints the card. */
  color:  string
}

interface Props {
  stats: Stat[]
}

// Magazine-style stat grid for the profile page. One huge number per card,
// tiny tracked-out label, accent stripe on the top edge that picks up the
// platform's section colours. No icons (icons make this look like a SaaS
// dashboard, which we are not).
export function StatBento({ stats }: Props) {
  if (stats.length === 0) return null
  // 2x2 grid by default — pairs naturally with a wider Settler Card on the
  // left of a hero row. Each cell tall enough that the big number actually
  // reads as a magazine spread, not a dashboard tile.
  return (
    <div
      className="grid grid-cols-2 gap-px h-full"
      style={{
        background: 'rgba(10,10,10,0.08)',
        border: '1px solid rgba(10,10,10,0.08)',
      }}
    >
      {stats.map((s, i) => (
        <div key={i} className="px-5 py-6 flex flex-col items-start justify-between min-h-[140px]"
          style={{
            background: '#FFFFFF',
            borderTop: `4px solid ${s.color}`,
          }}>
          <p className="font-display font-black leading-none flex items-baseline gap-1"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', color: '#0A0A0A', letterSpacing: '-0.03em' }}>
            {s.value}
            {s.total !== undefined && (
              <span className="font-display font-bold"
                style={{ fontSize: '0.55em', color: 'rgba(10,10,10,0.3)' }}>
                /{s.total}
              </span>
            )}
          </p>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase leading-tight"
            style={{ color: s.color }}>
            {s.label}
          </p>
        </div>
      ))}
    </div>
  )
}
