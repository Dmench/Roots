import Link from 'next/link'
import { CITIES, ACTIVE_CITIES } from '@/lib/data/cities'

const RECENT_QUESTIONS = [
  {
    city: 'Brussels',
    cityId: 'brussels',
    q: 'How long does the commune registration actually take?',
    a: 'The office visit takes about an hour, but the full process — police visit, verification, eID production — takes 4 to 8 weeks. Register within your first week.',
  },
  {
    city: 'Lisbon',
    cityId: 'lisbon',
    q: 'Do I need a NIF before I can rent an apartment?',
    a: 'Yes, almost all landlords and agencies require a NIF. The good news: you can get one at any Finanças office in a single visit, in under an hour.',
  },
  {
    city: 'Brussels',
    cityId: 'brussels',
    q: 'Which mutuelle is best for English-speaking expats?',
    a: 'Partenamut is widely recommended — they have English-speaking staff in Brussels and an accessible online portal. Mutualité Libérale is a solid alternative.',
  },
  {
    city: 'Lisbon',
    cityId: 'lisbon',
    q: 'Can I open a Portuguese bank account before I arrive?',
    a: 'Not easily at traditional banks. Open a Wise account before you land for an immediate IBAN, then open a Portuguese account at Millennium BCP or Caixa once you have your NIF and AIMA registration.',
  },
]

export default function HomePage() {
  const totalSettlers = ACTIVE_CITIES.reduce((sum, c) => sum + c.settlerCount, 0)

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Minimal nav ─────────────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 md:px-10 h-16 flex items-center justify-between">
        <span className="font-display font-black text-xl text-espresso tracking-tight">Roots</span>
        <Link
          href="/cities"
          className="px-5 py-2 border border-espresso/25 text-espresso rounded-full text-sm font-medium hover:bg-white/60 transition-colors backdrop-blur-sm bg-cream/40"
        >
          Choose your city
        </Link>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[92vh] flex flex-col justify-end pb-20 md:pb-28 px-6 md:px-10 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #F7F4EE 0%, #EFE0CF 30%, #E4C8B0 60%, #D9B494 100%)' }}
      >
        {/* Large decorative number — editorial accent */}
        <div
          className="absolute top-0 right-0 font-display font-black text-[22rem] md:text-[32rem] leading-none text-espresso/[0.04] select-none pointer-events-none"
          aria-hidden
        >
          R
        </div>

        <div className="relative max-w-6xl mx-auto w-full">
          {/* Eyebrow */}
          <p className="text-xs uppercase tracking-[0.25em] text-walnut/60 mb-6 font-medium">
            City onboarding · Belonging
          </p>

          {/* Main headline */}
          <h1 className="font-display font-black text-espresso leading-[0.88] tracking-tight mb-8"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 9rem)' }}>
            Put down<br />
            roots,<br />
            <em className="not-italic text-terracotta">anywhere.</em>
          </h1>

          {/* Subtext */}
          <p className="text-walnut text-lg md:text-xl max-w-md leading-relaxed mb-10">
            Settle in, get set up, and find your people — based on your actual situation.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/cities"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-terracotta text-cream rounded-full font-medium hover:bg-terracotta-dark transition-colors text-sm"
            >
              Choose your city
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-espresso/25 text-espresso rounded-full font-medium hover:bg-white/50 transition-colors text-sm"
            >
              See how it works
            </a>
          </div>

          {/* Live settler count */}
          <p className="mt-8 text-walnut/50 text-sm">
            {totalSettlers.toLocaleString()} people settling across {ACTIVE_CITIES.length} cities right now
          </p>
        </div>
      </section>

      {/* Fade */}
      <div style={{ height: 60, background: 'linear-gradient(to bottom, #D9B494, #FDFBF7)' }} />

      {/* ── Cities ───────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-16 md:py-24 max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-walnut/50 mb-4">Live now</p>
        <h2 className="font-display font-bold text-espresso mb-12"
          style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 0.92 }}>
          Pick your city
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CITIES.map(city => (
            city.active ? (
              <Link
                key={city.id}
                href={`/${city.id}`}
                className="group relative overflow-hidden rounded-3xl border border-sand hover:border-terracotta/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-espresso/5"
                style={{ background: city.heroGradient }}
              >
                <div className="p-8 md:p-10 min-h-[280px] flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-walnut/60 mb-2">{city.country}</p>
                    <h3 className="font-display font-black text-espresso mb-3"
                      style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 0.9 }}>
                      {city.name}
                    </h3>
                    <p className="text-walnut text-sm leading-relaxed max-w-xs">{city.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-8">
                    <span className="text-xs text-walnut/50 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-terracotta inline-block animate-pulse" />
                      {city.settlerCount} settling now
                    </span>
                    <span className="text-sm font-medium text-espresso group-hover:text-terracotta transition-colors flex items-center gap-1">
                      Settle in {city.name}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="translate-x-0 group-hover:translate-x-1 transition-transform">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div
                key={city.id}
                className="relative overflow-hidden rounded-3xl border border-sand/60 opacity-60"
                style={{ background: city.heroGradient }}
              >
                <div className="p-8 md:p-10 min-h-[280px] flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-walnut/50 mb-2">{city.country}</p>
                    <h3 className="font-display font-black text-espresso/60"
                      style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 0.9 }}>
                      {city.name}
                    </h3>
                  </div>
                  <span className="self-start mt-8 px-3 py-1 rounded-full bg-sand/60 text-walnut/60 text-xs font-medium">
                    Coming soon
                  </span>
                </div>
              </div>
            )
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="px-6 md:px-10 py-16 md:py-24 bg-ivory border-y border-sand/60">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-walnut/50 mb-4">The loop</p>
          <h2 className="font-display font-bold text-espresso mb-16"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 0.92 }}>
            One loop.<br />Three steps.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                num: '01',
                label: 'Ask',
                title: 'Any question.\nLive answers.',
                desc: 'Type anything about your city. Get a specific, cited answer based on your situation — not a generic guide.',
                detail: '"How do I register in Lisbon if I arrive next month with a D7 visa?"',
              },
              {
                num: '02',
                label: 'Settle',
                title: 'Answers become\nyour plan.',
                desc: 'Tasks are generated from your questions and situation. Your setup guide, your pace. Skip what doesn\'t apply.',
                detail: 'Register NIF · Open bank account · AIMA appointment — only what you need.',
              },
              {
                num: '03',
                label: 'Connect',
                title: 'People at\nyour stage.',
                desc: 'Not just anyone in the city. People who arrived the same month, working through the same steps.',
                detail: '"Also arrived in Lisbon last week, still hunting for a flat in Príncipe Real."',
              },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="flex items-start gap-5 mb-6">
                  <span className="font-display font-black text-5xl text-sand leading-none shrink-0">{step.num}</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-terracotta font-medium mb-1">{step.label}</p>
                    <h3 className="font-display font-bold text-espresso text-2xl md:text-3xl leading-tight whitespace-pre-line">
                      {step.title}
                    </h3>
                  </div>
                </div>
                <p className="text-walnut leading-relaxed mb-4">{step.desc}</p>
                <p className="text-sm text-walnut/50 italic border-l-2 border-sand pl-4 leading-relaxed">
                  {step.detail}
                </p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 -right-6 text-sand/60 text-2xl">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recently asked ───────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-16 md:py-24 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-walnut/50 mb-4">In action</p>
            <h2 className="font-display font-bold text-espresso"
              style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 0.92 }}>
              Recently asked
            </h2>
          </div>
          <Link href="/cities" className="text-terracotta text-sm hover:text-terracotta-dark transition-colors link-hover shrink-0 mb-1">
            Start asking →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RECENT_QUESTIONS.map((item, i) => (
            <div
              key={i}
              className="bg-ivory border border-sand rounded-3xl p-7 hover:border-terracotta/30 hover:bg-white transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium text-walnut bg-sand/60 px-3 py-1 rounded-full">
                  {item.city}
                </span>
                <span className="text-xs text-stone">via Ask</span>
              </div>
              <p className="font-display font-semibold text-espresso text-lg leading-snug mb-3">
                {item.q}
              </p>
              <p className="text-walnut text-sm leading-relaxed line-clamp-3">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-sand/60 px-6 md:px-10 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-display font-black text-xl text-espresso mb-1">Roots</p>
            <p className="text-walnut/50 text-sm">Put down roots, anywhere.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-walnut/50">
            <Link href="/cities" className="hover:text-espresso transition-colors">Cities</Link>
            <Link href="/brussels" className="hover:text-espresso transition-colors">Brussels</Link>
            <Link href="/lisbon" className="hover:text-espresso transition-colors">Lisbon</Link>
          </div>
          <p className="text-walnut/30 text-xs">
            Roots provides information, not advice. Always verify with official sources.
          </p>
        </div>
      </footer>
    </div>
  )
}
