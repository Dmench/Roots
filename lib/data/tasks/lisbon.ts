import type { Task } from '@/lib/types'

export const LISBON_TASKS: Task[] = [
  {
    id: 'lis-nif',
    cityId: 'lisbon',
    title: 'Get your NIF (tax identification number)',
    slug: 'nif',
    category: 'admin',
    stageRelevance: ['planning', 'just_arrived'],
    situationRelevance: [],
    summary: 'The NIF is Portugal\'s tax number and is required for almost everything — opening a bank account, signing a lease, setting up utilities, and buying a SIM card.',
    guide: `The NIF (Número de Identificação Fiscal) is a 9-digit tax number issued by the Portuguese tax authority (Autoridade Tributária e Aduaneira, or AT). It is the single most important number in Portugal — you will be asked for it constantly.

EU/EEA citizens can get a NIF directly at any Finanças office (the tax authority) or at a Loja do Cidadão (citizen service shop) with just their passport or national ID. Non-EU citizens technically need a fiscal representative to get a NIF before arriving, though this requirement is often unenforced in practice — many fintech companies (Anchorless, Bordr) offer remote NIF services.

If you are already in Portugal on a non-EU visa, bring your visa documentation. The process takes 15–30 minutes if you have all documents and the office is not busy. Lisbon Finanças offices in Rato and Picoas are the most manageable.

Your NIF is permanent — it stays with you even if you leave Portugal and return years later.`,
    steps: [
      { step: 'Check if you need a fiscal representative', detail: 'EU/EEA citizens: no representative needed. Non-EU citizens abroad: use a service like Bordr or Anchorless. Non-EU citizens already in Portugal: go directly to Finanças.' },
      { step: 'Find your nearest Finanças office', detail: 'In Lisbon, the Finanças office at Av. Eng. Duarte Pacheco (Rato) or the Loja do Cidadão at Laranjeiras are manageable options.' },
      { step: 'Bring your documents', detail: 'EU citizens: passport or national ID. Non-EU: passport + valid visa or residence permit + proof of address in Portugal.' },
      { step: 'Fill in the application form', detail: 'The form (Declaração de Início de Actividade or NIF application) is available at the desk. Staff will help you complete it.' },
      { step: 'Receive your NIF immediately', detail: 'You get a paper printout with your NIF on the spot. Keep it safe — you\'ll use it for everything.' },
    ],
    tip: 'Get your NIF before you arrive if possible using an online service. It typically takes 5–7 days and costs €50–150, but saves you a trip to Finanças on arrival day. You\'ll need it to open a bank account on day one.',
    estimatedTime: '1–2 hours at Finanças, or 1 week online',
    difficulty: 'easy',
    links: [
      { label: 'AT — Finanças portal', url: 'https://www.portaldasfinancas.gov.pt/at/html/index.html', type: 'official' },
      { label: 'Bordr — remote NIF service', url: 'https://www.bordr.io', type: 'affiliate' },
      { label: 'Loja do Cidadão Lisbon', url: 'https://www.lojadocidadao.pt/pt/informacao/localizacoes/', type: 'official' },
    ],
  },
  {
    id: 'lis-nhr',
    cityId: 'lisbon',
    title: 'Apply for the NHR tax regime',
    slug: 'nhr-tax-regime',
    category: 'admin',
    stageRelevance: ['planning', 'just_arrived'],
    situationRelevance: ['employed', 'self_employed', 'digital_nomad'],
    summary: 'Portugal\'s Non-Habitual Resident (NHR) tax regime offers a flat 20% income tax rate for qualifying foreign income for 10 years. Replaced in 2024 by IFICI, but existing NHR holders are protected.',
    guide: `Portugal's Non-Habitual Resident (NHR) regime was one of Europe's most attractive tax regimes for newcomers: a flat 20% tax rate on Portuguese-sourced income from qualifying professions, and potential exemption (or 10% flat tax) on most foreign-sourced income, for a 10-year period.

As of 2024, the original NHR regime was closed to new applicants and replaced by IFICI (Incentivo Fiscal à Investigação Científica e Inovação) — a narrower successor targeting specific professions (researchers, technology workers, STEM professionals, startup founders). The criteria are stricter than NHR but the benefit (20% flat rate) is the same.

If you became tax resident in Portugal before December 31, 2023 and applied for NHR, you are protected under the original regime for your full 10-year period. If you are arriving now, you should investigate IFICI eligibility and consult a Portuguese tax accountant (contabilista) immediately — the application window after establishing tax residency is narrow (you must apply by March 31 of the year following your first year of tax residency).

This is one area where professional advice is genuinely essential. A good Portuguese tax accountant costs €200–500 for the initial setup and annual filing.`,
    steps: [
      { step: 'Establish Portuguese tax residency', detail: 'You become a Portuguese tax resident once you are registered at an address, present for 183+ days in a calendar year, or have your main habitual residence in Portugal.' },
      { step: 'Check IFICI eligibility', detail: 'IFICI applies to researchers, technology/IT professionals, startup founders, qualified employees of startups, and a few other categories. Check the AT portal or ask a tax accountant.' },
      { step: 'Get your NIF and register on the AT portal', detail: 'You need an active NIF and a Portal das Finanças account to apply.' },
      { step: 'Apply before March 31 of the following year', detail: 'The IFICI/NHR application must be submitted before March 31 of the year after your first year of tax residency. Missing this window means losing the benefit entirely.' },
      { step: 'File annual tax returns under the regime', detail: 'You must file a Portuguese IRS (income tax) return each year, declaring worldwide income and claiming the applicable rates.' },
    ],
    tip: 'Even if you are unsure about your eligibility, consult a Portuguese tax accountant within the first 3 months of arriving. The cost of advice is trivial compared to the potential tax savings over 10 years.',
    estimatedTime: '2–4 hours (application) + accountant time',
    difficulty: 'hard',
    links: [
      { label: 'Portal das Finanças — NHR/IFICI', url: 'https://www.portaldasfinancas.gov.pt/at/html/index.html', type: 'official' },
      { label: 'AT — IFICI information (Portuguese)', url: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guias_fiscais/ifici/', type: 'official' },
    ],
  },
  {
    id: 'lis-aima',
    cityId: 'lisbon',
    title: 'Register with AIMA (residence permit)',
    slug: 'aima-registration',
    category: 'admin',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: ['non_eu'],
    summary: 'Non-EU/EEA citizens must register with AIMA (formerly SEF) to obtain a Portuguese residence permit. EU citizens register at the local council (câmara municipal) for a registration certificate.',
    guide: `AIMA (Agência para a Integração, Migrações e Asilo) replaced SEF (Serviço de Estrangeiros e Fronteiras) in October 2023. It is the authority responsible for legal migration and residence permits for non-EU nationals in Portugal.

For EU/EEA citizens: you do not need a full residence permit, but you should register at your local câmara municipal (town hall) for a Certificado de Registo EU citizen. This is technically required within 3 months of arrival and is needed for some services. It is quick (1 hour) and free or very low cost.

For non-EU citizens: the process depends on your visa type. Most arrive on a D-type visa (D2 for entrepreneurs, D3 for highly qualified workers, D7 for passive income/remote workers, D8 digital nomad visa). Within 4 months of arrival on a D-type visa, you must apply for a residence permit with AIMA.

AIMA is notorious for backlogs. Book your appointment as early as possible — the online system (Agendamento Online) frequently has no slots available weeks in advance. Apply on the AIMA portal the moment you arrive.`,
    steps: [
      { step: 'Determine your route', detail: 'EU/EEA citizen: go to your câmara municipal. Non-EU: book an AIMA appointment online at aima.gov.pt.' },
      { step: 'EU citizens: register at câmara municipal', detail: 'Bring passport/national ID, NIF, proof of address (lease or utility bill). Receive your Certificado de Registo on the spot or within a few days.' },
      { step: 'Non-EU: book AIMA appointment immediately', detail: 'Go to aima.gov.pt and book the earliest available slot. If no slots are available, check daily — they open unpredictably.' },
      { step: 'Prepare non-EU documents', detail: 'Valid passport, D-type visa, NIF, proof of address, proof of income/employment (varies by visa type), criminal record from home country (apostilled), health insurance, and passport photos.' },
      { step: 'Attend appointment and pay fee', detail: 'AIMA appointments are in person. The residence permit card takes several weeks to issue and is sent by post.' },
    ],
    tip: 'If AIMA slots are impossible to book, some law firms offer priority appointment slots through special arrangements. It is worth paying for legal assistance if your residence permit timeline is urgent.',
    estimatedTime: '1–3 hours (EU) or 1–6 months (non-EU, depending on appointment availability)',
    difficulty: 'hard',
    links: [
      { label: 'AIMA — booking portal', url: 'https://www.aima.gov.pt', type: 'official' },
      { label: 'AIMA online appointment system', url: 'https://agendamento.aima.gov.pt', type: 'official' },
    ],
  },
  {
    id: 'lis-housing',
    cityId: 'lisbon',
    title: 'Find housing in Lisbon',
    slug: 'find-housing',
    category: 'housing',
    stageRelevance: ['planning', 'just_arrived'],
    situationRelevance: ['renting'],
    summary: 'Lisbon\'s rental market is tight and fast-moving. Idealista and Imovirtual are the main platforms. Budget €900–1500/month for a one-bedroom in popular neighbourhoods.',
    guide: `Lisbon's rental market has tightened dramatically since 2018. Demand from international arrivals, combined with short-term rental platforms, has pushed rents to levels that feel high by Portuguese standards but moderate by Western European ones. A one-bedroom apartment in Alfama, Mouraria, Príncipe Real, or Santos typically runs €1,200–1,600/month. Further out — Alcântara, Campo de Ourique, Arroios — you can find €950–1,200.

The standard Portuguese rental contract is a minimum 1-year lease, with an initial fixed period (typically 2–5 years) during which neither party can exit without penalty. After the initial period, rolling contracts with 2-month tenant notice are common.

Landlords typically ask for 2 months' deposit plus the first month's rent upfront. Some ask for guarantors (fiador) — if you are a foreign national without Portuguese income history, this can be a barrier. Having a Portuguese employment contract or a year's rent in savings documentation helps.

Idealista is the dominant platform. Imovirtual and Casa Sapo are alternatives. Facebook groups ("Lisbon Expat Housing", "Lisbon Apartments and Rooms") are useful, especially for medium-term furnished accommodation.`,
    steps: [
      { step: 'Set up Idealista alerts', detail: 'Create saved searches with email alerts. In competitive neighbourhoods, new listings receive 10–20 enquiries within hours.' },
      { step: 'Be ready to move quickly', detail: 'Have your documents prepared: passport, proof of income (3 pay slips or bank statements), employer letter, and NIF. Landlords decide within 24–48 hours.' },
      { step: 'Visit properties in person', detail: 'Do not sign anything without visiting first. Photos often flatter; check natural light, noise levels, and hot water pressure.' },
      { step: 'Review the contract (contrato de arrendamento)', detail: 'Verify the initial fixed period length, monthly rent, deposit terms, and any restrictions on subletting or pets.' },
      { step: 'Sign with a witness and register', detail: 'Portuguese rental contracts should ideally be registered with the tax authority (AT) — some landlords resist this to avoid declaring rental income, but a registered contract is your legal protection.' },
    ],
    tip: 'Consider starting with a furnished short-term rental (1–3 months) while you search for a permanent place. It reduces pressure and lets you discover which neighbourhoods actually suit your life.',
    estimatedTime: '2–8 weeks',
    difficulty: 'hard',
    links: [
      { label: 'Idealista Portugal', url: 'https://www.idealista.pt/en/', type: 'official' },
      { label: 'Imovirtual', url: 'https://www.imovirtual.com/en/', type: 'official' },
      { label: 'Casa Sapo', url: 'https://casa.sapo.pt', type: 'official' },
    ],
  },
  {
    id: 'lis-sns',
    cityId: 'lisbon',
    title: 'Register with the SNS (public health)',
    slug: 'sns-health',
    category: 'health',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: [],
    summary: 'Portugal\'s Serviço Nacional de Saúde (SNS) provides universal healthcare. Register at your local health centre (centro de saúde) to get a utente number and a GP.',
    guide: `Portugal's National Health Service (SNS) is a universal public healthcare system. Once registered, you are assigned a utente (patient) number and a GP (médico de família) at your local health centre (centro de saúde). Consultations cost €0–5 for most users, and prescriptions are subsidised.

Registration is straightforward but requires proof of Portuguese residence. You register at the centro de saúde geographically closest to your registered address — you cannot freely choose any centre.

Wait times for appointments with your assigned GP can be long (weeks for a routine consultation). For urgent matters, you can use urgent care at health centres (same day) or hospital A&E. Private clinics (clínicas privadas) such as CUF, Luz Saúde, and Hospital da Cruz Vermelha offer same-day appointments at reasonable costs (€50–100 for a GP consultation).

If you have private health insurance (often included in employment packages in Portugal), use it for faster access and specialists. The SNS is your safety net for serious illness.`,
    steps: [
      { step: 'Find your nearest centro de saúde', detail: 'Use the SNS portal to find your assigned health centre based on your registered address. The ACES Sintra Lisboa and ACES Lisboa Central cover most of Lisbon.' },
      { step: 'Bring documents to register', detail: 'Portuguese residents: NIF, proof of address, and passport or national ID. EU citizens: also bring your EHIC or S1 form if applicable.' },
      { step: 'Register at the administrative desk', detail: 'Ask for "inscrição no centro de saúde". You\'ll receive a número de utente immediately or by post.' },
      { step: 'Wait for GP assignment', detail: 'If GPs are available at your centre, you are assigned one immediately. If not, you are placed on a waiting list — this can take weeks to months in Lisbon.' },
      { step: 'Download the MySNS app', detail: 'The MySNS app lets you check appointment status, request prescriptions, and view your health record.' },
    ],
    tip: 'Even if you primarily use private healthcare, register with the SNS. It provides free emergency care, covers specialist referrals, and is your backup if your private insurance lapses.',
    estimatedTime: '1–2 hours (registration)',
    difficulty: 'easy',
    links: [
      { label: 'SNS — find health centre', url: 'https://www.sns.gov.pt/sns/servico-nacional-de-saude/', type: 'official' },
      { label: 'MySNS portal', url: 'https://mysns.min-saude.pt', type: 'official' },
      { label: 'SNS 24 health line', url: 'https://www.sns24.gov.pt', type: 'official' },
    ],
  },
  {
    id: 'lis-bank',
    cityId: 'lisbon',
    title: 'Open a Portuguese bank account',
    slug: 'bank-account',
    category: 'money',
    stageRelevance: ['just_arrived', 'settling'],
    situationRelevance: [],
    summary: 'A Portuguese IBAN is required for salary payments, rent, utilities, and tax filings. Millennium BCP and Novo Banco are the most foreigner-friendly. Start with Wise while you wait.',
    guide: `A Portuguese bank account is essential for life in Lisbon. You need a PT IBAN for salary deposits, rent payments, utility direct debits, and your tax return. Without a local IBAN, many Portuguese services simply will not work.

The main Portuguese retail banks are Millennium BCP, Novo Banco, Caixa Geral de Depósitos (state-owned), Santander Portugal, and BPI. Millennium BCP is generally considered the most international-friendly and has reasonable English-language support. Activobank (part of Millennium) is an online-first option with lower fees.

You will need your NIF to open any Portuguese bank account — this is why getting your NIF first is critical. Most banks also require proof of address (lease or utility bill) and a minimum initial deposit (typically €250–500).

For immediate needs, open a Wise or Revolut account first — you get a PT-functional IBAN within hours and can use it for most purposes while the formal bank account is processed.`,
    steps: [
      { step: 'Open Wise or Revolut as a bridge', detail: 'Get a working PT-functional European IBAN within 24 hours. Use it for immediate transactions while your main account is being set up.' },
      { step: 'Gather your documents', detail: 'NIF (mandatory), passport, proof of Portuguese address (lease or utility bill), and a minimum opening deposit (usually €250–500).' },
      { step: 'Book an appointment at Millennium BCP or Novo Banco', detail: 'Both have English-speaking staff in Lisbon branches. Millennium BCP\'s Avenida da Liberdade branch has the most experience with foreign nationals.' },
      { step: 'Complete KYC / anti-money laundering forms', detail: 'Portuguese banks have strict KYC requirements. Be prepared to explain the source of funds if transferring large amounts from abroad.' },
      { step: 'Activate online banking and MB Way', detail: 'MB Way is Portugal\'s mobile payment system — link it to your account. It is used for everything from splitting bills to paying parking meters.' },
    ],
    tip: 'Activobank (Millennium\'s digital brand) lets you open an account without visiting a branch, entirely online. It is the fastest route to a formal Portuguese account if you already have your NIF.',
    estimatedTime: '1–3 days (Wise) or 1–2 weeks (Portuguese bank)',
    difficulty: 'easy',
    links: [
      { label: 'Millennium BCP', url: 'https://ind.millenniumbcp.pt/en/Particulares/Pages/Welcome.aspx', type: 'official' },
      { label: 'Activobank', url: 'https://www.activobank.pt/en', type: 'official' },
      { label: 'Wise (bridge account)', url: 'https://wise.com', type: 'affiliate' },
    ],
  },
]
