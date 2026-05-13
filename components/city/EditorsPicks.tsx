import type { EditorPick } from '@/lib/data/picks/brussels'

interface Props {
  pick: EditorPick
}

// Editorial weekly picks — curated, no commerce. One venue, one event, one
// walk, one tip. Renders at the top of the city hub above the events feed.
// The framing is "this is what the editor picked," not "this is sponsored."
export function EditorsPicks({ pick }: Props) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between gap-4 pb-3 mb-6"
        style={{ borderBottom: '2px solid #0A0A0A' }}>
        <p className="text-[10px] font-black tracking-[0.25em] uppercase"
          style={{ color: '#FF3EBA' }}>
          This week&apos;s picks
        </p>
        <p className="text-[10px] font-black tracking-[0.18em] uppercase"
          style={{ color: 'rgba(10,10,10,0.4)' }}>
          {pick.weekLabel}
        </p>
      </div>

      {/* Lead — Venue is the pick. Full row, larger display, proper standfirst.
          Replaces the 2×2 swatch with a magazine-style hero + three-up. */}
      <a href={pick.venue.href} target="_blank" rel="noopener noreferrer"
        className="block py-5 group hover:opacity-95 transition-opacity"
        style={{ borderBottom: '1px solid rgba(10,10,10,0.12)' }}>
        <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
          style={{ color: '#E8612A' }}>
          Venue · This week
        </p>
        <p className="font-display font-black leading-[1.05] mb-1.5"
          style={{ fontSize: '1.65rem', color: '#0A0A0A', letterSpacing: '-0.015em' }}>
          {pick.venue.name}
        </p>
        <p className="text-[10px] font-bold mb-2.5" style={{ color: 'rgba(10,10,10,0.45)' }}>
          {pick.venue.neighborhood}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(10,10,10,0.7)', maxWidth: '54ch' }}>
          {pick.venue.reason}
        </p>
      </a>

      {/* Three-up — Event / Walk / Phrase. No coloured top-bars; single
          1px black-tinted rule between rows, coloured kicker carries the
          identity. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-x-6">

        {/* Event */}
        <a href={pick.event.href} target="_blank" rel="noopener noreferrer"
          className="block py-5 group hover:opacity-95 transition-opacity md:border-r md:border-[rgba(10,10,10,0.08)] md:pr-6"
          style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
            style={{ color: '#FF3EBA' }}>
            Event
          </p>
          <p className="font-display font-black leading-tight mb-1"
            style={{ fontSize: '0.95rem', color: '#0A0A0A', letterSpacing: '-0.005em' }}>
            {pick.event.title}
          </p>
          <p className="text-[10px] font-bold mb-2" style={{ color: 'rgba(10,10,10,0.45)' }}>
            {pick.event.when} · {pick.event.venue}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.65)' }}>
            {pick.event.reason}
          </p>
        </a>

        {/* Walk */}
        <div className="py-5 md:border-r md:border-[rgba(10,10,10,0.08)] md:pr-6"
          style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
            style={{ color: '#38C0F0' }}>
            Walk
          </p>
          <p className="font-display font-black leading-tight mb-1"
            style={{ fontSize: '0.95rem', color: '#0A0A0A', letterSpacing: '-0.005em' }}>
            {pick.walk.title}
          </p>
          <p className="text-[10px] font-bold mb-2" style={{ color: 'rgba(10,10,10,0.45)' }}>
            {pick.walk.sub}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.65)' }}>
            {pick.walk.reason}
          </p>
        </div>

        {/* Phrase — bilingual Brussels expression */}
        <div className="py-5">
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
            style={{ color: '#FAB400' }}>
            Phrase
          </p>

          {/* FR — primary anchor (sized down to match the row) */}
          <p className="font-display font-black leading-tight"
            style={{ fontSize: '0.95rem', color: '#0A0A0A', letterSpacing: '-0.005em' }}>
            «&thinsp;{pick.phrase.fr}&thinsp;»
            <span className="ml-1.5 text-[8px] font-black tracking-[0.22em] align-middle"
              style={{ color: 'rgba(10,10,10,0.35)' }}>FR</span>
          </p>

          {/* NL — paired equivalent, slightly muted */}
          <p className="font-display font-bold leading-tight mt-0.5"
            style={{ fontSize: '0.85rem', color: 'rgba(10,10,10,0.7)' }}>
            «&thinsp;{pick.phrase.nl}&thinsp;»
            <span className="ml-1.5 text-[8px] font-black tracking-[0.22em] align-middle"
              style={{ color: 'rgba(10,10,10,0.3)' }}>NL</span>
          </p>

          {/* Gloss */}
          <p className="text-[10px] italic mt-2 leading-snug"
            style={{ color: 'rgba(10,10,10,0.5)' }}>
            {pick.phrase.meaning}
          </p>

          {/* Reason */}
          <p className="text-xs leading-relaxed mt-2" style={{ color: 'rgba(10,10,10,0.65)' }}>
            {pick.phrase.reason}
          </p>
        </div>

      </div>
    </section>
  )
}
