'use client'

import { currentBrusselsNote } from '@/lib/data/connect/brussels-weekly'

interface Props {
  cityId: string
}

// Pinned editorial note for /connect. Replaces the matchup poll for the
// cold-start phase — the council's read was: matchup needs scale; an
// editorial card works at N=1.
//
// One thing to do this week + one thing to know. ~80 words total.
// Founder writes it Sunday/Monday, ships for the week.
export function WeeklyNote({ cityId }: Props) {
  if (cityId !== 'brussels') return null
  const note = currentBrusselsNote()

  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between pb-3 mb-5"
        style={{ borderBottom: '2px solid #0A0A0A' }}>
        <p className="text-[10px] font-black tracking-[0.25em] uppercase"
          style={{ color: '#FF3EBA' }}>
          This week in Brussels
        </p>
        <p className="text-[10px] font-black tracking-[0.18em] uppercase"
          style={{ color: 'rgba(10,10,10,0.4)' }}>
          {note.weekLabel}
        </p>
      </div>

      <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(10,10,10,0.7)', maxWidth: '60ch' }}>
        {note.intro}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-x-8">
        {/* Do this */}
        <div className="py-5 md:border-r md:border-[rgba(10,10,10,0.08)] md:pr-8"
          style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
            style={{ color: '#E8612A' }}>
            A thing to do
          </p>
          {note.doThis.href ? (
            <a href={note.doThis.href} target="_blank" rel="noopener noreferrer"
              className="block group hover:opacity-90 transition-opacity">
              <p className="font-display font-black leading-tight mb-1.5"
                style={{ fontSize: '1.05rem', color: '#0A0A0A', letterSpacing: '-0.01em' }}>
                {note.doThis.label} →
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.65)' }}>
                {note.doThis.body}
              </p>
            </a>
          ) : (
            <>
              <p className="font-display font-black leading-tight mb-1.5"
                style={{ fontSize: '1.05rem', color: '#0A0A0A', letterSpacing: '-0.01em' }}>
                {note.doThis.label}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.65)' }}>
                {note.doThis.body}
              </p>
            </>
          )}
        </div>

        {/* Know this */}
        <div className="py-5" style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
            style={{ color: '#38C0F0' }}>
            A thing to know
          </p>
          <p className="font-display font-black leading-tight mb-1.5"
            style={{ fontSize: '1.05rem', color: '#0A0A0A', letterSpacing: '-0.01em' }}>
            {note.knowThis.label}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.65)' }}>
            {note.knowThis.body}
          </p>
        </div>
      </div>
    </section>
  )
}
