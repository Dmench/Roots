'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'
import { getCity } from '@/lib/data/cities'

export function Nav() {
  const pathname = usePathname()
  const { profile } = useProfile()
  const [mobileOpen, setMobileOpen] = useState(false)

  const cityMatch = pathname.match(/^\/([a-z-]+)/)
  const pathCityId = cityMatch?.[1]
  const pathCity = pathCityId && pathCityId !== 'cities' ? getCity(pathCityId) : undefined
  const profileCity = profile.cityId ? getCity(profile.cityId) : undefined
  const displayCity = pathCity || profileCity

  const cityNav = pathCity ? [
    { href: `/${pathCity.id}/settle`,  label: 'Settle' },
    { href: `/${pathCity.id}/ask`,     label: 'Ask' },
    { href: `/${pathCity.id}/connect`, label: 'Connect' },
  ] : []

  return (
    <>
      <header className="sticky top-0 z-50 bg-cream/85 backdrop-blur-md border-b border-sand/60">
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-8">

          <Link
            href="/"
            className="font-display font-black text-xl text-espresso tracking-tight hover:text-terracotta transition-colors shrink-0"
          >
            Roots
          </Link>

          {cityNav.length > 0 && (
            <nav className="hidden md:flex items-center gap-1 flex-1">
              {cityNav.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? 'bg-espresso text-cream'
                      : 'text-walnut hover:text-espresso hover:bg-parchment'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {displayCity && !pathCity && (
              <span className="hidden sm:flex items-center gap-1.5 text-sm text-walnut">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta inline-block" />
                {displayCity.name}
              </span>
            )}
            <Link
              href={profileCity ? `/${profileCity.id}` : '/cities'}
              className="px-4 py-2 border border-espresso/25 text-espresso rounded-full text-sm font-medium hover:bg-espresso/5 transition-colors whitespace-nowrap"
            >
              {profileCity ? 'My city' : 'Choose city'}
            </Link>

            <button
              className="md:hidden p-2 -mr-2 text-espresso"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-cream flex flex-col">
          <div className="flex items-center justify-between px-6 h-16 border-b border-sand/60">
            <span className="font-display font-black text-xl text-espresso">Roots</span>
            <button onClick={() => setMobileOpen(false)} className="p-2 text-espresso" aria-label="Close menu">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col gap-1 p-6 flex-1">
            {cityNav.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3.5 text-lg font-medium rounded-xl transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-espresso text-cream'
                    : 'text-espresso hover:bg-parchment'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-auto pt-6 border-t border-sand">
              <Link
                href="/cities"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-base text-walnut hover:text-espresso transition-colors"
              >
                All cities
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
