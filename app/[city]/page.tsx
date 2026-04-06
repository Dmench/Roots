import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'
import { getTasksForCity } from '@/lib/data/tasks'

export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city || !city.active) notFound()

  const tasks = getTasksForCity(city.id)

  return (
    <>
      {/* ── City hero ──────────────────────────────────────────────────── */}
      <div
        className="px-6 md:px-10 pt-12 pb-16 md:pt-16 md:pb-20 relative overflow-hidden"
        style={{ background: city.heroGradient }}
      >
        {/* Decorative city initial */}
        <div
          className="absolute bottom-0 right-0 font-display font-black leading-none text-espresso/[0.05] select-none pointer-events-none"
          style={{ fontSize: '28rem' }}
          aria-hidden
        >
          {city.name[0]}
        </div>

        <div className="max-w-6xl mx-auto relative">
          <p className="text-xs uppercase tracking-[0.2em] text-walnut/60 mb-4">{city.country}</p>
          <h1 className="font-display font-black text-espresso leading-[0.88] mb-5"
            style={{ fontSize: 'clamp(3rem, 9vw, 8rem)' }}>
            {city.name}
          </h1>
          <p className="text-walnut text-base md:text-lg max-w-lg leading-relaxed mb-8">
            {city.description}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-terracotta inline-block animate-pulse" />
            <span className="text-sm text-walnut/60">{city.settlerCount} people settling here right now</span>
          </div>
        </div>
      </div>

      {/* Fade */}
      <div style={{ height: 40, background: 'linear-gradient(to bottom, #D9B494, #FDFBF7)' }} />

      {/* ── Three pillars ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Settle */}
          <Link
            href={`/${city.id}/settle`}
            className="group bg-ivory border border-sand rounded-3xl p-8 hover:border-terracotta/30 hover:bg-white transition-all duration-300 hover:-translate-y-0.5"
          >
            <p className="text-xs uppercase tracking-widest text-terracotta font-medium mb-4">01 · Settle</p>
            <h2 className="font-display font-bold text-espresso text-3xl leading-tight mb-3 group-hover:text-terracotta transition-colors">
              Your setup,<br />your way.
            </h2>
            <p className="text-walnut text-sm leading-relaxed mb-6">
              Situation-based tasks. Skip what doesn&apos;t apply. Every step has a deep guide and the real official sources.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone">{tasks.length} tasks for {city.name}</span>
              <span className="text-sm font-medium text-espresso group-hover:text-terracotta transition-colors">
                Start →
              </span>
            </div>
          </Link>

          {/* Ask */}
          <Link
            href={`/${city.id}/ask`}
            className="group bg-ivory border border-sand rounded-3xl p-8 hover:border-terracotta/30 hover:bg-white transition-all duration-300 hover:-translate-y-0.5"
          >
            <p className="text-xs uppercase tracking-widest text-terracotta font-medium mb-4">02 · Ask</p>
            <h2 className="font-display font-bold text-espresso text-3xl leading-tight mb-3 group-hover:text-terracotta transition-colors">
              Any question.<br />Live answers.
            </h2>
            <p className="text-walnut text-sm leading-relaxed mb-6">
              Ask anything about living in {city.name}. Get specific, cited answers based on your stage and situation.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone">Powered by AI · Always current</span>
              <span className="text-sm font-medium text-espresso group-hover:text-terracotta transition-colors">
                Ask →
              </span>
            </div>
          </Link>

          {/* Connect */}
          <Link
            href={`/${city.id}/connect`}
            className="group bg-ivory border border-sand rounded-3xl p-8 hover:border-terracotta/30 hover:bg-white transition-all duration-300 hover:-translate-y-0.5"
          >
            <p className="text-xs uppercase tracking-widest text-terracotta font-medium mb-4">03 · Connect</p>
            <h2 className="font-display font-bold text-espresso text-3xl leading-tight mb-3 group-hover:text-terracotta transition-colors">
              People at<br />your stage.
            </h2>
            <p className="text-walnut text-sm leading-relaxed mb-6">
              Not just anyone in the city. Others who arrived the same month, working through the same steps.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone">Stage-matched community</span>
              <span className="text-sm font-medium text-espresso group-hover:text-terracotta transition-colors">
                Connect →
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Onboarding nudge ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 pb-16 md:pb-24">
        <div
          className="rounded-3xl p-8 md:p-10 border border-terracotta/20"
          style={{ background: 'linear-gradient(135deg, #FDF8F5 0%, #F8EDE3 100%)' }}
        >
          <p className="text-xs uppercase tracking-widest text-terracotta font-medium mb-3">Get personalised</p>
          <h3 className="font-display font-bold text-espresso text-2xl md:text-3xl leading-tight mb-3">
            Tell us where you are in the journey.
          </h3>
          <p className="text-walnut text-sm leading-relaxed mb-6 max-w-lg">
            Set your stage and situation once. Roots filters everything — tasks, answers, community — to what actually applies to you.
          </p>
          <Link
            href={`/${city.id}/settle`}
            className="inline-flex items-center gap-2 px-7 py-3 bg-terracotta text-cream rounded-full font-medium hover:bg-terracotta-dark transition-colors text-sm"
          >
            Set my situation →
          </Link>
        </div>
      </section>
    </>
  )
}
