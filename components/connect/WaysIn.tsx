import { BRUSSELS_WAYS_IN, WAYS_IN_INTRO, type WayIn } from '@/lib/data/connect/brussels-ways-in'

// "Ways in" — pinned, curated list of how people actually meet others in the
// city. Renders only where we have a curated list (Brussels for now); returns
// null elsewhere so the page degrades cleanly.
//
// Every link is a group's own free, no-login channel — deliberately never
// Meetup, which now paywalls the very thing newcomers come for.
export function WaysIn({ cityId }: { cityId: string }) {
  if (cityId !== 'brussels') return null
  const ways = BRUSSELS_WAYS_IN
  if (ways.length === 0) return null

  return (
    <section className="mb-10">
      {/* Running head */}
      <div className="flex items-baseline justify-between gap-4 pb-3 mb-4"
        style={{ borderBottom: '2px solid #0A0A0A' }}>
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 inline-block"
            style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF3EBA' }} />
          <span className="text-xs font-black tracking-[0.16em] uppercase truncate"
            style={{ color: '#FF3EBA' }}>
            Ways in
          </span>
          <span className="text-[10px] font-black tracking-[0.18em] uppercase hidden sm:inline"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            · where people actually meet
          </span>
        </span>
        <span className="text-[10px] font-black tracking-[0.18em] uppercase shrink-0"
          style={{ color: '#0E9B6B' }}>
          Free · no login
        </span>
      </div>

      {/* The one insight that ties it together */}
      <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(10,10,10,0.65)', maxWidth: '62ch' }}>
        {WAYS_IN_INTRO}
      </p>

      {/* List */}
      <div>
        {ways.map((w, i) => <WayRow key={w.name} way={w} first={i === 0} />)}
      </div>
    </section>
  )
}

function WayRow({ way, first }: { way: WayIn; first: boolean }) {
  return (
    <div className="py-4" style={{ borderTop: first ? 'none' : '1px solid rgba(10,10,10,0.08)' }}>
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <span className="flex items-baseline gap-2.5 min-w-0">
          <span className="text-sm font-black" style={{ color: '#0A0A0A' }}>{way.name}</span>
          <span className="text-[9px] font-black tracking-[0.18em] uppercase shrink-0"
            style={{ color: '#FF3EBA' }}>
            {way.kind}
          </span>
        </span>
        <span className="text-[10px] font-black tracking-[0.16em] uppercase shrink-0"
          style={{ color: 'rgba(10,10,10,0.4)' }}>
          {way.cadence}{way.area ? ` · ${way.area}` : ''}
        </span>
      </div>

      <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'rgba(10,10,10,0.55)', maxWidth: '64ch' }}>
        {way.why}
      </p>

      {/* Specific groups — each a free, no-login link */}
      {way.links && way.links.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {way.links.map(l => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
              className="group inline-flex items-center gap-1 text-[10px] font-black tracking-[0.1em] uppercase px-2.5 py-1.5 transition-colors"
              style={{ border: '1px solid rgba(10,10,10,0.14)', color: '#0A0A0A' }}>
              {l.label}
              <span className="transition-transform group-hover:translate-x-0.5" style={{ color: '#FF3EBA' }}>→</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
