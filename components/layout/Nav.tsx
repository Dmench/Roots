'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import { AuthModal } from '@/components/auth/AuthModal'
import { getCity } from '@/lib/data/cities'
import { cn } from '@/lib/utils'

export function Nav() {
  const pathname     = usePathname()
  const { profile }  = useProfile()
  const { user, loading: authLoading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authOpen,   setAuthOpen]   = useState(false)
  const [scrolled,   setScrolled]   = useState(false)

  useEffect(() => {
    const handler = () => setAuthOpen(true)
    window.addEventListener('roots:open-auth', handler)
    return () => window.removeEventListener('roots:open-auth', handler)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cityMatch   = pathname.match(/^\/([a-z-]+)/)
  const pathCityId  = cityMatch?.[1]
  const pathCity    = pathCityId && !['cities', 'profile', 'auth'].includes(pathCityId)
    ? getCity(pathCityId) : undefined
  const profileCity = profile.cityId ? getCity(profile.cityId) : undefined

  // Top nav order — Housing + Events combined into Listings (IA council
  // unanimous). Ask AI moved to the right cluster as a cyan pill (UX
  // council: AI is a flagship surface, not a destination in the city
  // walk). People kept in main nav for now — founder hasn't asked to
  // demote it; can move to overflow if crowding returns.
  const cityNav = pathCity ? [
    { href: `/${pathCity.id}`,          label: pathCity.name,  color: '#10B981', home: true },
    { href: `/${pathCity.id}/listings`, label: 'Listings',     color: '#FAB400' },
    { href: `/${pathCity.id}/connect`,  label: 'Community',    color: '#FF3EBA' },
    { href: `/${pathCity.id}/eat`,      label: 'Eat & Drink',  color: '#E8612A' },
    { href: `/${pathCity.id}/settle`,   label: 'Settle in',    color: '#4744C8' },
    { href: `/${pathCity.id}/people`,   label: 'People',       color: '#3D3CAC' },
  ] : []

  const isActive = (href: string) => {
    // Listings nav slot stays active for legacy deep links /housing
    // and /events (both still route directly to their respective
    // standalone pages).
    if (pathCity && href === `/${pathCity.id}/listings`) {
      return pathname.startsWith(`/${pathCity.id}/listings`)
          || pathname.startsWith(`/${pathCity.id}/housing`)
          || pathname.startsWith(`/${pathCity.id}/events`)
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-neutral-200 transition-all duration-200"
        style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)' }}
      >
        <div className={cn(
          'max-w-6xl mx-auto px-6 md:px-8 flex items-center justify-between gap-6 transition-all duration-200',
          scrolled ? 'h-10' : 'h-14'
        )}>

          {/* Logo */}
          <Link
            href="/"
            className={cn(
              'font-display font-black tracking-tight shrink-0 hover:opacity-60 transition-all duration-200 text-neutral-950',
              scrolled ? 'text-base' : 'text-xl'
            )}
          >
            Roots
          </Link>

          {/* City tabs — stretch to nav height; dynamic color-bar slides
              up from below on hover and stays full when active. */}
          {cityNav.length > 0 && (
            <nav className="hidden md:flex items-stretch gap-0">
              {cityNav.map((link) => {
                const active = link.home ? pathname === link.href : isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'group relative flex items-center gap-1.5 px-3 text-sm font-medium transition-colors',
                      active ? 'font-semibold' : 'text-neutral-500 hover:text-neutral-900'
                    )}
                    style={active ? { color: link.color } : {}}
                  >
                    {link.home && (
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#10B981' }} />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#10B981' }} />
                      </span>
                    )}
                    {link.label}
                    {/* Color-bar — slides up from below on hover, fully painted when active */}
                    <span
                      aria-hidden
                      className={cn(
                        'absolute left-0 right-0 bottom-0 h-[2px] origin-bottom transition-transform duration-300 ease-out',
                        active ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'
                      )}
                      style={{ background: link.color }}
                    />
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Ask AI — pill in cyan border. Sits LEFT of profile per UX
                council. Hover fills the pill faintly. */}
            {pathCity && (
              <Link href={`/${pathCity.id}/ask`}
                className="group hidden md:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-wide transition-colors"
                style={{
                  color: pathname.startsWith(`/${pathCity.id}/ask`) ? '#FFFFFF' : '#38C0F0',
                  background: pathname.startsWith(`/${pathCity.id}/ask`) ? '#38C0F0' : 'transparent',
                  border: '1.5px solid #38C0F0',
                }}>
                <span className="text-sm leading-none">✦</span>
                Ask AI
              </Link>
            )}
            {!pathCity && profileCity && (
              <Link
                href={`/${profileCity.id}`}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#10B981' }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#10B981' }} />
                </span>
                {profileCity.name}
              </Link>
            )}
            {!pathCity && !profileCity && (
              <Link
                href="/cities"
                className="flex px-4 py-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Explore cities
              </Link>
            )}

            {authLoading ? (
              <div className="w-16 h-7 animate-pulse bg-neutral-100" />
            ) : user ? (
              <Link
                href="/profile"
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors',
                  pathname === '/profile'
                    ? 'text-neutral-900 bg-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-900'
                )}
              >
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#3D3CAC' }} />
                <span className="hidden sm:inline">{profile.displayName ?? 'Profile'}</span>
              </Link>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: '#252450' }}
              >
                Sign in
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-neutral-500 hover:text-neutral-900 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
            >
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
                <path d="M0 1h18M0 6h18M0 11h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between px-6 h-14 border-b border-neutral-200">
            <span className="font-display font-black text-xl text-neutral-950">Roots</span>
            <button onClick={() => setMobileOpen(false)} className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col p-6 gap-0 flex-1">
            {cityNav.map(link => {
              const active = link.home ? pathname === link.href : isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium border-b border-neutral-100 transition-colors text-neutral-600 hover:text-neutral-900"
                  style={active ? { color: link.color, borderLeft: `3px solid ${link.color}`, paddingLeft: 13 } : {}}
                >
                  {link.home && (
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#10B981' }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#10B981' }} />
                    </span>
                  )}
                  {link.label}
                </Link>
              )
            })}
            <div className="mt-auto pt-6 border-t border-neutral-100 space-y-0">
              <Link href="/cities" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-neutral-500 hover:text-neutral-900 transition-colors border-b border-neutral-100">
                All cities
              </Link>
              {user ? (
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                  Profile
                </Link>
              ) : (
                <button onClick={() => { setMobileOpen(false); setAuthOpen(true) }} className="block w-full text-left px-4 py-3 text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                  Sign in
                </button>
              )}
            </div>
          </nav>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Mobile bottom tab bar — only shown when inside a city */}
      {pathCity && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
          style={{
            background: 'rgba(255,255,255,0.97)',
            borderTop: '1px solid rgba(10,10,10,0.1)',
            backdropFilter: 'blur(12px)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}>
          {/* Mobile bottom — 5 tabs. Listings (combined) frees a slot so
              Settle can return alongside Community + Eat. Ask AI lives in
              the right-cluster pill (top of screen) and overlay menu. */}
          {[
            { href: `/${pathCity.id}`,          label: 'Home',      color: '#10B981', icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            ), exact: true },
            { href: `/${pathCity.id}/listings`, label: 'Listings',  color: '#FAB400', icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 21h16"/><path d="M6 21V4a2 2 0 012-2h8a2 2 0 012 2v17"/><circle cx="15" cy="12" r="0.6" fill="currentColor"/>
              </svg>
            ), exact: false },
            { href: `/${pathCity.id}/connect`,  label: 'Community', color: '#FF3EBA', icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            ), exact: false },
            { href: `/${pathCity.id}/eat`,      label: 'Eat',       color: '#E8612A', icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
              </svg>
            ), exact: false },
            { href: `/${pathCity.id}/settle`,   label: 'Settle',    color: '#4744C8', icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            ), exact: false },
          ].map(tab => {
            const isListings = tab.href === `/${pathCity.id}/listings`
            const isActive = tab.exact
              ? pathname === tab.href
              : tab.href !== `/${pathCity.id}` && (
                  pathname.startsWith(tab.href) ||
                  // Listings tab in bottom bar lights up for legacy
                  // /housing and /events deep links too.
                  (isListings && (
                    pathname.startsWith(`/${pathCity.id}/housing`) ||
                    pathname.startsWith(`/${pathCity.id}/events`)
                  ))
                )
            return (
              <Link key={tab.href} href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-opacity"
                style={{ color: isActive ? tab.color : 'rgba(10,10,10,0.35)' }}>
                {tab.icon}
                <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 w-6 h-0.5" style={{ background: tab.color }} />
                )}
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
