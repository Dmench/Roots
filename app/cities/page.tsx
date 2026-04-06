import Link from 'next/link'
import { CITIES } from '@/lib/data/cities'
import { Nav } from '@/components/layout/Nav'

export const metadata = { title: 'Choose your city — Roots' }

export default function CitiesPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Nav />

      {/* Header */}
      <div
        className="px-6 md:px-10 pt-16 pb-12 md:pt-20 md:pb-16"
        style={{ background: 'linear-gradient(160deg, #F7F4EE 0%, #EFE0CF 60%, #E4C8B0 100%)' }}
      >
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-walnut/60 mb-4">Cities</p>
          <h1 className="font-display font-black text-espresso leading-[0.9]"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}>
            Where are<br />you going?
          </h1>
          <p className="text-walnut mt-5 text-lg max-w-md leading-relaxed">
            Pick your city. We&apos;ll walk you through every step.
          </p>
        </div>
      </div>
      <div style={{ height: 40, background: 'linear-gradient(to bottom, #E4C8B0, #FDFBF7)' }} />

      {/* City grid */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CITIES.map(city => (
            city.active ? (
              <Link
                key={city.id}
                href={`/${city.id}`}
                className="group relative overflow-hidden rounded-3xl border border-sand hover:border-terracotta/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-espresso/5"
                style={{ background: city.heroGradient }}
              >
                <div className="p-8 min-h-[240px] flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-walnut/60 mb-2">{city.country}</p>
                    <h2 className="font-display font-black text-espresso text-4xl md:text-5xl leading-[0.9] mb-3">
                      {city.name}
                    </h2>
                    <p className="text-walnut text-sm leading-relaxed line-clamp-3">{city.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-xs text-walnut/50 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-terracotta inline-block" />
                      {city.settlerCount} settling now
                    </span>
                    <span className="text-sm font-medium text-espresso group-hover:text-terracotta transition-colors">
                      Start →
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div
                key={city.id}
                className="relative overflow-hidden rounded-3xl border border-sand/40 opacity-50"
                style={{ background: city.heroGradient }}
              >
                <div className="p-8 min-h-[240px] flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-walnut/50 mb-2">{city.country}</p>
                    <h2 className="font-display font-black text-espresso/50 text-4xl md:text-5xl leading-[0.9]">
                      {city.name}
                    </h2>
                  </div>
                  <span className="self-start px-3 py-1 rounded-full bg-sand/50 text-walnut/50 text-xs font-medium">
                    Coming soon
                  </span>
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
