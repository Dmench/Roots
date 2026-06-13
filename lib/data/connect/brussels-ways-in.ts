// "Ways in" — curated, evergreen list of how people actually meet others in
// Brussels. Pinned at the top of /[city]/connect.
//
// This exists because the single most-repeated question from newcomers
// ("where do I meet people / make friends?") always gets the SAME handful of
// answers — run clubs, language tables, board-game nights, improv, salsa,
// the stamcafé habit — typed out by hand in thread after thread, then lost.
// Roots just keeps the list. The recurring truth from those threads: Belgians
// make friends through *repeated shared activity*, not in bars — so the trick
// isn't the place, it's going back a few times.
//
// Links use SEARCH urls, not direct group pages: Meetup groups rebrand and
// 404 constantly (same reasoning as RESOURCES in the connect page), so a
// keyword search stays alive where a single group link rots.

function meetupSearch(keywords: string) {
  return `https://www.meetup.com/find/?keywords=${encodeURIComponent(keywords)}&source=GROUPS&location=be--Brussels`
}

export interface WayIn {
  /** Short name of the activity / habit. */
  name: string
  /** Category chip, e.g. "Run club", "Language table", "Local ritual". */
  kind: string
  /** Cadence — the part that matters most. "Weekly", "Every 2nd Friday", "Go often". */
  cadence: string
  /** Optional area / neighbourhood hint. */
  area?: string
  /** One line on *why it works* — concrete, from the threads. */
  why: string
  /** Optional outbound link (search url preferred over fragile group pages). */
  href?: string
}

export const BRUSSELS_WAYS_IN: WayIn[] = [
  {
    name:    'Run clubs',
    kind:    'Run club',
    cadence: 'Weekly',
    why:     'The easiest cold-start in every thread: show up, run, drink after — no small-talk pressure. Several across the city, most are free.',
    href:    meetupSearch('running'),
  },
  {
    name:    'Language tables',
    kind:    'Language table',
    cadence: 'Weekly',
    area:    'Libraries & cafés',
    why:     'A "table de conversation" is a room full of strangers there to talk in a language they\'re learning — the awkward part is the whole point. Muntpunt and the local libraries run them.',
    href:    meetupSearch('language exchange'),
  },
  {
    name:    'Board-game nights',
    kind:    'Games',
    cadence: 'Weekly',
    why:     'A core group goes every time, so it feels established fast — the thread\'s own words. The game does the talking for you.',
    href:    meetupSearch('board games'),
  },
  {
    name:    'Improv & comedy jams',
    kind:    'Class / jam',
    cadence: 'Recurring',
    area:    'Ixelles & centre',
    why:     'Low-stakes, recurring, and built on showing up — the improv jam at Le Réservoir runs every second Friday. Easy to come back to.',
    href:    meetupSearch('improv'),
  },
  {
    name:    'Salsa & dance classes',
    kind:    'Class',
    cadence: 'Weekly',
    why:     'Partner rotation means you meet everyone in the room, and there\'s usually a social after. Brussels has a big scene (Salsa Bruxelles, Salsa Diablo).',
    href:    meetupSearch('salsa dancing'),
  },
  {
    name:    'Find your stamcafé',
    kind:    'Local ritual',
    cadence: 'Go often',
    why:     'The Belgian move: pick one nearby bar and go regularly. Chat the bartender, then their regulars. After a few weeks it becomes your "other place" — you\'ll always know someone there.',
  },
]

// The framing line shown above the list — the one insight that ties it all
// together, lifted straight from the threads ("go about 5 times", "a core
// group that goes every time", "nobody steps up so connections get lost").
export const WAYS_IN_INTRO =
  'The hardest part is the first link, and the trick isn\'t the place — it\'s going back. Pick one, show up a few times, and say the thing nobody else will: "same time next week?"'
