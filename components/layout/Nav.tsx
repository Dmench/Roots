'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import { AuthModal } from '@/components/auth/AuthModal'
import { getCity } from '@/lib/data/cities'
import { cn } from '@/lib/utils'

export function Nav() {
  const pathname     = usePathname()
  const { profile }  = useProfile()
  const { user }     = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authOpen,   setAuthOpen]   = useState(false)

  const cityMatch   = pathname.match(/^\/([a-z-]+)/)
  const pathCityId  = cityMatch?.[1]
  const pathCity    = pathCityId && !['cities', 'profile', 'auth'].includes(pathCityId)
    ? getCity(pathCityId) : undefined
  const profileCity = profile.cityId ? getCity(profile.cityId) : undefined

  const cityNav = pathCity ? [
    { href: `/${pathCity.id}/connect`, label: 'Connect', color: '#FF3EBA' },
    { href: `/${pathCity.id}/ask`,     label: 'Ask',     color: '#38C0F0' },
    { href: `/${pathCity.id}/settle`,  label: 'Settle',  color: '#FAB400' },
  ] : []

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <>
      <header className="sticky top-0 z-50 bg-cream border-b border-sand/60" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-14 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="font-display font-black text-lg text-espresso tracking-tight shrink-0 hover:opacity-70 transition-opacity">
            Roots
          </Link>

          {/* City tabs */}
          {cityNav.length > 0 && (
            <nav className="hidden md:flex items-center gap-0.5">
              {cityNav.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-1.5 rounded text-sm font-medium transition-all',
                    isActive(link.href) ? 'text-espresso' : 'text-walnut/60 hover:text-espresso hover:bg-parchment/60'
                  )}
                  style={isActive(link.href) ? { background: link.color + '18', color: link.color } : {}}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right */}
          <div className="flex items-center gap-1">
            {!pathCity && (
              <Link
                href={profileCity ? `/${profileCity.id}` : '/cities'}
                className="hidden sm:flex px-4 py-1.5 text-sm font-medium text-walnut/60 hover:text-espresso transition-colors"
              >
                {profileCity ? profileCity.name : 'Cities'}
              </Link>
            )}

            {user ? (
              <Link
                href="/profile"
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all',
                  pathname === '/profile'
                    ? 'text-espresso bg-parchment/60'
                    : 'text-walnut/60 hover:text-espresso hover:bg-parchment/40'
                )}
              >
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#3D3CAC' }} />
                <span className="hidden sm:inline">{profile.displayName ?? 'Profile'}</span>
              </Link>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-4 py-1.5 text-sm font-semibold text-white rounded transition-opacity hover:opacity-90"
                style={{ background: '#3D3CAC' }}
              >
                Sign in
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-walnut/60 hover:text-espresso transition-colors"
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
        <div className="fixed inset-0 z-50 flex flex-col bg-cream">
          <div className="flex items-center justify-between px-6 h-14 border-b border-sand/60">
            <span className="font-display font-black text-lg text-espresso">Roots</span>
            <button onClick={() => setMobileOpen(false)} className="p-1.5 text-walnut/50 hover:text-espresso transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col p-6 gap-1 flex-1">
            {cityNav.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-base font-medium rounded transition-colors text-walnut/70 hover:text-espresso hover:bg-parchment/40"
                style={isActive(link.href) ? { background: link.color + '18', color: link.color } : {}}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-auto pt-6 border-t border-sand/40 space-y-1">
              <Link href="/cities" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-walnut/60 hover:text-espresso transition-colors">
                All cities
              </Link>
              {user ? (
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-walnut/60 hover:text-espresso transition-colors">
                  Profile
                </Link>
              ) : (
                <button onClick={() => { setMobileOpen(false); setAuthOpen(true) }} className="block w-full text-left px-4 py-3 text-sm text-walnut/60 hover:text-espresso transition-colors">
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
