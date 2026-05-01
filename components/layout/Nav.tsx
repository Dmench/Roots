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

  const cityNav = pathCity ? [
    { href: `/${pathCity.id}`,         label: pathCity.name,  color: '#10B981', home: true },
    { href: `/${pathCity.id}/connect`, label: 'Community',    color: '#FF3EBA' },
    { href: `/${pathCity.id}/eat`,     label: 'Eat & Drink',  color: '#E8612A' },
    { href: `/${pathCity.id}/people`,  label: 'People',       color: '#4744C8' },
    { href: `/${pathCity.id}/ask`,     label: 'Ask AI',       color: '#38C0F0' },
    { href: `/${pathCity.id}/settle`,  label: 'Settle',       color: '#FAB400' },
  ] : []

  const isActive = (href: string) => pathname.startsWith(href)

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

          {/* City tabs — stretch to nav height so underline touches bottom */}
          {cityNav.length > 0 && (
            <nav className="hidden md:flex items-stretch gap-0">
              {cityNav.map((link) => {
                const active = link.home ? pathname === link.href : isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-1.5 px-3 text-sm font-medium transition-colors',
                      active
                        ? 'font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900'
                    )}
                    style={active ? {
                      color: link.color,
                      boxShadow: `inset 0 -2px 0 ${link.color}`,
                    } : {}}
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
            </nav>
          )}

          {/* Right */}
          <div className="flex items-center gap-1">
            {!pathCity && (
              <Link
                href={profileCity ? `/${profileCity.id}` : '/cities'}
                className="hidden sm:flex px-4 py-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                {profileCity ? profileCity.name : 'Cities'}
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
    </>
  )
}
