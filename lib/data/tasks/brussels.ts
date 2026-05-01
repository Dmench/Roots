import type { Task } from '@/lib/types'

export const BRUSSELS_TASKS: Task[] = [
  {
    id: 'bru-register-commune',
    cityId: 'brussels',
    title: 'Register at your commune',
    slug: 'register-commune',
    category: 'admin',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: ['eu_citizen'],
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

  // ── Non-EU specific ──────────────────────────────────────────────────────

  {
    id: 'bru-non-eu-visa',
    cityId: 'brussels',
    title: 'Get your long-stay visa before you arrive',
    slug: 'non-eu-visa',
    category: 'admin',
    stageRelevance: ['planning'],
    situationRelevance: ['non_eu'],
    summary: 'Non-EU nationals need a Type D (long-stay) visa before entering Belgium to live. Apply at the Belgian embassy in your home country — processing takes 4–12 weeks.',
    guide: `If you are not an EU/EEA/Swiss citizen, you cannot simply arrive in Belgium and start the residency process. You must obtain a Type D visa (visa de long séjour / visum voor lang verblijf) before departure from the Belgian embassy or consulate in your home country.

The Type D visa is the gateway to all Belgian residency rights — without it, your commune registration will be refused. The visa is typically issued for the duration of your reason for stay: employment contract, family reunification, student enrollment, etc.

Processing times vary significantly by country and by the embassy's current workload. Allow at minimum 4 weeks; in practice 8–12 weeks is common. Apply as early as possible.

Once you arrive in Belgium on a Type D visa, you register at your commune and receive a temporary Annex 15 certificate while your file is processed. You will then receive an A-card (Aliens Card / Carte d'étranger) — the non-EU equivalent of the eID, valid for 1–5 years depending on your situation.`,
    steps: [
      { step: 'Identify your visa category', detail: 'Employment, family reunification, student, or other. Your employer or sponsor in Belgium will usually tell you which applies.' },
      { step: 'Gather documents for your visa application', detail: 'Typically: valid passport, proof of your reason for stay (employment contract, invitation letter, proof of enrollment), proof of accommodation, health insurance coverage, and proof of financial means.' },
      { step: 'Book an appointment at the Belgian embassy', detail: 'Find the Belgian embassy website for your country. Appointments fill up quickly — book as soon as you know your move date.' },
      { step: 'Submit your application and biometrics', detail: 'You will attend the appointment in person to submit documents and have your fingerprints taken.' },
      { step: 'Wait for visa processing', detail: 'Belgium\'s Immigration Office (CGVS/OE) makes the decision. The embassy cannot speed this up. Track your application via the provided reference number.' },
      { step: 'Collect your visa and book your travel', detail: 'Once issued, the Type D visa is usually valid for 90 days from issue — plan your arrival within this window.' },
    ],
    tip: 'Your employer in Belgium may have an immigration lawyer or HR service that handles visa applications for new hires. Ask before starting the process yourself — this can save weeks of back-and-forth.',
    estimatedTime: '4–12 weeks (depends on embassy)',
    difficulty: 'hard',
    links: [
      { label: 'Belgium Immigration — long-stay visas', url: 'https://dofi.ibz.be/en/themes/residence/coming-to-work-in-belgium', type: 'official' },
      { label: 'Belgian embassies worldwide', url: 'https://diplomatie.belgium.be/en/embassies-and-consulates', type: 'official' },
    ],
  },
  {
    id: 'bru-non-eu-acard',
    cityId: 'brussels',
    title: 'Get your A-card (non-EU residence card)',
    slug: 'non-eu-residence-card',
    category: 'admin',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: ['non_eu'],
    summary: 'Non-EU residents receive an A-card (Aliens Card) instead of an eID. It serves the same purpose for daily life in Belgium, but the process and documents required are different.',
    guide: `After arriving in Belgium on a Type D visa and registering at your commune, you receive a temporary document (Annexe 15 or orange card) while your file is processed by the Immigration Office (Office des Étrangers / Dienst Vreemdelingenzaken).

Once approved, your commune calls you in to collect your A-card (Carte d'étranger Type A / Verblijfskaart van het Type A). This card:
- Proves your legal residence status in Belgium
- Contains your NISS (national number) — same as Belgian citizens
- Is required for bank accounts, mutuelle, tax filings, and travel within the Schengen zone
- Is typically valid for 1 year initially, then renewable

The A-card does NOT allow travel outside Schengen without your national passport. It is not a travel document — it is a residence document. For travel back home or outside Schengen, you always need your original passport.`,
    steps: [
      { step: 'Register at your commune within 8 days of arrival', detail: 'Bring your Type D visa, passport, proof of address (lease), and any supporting documents for your reason for stay.' },
      { step: 'Receive your Annexe 15', detail: 'This is a temporary certificate proving you have registered. It is valid for 45 days and should be carried with you.' },
      { step: 'Police home visit', detail: 'A local police officer visits to confirm you live at the registered address. Do not miss this — a missed visit delays your A-card significantly.' },
      { step: 'Wait for Immigration Office approval', detail: 'The commune sends your file to the Immigration Office, which decides on your residency. This takes 3–8 weeks on top of the commune processing time.' },
      { step: 'Collect your A-card', detail: 'The commune notifies you when your A-card is ready. Bring your passport and Annexe 15. You will set a PIN code.' },
      { step: 'Renew before expiry', detail: 'Start renewal 3 months before your card expires — the renewal process can be slow, and an expired card creates problems with employers and services.' },
    ],
    tip: 'Keep a photocopy of your passport, Type D visa, and Annexe 15 at all times during the waiting period. Police can ask for proof of legal residence and your Annexe 15 is the only document you have.',
    estimatedTime: '6–12 weeks (full process)',
    difficulty: 'hard',
    links: [
      { label: 'Immigration Office Belgium', url: 'https://dofi.ibz.be/en', type: 'official' },
      { label: 'Your commune — population office', url: 'https://www.bruxelles.be/19-communes', type: 'official' },
    ],
  },

  {
    id: 'bru-non-eu-income-proof',
    cityId: 'brussels',
    title: 'Prove financial means for your visa application',
    slug: 'non-eu-income-proof',
    category: 'admin',
    stageRelevance: ['planning'],
    situationRelevance: ['non_eu'],
    summary: 'Belgian embassies require proof that you can support yourself financially. What counts, how much you need, and how to present it correctly.',
    guide: `Every Belgian long-stay visa application requires proof of sufficient financial means. The embassy needs to be confident you won't become a charge on the Belgian social system. What qualifies — and how much — depends on your visa category.

**How much is "sufficient"?**
Belgium does not publish a single universal threshold. In practice, embassies look for monthly income or savings equivalent to the Belgian minimum wage (around €1,994/month gross in 2024) or a signed employment contract in Belgium that guarantees at least this. For family reunification or study visas, the sponsoring party's income is assessed instead.

**What documents are accepted as proof:**
- Employment contract with a Belgian employer (the clearest proof — salary is stated)
- Bank statements from the last 3–6 months (your home country account)
- Payslips from your current employer
- Tax returns or financial statements if self-employed
- Scholarship or fellowship letter (for students)
- Proof of savings (usually 12 months of living costs upfront)

**Key gotchas:**
- Bank statements must show consistent balance, not a recent large deposit. A sudden €20k deposit the week before application is a red flag — embassies check the pattern.
- Documents in languages other than French, Dutch, German, or English usually require a certified translation.
- All documents should be recent (within 3 months of your application date).
- If your employer in Belgium is sponsoring you, ask their HR to provide a hiring letter on company letterhead with salary and start date — this is often sufficient on its own.`,
    steps: [
      { step: 'Identify your visa category', detail: 'The income threshold and acceptable documents differ between work, family reunification, student, and self-employed visas.' },
      { step: 'Gather bank statements', detail: 'Download 3–6 months of statements from your home bank. Most embassies want the full account history, not just the current balance.' },
      { step: 'Get certified translations if needed', detail: 'If your bank statements are not in French, Dutch, German, or English, use a sworn translator (traducteur juré). Budget €40–80 per document.' },
      { step: 'Compile employment documentation', detail: 'If you have a Belgian employer, request a hiring letter with salary, start date, and company details. This usually carries the most weight.' },
      { step: 'Do not "stage" your finances', detail: 'Do not move money from family members to boost your balance just before applying. Embassies look at 3–6 months of history and unexplained large transfers raise flags.' },
    ],
    tip: 'If you are moving for a job, your Belgian employer\'s HR department has almost certainly done this before. Ask them for a boilerplate hiring letter for visa purposes — most large companies have a template.',
    estimatedTime: '1–2 weeks to gather documents',
    difficulty: 'medium',
    links: [
      { label: 'Belgium Immigration — financial means', url: 'https://dofi.ibz.be/en/themes/residence/coming-to-work-in-belgium', type: 'official' },
      { label: 'Belgian embassies worldwide', url: 'https://diplomatie.belgium.be/en/embassies-and-consulates', type: 'official' },
    ],
  },
  {
    id: 'bru-non-eu-remote-work',
    cityId: 'brussels',
    title: 'Understand your right to work remotely for a foreign employer',
    slug: 'non-eu-remote-work',
    category: 'work',
    stageRelevance: ['planning'],
    situationRelevance: ['non_eu', 'digital_nomad', 'self_employed'],
    summary: 'Living in Belgium while working for a company outside Belgium is a grey area with real legal and tax consequences. Here\'s what you need to know before you assume it\'s simple.',
    guide: `Working remotely in Belgium for a foreign company while holding a Belgian residency is legally complex. Belgium has no official "digital nomad visa" — you must enter on another visa category, and the rules on what work you can do depend on that category.

**Scenario 1 — You have a Belgian work permit (singlepermit) for a Belgian employer:**
You are authorised to work for that specific employer only. Working for a foreign company on the side — even remotely, even unpaid — may breach your permit conditions. Check with an immigration lawyer before doing anything.

**Scenario 2 — You are self-employed (indépendant) registered in Belgium:**
You can work for any client, including foreign ones. You invoice them, pay Belgian social security contributions, and file Belgian taxes on your worldwide income. This is the most straightforward path for digital nomads.

**Scenario 3 — You have a family reunification or student visa:**
These visas may restrict your right to work. Some student visas allow part-time work (up to 20 hours/week); check your specific permit.

**Tax implications:**
Once you are a Belgian resident (registered at your commune), Belgium taxes your worldwide income — including salary or revenue from a foreign employer or foreign clients. You may also trigger payroll obligations in your home country or your employer's country (permanent establishment risk). This is a complex area: get advice from a cross-border tax accountant.

**The A-card and work authorisation:**
Non-EU residents in Belgium must have either a work permit (singlepermit for employees) or self-employed status to work legally. Simply having an A-card from a family reunification visa does not automatically give you the right to work.`,
    steps: [
      { step: 'Identify your visa/permit type', detail: 'Check what your visa or residence permit authorises. The conditions are printed on the card or in the accompanying letter.' },
      { step: 'Consult an immigration lawyer if uncertain', detail: 'Belgian immigration law is not self-evident. A one-hour consultation with a Brussels immigration lawyer (€150–250) is worth it before making assumptions.' },
      { step: 'If self-employed: register before invoicing', detail: 'Register with a caisse sociale within 90 days of starting activity. Do not invoice foreign clients before you are registered.' },
      { step: 'Understand Belgian tax residency', detail: 'From the day you register at your commune, Belgium taxes your worldwide income. Notify your foreign employer — they may have payroll obligations too.' },
      { step: 'Get cross-border tax advice', detail: 'A tax accountant familiar with Belgian expat taxation can structure your situation properly. The cost (€300–800 for initial setup) is much less than a tax penalty.' },
    ],
    tip: 'Belgium has tax treaties with most countries to prevent double taxation. If your home country taxes you and Belgium taxes you on the same income, the treaty usually determines who has the primary right to tax — but you must declare income in both countries and claim the treaty relief yourself.',
    estimatedTime: '1–4 weeks (legal setup)',
    difficulty: 'hard',
    links: [
      { label: 'SPF Finances — tax treaties', url: 'https://finance.belgium.be/en/private_individuals/taxation/international_taxation/double_taxation_conventions', type: 'official' },
      { label: 'Immigration Office — work authorisation', url: 'https://dofi.ibz.be/en/themes/work', type: 'official' },
    ],
  },
  {
    id: 'bru-non-eu-pre-arrival-address',
    cityId: 'brussels',
    title: 'Solve the pre-arrival address catch-22',
    slug: 'non-eu-pre-arrival-address',
    category: 'housing',
    stageRelevance: ['planning'],
    situationRelevance: ['non_eu'],
    summary: 'Your visa application needs a Belgian address. But you can\'t rent a flat until you\'re in Belgium. Here\'s how people actually solve this.',
    guide: `This is one of the most common pre-arrival frustrations for non-EU nationals: the Belgian long-stay visa application requires a proof of address in Belgium — but you can\'t legally sign a long-term lease without first being in Belgium. This creates a circular problem.

**How people actually solve it:**

**Option 1 — Short-term rental (Airbnb / furnished apartment):**
Book a furnished apartment for your first 1–3 months. The booking confirmation or rental agreement serves as your proof of address. Once in Belgium, you find a permanent flat, sign a long-term lease, and update your commune registration to the new address. This is the most common path.

**Option 2 — Hotel or serviced apartment:**
Less ideal financially but completely valid. A confirmed hotel booking at a Brussels address is accepted by most embassies as proof of accommodation for the visa application.

**Option 3 — Friend or family sponsor:**
If you know someone in Brussels willing to host you on paper, they can provide a written declaration (déclaration d\'hébergement) stating you will reside at their address. This is a legal document — they take on responsibility for confirming your presence. Your commune will verify it with a police visit.

**Option 4 — Employer-provided accommodation:**
Some employers (especially in tech and consulting) maintain company apartments or have partnerships with serviced apartment providers. Ask your HR whether relocation support is available — many companies cover 1–3 months of temporary accommodation.

**What to avoid:**
Do not provide a false permanent address on your visa application. If the police visit discovers you do not live there, it can jeopardise your entire residency application.

**After you arrive:**
Once you sign a permanent lease in Brussels, notify your commune and update your registration address. The police visit will be to your actual address.`,
    steps: [
      { step: 'Book a furnished apartment or Airbnb for 1–3 months', detail: 'Search on Immoweb (under "furnished"), Spotahome, Homelike, or Airbnb for monthly rentals in Brussels. Budget €900–1,500/month for a one-bedroom.' },
      { step: 'Get a written booking confirmation', detail: 'The confirmation must show your name, the Brussels address, and the dates. Save it as a PDF — it is your proof of address for the visa application.' },
      { step: 'Submit the address with your visa application', detail: 'This is usually a required field on the visa application form. Use the short-term address — you can update it at the commune after you arrive.' },
      { step: 'Once in Belgium: find a permanent flat', detail: 'Use Immoweb.be, Zimmo.be, and local Facebook expat groups (Expats in Brussels, Bruxelles logement). Start the search before you arrive if possible.' },
      { step: 'Update your commune registration', detail: 'When you move to your permanent address, go back to the commune and update your registration. A new police visit will be scheduled.' },
    ],
    tip: 'Homelike and Spotahome specialise in furnished monthly rentals across Europe and have strong Brussels inventory. Both accept bookings from abroad with credit card — no Belgian bank account required.',
    estimatedTime: '1–4 weeks (to find and book short-term accommodation)',
    difficulty: 'medium',
    links: [
      { label: 'Spotahome — Brussels furnished rentals', url: 'https://www.spotahome.com/brussels', type: 'community' },
      { label: 'Immoweb — furnished apartments', url: 'https://www.immoweb.be/en/search/apartment/for-rent?countries=BE&localities=Brussels&furnished=true', type: 'official' },
      { label: 'Homelike — monthly furnished rentals', url: 'https://www.thehomelike.com/en/brussels', type: 'community' },
    ],
  },

  // ── Daily life ───────────────────────────────────────────────────────────

  {
    id: 'bru-phone-sim',
    cityId: 'brussels',
    title: 'Get a Belgian SIM or phone plan',
    slug: 'phone-sim',
    category: 'daily',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: [],
    summary: 'You need a Belgian number for bank verification, government portals (itsme), and daily life. Proximus, Base, and Orange are the main operators — Base is cheapest.',
    guide: `A Belgian phone number is needed for:
- itsme digital identity app (requires Belgian number to register)
- Bank two-factor authentication (most Belgian banks SMS you)
- Government portals and service callbacks
- Local contacts, landlords, and employers

Belgium has three main mobile operators: Proximus (best network coverage), Orange Belgium, and Base (budget). All operate on the same national infrastructure — the difference is mainly price and customer service. Virtual operators (MVNOs) like Mobile Vikings, Scarlet, and Voo Mobile run on Proximus or Orange networks at lower prices.

For EU citizens: your home SIM may work for the first few months under EU roaming rules (no roaming charges within the EU), but calls may be expensive and itsme requires a Belgian number for registration.

For non-EU citizens: EU roaming does not apply. Get a Belgian SIM as soon as possible — Base prepaid SIMs are available in any Carrefour or phone shop from day one, no ID required for prepaid.`,
    steps: [
      { step: 'Decide: prepaid or contract', detail: 'Prepaid SIMs (Base, Orange) require no Belgian ID and are available day one. Monthly contracts need your eID or passport and are cheaper long-term.' },
      { step: 'Compare plans', detail: 'Mobile Vikings (on Proximus) offers unlimited calls + 20–30GB data for €15–20/month. Base has comparable plans. Proximus and Orange own-brand plans are pricier but have better customer service.' },
      { step: 'Buy a SIM', detail: 'Base and Orange SIMs are sold in supermarkets (Carrefour, Delhaize), phone shops, and operator stores. Mobile Vikings is online-only.' },
      { step: 'Port your old number if needed', detail: 'Porting a foreign number to Belgian is complex and often not worth it. It\'s easier to give contacts your new Belgian number.' },
      { step: 'Register for itsme', detail: 'Once you have your eID or A-card, download the itsme app and register using your Belgian phone number and card PIN. This unlocks digital access to most Belgian government services.' },
    ],
    tip: 'Mobile Vikings is the sweet spot for most settlers: Proximus network quality, budget price, no contract. Their app is also one of the best for managing usage.',
    estimatedTime: '30 minutes',
    difficulty: 'easy',
    links: [
      { label: 'Mobile Vikings', url: 'https://www.mobilevikings.be/en', type: 'affiliate' },
      { label: 'Base Mobile', url: 'https://www.base.be/en', type: 'official' },
      { label: 'itsme app', url: 'https://www.itsme-id.com/en', type: 'official' },
    ],
  },
  {
    id: 'bru-home-insurance',
    cityId: 'brussels',
    title: 'Get home insurance (assurance habitation)',
    slug: 'home-insurance',
    category: 'housing',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: ['renting', 'buying'],
    summary: 'Belgian lease law requires tenants to have home insurance before moving in. Most landlords will ask for proof. It costs €100–200/year and covers fire, water damage, and theft.',
    guide: `In Belgium, tenant home insurance (assurance habitation locataire / huurdersverzekering) is legally required when renting. Your lease will almost certainly include a clause requiring it, and your landlord can ask for proof of coverage before handing over the keys.

Home insurance for tenants in Belgium typically covers:
- Fire, explosion, and smoke damage
- Water damage (burst pipes, flooding)
- Theft and break-in
- Civil liability (if you accidentally damage a neighbour's property — e.g., a burst pipe that floods the apartment below you)

Prices are generally €100–200/year for a typical Brussels apartment. The price depends on the surface area, the declared value of your contents, and whether you add extras like bicycle theft.

The easiest options for English-speaking settlers: AG Insurance (through brokers), Ethias, and online comparison tools like TopCompare or Assuralia.`,
    steps: [
      { step: 'Check your lease requirement', detail: 'Your lease will specify the coverage type required — usually RC Locataire (tenant civil liability) plus fire and water.' },
      { step: 'Compare quotes online', detail: 'Use TopCompare.be or Assuralia.be to compare Belgian home insurance offers. Enter the surface area and address of your apartment.' },
      { step: 'Choose a policy and pay', detail: 'Most insurers allow online purchase and immediate coverage. You receive a certificate (attestation) within minutes.' },
      { step: 'Send the certificate to your landlord', detail: 'Email the attestation before or on moving day. Some landlords require an annual renewal proof — set a calendar reminder.' },
      { step: 'Declare high-value items separately', detail: 'Laptops, bicycles, musical instruments, and jewellery above a certain value need to be declared separately in most policies.' },
    ],
    tip: 'If you have a good-quality bicycle, add bicycle theft to your policy. Brussels has a high bicycle theft rate and a stolen bike is not automatically covered by standard home insurance.',
    estimatedTime: '1 hour',
    difficulty: 'easy',
    links: [
      { label: 'TopCompare — home insurance', url: 'https://www.topcompare.be/en/home-insurance', type: 'community' },
      { label: 'Assuralia — insurance guide', url: 'https://www.assuralia.be/en', type: 'official' },
    ],
  },
  {
    id: 'bru-utilities',
    cityId: 'brussels',
    title: 'Set up electricity, gas, and internet',
    slug: 'utilities',
    category: 'housing',
    stageRelevance: ['just_arrived'],
    situationRelevance: ['renting'],
    summary: 'Brussels utility contracts must be in the tenant\'s name. Electricity and gas go through regional providers; internet through Proximus, Telenet, or VOO. Budget €100–180/month combined.',
    guide: `In Belgium, utility contracts (electricity, gas, internet) must typically be set up by the tenant in their own name. Some furnished apartments or short-term rentals include utilities — check your lease carefully.

**Electricity and gas (Brussels Region):**
Brussels uses a "social tariff" market. Most residents choose a regulated supplier. Sibelga is the network operator (not your supplier — you don't choose them). For the actual supply, compare via BRUGEL (the Brussels energy regulator) or Energyprice.be. Engie and EDF Luminus are the main operators. Budget: €60–120/month depending on apartment size and usage.

**Internet:**
Three main providers: Proximus (fiber/ADSL, national), Telenet (cable, available in most of Brussels), and VOO (cable, Brussels and Wallonia). Speeds are generally good — 500Mbps fiber plans are standard. Budget: €35–55/month for broadband. Proximus and VOO both have English-language customer service.

**When to set up:**
Ideally before you move in. Internet installation can take 1–2 weeks for a physical technician visit. Electricity transfer is usually same-day online. Take meter readings on your first day — photograph the meters and send them to your new supplier to avoid paying for the previous tenant's usage.`,
    steps: [
      { step: 'Check what is included in your rent', detail: 'Verify whether water, gas, electricity, or internet are included (charges comprises) or your responsibility.' },
      { step: 'Photograph meters on move-in day', detail: 'Take photos of the electricity meter (kWh reading) and gas meter (m³ reading) with the date visible. Send to your new supplier and keep a copy.' },
      { step: 'Choose an energy supplier', detail: 'Compare on Energyprice.be or BRUGEL\'s comparison tool. Standard contract or "index" contract (variable tariff) — most settlers take fixed-rate for predictability.' },
      { step: 'Set up internet', detail: 'Order online — allow 1–2 weeks for technician installation if needed. Proximus and VOO both offer English support. If the previous tenant had a contract at the address, transfer may be faster.' },
      { step: 'Set up direct debit', detail: 'All Belgian utility providers prefer SEPA direct debit from your Belgian bank account. Set this up to avoid late payment fees.' },
    ],
    tip: 'If your lease says "charges non comprises" (charges not included), utilities are 100% your responsibility. If it says "charges comprises" or lists a fixed monthly charge, clarify exactly what\'s covered before signing.',
    estimatedTime: '2–3 hours (setup) + 1–2 weeks (internet installation)',
    difficulty: 'medium',
    links: [
      { label: 'BRUGEL — energy comparison Brussels', url: 'https://www.brugel.brussels/en', type: 'official' },
      { label: 'Proximus internet', url: 'https://www.proximus.be/en', type: 'official' },
      { label: 'VOO internet', url: 'https://www.voo.be/en', type: 'official' },
    ],
  },
  {
    id: 'bru-language-classes',
    cityId: 'brussels',
    title: 'Start French or Dutch language classes',
    slug: 'language-classes',
    category: 'community',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: [],
    summary: 'Brussels is officially bilingual (French and Dutch), but French dominates daily life. Even basic French transforms your experience — and many classes are free or subsidised for Brussels residents.',
    guide: `Brussels is officially bilingual — French and Dutch — but in practice, French is the dominant language of daily life, administration, and social interaction in most of the city. Dutch is strong in the northern municipalities (Laeken, Evere, Schaerbeek). English gets you very far, but French opens a different level of belonging.

**Free and subsidised options:**
- **Bon** (Bureau Ondersteuning Brusselse Onderwijs): subsidised French courses for Brussels residents, €50–150 for a full semester course
- **CPAS / OCMW language programmes**: free French classes for residents, prioritised for non-EU citizens with residency
- **Inburgering (for Flemish Brussels)**: mandatory integration programme for non-EU citizens registering in the Flemish region — includes free Dutch classes
- **Alliance Française**: higher-quality private courses, €200–500 per level, intensive and evening options

**Online learning alongside classes:**
Duolingo, Babbel, and Pimsleur are useful for vocabulary, but Brussels French is fast and colloquial — classroom practice with a teacher dramatically accelerates progress.`,
    steps: [
      { step: 'Decide: French or Dutch (or both)', detail: 'French first if you live in Ixelles, Saint-Gilles, Etterbeek, or the EU Quarter. Dutch if you work in a Flemish company or live in northern Brussels.' },
      { step: 'Check Bon for subsidised classes', detail: 'BON.brussels offers affordable community-based French courses across all Brussels communes. Register online in August/September (courses fill up fast).' },
      { step: 'Take a placement test', detail: 'Most language centres place you in the right level. Don\'t start at the beginning if you already have some French — it wastes time and demotivates.' },
      { step: 'Commit to a schedule', detail: 'Language learning needs consistency. Even 2 hours/week of formal class plus 20 minutes daily practice makes measurable progress in 3 months.' },
      { step: 'Practice outside class', detail: 'Order your coffee in French. Ask for things at the commune in French. The friction is the learning.' },
    ],
    tip: 'If you are non-EU, check with your commune whether you are required to complete an inburgering (integration) programme. Failing to complete it when required can affect your residency renewal.',
    estimatedTime: 'Ongoing — first class in 2–4 weeks',
    difficulty: 'medium',
    links: [
      { label: 'BON Brussels — French courses', url: 'https://www.bon.brussels/en', type: 'official' },
      { label: 'Alliance Française de Bruxelles', url: 'https://www.alliancefrancaise.be/en', type: 'official' },
      { label: 'Bon — inburgering information', url: 'https://www.bon.brussels/en/integration', type: 'official' },
    ],
  },
  {
    id: 'bru-self-employed',
    cityId: 'brussels',
    title: 'Register as self-employed (indépendant)',
    slug: 'self-employed-registration',
    category: 'work',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: ['self_employed', 'digital_nomad'],
    summary: 'Working freelance or running a business in Belgium requires registration with a social security fund (caisse sociale) and optionally the CBE business register. You must do this before issuing your first invoice.',
    guide: `In Belgium, working as a self-employed person (travailleur indépendant / zelfstandige) requires formal registration before you start invoicing clients. Working without registering is illegal and can result in fines and back-payment of social contributions.

**Two legal structures for most freelancers:**
1. **Sole trader (indépendant en personne physique)**: Simplest. You register with a social security fund (caisse sociale / sociaal verzekeringsfonds) and optionally with the Crossroads Bank of Enterprises (CBE/BCE). No company, no separate legal entity — you and the business are the same.
2. **Company (SRL/SPRL or SA/NV)**: More complex, requires a notary and minimum capital. Best if you plan to have employees or significant revenue.

Most digital nomads and freelancers start as sole traders. It can be converted to a company later.

**Social security contributions:**
Self-employed people pay quarterly social contributions (cotisations sociales) — approximately 20.5% of net income, with a minimum of ~€900/quarter. These fund your health insurance (through your mutuality) and pension.

**VAT:**
If your annual turnover exceeds €25,000, VAT registration (TVA/BTW) is mandatory. Below that, you can opt for the "small business exemption" (franchise TVA) and not charge VAT.`,
    steps: [
      { step: 'Choose your social security fund', detail: 'You must affiliate with an approved caisse sociale within 90 days of starting activity. Options: Xerius, Acerta, Securex, UCM, or Partena Professional. All offer English-language service.' },
      { step: 'Register with the CBE (business register)', detail: 'If you plan to have a business name or formal invoicing entity, register with the Crossroads Bank of Enterprises via a "guichet d\'entreprise" (enterprise office). This gives you a company number (BCE number). Xerius and Acerta run enterprise offices.' },
      { step: 'Open a professional bank account', detail: 'Not legally required for sole traders, but strongly recommended for clean bookkeeping. Wise Business and Revolut Business are simple options.' },
      { step: 'Set up accounting', detail: 'Belgian bookkeeping requirements are real — even for sole traders. Use accounting software (Exact Online, Billit, or Dext) or hire an accountant from day one. An accountant costs €600–1,200/year and is tax-deductible.' },
      { step: 'Understand your tax obligations', detail: 'Self-employed income is taxed at personal income tax rates (up to 50% above €42k). Your accountant files your annual return. You also make quarterly provisional tax advance payments.' },
    ],
    tip: 'If you are non-EU, check that your visa category permits self-employed activity. Some visas (e.g., employee-sponsored work permits) do not permit freelance work on the side.',
    estimatedTime: '1–2 weeks (registration) + ongoing',
    difficulty: 'hard',
    links: [
      { label: 'Partena Professional (English)', url: 'https://www.partena-professional.be/en', type: 'official' },
      { label: 'Acerta (English)', url: 'https://www.acerta.be/en', type: 'official' },
      { label: 'FPS Economy — self-employment guide', url: 'https://economie.fgov.be/en/themes/enterprises/start-business', type: 'official' },
    ],
  },
  {
    id: 'bru-driving-licence',
    cityId: 'brussels',
    title: 'Exchange your foreign driving licence',
    slug: 'driving-licence',
    category: 'admin',
    stageRelevance: ['settling', 'settled'],
    situationRelevance: [],
    summary: 'EU licences are valid in Belgium indefinitely. Non-EU licences must be exchanged within one year of residency. Some countries have bilateral agreements; others require a full Belgian driving test.',
    guide: `**EU/EEA licences:**
If your driving licence was issued by an EU or EEA country, it is valid in Belgium for as long as it is valid in the issuing country. No exchange is required. When your licence expires, you renew it at your Belgian commune using a standard renewal process.

**Non-EU licences:**
Belgium has bilateral exchange agreements with many countries including the USA, Canada, Australia, Japan, Switzerland, and South Korea. If your country is on the list, you can exchange your licence at your commune without taking a new test — bring your foreign licence, your eID or A-card, a certified translation if the licence is not in French, Dutch, or German, and passport photos.

**Countries without an exchange agreement:**
You must pass the Belgian theory test and practical driving test, even if you have been driving for 20 years. Theory test (theorie-examen / examen théorique) can be taken in English at approved centres. Budget 3–6 months for the full process.

**Practical note:**
Even if exchange is possible, some Belgian communes are slow on this. The Ixelles commune is known to have a backlog. Some people prefer to use their foreign licence until they are settled and then do the exchange all at once.`,
    steps: [
      { step: 'Check if your country has an exchange agreement', detail: 'Look up Belgium\'s list of bilateral driving licence agreements on the SPF Mobilité website. If listed, you can exchange without a test.' },
      { step: 'Get a certified translation if needed', detail: 'Non-Latin script licences (Arabic, Chinese, Thai, etc.) require a certified translation into French or Dutch. A sworn translator (traducteur juré) in Brussels charges €40–80.' },
      { step: 'Go to your commune with documents', detail: 'Belgian eID or A-card, your foreign licence, the translation (if required), passport photos, and the exchange fee (usually €25–35).' },
      { step: 'Surrender your foreign licence', detail: 'Belgium keeps your original foreign licence. Keep a photocopy before handing it in. Some communes send it back to the issuing country.' },
      { step: 'If no agreement: book theory test', detail: 'Theory tests in English are available at GOCA exam centres across Brussels. Study using the official GOCA practice app or website. Most people pass after 1–2 weeks of study.' },
    ],
    tip: 'Do not wait more than 12 months after registering as a Belgian resident if your country does not have an exchange agreement — using a non-EU licence after 12 months of Belgian residency is illegal, even if you never exchanged it.',
    estimatedTime: '1 day (exchange) or 2–4 months (full test)',
    difficulty: 'medium',
    links: [
      { label: 'SPF Mobilité — licence exchange', url: 'https://mobilit.belgium.be/en/road/driving-licences/foreign-driving-licences', type: 'official' },
      { label: 'GOCA — theory test (English)', url: 'https://www.goca.be/en', type: 'official' },
    ],
  },
  {
    id: 'bru-school-children',
    cityId: 'brussels',
    title: 'Enrol children in school',
    slug: 'school-children',
    category: 'daily',
    stageRelevance: ['planning', 'just_arrived'],
    situationRelevance: ['family'],
    summary: 'Brussels has parallel French and Dutch school systems, plus international schools. The French-speaking system is large but popular schools fill fast. Apply early — waiting lists are common for sought-after schools.',
    guide: `Brussels has three distinct school systems operating in parallel:

**1. French-speaking (Fédération Wallonie-Bruxelles):**
The largest system. Schools are categorised as communal (municipal), provincial, or libre (Catholic-affiliated). Quality varies significantly by school. Registration for primary school happens through a centralised enrolment system (EUDONET / Inscriptions.be) in spring for September entry. Secondary school places are also highly competitive in desirable neighbourhoods.

**2. Dutch-speaking (Gemeenschapsonderwijs / GO!):**
Smaller but often praised for quality and integration of expat children. Most lessons are in Dutch — intensive Dutch classes (OKAN programme) for non-Dutch speaking children. Schools in Ixelles, Etterbeek, and the EU Quarter often have waiting lists.

**3. International schools:**
Brussels has more international schools per capita than almost any city in Europe, reflecting the EU/NATO expat population. ISB (International School of Brussels), St John's, BSB, and the European Schools are the main ones. The European Schools are free for EU institution employees. Private international schools cost €15,000–30,000/year.

**Key timing:**
Applications for the following September typically open in January–February. For international schools, apply 6–12 months in advance. Some popular communal schools have multi-year waiting lists.`,
    steps: [
      { step: 'Decide on school system', detail: 'French, Dutch, or international. Consider your family\'s languages, budget, and how long you plan to stay in Brussels.' },
      { step: 'Research schools in your neighbourhood', detail: 'Visit school websites and read reviews on expat forums. Ask in Brussels expat Facebook groups and Roots community for recommendations.' },
      { step: 'Apply through the correct channel', detail: 'French system: through Inscriptions.be (opens January). Dutch system: directly to the school. International schools: directly with admissions. European Schools: through your EU institution HR.' },
      { step: 'Join waiting lists as backup', detail: 'Apply to multiple schools simultaneously. Brussels popular schools fill up fast and waiting lists move slowly.' },
      { step: 'Register at school once a place is confirmed', detail: 'Bring your child\'s birth certificate (with sworn translation if not in French/Dutch), immunisation records, and your Belgian address proof.' },
    ],
    tip: 'The OKAN programme (Dutch system) places non-Dutch-speaking children in an intensive Dutch integration class before mainstream schooling. Children typically integrate into regular classes within 1 year. It is genuinely impressive and free.',
    estimatedTime: '1–6 months (application to start)',
    difficulty: 'hard',
    links: [
      { label: 'Inscriptions.be — French school registration', url: 'https://www.inscriptions.cfwb.be', type: 'official' },
      { label: 'GO! Brussels — Dutch schools', url: 'https://www.g-o.be/en', type: 'official' },
      { label: 'European Schools Brussels', url: 'https://www.eursc.eu/en', type: 'official' },
    ],
  },
]
