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

        {/* Tip */}
        <div className="px-5 py-5"
          style={{ background: '#FFFFFF', borderTop: '4px solid #FAB400' }}>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
            style={{ color: '#FAB400' }}>
            Tip
          </p>
          <p className="font-display font-black leading-tight mb-2.5"
            style={{ fontSize: '1.15rem', color: '#0A0A0A', letterSpacing: '-0.01em' }}>
            {pick.tip.headline}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.65)' }}>
            {pick.tip.body}
          </p>
        </div>

      </div>
    </section>
  )
}
