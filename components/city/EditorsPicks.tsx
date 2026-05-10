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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px"
        style={{ background: 'rgba(10,10,10,0.08)', border: '1px solid rgba(10,10,10,0.08)' }}>

        {/* Venue */}
        <a href={pick.venue.href} target="_blank" rel="noopener noreferrer"
          className="block px-5 py-5 group hover:opacity-95 transition-opacity"
          style={{ background: '#FFFFFF', borderTop: '4px solid #E8612A' }}>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
            style={{ color: '#E8612A' }}>
            Venue
          </p>
          <p className="font-display font-black leading-tight mb-1"
            style={{ fontSize: '1.15rem', color: '#0A0A0A', letterSpacing: '-0.01em' }}>
            {pick.venue.name}
          </p>
          <p className="text-[10px] font-bold mb-2.5" style={{ color: 'rgba(10,10,10,0.45)' }}>
            {pick.venue.neighborhood}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.65)' }}>
            {pick.venue.reason}
          </p>
        </a>

        {/* Event */}
        <a href={pick.event.href} target="_blank" rel="noopener noreferrer"
          className="block px-5 py-5 group hover:opacity-95 transition-opacity"
          style={{ background: '#FFFFFF', borderTop: '4px solid #FF3EBA' }}>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
            style={{ color: '#FF3EBA' }}>
            Event
          </p>
          <p className="font-display font-black leading-tight mb-1"
            style={{ fontSize: '1.15rem', color: '#0A0A0A', letterSpacing: '-0.01em' }}>
            {pick.event.title}
          </p>
          <p className="text-[10px] font-bold mb-2.5" style={{ color: 'rgba(10,10,10,0.45)' }}>
            {pick.event.when} · {pick.event.venue}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.65)' }}>
            {pick.event.reason}
          </p>
        </a>

        {/* Walk */}
        <div className="px-5 py-5"
          style={{ background: '#FFFFFF', borderTop: '4px solid #38C0F0' }}>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
            style={{ color: '#38C0F0' }}>
            Walk
          </p>
          <p className="font-display font-black leading-tight mb-1"
            style={{ fontSize: '1.15rem', color: '#0A0A0A', letterSpacing: '-0.01em' }}>
            {pick.walk.title}
          </p>
          <p className="text-[10px] font-bold mb-2.5" style={{ color: 'rgba(10,10,10,0.45)' }}>
            {pick.walk.sub}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.65)' }}>
            {pick.walk.reason}
          </p>
        </div>

        {/* Phrase — bilingual Brussels expression */}
        <div className="px-5 py-5"
          style={{ background: '#FFFFFF', borderTop: '4px solid #FAB400' }}>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-3"
            style={{ color: '#FAB400' }}>
            Phrase
          </p>

          {/* FR — primary anchor */}
          <p className="font-display font-black leading-tight"
            style={{ fontSize: '1.2rem', color: '#0A0A0A', letterSpacing: '-0.01em' }}>
            «&thinsp;{pick.phrase.fr}&thinsp;»
            <span className="ml-2 text-[9px] font-black tracking-[0.22em] align-middle"
              style={{ color: 'rgba(10,10,10,0.35)' }}>FR</span>
          </p>

          {/* NL — paired equivalent, slightly muted */}
          <p className="font-display font-bold leading-tight mt-1"
            style={{ fontSize: '1rem', color: 'rgba(10,10,10,0.7)', letterSpacing: '-0.005em' }}>
            «&thinsp;{pick.phrase.nl}&thinsp;»
            <span className="ml-2 text-[9px] font-black tracking-[0.22em] align-middle"
              style={{ color: 'rgba(10,10,10,0.3)' }}>NL</span>
          </p>

          {/* Gloss — italic, sets up the punchline */}
          <p className="text-[11px] italic mt-2.5 leading-snug"
            style={{ color: 'rgba(10,10,10,0.5)' }}>
            {pick.phrase.meaning}
          </p>

          {/* Reason */}
          <p className="text-xs leading-relaxed mt-2.5" style={{ color: 'rgba(10,10,10,0.65)' }}>
            {pick.phrase.reason}
          </p>
        </div>

      </div>
    </section>
  )
}
