// "This week in Brussels" — the editorial note pinned above the tips
// channel on /connect. One curated thing every Friday, written by the
// founder. Replaces the WeeklyMatchup poll for the cold-start phase.
//
// Add new entries to the TOP. The component renders the first one.

export interface ConnectNote {
  /** ISO-ish week label for sort + display, e.g. "2026-W20". */
  week:      string
  /** Friendly date for the header, e.g. "Week of 16 May 2026". */
  weekLabel: string
  /** A short opening that frames the week. 1–2 sentences. */
  intro:     string
  /** "A thing to do" — concrete, this week, in Brussels. */
  doThis:    { label: string; body: string; href?: string }
  /** "A thing to know" — practical, learnt-the-hard-way, settler-useful. */
  knowThis:  { label: string; body: string }
}

export const BRUSSELS_NOTES: ConnectNote[] = [
  {
    week:      '2026-W20',
    weekLabel: 'Week of 16 May 2026',
    intro:     'First proper spring weekend on the cards. The terraces won\'t need a strategy yet — pick whichever street faces the sun — but two specifics worth keeping in your back pocket this week.',
    doThis: {
      label: 'Place du Châtelain market',
      body:  'Wednesday from 14:00. Oysters in the open air at Mer du Nord stall, natural wine by the glass, suncream optional. Locals start arriving at 17:30 — get there earlier if you want to talk.',
      href:  'https://maps.google.com/?q=Place+du+Châtelain+market+Brussels',
    },
    knowThis: {
      label: 'Mutuelle deadlines reset on the 1st',
      body:  'If you registered at commune in the last two months, your 90-day mutuelle window is shorter than you think. Check the date on your Annex 8 / Annex 19 today — easy to miss in the move-in chaos.',
    },
  },
]

export function currentBrusselsNote(): ConnectNote {
  return BRUSSELS_NOTES[0]
}
