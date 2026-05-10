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
  return (
    <section className="mt-8">
      <div
        className="grid gap-px"
        style={{
          background: 'rgba(10,10,10,0.08)',
          border: '1px solid rgba(10,10,10,0.08)',
          gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))`,
        }}
      >
        {stats.map((s, i) => (
          <div key={i} className="px-4 py-5 flex flex-col items-start"
            style={{
              background: '#FFFFFF',
              borderTop: `3px solid ${s.color}`,
            }}>
            <p className="font-display font-black leading-none flex items-baseline gap-1"
              style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
              {s.value}
              {s.total !== undefined && (
                <span className="font-display font-bold"
                  style={{ fontSize: '0.65em', color: 'rgba(10,10,10,0.3)' }}>
                  /{s.total}
                </span>
              )}
            </p>
            <p className="mt-2 text-[9px] font-black tracking-[0.22em] uppercase"
              style={{ color: s.color }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
