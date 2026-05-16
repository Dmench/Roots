import type { CityId } from '@/lib/types'

export interface Neighbourhood {
  cityId:        CityId
  slug:          string
  name:          string
  aka?:          string         // alternate names / spellings for matching venues
  oneLiner:      string         // 1 sentence — used in cards + meta description
  whoLivesHere:  string
  feels:         string         // editorial paragraph — character of the area
  practical:     string         // transport, rent ballpark, things to know
  bestFor:       string[]       // 3–5 short tags ("Sunday brunch", "first-time movers")
  notIdealIf:    string[]       // honest counterpoint, 2–3 items
  rentBallpark:  string         // "€1,100–1,400 for a one-bed (May 2026)"
  transport:     string         // STIB lines and walk-to-metro time
  // Slugs of venues from brussels-venues.json that anchor the area
  anchorVenueIds?: string[]
  // Cross-link to Roots task slugs that are particularly relevant
  relatedTaskSlugs?: string[]
}

// Six editorial neighbourhood profiles. Each is a real landing-page surface
// for organic search ("moving to Ixelles", "living in Saint-Gilles").
// Add more as we get traction — quality over breadth at this stage.
export const BRUSSELS_NEIGHBOURHOODS: Neighbourhood[] = [
  {
    cityId: 'brussels',
    slug: 'ixelles',
    name: 'Ixelles',
    aka: 'Elsene',
    oneLiner: 'The settler heartland of Brussels — natural wine, specialty coffee, and a neighbour for every accent.',
    whoLivesHere:
      'Brussels is divided into 19 communes; Ixelles is the one most newcomers end up in. EU staff, freelancers, academics from the ULB campus, families who could live anywhere and choose here. Rents are not cheap but the social density is — you can move here knowing no one and have a regular café by month two.',
    feels:
      'Ixelles is what people mean when they say "the good part of Brussels" — even though every commune has its own good parts. The avenue Louise side is polished and slightly French; the Châtelain pocket has the best Wednesday-evening market in the city; Flagey square is the cultural anchor with a Saturday morning food market that beats anything else within an hour. Walk three blocks in any direction and you hit a natural wine bar, a record shop, a Portuguese bakery, a Lebanese sandwich counter, a bookshop in three languages.',
    practical:
      'Bilingual on paper (French and Dutch) but functionally French- and English-speaking. The 71 bus is the lifeline north-south and tends to be packed; trams 81 and 92 cover the rest. Cycling works well except on the rue du Bailli (cobbles + cars). Cost of living is mid-to-high for Brussels — about 15–20% above the city average for rent.',
    bestFor: ['New arrivals', 'Sunday brunch', 'Working from a café', 'Walking everywhere', 'Bookshop afternoons'],
    notIdealIf: ['You want quiet streets at night near Place Flagey', 'You need parking', 'You want to feel like you live in "real" Brussels — try Saint-Gilles or Schaerbeek'],
    rentBallpark: '€1,100–1,400 for a one-bed (May 2026)',
    transport: 'Metro: 5 min to Porte de Namur (line 2/6). Trams 81/92/93. STIB monthly pass €59.',
    anchorVenueIds: ['curated-gratin', 'curated-belga', 'curated-or-coffee'],
    relatedTaskSlugs: ['register-commune', 'find-housing', 'walk-your-neighbourhood', 'three-anchor-spots'],
  },
  {
    cityId: 'brussels',
    slug: 'saint-gilles',
    name: 'Saint-Gilles',
    aka: 'Sint-Gillis',
    oneLiner: 'The most cinematic commune in Brussels — Art Nouveau facades, Portuguese cafés, and the city\'s best terrace square.',
    whoLivesHere:
      'A genuine mix: long-term Portuguese and Moroccan families, young Belgians priced out of Ixelles, a wave of French arrivals from Paris, freelance creatives, queer community. The neighbourhood has gentrified noticeably in the last decade but kept more texture than Ixelles — you still hear five languages at the bakery counter.',
    feels:
      'Parvis Saint-Gilles is the heart: a triangular square ringed with terrace cafés (Moeder Lambic for beer, Café des Spores for wine, Tartine for breakfast), an open-air market three mornings a week, kids and dogs and laptops sharing the same square in equal measure. Walk five minutes in any direction and the architecture is genuinely beautiful — Hôtel Hannon, Maison Cauchie, dozens of unlisted Art Nouveau buildings most cities would put on a tour. The downside: the area between Gare du Midi and the rue de Mérode can feel rough at night; pick your block carefully.',
    practical:
      'French-speaking commune. Excellent for cycling (mostly flat, mostly civilised). Metro: Porte de Hal (line 2/6) or Saint-Gilles tram stop. The Gare du Midi proximity is a feature (Eurostar, Thalys, TGV) and a bug (the immediate area around the station is not its best).',
    bestFor: ['Architecture lovers', 'Trains across Europe', 'Terrace culture', 'Buying property (cheaper than Ixelles)', 'Coming from Paris/Berlin'],
    notIdealIf: ['You want a polished, safe-feeling every-block experience', 'You want quiet on Friday night', 'You drive — parking is hostile'],
    rentBallpark: '€950–1,250 for a one-bed (May 2026)',
    transport: 'Metro: Porte de Hal (line 2/6), 3 min walk to Parvis. Eurostar at Gare du Midi (8 min walk).',
    anchorVenueIds: ['curated-tartine'],
    relatedTaskSlugs: ['register-commune', 'find-housing', 'walk-your-neighbourhood'],
  },
  {
    cityId: 'brussels',
    slug: 'dansaert',
    name: 'Dansaert',
    oneLiner: 'Brussels\' creative quarter — independent fashion, all-day cafés, and the city\'s coolest one-kilometre strip.',
    whoLivesHere:
      'Younger, design-leaning, often working in branding, fashion, or tech. The rents are high enough to push out the original artists but low enough that creative work still happens here. Dansaert is the strip where you go to look like you have lived in Brussels for a year, whether you have or not.',
    feels:
      'A 1-kilometre run of independent boutiques (Stijl, Hunting & Collecting), all-day cafés (OR coffee, Mok), bookshops, and the kind of small-plates restaurants where the menu is on a chalkboard and changes weekly. North of the strip is Sainte-Catherine — a more local square with a fish market and Belga Queen energy. South spills into the Bourse and into the slightly rougher Manneken-Pis tourist zone. Dansaert at 11am on a Saturday is one of the most consistently good walks in the city.',
    practical:
      'French- and Dutch-speaking. Highly walkable. Bourse metro (line 1/5) is a 5-min walk. Limited parking, decent cycling. Lots of short-term rentals, so look carefully at lease terms.',
    bestFor: ['Working in creative fields', 'Saturday browsing', 'Easy access to Gare du Midi + airport via Centraal', 'Smaller apartments'],
    notIdealIf: ['You want big-flat-with-garden energy', 'You want quiet', 'You\'re relocating with kids — schools further out are stronger'],
    rentBallpark: '€1,050–1,350 for a one-bed (May 2026)',
    transport: 'Metro: Bourse (line 1/5) and Sainte-Catherine. Centraal Station 10-min walk.',
    anchorVenueIds: ['curated-bbp-dansaert'],
    relatedTaskSlugs: ['register-commune', 'find-housing', 'three-anchor-spots'],
  },
  {
    cityId: 'brussels',
    slug: 'flagey',
    name: 'Flagey',
    oneLiner: 'The square that is also a neighbourhood — Brussels\' best Saturday market, the Flagey culture centre, and a ring of cafés that never stops.',
    whoLivesHere:
      'A bit older than Ixelles average, a bit more Belgian, lots of musicians (Flagey is a concert venue), academics from ULB, families who want the Bois de la Cambre walkable from their door. This is one of the most consistently liveable pockets of Brussels — green, central, and not too noisy.',
    feels:
      'Place Flagey is a square the size of a small village green, framed on one side by the Flagey culture centre (concerts, cinema, the famous Belga café terrace), on another by the Ixelles ponds and the entrance to the Bois de la Cambre. Saturday morning the market sets up: cheese, oysters, Moroccan olives, a fish counter, the best bread in the city from Charli. Stay for an espresso at Café Belga, walk the ponds, lunch at Le Tournant. This is the recommended Saturday in Brussels.',
    practical:
      'French- and Dutch-speaking. The 81 tram and 71 bus connect it to everything; cycling is the fastest way out of the square. Rents are slightly higher than central Ixelles — you\'re paying for the green and the quiet.',
    bestFor: ['Families', 'Anyone who wants a Saturday-morning ritual', 'Musicians (Flagey concert hall)', 'Walking the ponds'],
    notIdealIf: ['You want nightlife on your doorstep — head toward Châtelain', 'You want a small budget — this is one of the pricier pockets'],
    rentBallpark: '€1,200–1,500 for a one-bed (May 2026)',
    transport: 'Tram 81 to the centre (15 min). Bus 71 north-south. Bois de la Cambre 10-min walk.',
    anchorVenueIds: ['curated-belga'],
    relatedTaskSlugs: ['register-commune', 'find-housing', 'three-anchor-spots'],
  },
  {
    cityId: 'brussels',
    slug: 'marolles',
    name: 'Marolles',
    oneLiner: 'Old Brussels, no tourists — the Sunday flea market, the best frites in the city, and a working-class accent that has survived everything.',
    whoLivesHere:
      'A real mix — long-term Brussels-Brusselaers (the local dialect), Moroccan families, artists who bought in the 90s, and a small wave of newcomers who want texture over polish. The neighbourhood has stubbornly resisted full gentrification despite being two blocks from the Sablon.',
    feels:
      'Place du Jeu de Balle hosts the daily Vieux Marché flea market — Sunday before 9am is the moment, when the dealers haven\'t picked through the best stuff yet. Chez Biquet does the best frites in the city (cash, queue outside, no apologies). Brasserie Ploegmans for a gueuze after. No menus in English on most blocks; no tourist pricing; no Instagram crowds. The streets are narrow and slightly worn, and that is exactly the point.',
    practical:
      'French- and Dutch-speaking with a strong Brussels-Brusselaers thread. Walkable to the Sablon (5 min), the Grand Place (8 min), the Palais (10 min). Limited parking. Cycling works but the cobbles are real.',
    bestFor: ['Sunday flea-market obsessives', 'Anyone tired of polish', 'Eating well for under €15', 'Living five minutes from the centre without paying centre prices'],
    notIdealIf: ['You want quiet on weekend mornings', 'You drive', 'You want every street to feel safe at 2am'],
    rentBallpark: '€850–1,150 for a one-bed (May 2026)',
    transport: 'Metro: Porte de Hal or Louise. Tram 92/93. 8-min walk to Grand Place.',
    anchorVenueIds: [],
    relatedTaskSlugs: ['register-commune', 'find-housing', 'walk-your-neighbourhood'],
  },
  {
    cityId: 'brussels',
    slug: 'eu-quarter',
    name: 'EU Quarter',
    aka: 'European Quarter / Schuman',
    oneLiner: 'Fast, functional, and slightly soulless on Sundays — but unbeatable if you work for an EU institution.',
    whoLivesHere:
      'Heavy concentration of EU institution staff, NATO, consultants, lobbyists, and the journalists who cover them. Many residents are on 3–5 year postings, which gives the area a transient feel — but also makes it easy to slot in. Brussels-born locals mostly avoid living here.',
    feels:
      'Three squares anchor it: Schuman (Commission HQ), Place du Luxembourg (Parliament, plus the Thursday-evening drinks scene), and Place Jourdan (the unofficial neighbourhood centre, where Maison Antoine\'s frites stand has been operating since 1948). Weekday lunches are excellent — Mer du Nord for fish, Antoine for frites, a dozen sandwich spots. Weekends, the area empties out and you remember why locals warn you. The Cinquantenaire park on the eastern edge is one of the best green spaces in the city.',
    practical:
      'English-functional everywhere. Metro: Schuman (line 1/5), Maelbeek (line 1/5), Trône (line 2/6). Excellent for commuting to EU institutions and Centraal Station. Rents are high — you\'re paying for the institutional proximity.',
    bestFor: ['EU institution staff (free European Schools for kids)', 'Anyone who wants English to "just work"', 'Cinquantenaire-adjacent living', 'Short-term postings'],
    notIdealIf: ['You want a Sunday-morning culture', 'You want to feel embedded in Brussels rather than adjacent to it', 'Your budget is tight'],
    rentBallpark: '€1,200–1,600 for a one-bed (May 2026)',
    transport: 'Metro: Schuman + Maelbeek (line 1/5). 10-min walk to Centraal.',
    anchorVenueIds: [],
    relatedTaskSlugs: ['register-commune', 'find-housing', 'school-children'],
  },
  {
    cityId: 'brussels',
    slug: 'schaerbeek',
    name: 'Schaerbeek',
    aka: 'Schaarbeek',
    oneLiner: 'Big, layered, and one of the most genuinely diverse communes in Western Europe — Brussels without the Brussels expat sheen.',
    whoLivesHere:
      'Turkish, Moroccan, and Belgian families who have been in the same buildings for generations, plus a growing wave of newcomers priced out of Ixelles and Saint-Gilles. Schaerbeek is large — 130,000 people across pockets that feel like five different cities. The Place Dailly / Diamant area is quiet and residential; the Gare du Nord side is dense and grittier; the upper part around Square Riga has Art Nouveau streets and high-ceilinged apartments at half Ixelles prices.',
    feels:
      'The Hôtel Communal on Place Colignon is one of the most beautiful town halls in Belgium. Parc Josaphat is a proper city park with a lake, a deer enclosure, and tennis courts. Chaussée de Haecht runs north-south as the commercial spine — Turkish bakeries, halal butchers, fabric shops, and the best baklava in Brussels at Damascus or Ankara. Weekend markets at Place du Roi Baudouin and Place Lehon. This is what newcomers mean when they say they want to live in "real" Brussels — and the rents reflect that nobody warned them yet.',
    practical:
      'French-speaking commune with strong Arabic and Turkish presence. Metro coverage is limited (line 3 reaches the west edge); trams 25/55/62 are the lifelines. Cycling is decent on the flat parts, brutal on the hills around Schaerbeek-Plage. Some streets are gentrifying fast; others won\'t for another decade. Walk first.',
    bestFor: ['Mixed-budget couples', 'Buyers (still affordable)', 'Anyone tired of expat bubbles', 'Big apartments with original parquet'],
    notIdealIf: ['You need quick metro access in every direction', 'You want streets that all feel polished', 'Nightlife is non-negotiable'],
    rentBallpark: '€800–1,100 for a one-bed (May 2026)',
    transport: 'Trams 25/55/62. Metro: Botanique (line 2/6) on the south edge, 10-min walk from most pockets.',
    anchorVenueIds: [],
    relatedTaskSlugs: ['register-commune', 'find-housing', 'walk-your-neighbourhood', 'meet-one-neighbour'],
  },
  {
    cityId: 'brussels',
    slug: 'etterbeek',
    name: 'Etterbeek',
    oneLiner: 'The quiet, slightly studious commune next door to the EU Quarter — leafy streets, the ULB campus, and Brussels\' best 19th-century apartment stock.',
    whoLivesHere:
      'ULB and VUB students and academics, EU staff who wanted a calmer alternative to Schuman, young couples buying their first apartment. Etterbeek punches above its weight on liveability — small enough to feel local, central enough to reach anything in 15 minutes.',
    feels:
      'Place Jourdan technically straddles the EU Quarter, but the Etterbeek side has the actual neighbourhood centre — bakeries, hardware shops, a Sunday market. The streets around Place Jourdan, Square Marie-Louise, and the ULB campus are some of the prettiest in the city: high-ceilinged townhouses, leafy, walkable. The Cinquantenaire arch is at one edge; the ULB botanical gardens and the calm Parc Léopold are inside it. Etterbeek is what people pick when they want Ixelles energy minus 30% of the noise.',
    practical:
      'French- and Dutch-speaking. Metro: Mérode (line 1/5), Schuman (line 1/5), Thieffry (line 5). Excellent cycling — flat, civilised drivers. Rents are mid-tier Brussels.',
    bestFor: ['Working at the EU', 'Studying at ULB/VUB', 'Buyers looking for character apartments', 'Couples planning a quieter life'],
    notIdealIf: ['You want lots of bars on your doorstep', 'You want diversity on every block — Etterbeek is more uniform than Schaerbeek or Anderlecht', 'You want big-flat-with-garden energy at a discount — you\'ll have to go further out'],
    rentBallpark: '€1,000–1,300 for a one-bed (May 2026)',
    transport: 'Metro: Mérode + Schuman (line 1/5). Trams 7/25/81. 12-min walk to Centraal via Cinquantenaire.',
    anchorVenueIds: [],
    relatedTaskSlugs: ['register-commune', 'find-housing', 'walk-your-neighbourhood'],
  },
  {
    cityId: 'brussels',
    slug: 'uccle',
    name: 'Uccle',
    aka: 'Ukkel',
    oneLiner: 'Brussels\' leafy southern commune — large gardens, international schools, and a slower pace that families chase deliberately.',
    whoLivesHere:
      'Families with kids in school, long-term Belgian residents, a strong British and Dutch contingent, and EU staff who picked the commute over the city centre. Uccle is large and varied — the Vert Chasseur and Saint-Job pockets feel almost suburban; Brugmann and the area around the Bois de la Cambre still feel Brussels.',
    feels:
      'The Bois de la Cambre wraps the northern edge — 300 acres of woods running into the Forêt de Soignes beyond. Saturday mornings at the Brugmann market or the Place du Châtelain market (technically Ixelles but a 10-min walk). Place Saint-Job has a village-square feel; the Globe area is quietly hip with newer cafés. The British School of Brussels and ISB are both within easy reach, which is why so many international families settle here.',
    practical:
      'French-speaking commune with strong English/Dutch presence. Tram 92 is the lifeline north to the centre — 25 minutes to Place Louise. Cycling works if you\'re willing to climb. Some pockets are unwalkable without a car (Vert Chasseur, parts of Saint-Job); others are pedestrian-friendly. Rents vary wildly — a leafy villa on avenue Brugmann vs. a studio near Albert station.',
    bestFor: ['Families with kids', 'International school commute', 'Anyone wanting a garden', 'A slower Brussels'],
    notIdealIf: ['You don\'t drive and want full city access', 'You want neighbours your age in their 20s/30s without kids', 'Your social life is in the centre — the commute eats you'],
    rentBallpark: '€1,100–1,600 for a one-bed (May 2026)',
    transport: 'Tram 92 north-south (~25 min to Louise). Tram 3 and Tram 4 north-south alternatives. Limited metro.',
    anchorVenueIds: [],
    relatedTaskSlugs: ['register-commune', 'find-housing', 'school-children'],
  },
  {
    cityId: 'brussels',
    slug: 'anderlecht',
    name: 'Anderlecht',
    oneLiner: 'Gentrifying west of the canal — the food market scene, the football, and the lowest rents in central Brussels.',
    whoLivesHere:
      'Long-term Moroccan and Belgian families, a growing wave of young couples and freelancers priced out of Saint-Gilles, and people serious about getting more flat for their money. Anderlecht is huge and split into pockets — Cureghem near the slaughterhouses feels gritty; Wayez has a more polished commercial centre; the Bizet/Veeweyde area is leafier and family-oriented.',
    feels:
      'The Sunday Abattoirs market (Cureghem) is the largest open-air market in Europe and the best place in Brussels to spend €20 on food and feel rich. RSCA (the football club) is a real local identity. New brewery and natural-wine spots are appearing along Chaussée de Mons — Brussels Beer Project moved part of its operation here. Anderlecht is what Berlin\'s Neukölln was a decade ago: real, undervalued, on the way up, and not for everyone yet.',
    practical:
      'French-speaking commune with strong Arabic presence. Metro: Saint-Guidon, Gare de l\'Ouest (line 5), Clémenceau (line 2/6). Trams 81/82/97. Cycling is decent on the flat, but parts of the commune feel cut off from the rest of the city by the canal and the rail tracks. Rents are the lowest of any "central" Brussels commune.',
    bestFor: ['Buyers (still affordable, gentrifying)', 'Renters wanting space', 'Sunday-market lovers', 'Anyone who likes a place before it gets discovered'],
    notIdealIf: ['Your first impression of a place matters', 'You want safe-feeling streets everywhere — pick your block', 'You don\'t want to explain to family why your address sounds rough'],
    rentBallpark: '€700–1,000 for a one-bed (May 2026)',
    transport: 'Metro: Saint-Guidon + Gare de l\'Ouest (line 5). Tram 81 east-west.',
    anchorVenueIds: [],
    relatedTaskSlugs: ['register-commune', 'find-housing', 'walk-your-neighbourhood', 'meet-one-neighbour'],
  },
  {
    cityId: 'brussels',
    slug: 'sainte-catherine',
    name: 'Sainte-Catherine',
    aka: 'Sint-Katelijne',
    oneLiner: 'The most walkable square in Brussels — fish market, fountains, and a five-minute reach to anything you need.',
    whoLivesHere:
      'A genuine mix: long-term Brusselsers in the social housing blocks, a layer of architects-and-graphic-designers who bought in the early 2000s, and a steady stream of newcomers willing to pay centre-of-city prices. Sainte-Catherine is unusual in Brussels — central but quiet, dense but liveable.',
    feels:
      'Place Sainte-Catherine and Place du Vieux Marché aux Poissons share a single wide pedestrian space — once the inner harbour, now a long fountain pool ringed with terrace seafood restaurants (Mer du Nord, Noordzee, the Sunday-only oyster crowd). Walk five minutes north and you hit the Marché de Sainte-Catherine for a Sunday-morning food market; five minutes south is the Bourse and Dansaert. The architecture is mixed — restored 17th-century houses next to 1970s mistakes — but the street grid is old and the squares are real squares. This is one of the few central pockets that still feels like a neighbourhood, not just a tourist zone.',
    practical:
      'French- and Dutch-speaking. Metro: Sainte-Catherine (line 1/5), Bourse (line 1/5). Walkable to Centraal Station (10 min), De Brouckère (5 min), Dansaert (3 min). Limited parking. Cycling works in the pedestrian zones but the surrounding streets are tight.',
    bestFor: ['Fish-market Sundays', 'Walking-everywhere lives', 'Couples without kids', 'Anyone who works in the centre'],
    notIdealIf: ['You need a big flat with a garden', 'You want quiet at 2am on Friday', 'Your budget can\'t stretch to centre pricing'],
    rentBallpark: '€1,100–1,400 for a one-bed (May 2026)',
    transport: 'Metro: Sainte-Catherine (line 1/5). 5-min walk to Bourse + De Brouckère.',
    anchorVenueIds: [],
    relatedTaskSlugs: ['register-commune', 'find-housing', 'walk-your-neighbourhood', 'three-anchor-spots'],
  },
  {
    cityId: 'brussels',
    slug: 'forest',
    name: 'Forest',
    aka: 'Vorst',
    oneLiner: 'Saint-Gilles\' quieter southern neighbour — the same Art Nouveau bones, lower rents, and an Abbaye park most newcomers don\'t know about.',
    whoLivesHere:
      'Saint-Gilles overflow: young Belgian-French-Portuguese families, freelancers, a growing creative scene around Wiels (the contemporary art centre). Forest is one of the most multilingual communes in Brussels — French, Dutch, Portuguese, Arabic, and English all in everyday use on the same street.',
    feels:
      'Place Saint-Denis is the village-square heart — markets twice a week, a handful of bars, the kind of square where you recognise faces by month two. The Parc de Forest and Parc Duden are two beautiful linked green spaces most newcomers haven\'t found yet. Wiels (the converted brewery, now an art centre with the best café terrace south of Saint-Gilles) is the cultural anchor. Streets in Forest-Haut feel almost Parisian; Forest-Bas is rougher and cheaper.',
    practical:
      'French- and Dutch-speaking. Trams 82/97 are the workhorses; bus 49 connects to Saint-Gilles. Cycling works on flats but Forest is hilly south. Rents are 15–25% below Saint-Gilles for the same size flat.',
    bestFor: ['Saint-Gilles-on-a-budget', 'Art-and-park-Sunday people', 'Buyers (still climbing)', 'Bilingual families'],
    notIdealIf: ['You want a metro on your doorstep', 'You need every street to feel polished — pick Forest-Haut', 'You want bars open until 2am within walking distance'],
    rentBallpark: '€800–1,100 for a one-bed (May 2026)',
    transport: 'Tram 82 + 97. No metro inside the commune (closest: Albert, on the edge with Saint-Gilles).',
    anchorVenueIds: [],
    relatedTaskSlugs: ['register-commune', 'find-housing', 'walk-your-neighbourhood'],
  },
]

export function getNeighbourhood(slug: string): Neighbourhood | undefined {
  return BRUSSELS_NEIGHBOURHOODS.find(n => n.slug === slug)
}

export function getNeighbourhoodsForCity(cityId: CityId): Neighbourhood[] {
  return BRUSSELS_NEIGHBOURHOODS.filter(n => n.cityId === cityId)
}
