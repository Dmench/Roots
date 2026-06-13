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
// THE EDGE: Meetup (bought by Bending Spoons, Jan 2024) now blurs member
// names/photos and locks groups behind a paid "Meetup+" subscription. So we
// deliberately DO NOT link to Meetup. Every link here goes to a group's own
// free, no-login channel — its website, Instagram or Strava. Roots stays free
// and points at the open web that Meetup is busy walling off.

export interface WayIn {
  /** Short name of the activity / habit. */
  name: string
  /** Category chip, e.g. "Run club", "Language table", "Local ritual". */
  kind: string
  /** Cadence — the part that matters most. "Weekly", "1st & 3rd Friday", "Go often". */
  cadence: string
  /** Optional area / neighbourhood hint. */
  area?: string
  /** One line on *why it works* — concrete, from the threads. */
  why: string
  /** Specific groups to actually go to — each a FREE, no-login source (own
   *  site / Instagram / Strava). Never Meetup. */
  links?: { label: string; href: string }[]
}

export const BRUSSELS_WAYS_IN: WayIn[] = [
  {
    name:    'Run clubs',
    kind:    'Run club',
    cadence: 'Weekly · free',
    why:     'The easiest cold-start in every thread: turn up, run, drink after — no small-talk required. All free and volunteer-run, and they post the next run on Instagram/Strava, not behind a login.',
    links: [
      { label: 'BXL Run Crew',            href: 'https://www.bxlruncrew.com' },
      { label: 'Brussels Runners',        href: 'https://www.instagram.com/brussels.runners/' },
      { label: 'All run clubs ·CorrerJuntos', href: 'https://www.correrjuntos.com/cities/brussels' },
    ],
  },
  {
    name:    'Language tables',
    kind:    'Language table',
    cadence: 'Weekly',
    why:     'A room of strangers there to talk in a language they\'re learning — the awkward part is the whole point. BlaBla runs a weekly Brussels night (free entry, just buy a drink); ConversationExchange matches you for free.',
    links: [
      { label: 'BlaBla Brussels',         href: 'https://www.blablacommunity.com/events/brussels-blabla-language-exchange-3' },
      { label: 'ConversationExchange',    href: 'https://www.conversationexchange.com' },
    ],
  },
  {
    name:    'Board-game nights',
    kind:    'Games',
    cadence: 'Several nights/week',
    area:    'Outpost, centre',
    why:     'A core group goes every time, so it feels established fast — the thread\'s own words. Outpost is a free-to-play board-game café; the open "join & play" nights mean you never sit alone.',
    links: [
      { label: 'Outpost Brussels',        href: 'https://outpostbrussels.be/en' },
    ],
  },
  {
    name:    'Improv jams',
    kind:    'Jam',
    cadence: '1st & 3rd Friday · free',
    area:    'Le Réservoir, Ixelles',
    why:     'ImproBubble opens its jam to the whole city — basement of Le Réservoir, 19:00, free, all levels, zero experience needed. Show up, play, stay for a drink after.',
    links: [
      { label: 'ImproBubble jams',        href: 'https://www.improbubble.com/jams' },
      { label: 'Impro Brussels (classes)', href: 'https://www.improbrussels.com' },
    ],
  },
  {
    name:    'Salsa & social dance',
    kind:    'Class',
    cadence: 'Weekly',
    why:     'Partner rotation means you meet the whole room, and there\'s a social after most classes. Studio NY runs free "shines" sessions for all levels; Salsa Bruxelles and Brussels Dance Project have big beginner scenes.',
    links: [
      { label: 'Studio NY Salsa',         href: 'https://www.studionysalsa.be' },
      { label: 'Salsa Bruxelles',         href: 'https://salsabruxelles.be/en/' },
      { label: 'Brussels Dance Project',  href: 'https://www.danceproject.be' },
    ],
  },
  {
    name:    'Find your stamcafé',
    kind:    'Local ritual',
    cadence: 'Go often',
    why:     'The Belgian move, no link required: pick one nearby bar and go regularly. Chat the bartender, then their regulars. After a few weeks it becomes your "other place" — you\'ll always know someone there.',
  },
]

// The framing line shown above the list — the one insight that ties it all
// together, lifted straight from the threads ("go about 5 times", "a core
// group that goes every time", "nobody steps up so connections get lost").
export const WAYS_IN_INTRO =
  'The hardest part is the first link, and the trick isn\'t the place — it\'s going back. Pick one, show up a few times, and say the thing nobody else will: "same time next week?"'
