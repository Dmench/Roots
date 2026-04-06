import type { Task } from '@/lib/types'

export const BRUSSELS_TASKS: Task[] = [
  {
    id: 'bru-register-commune',
    cityId: 'brussels',
    title: 'Register at your commune',
    slug: 'register-commune',
    category: 'admin',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: [],
    summary: 'Your first official step in Belgium. Registration triggers the police visit, starts your 3-month eID clock, and unlocks nearly everything else.',
    guide: `Registering at your local commune (gemeente/commune) is your first and most important administrative step. Without it, you cannot get your eID, open most Belgian bank accounts, or access public healthcare. You must register within 8 days of establishing your main residence in Belgium, though in practice most communes accept you within 3 months.

Go to your commune's registration office (Bureau de la Population / Bevolkingsdienst) in person. Bring all required documents. A commune officer will schedule a police home visit to verify your address — this usually happens within 2–4 weeks. Once verified, you'll receive a notification to collect your eID.

Your commune is determined by where you live, not where you work. Brussels has 19 communes — Ixelles, Uccle, Etterbeek, Saint-Gilles, Schaerbeek, Forest, Molenbeek, Jette, Anderlecht, Koekelberg, Berchem-Sainte-Agathe, Ganshoren, Laeken, Neder-Over-Heembeek, Evere, Woluwe-Saint-Lambert, Woluwe-Saint-Pierre, Auderghem, and Watermael-Boitsfort.`,
    steps: [
      { step: 'Find your commune office', detail: 'Search "[your commune] population office" or check the commune website. Most are open weekday mornings.' },
      { step: 'Gather your documents', detail: 'Valid passport or national ID, proof of address (signed lease or utility bill), passport photos (2×), and your lease or property deed.' },
      { step: 'Go in person', detail: 'Many communes require an appointment. Check online first — some communes (like Ixelles) have appointment systems.' },
      { step: 'Wait for police visit', detail: 'A local police officer will visit your home to verify the address. They ring once; if you miss it, check your letterbox for a note with a callback number.' },
      { step: 'Receive your attestation', detail: 'After verification, you get a temporary attestation. Your eID takes 3–6 weeks to arrive.' },
    ],
    tip: 'Bring your landlord\'s contact details. Some communes call them to verify the lease. Also bring a French or Dutch translation of any foreign documents if asked.',
    estimatedTime: '1–2 hours (office visit) + 2–4 weeks (process)',
    difficulty: 'medium',
    links: [
      { label: 'Brussels communes directory', url: 'https://www.bruxelles.be/19-communes', type: 'official' },
      { label: 'Registering in Belgium (Belgium.be)', url: 'https://www.belgium.be/en/family/residence/registration_in_the_municipality', type: 'official' },
    ],
  },
  {
    id: 'bru-bank-account',
    cityId: 'brussels',
    title: 'Open a Belgian bank account',
    slug: 'bank-account',
    category: 'money',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: [],
    summary: 'You need a Belgian IBAN to receive salary, pay rent, and set up direct debits. Most landlords and employers require one.',
    guide: `A Belgian bank account (with a BE IBAN) is essential. Most Belgian landlords require rent paid from a Belgian account, and employers need one for payroll. Traditional banks (BNP Paribas Fortis, ING, KBC, Belfius) often require you to be already registered at your commune and have your eID.

If you just arrived, start with a fintech account immediately: Wise or Revolut give you a functional European IBAN within hours and work everywhere while you wait for the commune process. Then open a full Belgian account once you have your eID.

For full Belgian accounts, BNP Paribas Fortis and ING are the most foreigner-friendly. BNP's Hello Bank is online-first and quicker to open. KBC is the easiest for Dutch speakers.`,
    steps: [
      { step: 'Open Wise or Revolut immediately', detail: 'Get a European IBAN within 1–2 days. Use this for initial rent payments and receiving salary while you wait for your Belgian account.' },
      { step: 'Wait until you have your eID or attestation', detail: 'Traditional Belgian banks require proof of Belgian address — your commune attestation or eID.' },
      { step: 'Compare Belgian banks', detail: 'ING and BNP are most foreigner-friendly and have English-language service. KBC is strong if you speak Dutch.' },
      { step: 'Book an appointment', detail: 'Most major banks require in-branch appointments to open accounts. Bring passport, proof of address, and commune attestation.' },
      { step: 'Set up Belgian direct debits', detail: 'Rent, utilities, and phone contracts all prefer Belgian SEPA direct debit. Update your IBAN once the account is active.' },
    ],
    tip: 'Argenta is a good option if you want a no-frills, low-fee Belgian account. Their staff in Brussels often speak English.',
    estimatedTime: '1 hour (fintech) or 1–2 weeks (Belgian bank)',
    difficulty: 'easy',
    links: [
      { label: 'Open Wise account', url: 'https://wise.com', type: 'affiliate' },
      { label: 'BNP Paribas Fortis Hello Bank', url: 'https://www.hellobank.be/en', type: 'official' },
      { label: 'ING Belgium', url: 'https://www.ing.be/en/private', type: 'official' },
    ],
  },
  {
    id: 'bru-mutuelle',
    cityId: 'brussels',
    title: 'Join a mutuelle (health insurance)',
    slug: 'mutuelle',
    category: 'health',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: [],
    summary: 'Belgium\'s mutuelle reimburses 75–80% of medical costs. You must join within 3 months of arriving or registering for full retroactive coverage.',
    guide: `In Belgium, the public healthcare system works through mutualities (mutualités/mutualiteiten) — private non-profit organisations that reimburse your medical expenses. You pay a small annual membership fee (€0–€100) and then receive reimbursements for doctor visits, specialist care, hospital stays, and prescriptions.

There are five main mutualities. They all reimburse at the same INAMI/RIZIV rates (set by government), but differ in extra benefits and English-language support. For English speakers in Brussels, the Partenamut and the Mutualité Libérale are generally easiest to work with.

You must affiliate within 3 months of becoming affiliated with social security (i.e., when you start work or register as self-employed). Do it immediately — retroactive coverage is possible if you act fast.`,
    steps: [
      { step: 'Choose your mutuality', detail: 'Partenamut is most popular with expats in Brussels and has English-speaking staff. Mutualité Libérale (OZ in Flanders) is also good.' },
      { step: 'Visit their Brussels office or apply online', detail: 'Bring your eID (or attestation), your employment contract or proof of social security affiliation, and your Belgian bank account IBAN.' },
      { step: 'Fill in the affiliation form', detail: 'Declare your arrival date and employment start date. Affiliation is backdated to when you became eligible.' },
      { step: 'Receive your SIS card / eID link', detail: 'Your mutuality will link to your eID. Doctors scan your card directly to identify your coverage.' },
      { step: 'Register a GP (médecin de référence)', detail: 'Registering a fixed GP gives you higher reimbursement rates. Worth doing as soon as you find a doctor.' },
    ],
    tip: 'Even if you have private international health insurance through an employer, still join a mutuality. Belgian doctors and hospitals bill the mutuality first — having both means near-zero out-of-pocket costs.',
    estimatedTime: '1 hour (registration) + 2 weeks (processing)',
    difficulty: 'easy',
    links: [
      { label: 'Partenamut', url: 'https://www.partenamut.be/en', type: 'official' },
      { label: 'Mutualité Libérale (OZ)', url: 'https://www.mloz.be/en', type: 'official' },
      { label: 'INAMI/RIZIV — healthcare guide', url: 'https://www.inami.fgov.be/en', type: 'official' },
    ],
  },
  {
    id: 'bru-eid',
    cityId: 'brussels',
    title: 'Collect your eID card',
    slug: 'eid',
    category: 'admin',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: [],
    summary: 'Your Belgian electronic identity card. Unlocks banking, healthcare, travel within the EU, and signing official documents digitally.',
    guide: `Your eID (elektronische identiteitskaart / carte d'identité électronique) is your Belgian residence card. It proves you are registered, contains your Belgian national number (NISS), and functions as an identity document for travel within the EU/EEA.

You will receive a letter from your commune when your eID is ready for collection — usually 3–6 weeks after the police home visit confirms your registration. You must collect it in person at the commune office and bring a valid passport. You will also set a PIN code on the spot.

The eID chip contains a digital signature (DigiD in Belgium is called "itsme") that lets you sign official documents, log in to government portals, and authenticate with Belgian institutions.`,
    steps: [
      { step: 'Wait for commune notification', detail: 'You receive a paper letter at your registered address when the eID is ready.' },
      { step: 'Go to commune with passport', detail: 'You must collect in person. The agent will ask you to set a PIN (4 digits) and activate the card.' },
      { step: 'Set your PIN and PUK', detail: 'Write these down securely. You need the PIN for digital signing. The PUK unblocks it if you enter the PIN wrong three times.' },
      { step: 'Download the itsme app', detail: 'itsme is Belgium\'s digital identity app. Link it to your eID for easy login to government portals, banks, and services.' },
      { step: 'Update your bank and mutuality', detail: 'Inform your bank and mutuality that you now have your eID. Some accounts auto-upgrade; others need you to visit in person.' },
    ],
    tip: 'The eID chip requires a card reader to use digitally on a computer. For most things, itsme on your phone is much easier and does the same job.',
    estimatedTime: '30 minutes (collection)',
    difficulty: 'easy',
    links: [
      { label: 'itsme app', url: 'https://www.itsme-id.com/en', type: 'official' },
      { label: 'eID — Belgium.be', url: 'https://www.belgium.be/en/family/identity_documents/eid', type: 'official' },
    ],
  },
  {
    id: 'bru-find-housing',
    cityId: 'brussels',
    title: 'Find and sign a housing contract',
    slug: 'find-housing',
    category: 'housing',
    stageRelevance: ['planning', 'just_arrived'],
    situationRelevance: ['renting'],
    summary: 'Belgian lease law is tenant-friendly but specific. Know what a 3-6-9 contract is, what a rental guarantee looks like, and what your landlord must provide.',
    guide: `Belgian rental law distinguishes between short-term (up to 3 years), long-term (9 years, with break clauses at 3 and 6), and other contracts. Most standard leases are 3-6-9 contracts, meaning a 9-year lease with the right to break at the 3-year and 6-year marks with 3 months' notice.

The rental guarantee (garantie locative) is capped at 2 months' rent if paid directly or 3 months if held in a blocked bank account. You cannot be asked for more. The landlord must provide a detailed état des lieux (property condition report) before you move in — never skip this.

For finding housing, Immoweb is the dominant Belgian platform. Zimmo and Logic-Immo are alternatives. Facebook groups ("Brussels Housing Expats", "Brussels Apartments & Rooms") are useful for short-term. Agencies charge fees but move faster.`,
    steps: [
      { step: 'Search on Immoweb', detail: 'Filter by commune, price, and type. Set email alerts for new listings — good apartments go within 24–48 hours.' },
      { step: 'Visit shortlisted properties', detail: 'Brussels agencies often do group viewings. Bring your documents (passport, pay slips, employment contract) to show you are serious.' },
      { step: 'Review the lease carefully', detail: 'Check the rent indexation clause (rent can increase annually). Ensure utilities are clearly defined as included or excluded.' },
      { step: 'Pay rental guarantee', detail: 'Transfer 2 months\' rent to a blocked guarantee account at your bank (not directly to the landlord). Get a receipt.' },
      { step: 'Complete the état des lieux', detail: 'Do this together with the landlord or agent, in writing, before moving anything in. Photograph everything and keep a copy.' },
    ],
    tip: 'Rent in Brussels is often quoted excluding charges (charges non comprises). Add €100–200/month for utilities in a typical apartment. Always clarify this upfront.',
    estimatedTime: '2–8 weeks (search and signing)',
    difficulty: 'hard',
    links: [
      { label: 'Immoweb', url: 'https://www.immoweb.be/en', type: 'official' },
      { label: 'Zimmo', url: 'https://www.zimmo.be/en', type: 'official' },
      { label: 'Brussels Housing (official)', url: 'https://housing.brussels/en', type: 'official' },
    ],
  },
  {
    id: 'bru-doctor',
    cityId: 'brussels',
    title: 'Register with a GP',
    slug: 'find-doctor',
    category: 'health',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: [],
    summary: 'Find an English-speaking GP near you and register as a fixed patient (médecin de référence) to unlock higher mutuality reimbursements.',
    guide: `In Belgium, having a fixed GP (médecin de référence / referentiearts) means you pay €11.11 per visit and are reimbursed €9.03, giving a net cost of around €2. Without a registered GP, you pay more and are reimbursed less.

Finding an English-speaking doctor in Brussels is possible but requires research — many are concentrated in Ixelles, Etterbeek, Woluwe, and the European Quarter. Doctoranytime is the best online booking platform for Belgium.

After registering with your mutuality, inform them of your chosen GP by name and INAMI number. This registration takes a few weeks to activate.`,
    steps: [
      { step: 'Search Doctoranytime for GPs near you', detail: 'Filter by "general practitioner", your commune, and "English" in the language filter.' },
      { step: 'Call to confirm they are taking new patients', detail: 'Some popular GPs have closed lists. Call before visiting.' },
      { step: 'Book an initial appointment', detail: 'Some GPs require a "new patient" registration appointment before treating you.' },
      { step: 'Register them as your référence doctor', detail: 'Tell your mutuality the GP\'s name and INAMI number. This can often be done online through your mutuality\'s member portal.' },
      { step: 'Get a Global Medical Record (DMG)', detail: 'Ask your GP to open a DMG (Dossier Médical Global). This gives a higher reimbursement rate on all visits.' },
    ],
    tip: 'Expat doctor databases: The International Association of Brussels (IAB) maintains a recommended list of English-speaking doctors. Your embassy may also have a list.',
    estimatedTime: '1–2 weeks (finding + first appointment)',
    difficulty: 'easy',
    links: [
      { label: 'Doctoranytime Belgium', url: 'https://www.doctoranytime.be/en', type: 'official' },
      { label: 'IAB English-speaking doctors list', url: 'https://www.iab.be/en/directory', type: 'community' },
    ],
  },
  {
    id: 'bru-transport',
    cityId: 'brussels',
    title: 'Get your STIB/MIVB transport pass',
    slug: 'transport-pass',
    category: 'transport',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: [],
    summary: 'Brussels public transport covers metro, tram, and bus. A monthly pass (€50.40) beats per-journey tickets by far.',
    guide: `Brussels public transport (STIB/MIVB) runs metro, tram, and bus across the city and inner ring. A monthly unlimited pass costs €50.40 and is the standard for anyone living in Brussels. The JUMP app handles your subscription, journey planning, and real-time departures.

Important: Brussels transport is strike-prone. STIB goes on strike several times a year, often with 24–72 hours notice. On strike days, services are reduced or stopped. Check the STIB app or RTBF/VRT news for announcements.

For cycling: Villo! is Brussels' bike share — annual subscription is €40. Brussels cycling infrastructure is uneven; Ixelles and the European Quarter are best for cycling.`,
    steps: [
      { step: 'Download the JUMP app', detail: 'JUMP is the official STIB app for tickets, passes, and real-time departures.' },
      { step: 'Create an account and subscribe', detail: 'Monthly pass is €50.40. You can also get annual at a discount. Payment by Belgian bank card or credit card.' },
      { step: 'Load the pass onto your phone or eID', detail: 'The JUMP app uses NFC — tap your phone or eID at metro gates. No physical card needed.' },
      { step: 'Explore the network', detail: 'The 4 metro lines cover key hubs (Gare du Midi, Arts-Loi, Schuman, Gare du Nord). Trams are best for central Brussels.' },
      { step: 'Set up STIB disruption alerts', detail: 'Enable push notifications in the app. Subscribe to RTBF or VRT news alerts for strike announcements.' },
    ],
    tip: 'National trains (SNCB/NMBS) are separate from STIB. For travel to Leuven, Ghent, Antwerp, or Bruges, use the SNCB app or B-Europe. Weekend rail in Belgium is very cheap.',
    estimatedTime: '20 minutes',
    difficulty: 'easy',
    links: [
      { label: 'STIB/MIVB — JUMP app', url: 'https://www.stib-mivb.be', type: 'official' },
      { label: 'SNCB National trains', url: 'https://www.belgiantrain.be/en', type: 'official' },
      { label: 'Villo! bike share', url: 'https://www.villo.be/en', type: 'official' },
    ],
  },
  {
    id: 'bru-tax',
    cityId: 'brussels',
    title: 'File your Belgian tax return',
    slug: 'tax-return',
    category: 'admin',
    stageRelevance: ['settling', 'settled'],
    situationRelevance: ['employed', 'self_employed'],
    summary: 'Belgian tax returns are due in June/July each year. Most employees find it straightforward via Tax-on-Web; self-employed need an accountant.',
    guide: `Belgium has mandatory annual tax returns for all residents. The Belgian fiscal year follows the calendar year (January–December), with returns due in June for paper and July for online submission (Tax-on-Web).

For employees, most information is pre-filled by your employer and the tax authority. Log in to Tax-on-Web via your eID or itsme, verify the pre-filled data, and submit. Most employees get a refund or a small payment due.

For self-employed (freelancers, consultants), Belgian taxation is significantly more complex. You pay social security contributions quarterly, tax is assessed annually, and VAT registration may be required. An accountant is strongly recommended and is tax-deductible as a professional expense.

New arrivals who only lived in Belgium for part of the year declare worldwide income for the period of Belgian residence.`,
    steps: [
      { step: 'Register on MyMinfin / Tax-on-Web', detail: 'Log in with your eID or itsme. Your national number (NISS) links your account.' },
      { step: 'Review pre-filled data', detail: 'Wage declarations, bank interest, and some deductions are pre-filled by employers and banks.' },
      { step: 'Add deductions', detail: 'Commuting costs, professional expenses, and charitable donations are deductible. Keep receipts.' },
      { step: 'Submit before the deadline', detail: 'Online deadline is usually mid-July. Check Tax-on-Web for the current year\'s exact date.' },
      { step: 'For self-employed: hire an accountant', detail: 'ITAA-registered accountants are the professionals for Belgian tax. Budget €600–1500/year for a freelancer.' },
    ],
    tip: 'Belgium taxes worldwide income. If you have rental income or investments abroad, declare them. The "transparency tax" on foreign dividends is often missed by new arrivals.',
    estimatedTime: '1–3 hours (employed) or ongoing (self-employed)',
    difficulty: 'medium',
    links: [
      { label: 'Tax-on-Web (MyMinfin)', url: 'https://eservices.minfin.fgov.be/myminfin-web', type: 'official' },
      { label: 'SPF Finances — income tax guide', url: 'https://finance.belgium.be/en/private_individuals/taxation/tax_return', type: 'official' },
    ],
  },
]
