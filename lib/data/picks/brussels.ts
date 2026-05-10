// Editor's Picks — hand-curated weekly bundle for the city hub.
// One venue · one event · one walk · one tip. Editorial framing, no commerce.
// New entry every Monday morning — append to the top of the array.
// The hub renders the first entry; older entries are kept for archive value.

export interface EditorPick {
  /** ISO-ish week label for sort + display, e.g. "2026-W19". */
  week: string
  /** Friendly date for the header, e.g. "Week of 10 May 2026". */
  weekLabel: string
  venue: {
    name:         string
    neighborhood: string
    /** One-paragraph editorial reason — the voice of the editor, not a description. */
    reason:       string
    /** External or internal href. Use Google Maps for venues we don't have on /eat yet. */
    href:         string
  }
  event: {
    title:        string
    /** Free-text date — "Every Saturday, 8am–2pm" or "Sat 17 May, 20:00". */
    when:         string
    venue:        string
    reason:       string
    href:         string
  }
  walk: {
    title:        string
    /** Three-word subtitle, e.g. "Flea market → frites → gueuze". */
    sub:          string
    reason:       string
  }
  tip: {
    headline:     string
    body:         string
  }
}

export const BRUSSELS_PICKS: EditorPick[] = [
  {
    week: '2026-W19',
    weekLabel: 'Week of 10 May 2026',
    venue: {
      name: 'Maison Antoine',
      neighborhood: 'Place Jourdan',
      reason: 'The frites stand every Brusseleer points to — cash only, paper cone, eat them on a bench in the square. Andalouse if it\'s sunny, samourai if you can handle it. Closed Mondays.',
      href: 'https://maps.google.com/?q=Maison+Antoine+Brussels',
    },
    event: {
      title: 'Saturday market at Place Flagey',
      when: 'Every Saturday, 08:00–14:00',
      venue: 'Place Flagey, Ixelles',
      reason: 'Best food market in the city. Cheese, fish, Moroccan olives, fresh bread. Go before 11. Stay for a Belga terrace lunch.',
      href: 'https://maps.google.com/?q=Place+Flagey+Brussels',
    },
    walk: {
      // Lead with the route — three proper nouns separated by arrows. The eyebrow
      // names the moment, the reason gives the texture.
      title: 'Place du Jeu de Balle → Chez Biquet → Brasserie Ploegmans',
      sub: 'Marolles Sunday morning · 7–11am',
      reason: 'The city\'s last real flea market, no Instagram crowds. Frites at Chez Biquet — cash, queue outside, no apologies. End with a Cantillon gueuze at Ploegmans before the lunch rush.',
    },
    tip: {
      headline: 'Always carry €5 in cash',
      body: 'Frites stands, the Sunday market, the bus driver who can\'t change a €50. Belgium runs on small cash even in 2026 — and the people who run on small cash are the ones worth queueing for.',
    },
  },
]

/** Returns the most recent pick (top of the array) — what the hub renders today. */
export function currentBrusselsPick(): EditorPick {
  return BRUSSELS_PICKS[0]
}
