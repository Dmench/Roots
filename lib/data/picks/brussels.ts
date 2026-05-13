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
    /** Optional — ID of a venue in brussels-venues.json. When set, the hub
     *  resolves the photoRef from venue_photo_cache automatically. Prefer
     *  this over `photo` for curated-corpus venues. */
    venueId?:     string
    /** Optional — direct image URL (Unsplash, CDN, etc.) for venues not
     *  in the curated corpus. Use when `venueId` isn't available. */
    photo?:       string
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
  /** Brussels is bilingual — every phrase pick carries both French and Dutch.
      Picks must be tasteful and specific enough to entertain native Belgians,
      not tourist-phrasebook material. */
  phrase: {
    /** French version — usually the headline. */
    fr:      string
    /** Dutch version — paired equivalent, not always a literal translation. */
    nl:      string
    /** One-line English gloss — gives the punchline beat for non-speakers. */
    meaning: string
    /** Editorial reason: when to use, why it's a Belgicism, what it signals. */
    reason:  string
  }
}

export const BRUSSELS_PICKS: EditorPick[] = [
  {
    week: '2026-W20',
    weekLabel: 'Week of 11 May 2026',
    venue: {
      name: 'Fin de Siècle',
      neighborhood: 'Saint-Géry',
      reason: 'No reservations, cash only, paper menu — and every guidebook lists it for a reason. Stoemp aux saucisses, lapin à la kriek, students next to suits, queues outside by 19:30. Sit at the bar if you\'re alone. Closed Tuesdays.',
      href: 'https://maps.google.com/?q=Fin+de+Si%C3%A8cle+Brussels',
      venueId: 'curated-fin-de-siecle',
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
    phrase: {
      fr: 'Non peut-être',
      nl: 'Niet kapot van',
      meaning: 'Belgian double-negatives. Both mean: actually quite good.',
      reason: '«Non peut-être» is the Belgicism every Bruxellois recognises instantly — a double negative that lands as wholehearted yes. Its Flemish cousin, «niet kapot van iets zijn» («not broken about it»), runs the same trick in reverse: muted understatement that\'s actually a quiet recommendation. Drop either in a café and you\'ve passed for local.',
    },
  },
]

/** Returns the most recent pick (top of the array) — what the hub renders today. */
export function currentBrusselsPick(): EditorPick {
  return BRUSSELS_PICKS[0]
}
