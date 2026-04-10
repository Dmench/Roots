'use client'
import Link from 'next/link'
import { Nav } from '@/components/layout/Nav'
import { ACTIVE_CITIES, getCity } from '@/lib/data/cities'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { AuthModal } from '@/components/auth/AuthModal'
import { useState } from 'react'

const RECENT_QUESTIONS = [
  {
    city: 'Brussels', cityId: 'brussels',
    q: 'How long does commune registration actually take?',
    a: 'The office visit takes about an hour, but the full process — police visit, verification, eID production — takes 4 to 8 weeks. Register within your first week.',
    color: '#4744C8',
  },
  {
    city: 'Brussels', cityId: 'brussels',
    q: 'Which mutuelle is best for English-speaking expats?',
    a: 'Partenamut is widely recommended — they have English-speaking staff in Brussels and an accessible online portal. Ask specifically for the international desk.',
    color: '#38C0F0',
  },
  {
    city: 'Brussels', cityId: 'brussels',
    q: 'Do I need a Belgian bank account to sign a lease?',
    a: 'Most landlords require a Belgian IBAN. Open a Wise account for an immediate IBAN before you arrive, then switch to BNP Paribas Fortis or ING once you\'re registered.',
    color: '#FF3EBA',
  },
  {
    city: 'Brussels', cityId: 'brussels',
    q: 'What\'s the difference between a 3-6-9 lease and a short-term lease?',
    a: 'A 3-6-9 is the standard residential lease — 9 years with break options at 3 and 6. Short-term leases max at 3 years but offer less tenant protection. Most expats start short-term.',
    color: '#FAB400',
  },
]

export default function HomePage() {
  const totalSettlers = ACTIVE_CITIES.reduce((sum, c) => sum + c.settlerCount, 0)
  const { user, loading, signOut } = useAuth()
  const { profile } = useProfile()
  const [authOpen, setAuthOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    // stays on this page — loading will flip and marketing view will show
  }

  const cityObj = profile.cityId ? getCity(profile.cityId) : null
  const firstName = profile.displayName?.split(' ')[0]

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#F5ECD7' }}>
        <Nav />
      </div>
    )
  }

  // ── Signed-in state ──────────────────────────────────────────────────────
  if (user) {
    return (
      <div className="min-h-screen" style={{ background: '#F5ECD7' }}>
        <Nav />
        <div className="relative overflow-hidden px-6 md:px-12 pt-16 pb-24">
          {/* Shapes */}
          <div className="absolute rounded-full pointer-events-none"
            style={{ background: '#4744C8', width: 320, height: 320, top: -140, right: -80, opacity: 0.9 }} />
          <div className="absolute rounded-full pointer-events-none"
            style={{ background: '#38C0F0', width: 100, height: 100, bottom: 20, right: '22%', opacity: 0.6 }} />
          <div className="absolute pointer-events-none overflow-hidden"
            style={{ width: 80, height: 40, bottom: 0, left: '40%' }}>
            <div className="w-full rounded-full" style={{ background: '#FF3EBA', height: 80, marginTop: -40, opacity: 0.7 }} />
          </div>

          <div className="max-w-4xl mx-auto relative pt-8">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-8"
              style={{ color: 'rgba(37,36,80,0.35)' }}>
              Welcome back
            </p>
            <h1 className="font-display font-black leading-[0.85] mb-6"
              style={{ fontSize: 'clamp(3.5rem, 9vw, 7.5rem)', color: '#252450' }}>
              {firstName ? `Hey, ${firstName}.` : 'Welcome back.'}
            </h1>
            <p className="text-lg mb-12" style={{ color: 'rgba(37,36,80,0.55)', maxWidth: 360 }}>
              {cityObj
                ? `Your ${cityObj.name} home is ready.`
                : 'Pick up where you left off.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {cityObj ? (
                <>
                  <Link
                    href={`/${cityObj.id}`}
                    className="inline-flex items-center justify-center px-8 py-4 text-white rounded-full font-bold hover:opacity-90 transition-opacity text-sm"
                    style={{ background: '#4744C8' }}
                  >
                    Open {cityObj.name} →
                  </Link>
                  <Link
                    href={`/${cityObj.id}/connect`}
                    className="inline-flex items-center justify-center px-8 py-4 rounded-full font-bold text-sm hover:opacity-80 transition-opacity"
                    style={{ border: '2px solid rgba(37,36,80,0.15)', color: '#252450' }}
                  >
                    Community
                  </Link>
                </>
              ) : (
                <Link
                  href="/cities"
                  className="inline-flex items-center justify-center px-8 py-4 text-white rounded-full font-bold hover:opacity-90 transition-opacity text-sm"
                  style={{ background: '#4744C8' }}
                >
                  Choose your city →
                </Link>
              )}
              <Link
                href="/profile"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full font-medium text-sm hover:opacity-70 transition-opacity"
                style={{ color: 'rgba(37,36,80,0.45)' }}
              >
                Profile
              </Link>
            </div>

            <button
              onClick={handleSignOut}
              className="mt-12 text-xs hover:opacity-70 transition-opacity"
              style={{ color: 'rgba(37,36,80,0.3)' }}
            >
              Sign out
            </button>
          </div>
        </div>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    )
  }

  // ── Marketing / signed-out state ─────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 md:px-10 pt-16 md:pt-24 pb-24 md:pb-40"
        style={{ background: '#F5ECD7' }}
      >
        {/* Geometric shapes */}
        {/* Large indigo circle – top right, partly off-screen */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ background: '#4744C8', width: '42vw', height: '42vw', maxWidth: 560, maxHeight: 560, top: '-18%', right: '-8%' }}
        />
        {/* Sky blue circle – mid right */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ background: '#38C0F0', width: '22vw', height: '22vw', maxWidth: 280, maxHeight: 280, bottom: '8%', right: '12%' }}
        />
        {/* Gold circle – bottom left */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ background: '#FAB400', width: '14vw', height: '14vw', maxWidth: 180, maxHeight: 180, bottom: '-6%', left: '4%' }}
        />
        {/* Magenta half-circle – bottom right accent */}
        <div
          className="absolute pointer-events-none overflow-hidden"
          style={{ width: 120, height: 60, bottom: 0, right: '38%' }}
        >
          <div className="w-full rounded-full" style={{ background: '#FF3EBA', height: 120, marginTop: -60 }} />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <p className="text-xs uppercase tracking-[0.3em] mb-8 font-semibold" style={{ color: '#252450', opacity: 0.5 }}>
            City onboarding · Belonging
          </p>
          <h1
            className="font-display font-black leading-[0.85] tracking-tight mb-8"
            style={{ fontSize: 'clamp(4rem, 11vw, 10rem)', color: '#252450' }}
          >
            Put down<br />roots,<br />
            <em className="not-italic" style={{ color: '#4744C8' }}>anywhere.</em>
          </h1>
          <p className="text-lg md:text-xl max-w-sm leading-relaxed mb-10" style={{ color: '#252450', opacity: 0.65 }}>
            Find your people in Brussels. Then figure everything else out together.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <Link
              href="/cities"
              className="inline-flex items-center justify-center px-8 py-4 text-white rounded-full font-bold hover:opacity-90 transition-opacity text-sm"
              style={{ background: '#4744C8' }}
            >
              Choose your city →
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full font-medium hover:opacity-80 transition-opacity text-sm"
              style={{ border: '2px solid rgba(37,36,80,0.2)', color: '#252450' }}
            >
              How it works
            </a>
          </div>
          <p className="mt-10 text-sm font-medium" style={{ color: '#252450', opacity: 0.4 }}>
            {totalSettlers.toLocaleString()} people finding their feet in Brussels right now
          </p>
        </div>
      </section>

      {/* ── Three pillars ─────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-16 md:py-24 max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-[0.25em] text-stone mb-5 font-semibold">What you get</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Connect — Magenta — LEAD */}
          <Link
            href="/brussels/connect"
            className="group relative rounded-2xl p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-espresso/10 md:col-span-1"
            style={{ background: '#FF3EBA' }}
          >
            <div className="absolute bottom-6 right-6 pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.2)', width: 80, height: 80, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
            <div className="absolute top-4 right-4 rounded-full pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.18)', width: 36, height: 36 }} />
            <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'rgba(37,36,80,0.45)' }}>Community</p>
            <h3 className="font-display font-black text-2xl md:text-3xl leading-tight mb-3" style={{ color: '#252450' }}>
              Find your<br />people.
            </h3>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(37,36,80,0.65)' }}>
              Not just &ldquo;expats in Brussels.&rdquo; People who moved here this month, figuring out the same things you are.
            </p>
            <span className="text-sm font-bold" style={{ color: '#252450' }}>Join →</span>
          </Link>

          {/* Ask — Sky */}
          <Link
            href="/brussels/ask"
            className="group relative rounded-2xl p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-espresso/10"
            style={{ background: '#38C0F0' }}
          >
            <div className="absolute -top-10 -left-10 rounded-full pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.2)', width: 160, height: 160 }} />
            <div className="absolute bottom-8 right-8 pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.18)', width: 50, height: 50, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
            <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'rgba(37,36,80,0.45)' }}>Ask anything</p>
            <h3 className="font-display font-black text-2xl md:text-3xl leading-tight mb-3" style={{ color: '#252450' }}>
              Any question.<br />Live answers.
            </h3>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(37,36,80,0.65)' }}>
              Specific, cited answers about Brussels — based on your visa, your stage, your situation.
            </p>
            <span className="text-sm font-bold" style={{ color: '#252450' }}>Ask →</span>
          </Link>

          {/* Settle — Gold */}
          <Link
            href="/brussels/settle"
            className="group relative rounded-2xl p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-espresso/10"
            style={{ background: '#FAB400' }}
          >
            <div className="absolute -bottom-8 -right-8 rounded-full pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.22)', width: 140, height: 140 }} />
            <div className="absolute top-6 right-6 rounded-full pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.15)', width: 40, height: 40 }} />
            <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'rgba(37,36,80,0.45)' }}>Get set up</p>
            <h3 className="font-display font-black text-2xl md:text-3xl leading-tight mb-3" style={{ color: '#252450' }}>
              Checklist,<br />your way.
            </h3>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(37,36,80,0.65)' }}>
              Commune, mutuelle, bank account — filtered to your situation. Skip what doesn&apos;t apply to you.
            </p>
            <span className="text-sm font-bold" style={{ color: '#252450' }}>Start →</span>
          </Link>
        </div>
      </section>

      {/* ── Cities ────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-16 md:py-24" style={{ background: '#F5ECD7' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-stone mb-4 font-semibold">Live now</p>
              <h2 className="font-display font-bold" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 0.9, color: '#252450' }}>
                Pick your city
              </h2>
            </div>
            <Link href="/cities" className="text-sm font-semibold mb-1 hover:opacity-70 transition-opacity" style={{ color: '#4744C8' }}>
              All cities →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {ACTIVE_CITIES.map((city) => (
              <Link
                key={city.id}
                href={`/${city.id}`}
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-espresso/15"
                style={{ background: '#4744C8', minHeight: 300 }}
              >
                {/* Geometric decorations */}
                <div className="absolute rounded-full pointer-events-none" style={{ background: '#38C0F0', opacity: 0.35, width: 320, height: 320, bottom: -100, right: -60 }} />
                <div className="absolute rounded-full pointer-events-none" style={{ background: '#FAB400', opacity: 0.4, width: 120, height: 120, top: 24, right: 40 }} />
                <div className="absolute pointer-events-none" style={{ background: '#FF3EBA', opacity: 0.3, width: 80, height: 80, top: '40%', right: 200, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />

                <div className="relative p-10 md:p-14 flex flex-col md:flex-row md:items-center justify-between h-full gap-8" style={{ minHeight: 300 }}>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-3" style={{ color: 'rgba(245,236,215,0.5)' }}>{city.country} · Live now</p>
                    <h3 className="font-display font-black text-white leading-[0.88] mb-4" style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)' }}>
                      {city.name}
                    </h3>
                    <p className="text-base leading-relaxed max-w-md" style={{ color: 'rgba(245,236,215,0.7)' }}>{city.description}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-start md:items-end gap-4">
                    <span className="flex items-center gap-2 text-sm font-medium" style={{ color: 'rgba(245,236,215,0.55)' }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: '#38C0F0' }} />
                      {city.settlerCount} settling now
                    </span>
                    <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 opacity-0 group-hover:opacity-100"
                      style={{ background: '#FAB400', color: '#252450' }}>
                      Settle in {city.name} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {/* Coming soon cities */}
          <div className="mt-4 flex flex-wrap gap-3">
            {(['Lisbon', 'Berlin', 'Barcelona', 'Amsterdam'] as const).map(name => (
              <span key={name} className="px-4 py-2 rounded-full text-sm border border-sand/60 text-stone bg-white">
                {name} — coming soon
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="px-6 md:px-10 py-20 md:py-32 relative overflow-hidden" style={{ background: '#252450' }}>
        {/* Geometric decorations */}
        <div className="absolute rounded-full pointer-events-none" style={{ background: '#4744C8', width: 320, height: 320, top: -120, right: -80, opacity: 0.6 }} />
        <div className="absolute pointer-events-none" style={{ background: '#FF3EBA', width: 120, height: 120, bottom: 40, left: 60, opacity: 0.5, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ background: '#FAB400', width: 80, height: 80, bottom: 60, right: '20%', opacity: 0.5 }} />

        <div className="max-w-6xl mx-auto relative">
          <p className="text-xs uppercase tracking-[0.25em] mb-5 font-semibold" style={{ color: 'rgba(245,236,215,0.45)' }}>How it works</p>
          <h2 className="font-display font-bold text-white mb-20" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 0.9 }}>
            Community first.<br />Everything else follows.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {[
              {
                num: '01', label: 'Connect', color: '#FF3EBA',
                title: 'Find your\npeople first.',
                desc: 'Others who moved here this month are already on Roots. Stage-matched — not just a generic expat group.',
                detail: '"Also arrived in Brussels last week, still figuring out the commune. Anyone else?"',
              },
              {
                num: '02', label: 'Ask', color: '#38C0F0',
                title: 'Any question.\nLive answers.',
                desc: 'Type anything that comes up. Get a specific, cited answer based on your situation — not a generic guide.',
                detail: '"Which commune is fastest for registration right now if I live in Ixelles?"',
              },
              {
                num: '03', label: 'Settle', color: '#FAB400',
                title: 'Get set up\nat your pace.',
                desc: 'Checklist filtered to your situation. Commune, mutuelle, bank account — only what applies to you.',
                detail: 'Register at commune · Open Belgian bank · Get mutuelle — skip the rest.',
              },
            ].map((step, i) => (
              <div key={i}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black mb-6" style={{ background: step.color, color: '#252450' }}>
                  {step.num}
                </div>
                <p className="text-xs uppercase tracking-[0.2em] mb-3 font-bold" style={{ color: step.color }}>{step.label}</p>
                <h3 className="font-display font-bold text-white text-2xl md:text-3xl leading-tight mb-4 whitespace-pre-line">
                  {step.title}
                </h3>
                <p className="leading-relaxed mb-4 text-sm" style={{ color: 'rgba(245,236,215,0.6)' }}>{step.desc}</p>
                <p className="text-sm italic pl-4 leading-relaxed" style={{ color: 'rgba(245,236,215,0.35)', borderLeft: `2px solid ${step.color}40` }}>
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recently asked ────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-20 md:py-32 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-14 gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-stone mb-4 font-semibold">In action</p>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 0.9, color: '#252450' }}>
              Recently asked
            </h2>
          </div>
          <Link href="/cities" className="text-sm font-semibold mb-1 hover:opacity-70 transition-opacity" style={{ color: '#4744C8' }}>
            Start asking →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {RECENT_QUESTIONS.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl p-8 relative overflow-hidden"
              style={{ background: '#F5ECD7' }}
            >
              {/* Subtle circle accent */}
              <div className="absolute -bottom-6 -right-6 rounded-full pointer-events-none" style={{ background: item.color, opacity: 0.12, width: 120, height: 120 }} />
              <div className="flex items-center gap-2.5 mb-5">
                <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: item.color }}>
                  {item.city}
                </span>
                <span className="text-xs text-stone font-medium">via Ask</span>
              </div>
              <p className="font-display font-semibold text-xl leading-snug mb-4" style={{ color: '#252450' }}>
                {item.q}
              </p>
              <p className="text-sm leading-relaxed line-clamp-3" style={{ color: 'rgba(37,36,80,0.6)' }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── For organisations ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 md:px-10 py-20 md:py-32" style={{ background: '#4744C8' }}>
        {/* Geometric decorations */}
        <div className="absolute rounded-full pointer-events-none" style={{ background: '#38C0F0', opacity: 0.3, width: 300, height: 300, top: -100, right: -60 }} />
        <div className="absolute pointer-events-none" style={{ background: '#FAB400', opacity: 0.35, width: 100, height: 100, bottom: 40, left: 80, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ background: '#FF3EBA', opacity: 0.3, width: 140, height: 140, bottom: -40, right: '30%' }} />

        <div className="max-w-6xl mx-auto md:grid md:grid-cols-2 gap-16 items-center relative">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] mb-5 font-semibold" style={{ color: 'rgba(245,236,215,0.55)' }}>For organisations</p>
            <h2 className="font-display font-bold text-white mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 0.9 }}>
              Moving your team<br />to a new city?
            </h2>
            <p className="text-lg max-w-lg leading-relaxed mb-8" style={{ color: 'rgba(245,236,215,0.7)' }}>
              Brussels hosts 40,000+ EU institution staff. Lisbon is the fastest-growing tech hub in Europe.
              Roots handles city onboarding end-to-end for entire cohorts.
            </p>
            <a
              href="mailto:hello@roots.so"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold hover:opacity-90 transition-opacity text-sm"
              style={{ background: '#FAB400', color: '#252450' }}
            >
              Talk to us →
            </a>
          </div>

          <div className="mt-12 md:mt-0">
            <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
              <p className="text-xs uppercase tracking-widest mb-5 font-bold" style={{ color: 'rgba(245,236,215,0.55)' }}>Team plans include</p>
              <ul className="space-y-4">
                {[
                  'Bulk seat access for all relocating employees',
                  'Custom city guides for your contract terms',
                  'HR dashboard — track team onboarding progress',
                  'White-label option for relocation firms',
                ].map((f, i) => {
                  const dots = ['#38C0F0', '#FAB400', '#FF3EBA', '#38C0F0']
                  return (
                    <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(245,236,215,0.8)' }}>
                      <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: dots[i] }} />
                      {f}
                    </li>
                  )
                })}
              </ul>
              <p className="mt-8 text-xs font-medium" style={{ color: 'rgba(245,236,215,0.4)' }}>hello@roots.so</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="px-6 md:px-10 py-12 border-t border-sand/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-display font-black text-xl mb-1" style={{ color: '#252450' }}>Roots</p>
            <p className="text-sm text-stone">Put down roots, anywhere.</p>
          </div>
          <div className="flex flex-wrap gap-8 text-sm text-stone">
            <Link href="/cities" className="hover:text-espresso transition-colors">Cities</Link>
            <Link href="/brussels" className="hover:text-espresso transition-colors">Brussels</Link>
            <Link href="/lisbon" className="hover:text-espresso transition-colors">Lisbon</Link>
            <a href="mailto:hello@roots.so" className="hover:text-espresso transition-colors">Contact</a>
          </div>
          <p className="text-xs text-stone max-w-xs">
            Roots provides information, not advice. Always verify with official sources.
          </p>
        </div>
      </footer>
    </div>
  )
}
