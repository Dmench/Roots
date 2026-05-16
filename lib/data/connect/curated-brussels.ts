// Curated "Roots note" content for Brussels.
//
// Each entry has:
//   - a stable slug — used in /brussels/tips/[slug] URLs (do NOT renumber)
//   - a short body (~280 chars) — the version shown in the Connect feed
//   - an expansion (~120–200 words) — used on the public tip detail page
//     for SEO depth and to give Google more than a 280-char skinny page
//   - optional neighbourhood + relatedTaskSlugs cross-links
//
// Treat this file as editorial content, not generated. Hand-write expansions.

import type { CityId } from '@/lib/types'

export type CuratedKind = 'tip' | 'question' | 'heads-up'

export interface CuratedNote {
  id:               string             // legacy id used in the Connect feed (kept for compatibility)
  cityId:           CityId
  slug:             string             // URL slug — stable
  kind:             CuratedKind
  title:            string             // h1 on the detail page (≤80 chars)
  body:             string             // 1–2 sentence summary used in the feed card (≤280 chars)
  expansion:        string             // 80–200 word body for the public tip page (markdown-light)
  neighbourhood?:   string             // optional neighbourhood slug match (lowercase)
  relatedTaskSlugs?: string[]
  relatedTipSlugs?: string[]
}

export const CURATED_BRUSSELS: CuratedNote[] = [
  // ── Tips ────────────────────────────────────────────────────────────────
  {
    id:    'bxl-tip-1',
    cityId: 'brussels',
    slug:  'register-commune-8-days',
    kind:  'tip',
    title: 'Register at your commune within 8 days of arriving',
    body:  'Register at your commune within 8 days of arriving — this unlocks your eID, mutuelle, and everything else. Ixelles and Saint-Gilles tend to have English-speaking staff.',
    expansion:
`The 8-day rule is in the Belgian Foreign Nationals Act. Most newcomers miss it because no one tells them, and the consequence — a small administrative fine, plus a delay on every downstream step — only becomes visible weeks later.

In practice you have a bit of slack: every commune accepts late registrations, and the actual processing time (police visit + dossier) is 4–8 weeks regardless of when you started. But starting late means the mutuelle deadline (3 months from arrival) starts pressing fast, and you cannot open most Belgian bank accounts without proof of registration.

Bring: your passport, a signed lease or accommodation declaration, two passport photos, and €25 in cash for the eID. Ixelles, Saint-Gilles, and the City of Brussels communes generally have English-speaking staff; Schaerbeek, Anderlecht, and Molenbeek prefer French. The Bureau de la Population in your commune is the office you want — appointments via the commune website, walk-ins accepted at some.`,
    relatedTaskSlugs: ['register-commune', 'eid'],
  },
  {
    id:    'bxl-tip-2',
    cityId: 'brussels',
    slug:  'stib-monthly-pass',
    kind:  'tip',
    title: 'The STIB monthly pass covers everything, but the 12-trip card is better at first',
    body:  'STIB\'s monthly pass is ~€59 and covers metro, tram, and bus across the whole region. The 12-trip card is better than single tickets if you\'re not yet committed to monthly.',
    expansion:
`STIB (Société des Transports Intercommunaux de Bruxelles, MIVB in Dutch) runs the metro, tram, and bus across all 19 communes of Brussels. One monthly pass — €59 standard, €12 for under-25s — covers everything.

If you\'re new and unsure how much you\'ll travel, start with the 12-trip card (€17, valid 60 minutes per trip including transfers). It\'s the lowest-friction way to get moving while you decide whether to commit. Above ~16 trips a month, the monthly pass pays off.

The pass loads onto either a MOBIB physical card (€5 one-off), your eID directly (free, but you need the eID first), or the STIB JUMP app. JUMP is the easiest — you scan the QR code in stations and on board with your phone. Note that the JUMP app needs a Belgian phone number to register; if you only have a foreign one, use MOBIB until your SIM arrives.`,
    relatedTaskSlugs: ['phone-sim'],
  },
  {
    id:    'bxl-tip-3',
    cityId: 'brussels',
    slug:  'mutuelle-partenamut-english',
    kind:  'tip',
    title: 'Partenamut is the easiest mutuelle for English speakers',
    body:  'Mutualité Socialiste and Mutualité Chrétienne are the two dominant mutuelles, but Partenamut is the easiest for English speakers. Sign up within 90 days of arrival or you pay medical costs out of pocket.',
    expansion:
`Belgium\'s healthcare runs through mutualités (mutuelles in French, ziekenfondsen in Dutch) — non-profit insurance funds that reimburse you for most medical costs once you\'re registered. You\'re legally required to join one within 90 days of registering at your commune.

Mutualité Socialiste (Solidaris) and Mutualité Chrétienne are the two largest, but their English-language service varies by branch. Partenamut is consistently the smoothest for non-French/Dutch speakers — they have an English-language onboarding flow, English customer support, and an app that works in English. Mutualité Libérale is a smaller fourth option also worth a look.

Joining is one form + ID + proof of commune registration. They\'ll backdate to your arrival date if you sign up within the 90-day window. Miss the window and you pay full medical costs until you re-qualify — which can take months. Don\'t miss the window.`,
    relatedTaskSlugs: ['mutuelle'],
  },
  {
    id:    'bxl-tip-4',
    cityId: 'brussels',
    slug:  'wise-revolut-first-salary',
    kind:  'tip',
    title: 'Open Wise or Revolut before you arrive — your first salary lands there',
    body:  'Open a Wise or Revolut account before you arrive. You\'ll need a Belgian address and eID for a full Belgian bank, but you can receive your first salary into Wise no problem.',
    expansion:
`Belgian banks (BNP Paribas Fortis, ING, KBC, Belfius) all require a Belgian address and eID to open a current account. The eID takes 4–8 weeks after you register at your commune. Your first payday will arrive before that.

Wise and Revolut both issue European IBANs and accept Belgian salary payments without any Belgian-resident requirement. Open one before you fly in, give the IBAN to your employer on day one, and you have salary flowing while the Belgian banking process runs in the background.

Wise tends to be slightly better for one-off transfers (multi-currency, very low FX fees). Revolut tends to be slightly better for daily spending and budgeting. Either works. Most Brussels newcomers open both, use them as bridge accounts for 1–3 months, then keep one as a secondary alongside their Belgian bank.`,
    relatedTaskSlugs: ['bank-account'],
  },
  {
    id:    'bxl-tip-5',
    cityId: 'brussels',
    slug:  'place-flagey-saturday-market',
    kind:  'tip',
    title: 'Place Flagey Saturday market is the best food market in Brussels — get there before 11',
    body:  'Place Flagey market on Saturday morning is the best food market in Brussels — get there before 11. Cheese, wine, bread, Moroccan olives, and a Belga terrace afterwards.',
    expansion:
`Place Flagey hosts the Saturday morning food market that beats anything else within an hour of the city. Cheese counters with proper Belgian and French selections, two competing oyster bars, the Charli bread stand (the best baguette in the city, queue accepted), Moroccan olive sellers, wine merchants, a flower stall, fish, fruit, vegetables — the works.

Arrive before 11am. After 11 it gets crowded and the best things sell out. Bring cash for the smaller stalls; most accept card now but a few don\'t. Bring a tote — the plastic bags are a Brussels environmental nuisance and the cheesemonger will judge you.

After: cross the square to Café Belga (the terrace institution under the Flagey radio building) for a coffee or a vermouth. Saturday morning at Flagey is one of the most consistently good two-hour experiences in Brussels, and the cheapest entry point into "I live here" energy.`,
    neighbourhood: 'flagey',
    relatedTipSlugs: ['three-anchor-cafe-walk-eat'],
  },
  {
    id:    'bxl-tip-6',
    cityId: 'brussels',
    slug:  'villo-bike-share-cheap',
    kind:  'tip',
    title: 'Villo bike share is €38 a year — half the bikes work most days',
    body:  'Villo bike share is €38 a year — cheaper than two STIB monthly passes. Phone-unlock, dock anywhere in the city, half the bikes work most days.',
    expansion:
`Villo! is Brussels\' Bolloré-run bike share. Annual subscription €38, phone unlock via the Villo! app, dock anywhere in the network (about 350 stations across the 19 communes). Two STIB monthly passes cost more.

The honest caveat: about a third of the bikes are out of order at any given time, station rebalancing is unreliable, and central stations empty out at rush hour. Plan for the occasional 5-minute walk to the next station. The newer e-bike-only Pony scheme (separate app) is the backup when Villo! fails.

Brussels is hillier than most cycle cities — pick routes via the canal or the rue du Trône / Avenue Louise spine to avoid the worst climbs. Bike paths are decent in Ixelles, Saint-Gilles, the EU Quarter, and along the canal; basically non-existent in Schaerbeek and parts of Anderlecht. A helmet is not required by law but nobody who cycles regularly skips one.`,
    relatedTipSlugs: ['stib-monthly-pass'],
  },
  {
    id:    'bxl-tip-7',
    cityId: 'brussels',
    slug:  'english-speaking-gp-bmc-house-of-doctors',
    kind:  'tip',
    title: 'BMC and House of Doctors — English GPs that bill via mutuelle',
    body:  'For an English-speaking GP without a wait, look up Brussels Medical Center (BMC) in Châtelain or House of Doctors near Schuman. Both bill via your mutuelle directly once you\'re registered.',
    expansion:
`Finding an English-speaking GP in Brussels is harder than it should be. Most communal practices speak French and Dutch; many of the truly bilingual ones have closed patient lists.

Brussels Medical Center (BMC) on rue Vilain XIIII in Ixelles/Châtelain is one of the most reliable for English speakers. Mixed practice — GPs, paediatricians, some specialists. Walk-ins accepted, appointments via the Doctena app. House of Doctors near Schuman is similar, serves the EU Quarter, and is set up for the transient EU/NATO population.

Both bill via tiers payant — meaning your mutuelle pays directly, you pay only the patient-share (typically €5–15 per visit). You must be registered with a mutuelle first. If you\'re still in your 90-day window, keep all receipts and submit them once your mutuelle is active.`,
    relatedTaskSlugs: ['register-gp', 'mutuelle'],
  },
  {
    id:    'bxl-tip-8',
    cityId: 'brussels',
    slug:  'itsme-belgian-universal-login',
    kind:  'tip',
    title: 'Get Itsme as soon as you have an eID — it saves hours over time',
    body:  'Get an Itsme account as soon as you have an eID. It\'s the Belgian universal login for tax declarations, mutuelle paperwork, opening accounts — saves hours over time.',
    expansion:
`Itsme is the Belgian universal digital identity app. Once linked to your eID, it logs you into government portals (MyMinFin for taxes, MyHandicap for disability claims, eBox for official mail), bank accounts, mutuelle dashboards, doctor booking platforms, and dozens of private services — with one tap.

Without Itsme you\'re back to passwords plus eID card-reader logins, which are painful. Itsme works with face/fingerprint unlock on your phone. The setup is one-off — link to eID at any bank branch, takes 5 minutes, then you\'re done.

The tax declaration deadline (June for paper, mid-July for online) is the moment most newcomers wish they\'d set up Itsme earlier. Do it the same week you collect your eID.`,
    relatedTaskSlugs: ['eid'],
  },
  {
    id:    'bxl-tip-9',
    cityId: 'brussels',
    slug:  'groceries-carrefour-delhaize-lidl',
    kind:  'tip',
    title: 'Carrefour for late, Delhaize for produce, Lidl for everything else',
    body:  'For groceries: Carrefour Express for late nights, Delhaize for produce quality, Lidl for everything else. The Wednesday-evening Châtelain market beats them all for a date-night dinner.',
    expansion:
`Carrefour Express is the late-night convenience format — open until 10pm or 11pm most days, premium price, useful when you\'ve forgotten something. Delhaize sits in the middle — pricier than Lidl, broader range, consistently better fresh produce. Lidl is the price-leader on basics, especially good for cheese, bread, eggs, and frozen.

Belgians switch between them without loyalty. The €40-saving-per-week move is doing your weekly shop at Lidl and your fresh-and-Saturday shop at Delhaize.

The Wednesday-afternoon Châtelain market (15h–20h, Place du Châtelain in Ixelles) beats them all when you want to actually cook something good. Cheese, fish, charcuterie, oysters, flowers, wine, and the only properly serious bread stall outside of Flagey. Bring cash and a tote.`,
    neighbourhood: 'ixelles',
    relatedTipSlugs: ['place-flagey-saturday-market'],
  },
  {
    id:    'bxl-tip-10',
    cityId: 'brussels',
    slug:  'arrive-summer-august-closed',
    kind:  'tip',
    title: 'If you arrive in summer, half the city is closed in August',
    body:  'If you arrive in summer, expect half the city to be closed in August. Sign anything important (lease, bank, mutuelle) before the first week of August or after the third week.',
    expansion:
`Belgium takes August seriously. Government offices reduce hours, many doctors and dentists close for 2–3 weeks, a meaningful share of restaurants and shops shut completely, and the people who run things at your commune, mutuelle, and bank go on holiday. The commune of Ixelles, for instance, has historically run on reduced hours through the entire month.

If you can choose your arrival date, avoid the first 3 weeks of August. The 9-day window of mid-September is the sweet spot — schools restart, everyone is back, but the autumn admin rush hasn\'t kicked in yet.

If you must arrive in August, do as much as possible online: book commune appointments in advance via the website, use Itsme to handle anything you can from your phone, and accept that some processes will simply pause until September. Use the time to walk neighbourhoods — the city is empty and lovely.`,
    relatedTaskSlugs: ['register-commune'],
  },

  // ── Questions ────────────────────────────────────────────────────────────
  {
    id:    'bxl-q-1',
    cityId: 'brussels',
    slug:  'commune-registration-how-long',
    kind:  'question',
    title: 'How long does commune registration actually take?',
    body:  'Common question: how long does commune registration actually take? Most communes process your dossier in 4–8 weeks, then a local police officer visits your address before the card is issued.',
    expansion:
`Commune registration in Brussels has two stages: the dossier (paperwork at the Bureau de la Population) and the police visit (an officer turning up at your declared address to confirm you actually live there).

The dossier opens immediately when you walk in with your passport, lease, and photos. The police visit is the bottleneck — it can happen within 5 days in fast communes (Etterbeek, Watermael-Boitsfort) or take 6–10 weeks in slow ones (City of Brussels, Schaerbeek). Your eID is then issued 2–3 weeks after the police clear the visit.

Total: 4–8 weeks in most cases, longer if the officer keeps missing you. If you\'re not home when they ring, they leave a paper note in the letterbox with a callback number — call back the same day. Two missed visits and your dossier risks being suspended.`,
    relatedTaskSlugs: ['register-commune'],
  },
  {
    id:    'bxl-q-2',
    cityId: 'brussels',
    slug:  '3-6-9-lease-explained',
    kind:  'question',
    title: 'What is a 3-6-9 lease and what does it actually mean?',
    body:  'People often ask about the 3-6-9 lease. It\'s a standard Belgian residential lease — you can leave after 3, 6, or 9 years with 3 months notice. Earlier exits cost ~3 months\' rent in penalty.',
    expansion:
`The 3-6-9 (bail de résidence principale) is the default Belgian residential lease for someone\'s main home. The 9 in the name is the maximum length; the 3 and 6 are mid-points at which you can break the lease without paying penalty, with 3 months\' written notice.

Breaking the lease earlier — i.e. before year 3 — costs a penalty. Year 1: 3 months\' rent. Year 2: 2 months. Year 3: 1 month. After the year-3 break point, you can leave at any time with 3 months\' notice and no penalty, as long as you give it at the right time.

Short-term leases exist too (bail de courte durée, 3 years or less), and student/furnished leases have their own rules. If your lease isn\'t labelled "bail de résidence principale" or "9 ans," read it carefully — the protections differ.`,
    relatedTaskSlugs: ['find-housing'],
  },
  {
    id:    'bxl-q-3',
    cityId: 'brussels',
    slug:  'french-required-in-brussels',
    kind:  'question',
    title: 'Do I need to speak French in Brussels?',
    body:  'Do I need to speak French in Brussels? In Ixelles, Saint-Gilles, the EU Quarter, Châtelain, and Dansaert — no, English is fine. In communes north and west of the canal, basic French saves a lot of friction.',
    expansion:
`Brussels is officially bilingual French/Dutch, with English as a third functional language in the EU-adjacent neighbourhoods. Whether you "need" French depends on where you live and what you do.

Ixelles, Saint-Gilles (south of the canal), Châtelain, Dansaert, and the EU Quarter all run on English-comfortable terms — most cafés, shops, restaurants, GPs, and gyms will switch to English without being asked. You can live a full life here in English alone.

North and west of the canal — Schaerbeek, Molenbeek, Anderlecht, parts of Saint-Josse — runs primarily on French and Arabic. Basic spoken French (greetings, ordering, asking directions) makes daily life much smoother. Communal admin staff anywhere in Brussels is required to be bilingual French/Dutch but the working language is whichever side of the language frontier you\'re on.

Dutch is rarely "needed" in Brussels itself but is genuinely useful if you commute to Flanders for work.`,
    relatedTaskSlugs: ['register-commune'],
  },
  {
    id:    'bxl-q-4',
    cityId: 'brussels',
    slug:  'finding-apartment-without-agency',
    kind:  'question',
    title: 'How do I find an apartment without an agency?',
    body:  'How do I find an apartment without an agency? Immoweb is the main listing site, but the best places never make it there — check Reddit r/brussels weekly threads and ask directly in newcomer WhatsApp groups.',
    expansion:
`Immoweb is the dominant Belgian property portal — 80% of agency listings and a good chunk of private ones. Set up email alerts for your criteria; the best places vanish within 24 hours.

But there\'s a quieter rental market that never hits Immoweb. Landlords who don\'t want agency fees post in Facebook groups ("Brussels Housing Expats", "Bruxelles Logement", "Apartments and Rooms Brussels"), in the r/brussels weekly housing thread (Sunday evenings), and via word-of-mouth in newcomer WhatsApp groups. About 20% of Brussels rentals go this way and the listings are often better — fairer prices, longer-term landlords, fewer agency-fee headaches.

The bait: scams exist (a foreign owner abroad who can\'t meet you, asks for a deposit upfront — never pay before viewing in person). Visit every flat in person. Bring your dossier (passport, lease, 3 pay slips). The good landlords pick fast.`,
    relatedTaskSlugs: ['find-housing'],
  },
  {
    id:    'bxl-q-5',
    cityId: 'brussels',
    slug:  'tax-residency-worldwide-income',
    kind:  'question',
    title: 'When does Belgium start taxing my worldwide income?',
    body:  'Tax residency: Belgium taxes you on worldwide income from the day you register at the commune. If you arrive late in the year, you\'ll only owe on income earned from your registration date — not the full year.',
    expansion:
`Belgium considers you a tax resident from the day you\'re registered at your commune — not from the day you arrived. Worldwide income from that date forward is taxable in Belgium, including foreign salary, foreign rental income, and foreign investment gains (with treaty-based exemptions for some).

If you register in October, you\'re taxed in Belgium only on income earned October–December. Income earned January–September is still potentially taxable in your previous country of residence (depending on their rules and the bilateral tax treaty).

Belgium uses progressive rates — roughly 25% on the first €15k, 40% on €15k–27k, 45% on €27k–48k, and 50% above. A municipal surcharge of 6–9% sits on top. The Belgian system is one of the higher-tax in Europe, but it also funds the mutuelle reimbursement scheme, unemployment insurance, and the relatively generous parental leave system.

If your situation is complicated (foreign employer, freelance, multiple residences), get advice from a Belgian tax advisor in your first year. The cost (€300–500) is much less than getting it wrong.`,
    relatedTaskSlugs: ['register-commune'],
  },
  {
    id:    'bxl-q-6',
    cityId: 'brussels',
    slug:  'mobile-vikings-proximus-base',
    kind:  'question',
    title: 'Which mobile operator is best for new arrivals?',
    body:  'Best mobile operators for new arrivals: Mobile Vikings (best for English-speaking customer service), Proximus (best coverage), or BASE (cheapest). All work fine; you can switch in 30 days if you change your mind.',
    expansion:
`Belgium has three real networks: Proximus (incumbent, broadest coverage), Orange (formerly Mobistar), and BASE (now part of Telenet). Plus a layer of MVNOs running on top — Mobile Vikings on Proximus, Scarlet on Proximus, BASE\'s budget brand, and the regional CityZen.

For newcomers: Mobile Vikings is the easiest first SIM. English-language signup, English customer support, no Belgian-resident requirement beyond a delivery address, and €15–20/month unlimited calls + 20–30GB data. Activates within 24 hours.

If signal matters more than price (you\'re heading to rural Wallonia for work or live in a basement flat), Proximus direct has the best coverage. BASE is the cheapest if you don\'t need much data.

You can port your Belgian number between operators within 24–48 hours if you change your mind. Porting an international number to Belgium is rarely worth it — it\'s slow, error-prone, and most newcomers prefer to keep their old number on Wise/WhatsApp anyway.`,
    relatedTaskSlugs: ['phone-sim'],
  },
  {
    id:    'bxl-q-7',
    cityId: 'brussels',
    slug:  'schools-international-non-belgian-kids',
    kind:  'question',
    title: 'What are the school options for non-Belgian children?',
    body:  'Schools for non-Belgian children: International School of Brussels (Watermael-Boitsfort) and BSB (Tervuren) for English curriculums. For a public school in French/Dutch, your commune assigns based on residence.',
    expansion:
`Three buckets: the European Schools (free for EU institution staff, costly otherwise, English/French/Dutch instruction), the private international schools (€18k–30k/year, English instruction, IB or American curricula), and the local public system (free, French or Dutch instruction).

The big international names: International School of Brussels (ISB) in Watermael-Boitsfort, British School of Brussels (BSB) in Tervuren, St John\'s International School in Waterloo, and EEB1-4 (European Schools). All have waiting lists; apply 6–12 months out.

The local public system is genuinely good — Belgian schools rank high in OECD studies for equity and academic outcomes. Your commune assigns based on residence and capacity; in popular areas (Ixelles, Etterbeek, the EU Quarter) the assignment lottery favours residents on a strict cadre. Brussels-Capital uses a centralised inscription system for primary and secondary: register your child at multiple preferred schools via inscription.brussels in the year before they start.

If your kids will stay in Belgium past primary school, integrating them into a Belgian school (French or Dutch) is the durable choice. Bilingual immersion gives them an asset for life.`,
    relatedTaskSlugs: ['school-children'],
  },
  {
    id:    'bxl-q-8',
    cityId: 'brussels',
    slug:  'healthcare-while-waiting-mutuelle',
    kind:  'question',
    title: 'How do I get healthcare while I wait for my mutuelle?',
    body:  'Healthcare while you wait for your mutuelle: keep all receipts. Once your mutuelle membership is backdated, you can submit them and get reimbursed retroactively. Don\'t throw any paperwork away in the first 3 months.',
    expansion:
`The 90-day clock between arrival and mutuelle activation is the gap newcomers worry about. The good news: it\'s a paperwork gap, not a coverage gap.

Once your mutuelle is active, it backdates to your commune registration date. Any medical bill, prescription, or hospital invoice you paid in the interim is reimbursable retroactively. The trick is keeping every piece of paper — the original receipt, the prescription, the invoice from the doctor or pharmacy. Snap photos for backup; the originals are what the mutuelle wants.

In a real emergency, go to A&E (urgences) at any Brussels hospital — Saint-Pierre, Saint-Luc, Erasme. They\'ll treat you regardless of insurance status and bill you afterwards. The bill can be substantial (€300–€2,000 for non-trivial admissions). Submit it to your mutuelle once active; expect 60–80% reimbursement.

If you have private international health insurance from a previous employer, keep it active through the first 6 months as belt-and-braces. The day your mutuelle is fully bedded in, you can drop it.`,
    relatedTaskSlugs: ['mutuelle', 'register-gp'],
  },

  // ── Heads-up ─────────────────────────────────────────────────────────────
  {
    id:    'bxl-hu-1',
    cityId: 'brussels',
    slug:  'rental-guarantee-capped-2-months',
    kind:  'heads-up',
    title: 'Rental guarantee is capped at 2 months by law — push back if a landlord asks more',
    body:  'Rental guarantees in Brussels are capped at 2 months\' rent by law (or 3 months in a bank guarantee). If a landlord asks for more, that\'s illegal — push back or walk away.',
    expansion:
`Belgian law caps the rental guarantee at 2 months\' rent if paid directly in cash, or 3 months\' rent if held in a blocked bank guarantee account (the standard option — the bank holds it, the landlord can only access it via court order or with your written consent).

If a landlord asks for 4, 6, or 12 months upfront — it\'s illegal, and the lease clause would be unenforceable in a Belgian housing court. This happens more often than it should at the top end of the market and with landlords renting to non-EU citizens they think won\'t challenge it.

What to do: politely point to the law (Code Civil, article 1762ter). If the landlord refuses to budge, walk away — they\'re signalling other problems. If you\'ve already signed, you can challenge it via the Juge de Paix (free, no lawyer needed for amounts under €2,500) and recover the excess.

The bank guarantee option (garantie locative bancaire) is your friend: your money stays in your name, you earn (a little) interest, and the landlord can\'t touch it without going to court.`,
    relatedTaskSlugs: ['find-housing'],
  },
  {
    id:    'bxl-hu-2',
    cityId: 'brussels',
    slug:  'belgian-banks-need-eid-bridge-with-wise',
    kind:  'heads-up',
    title: 'Belgian banks need eID before they\'ll open you an account — bridge with Wise or N26',
    body:  'Belgian banks often require a Belgian address and eID to open a full current account. In the meantime, Wise or N26 cover salary, rent, and direct debits for most things.',
    expansion:
`Every major Belgian retail bank — BNP Paribas Fortis, ING, KBC, Belfius — requires proof of Belgian residence (commune registration attestation, then eID) before opening a full current account with a BE-prefixed IBAN. The full process takes 4–8 weeks from your commune visit.

In the gap, Wise and N26 both issue European IBANs (BE-prefixed for Belgian Wise, DE-prefixed for N26) that Belgian employers accept for salary, that Belgian landlords accept for rent (most of them), and that Belgian utilities accept for direct debit (most of them — verify with your provider).

The friction: a few specific institutions still insist on a BE-prefixed Belgian-bank IBAN. The energy providers ENGIE and Luminus historically rejected DE IBANs for direct debit; some Belgian mutuelles want a BE IBAN for reimbursements. Wise issues BE IBANs to Belgian residents (after KYC), which closes most of the gap. N26 does not. If you can only pick one, Wise > N26 for Brussels-specific compatibility.`,
    relatedTaskSlugs: ['bank-account'],
  },
  {
    id:    'bxl-hu-3',
    cityId: 'brussels',
    slug:  'trash-collection-coloured-bags',
    kind:  'heads-up',
    title: 'Trash collection uses coloured bags by commune — buying the wrong one means it won\'t be picked up',
    body:  'Trash collection in Brussels uses coloured bags — white (general), yellow (paper), blue (PMC: plastic, metal, cartons). Buying the wrong commune\'s bag means it won\'t be picked up. Check your commune\'s schedule, it varies street by street.',
    expansion:
`Bruxelles-Propreté (the regional waste agency) runs the collection. White bags = general waste, yellow = paper/cardboard, blue = plastic/metal/cartons (the PMC bag). Buy them at any supermarket — Lidl, Carrefour, Delhaize all stock all three.

The catch: collection days vary street by street, not just commune by commune. Two flats on opposite sides of the same Ixelles street can have different collection days. Check the schedule at bruxellespropreté.be using your exact address — it\'ll show you which day each colour goes out.

Put bags out the evening before pickup, after 6pm. Putting them out earlier risks a fine (and they sit in the sun overnight, which is unpleasant for everyone). If your bag isn\'t picked up — wrong colour, wrong day, or torn — Bruxelles-Propreté leaves a yellow sticker on it. Bring it back in and try again next pickup.

Glass goes to communal glass bubbles (the green/white bell-shaped containers around every commune), not in your bag. Garden waste, electronics, and large items go to the local Recypark.`,
    relatedTaskSlugs: [],
  },
  {
    id:    'bxl-hu-4',
    cityId: 'brussels',
    slug:  'no-winter-eviction-protection-belgium',
    kind:  'heads-up',
    title: 'No "trêve hivernale" in Belgium — landlords can evict in winter',
    body:  'The "trêve hivernale" rule that exists in France does NOT exist in Belgium — landlords can evict in winter if you\'re behind on rent. Don\'t let unpaid rent stack up beyond two months.',
    expansion:
`France has the trêve hivernale (winter truce) — a legal protection that prevents residential eviction between 1 November and 31 March. Many French newcomers in Brussels assume the same rule applies in Belgium. It doesn\'t.

Belgian law allows residential eviction year-round, including in mid-January. The process takes 3–6 months from the first unpaid rent notice (Juge de Paix proceedings, formal notice, bailiff intervention), but the calendar gives you no automatic shield.

If you\'re struggling with rent, do not let it stack up. Two months in arrears and the landlord has a clear case. Talk to them before that point — most Belgian landlords are willing to agree a payment plan if you act early. If you\'re facing actual hardship, the CPAS (the public social welfare office in your commune) can intervene and sometimes cover arrears.

The same lack of winter protection applies to utility cutoffs in theory, though in practice ENGIE and Luminus rarely cut off gas/electricity in winter — there\'s a Brussels regional rule against it for households with children or vulnerable adults.`,
    relatedTaskSlugs: ['find-housing'],
  },
  {
    id:    'bxl-hu-5',
    cityId: 'brussels',
    slug:  'sundays-brussels-properly-closed',
    kind:  'heads-up',
    title: 'Sundays in Brussels are properly closed — plan accordingly',
    body:  'Sundays in Brussels are properly closed. Most supermarkets shut by 13:00, many restaurants close all day. Brunch spots in Saint-Gilles and Ixelles are the exception. Plan accordingly or you\'ll be hungry.',
    expansion:
`Belgian Sunday is a real thing. Most supermarkets — Delhaize, Lidl, Carrefour — close at 12:30 or 13:00 on Sunday, and most don\'t open at all in some communes. Many restaurants close for the entire day. The pharmacy on your corner is closed; you find the on-duty pharmacy (pharmacie de garde) via the rotating-list at pharmacie.be.

The exception: the brunch and weekend-cafe scene in Ixelles, Saint-Gilles, Châtelain, and Dansaert runs strong all Sunday. Le Cyclo (Saint-Gilles), Cocina (Châtelain), Maison Antoine (always — frites since 1948), the Halles Saint-Géry, and a dozen others stay open until 16h or later. The Marolles flea market (Place du Jeu de Balle) runs every Sunday morning until 14h — go before 10 for the best stuff.

Plan your weekly shop for Saturday before 19h, or use the Albert Heijn To Go in Schuman / Carrefour Express which keep slightly longer Sunday hours but are pricier. The Night & Day chain stays open until 22h or later — useful for emergency basics.`,
    neighbourhood: 'ixelles',
    relatedTipSlugs: ['groceries-carrefour-delhaize-lidl'],
  },
  {
    id:    'bxl-hu-6',
    cityId: 'brussels',
    slug:  'stib-strikes-announced-48-hours-ahead',
    kind:  'heads-up',
    title: 'STIB strikes are common — they\'re usually announced 48 hours ahead',
    body:  'STIB strikes are common — usually announced 48 hours ahead. Follow @STIBMIVB or the STIB app for live status. On strike days, Villo bikes and Lime scooters get expensive fast; budget extra.',
    expansion:
`STIB workers strike roughly 3–5 times a year, usually over working conditions or pension reform. Strikes are typically called by one of the unions (CGSP, CSC, ACOD) and announced 48 hours ahead. Public-sector general strikes (across all transport, schools, hospitals) happen 1–2 times a year and are similarly pre-announced.

Full strike days mean no metro, no trams, and reduced buses. Partial strikes (specific depots or shifts) cause patchy service — some lines run, others don\'t, often without clear advance information.

Your real-time sources: @STIBMIVB on Twitter/X for live updates, the STIB app for line-by-line status, and the STIB website for the formal grève (strike) notice. The Bruxelles Mobilité Twitter account aggregates strike news across STIB, SNCB rail, and De Lijn.

Strike-day fallbacks: Villo and Pony bike-share usage spikes (and the apps occasionally crash from demand). Lime and Bolt scooters work but are pricier than a normal day. Uber and Heetch ride-share work but with 2–3× surge pricing. If you have a long commute, working from home on strike days is the standard Brussels move.`,
    relatedTipSlugs: ['villo-bike-share-cheap'],
  },
  {
    id:    'bxl-hu-7',
    cityId: 'brussels',
    slug:  'direct-debit-first-bill-only',
    kind:  'heads-up',
    title: 'Don\'t set up direct debit on a Belgian utility until your first bill arrives',
    body:  'Don\'t pay your mobile/internet contract by direct debit until you\'ve had your first bill. Operators occasionally double-charge or fail to cancel old plans, and reversing direct debits is a fight.',
    expansion:
`Belgian utility billing is mostly fine, but the operators have a recurring failure mode: when you switch plans or providers, the old contract sometimes isn\'t actually cancelled. The system bills you for both. Reversing the resulting direct debit is a 4–6 week dispute with customer service.

The fix: receive your first 1–2 bills as one-off invoices (paid by manual transfer), confirm the amounts are correct, then set up the direct debit. You can do this for Proximus (internet/mobile), Telenet, Orange, BASE, the energy providers ENGIE and Luminus, and the water utility Vivaqua.

This is annoying for the first 4 weeks but saves you the experience of fighting Proximus customer support about a €120 ghost charge. Most Belgians who\'ve lived here long enough do this automatically.

Once you\'re confident the bill is right and the contract is the one you signed, switch to direct debit — Belgian invoices have a 15-day payment window and the late fees compound quickly.`,
    relatedTipSlugs: [],
  },
  {
    id:    'bxl-hu-8',
    cityId: 'brussels',
    slug:  'agency-fees-illegal-for-tenants',
    kind:  'heads-up',
    title: 'Agency fees are illegal for tenants in Belgium — only the landlord pays',
    body:  'If you sign a lease through an agency, agency fees are illegal in Belgium for the tenant — only the landlord pays. If anyone tries to charge you, refuse politely and they almost always back down.',
    expansion:
`In Belgium, the property agency works for the landlord — and the landlord pays the agency fee. Charging the tenant any portion of the agency commission is illegal under the 2014 lease law reform. This applies in Brussels-Capital, Flanders, and Wallonia.

Some agencies still try, especially with non-EU newcomers who don\'t know the law. The "administrative file fee" or "dossier fee" of €100–300 charged to a tenant before signing is the most common version of the same illegal practice — also unenforceable.

What to do: when an agent mentions a fee, ask politely whether it\'s legal under Belgian housing law. The honest agents back down on the spot. The dishonest ones get defensive — that\'s your signal to walk and find a different flat. There\'s no shortage.

If you\'ve already paid and want it back: written request to the agency citing article 5 of the Brussels Housing Code, and if they refuse, a Juge de Paix complaint (free, no lawyer, recovers in 2–4 months).`,
    relatedTaskSlugs: ['find-housing'],
  },
]

export function getCuratedTip(slug: string): CuratedNote | undefined {
  return CURATED_BRUSSELS.find(n => n.slug === slug)
}

export function getCuratedForChannel(kind: CuratedKind): CuratedNote[] {
  return CURATED_BRUSSELS.filter(n => n.kind === kind)
}

// Legacy shape — Connect feed renders these as the curated pin list.
// Keep this in sync with the feed's expected `CuratedPin` interface.
export interface LegacyPin { id: string; text: string; label: string; slug: string }

export function legacyPinsForChannel(kind: CuratedKind): LegacyPin[] {
  return getCuratedForChannel(kind).map(n => ({
    id:    n.id,
    text:  n.body,
    label: 'Roots note',
    slug:  n.slug,
  }))
}
