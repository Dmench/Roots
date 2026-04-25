'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { AuthModal } from '@/components/auth/AuthModal'
import { getCity, STAGES, SITUATIONS, NEIGHBORHOODS, LANGUAGES } from '@/lib/data/cities'
import { getTasksForCity } from '@/lib/data/tasks'
import { Nav } from '@/components/layout/Nav'
import { cn } from '@/lib/utils'
import type { Stage, SituationTag } from '@/lib/types'

function daysInCity(arrivalDate?: string): number | null {
  if (!arrivalDate) return null
  const diff = Date.now() - new Date(arrivalDate).getTime()
  return Math.max(0, Math.floor(diff / 86400000))
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function memberSince(date?: string): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const {
    profile, hydrated,
    setStage, setArrivalDate, setDisplayName,
    setNeighborhood, setShowInDirectory,
    toggleLanguage, toggleSituation,
  } = useProfile()

  const [authOpen,    setAuthOpen]    = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput,   setNameInput]   = useState('')
  const [saved,       setSaved]       = useState(false)
  const [stageOpen,   setStageOpen]   = useState(false)
  const dateRef = useRef<HTMLInputElement>(null)

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2200) }
  function wrap<T extends unknown[]>(fn: (...args: T) => void) {
    return (...args: T) => { fn(...args); flash() }
  }
  const _setStage           = wrap(setStage)
  const _setArrivalDate     = wrap(setArrivalDate)
  const _setNeighborhood    = wrap(setNeighborhood)
  const _setShowInDirectory = wrap(setShowInDirectory)
  const _toggleLanguage     = wrap(toggleLanguage)
  const _toggleSituation    = wrap(toggleSituation)

  const city         = profile.cityId ? getCity(profile.cityId) : undefined
  const currentStage = profile.stage  ? STAGES.find(s => s.id === profile.stage) : undefined
  const allTasks     = city ? getTasksForCity(city.id) : []
  const doneCount    = (profile.completedTaskIds ?? []).filter(id => allTasks.some(t => t.id === id)).length
  const pct          = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0
  const days         = daysInCity(profile.arrivalDate ?? undefined)
  const handleSignOut = async () => { await signOut(); router.push('/') }

  const saveName = () => {
    if (!nameInput.trim()) return
    setDisplayName(nameInput.trim())
    setEditingName(false)
    flash()
  }

  if (authLoading || !hydrated) {
    return (
      <div className="min-h-screen bg-cream">
        <Nav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: '#3D3CAC', borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream">
        <Nav />
        <div className="max-w-md mx-auto px-6 py-28 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{ background: 'linear-gradient(135deg, #3D3CAC 0%, #FF3EBA 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.5" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone mb-4">Profile</p>
          <h1 className="font-display font-bold text-espresso text-4xl mb-4 leading-tight">
            Sign in to save<br />your progress
          </h1>
          <p className="text-walnut/60 text-sm mb-10 leading-relaxed">
            Your stage, tasks, and community posts sync across devices when you have an account.
          </p>
          <button
            onClick={() => setAuthOpen(true)}
            className="px-10 py-4 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
            style={{ background: '#3D3CAC' }}
          >
            Sign in or create account →
          </button>
          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      </div>
    )
  }

  const displayInitial = (profile.displayName ?? user.email ?? '?')[0].toUpperCase()
  const joinedDate = user.created_at ? memberSince(user.created_at) : ''

  return (
    <div className="min-h-screen bg-cream">
      <Nav />

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">

        {/* ── Hero card ──────────────────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl overflow-hidden mb-6 select-none"
          style={{ background: 'linear-gradient(145deg, #0F0E1E 0%, #1A1840 60%, #0F0E1E 100%)' }}
        >
          {/* Ambient blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute rounded-full"
              style={{ width: 320, height: 320, top: -80, right: -60, background: '#4744C8', opacity: 0.12, filter: 'blur(70px)' }} />
            <div className="absolute rounded-full"
              style={{ width: 160, height: 160, bottom: -40, left: -20, background: '#FF3EBA', opacity: 0.1, filter: 'blur(50px)' }} />
          </div>

          <div className="relative px-7 pt-7 pb-0">
            {/* Top row */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-[9px] font-black tracking-[0.3em] uppercase"
                style={{ color: 'rgba(245,244,240,0.25)' }}>
                Roots · Member{joinedDate ? ` since ${joinedDate}` : ''}
              </p>
              {saved && (
                <span className="text-[9px] font-black tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.18)', color: '#10B981' }}>
                  Saved ✓
                </span>
              )}
            </div>

            {/* Name row */}
            <div className="flex items-end justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                      placeholder="Your name"
                      className="flex-1 px-3 py-1.5 rounded-lg text-sm focus:outline-none"
                      style={{ background: 'rgba(245,244,240,0.1)', border: '1px solid rgba(245,244,240,0.2)', color: '#F5F4F0' }}
                    />
                    <button onClick={saveName}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                      style={{ background: '#4744C8', color: '#F5F4F0' }}>
                      Save
                    </button>
                    <button onClick={() => setEditingName(false)}
                      className="text-xs hover:opacity-60 transition-opacity"
                      style={{ color: 'rgba(245,244,240,0.35)' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setNameInput(profile.displayName ?? ''); setEditingName(true) }}
                    className="group flex items-center gap-2 text-left"
                  >
                    <h1 className="font-display font-bold leading-tight"
                      style={{ fontSize: '1.9rem', color: '#F5F4F0' }}>
                      {profile.displayName ?? 'Add your name'}
                    </h1>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                      className="mb-1 opacity-0 group-hover:opacity-30 transition-opacity shrink-0">
                      <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="#F5F4F0" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                <p className="text-xs mt-0.5" style={{ color: 'rgba(245,244,240,0.3)' }}>{user.email}</p>
              </div>

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-display font-black shrink-0"
                style={{ background: 'linear-gradient(135deg, #4744C8 0%, #FF3EBA 100%)', color: '#fff' }}
              >
                {displayInitial}
              </div>
            </div>

            {/* Days + city as hero stat */}
            {(days !== null || city) && (
              <div className="flex items-baseline gap-3 mb-5">
                {days !== null && (
                  <>
                    <span className="font-display font-black text-5xl leading-none"
                      style={{ color: '#F5F4F0' }}>
                      {days}
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'rgba(245,244,240,0.5)' }}>
                      {days === 1 ? 'day' : 'days'} in {city?.name ?? 'your city'}
                    </span>
                  </>
                )}
                {days === null && city && (
                  <span className="text-sm font-medium" style={{ color: 'rgba(245,244,240,0.5)' }}>
                    {city.name}
                  </span>
                )}
              </div>
            )}

            {/* Stage as inline control — not an abstract tracker */}
            <div className="mb-6">
              {currentStage ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                    style={{ background: 'rgba(71,68,200,0.3)', color: '#A5A3F5' }}>
                    {currentStage.label}
                  </span>
                  <span className="text-[11px]" style={{ color: 'rgba(245,244,240,0.3)' }}>
                    · filters your Settle checklist
                  </span>
                  <button
                    onClick={() => setStageOpen(true)}
                    className="text-[11px] underline underline-offset-2 hover:opacity-70 transition-opacity"
                    style={{ color: 'rgba(245,244,240,0.35)' }}>
                    change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setStageOpen(true)}
                  className="text-xs px-3 py-1.5 rounded-full border border-dashed hover:opacity-70 transition-opacity"
                  style={{ borderColor: 'rgba(245,244,240,0.2)', color: 'rgba(245,244,240,0.4)' }}>
                  + Set your stage
                </button>
              )}
            </div>
          </div>

          {/* Settlement progress bar */}
          {city && allTasks.length > 0 && (
            <div className="relative px-7 pb-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px]" style={{ color: 'rgba(245,244,240,0.3)' }}>
                  Settlement checklist
                </p>
                <p className="text-[10px] font-semibold" style={{ color: 'rgba(245,244,240,0.45)' }}>
                  {doneCount} / {allTasks.length} done · {pct}%
                </p>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(245,244,240,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #4744C8, #FF3EBA)' }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Stage picker modal ────────────────────────────────────────────── */}
        {stageOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setStageOpen(false)}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone mb-1">Your stage</p>
              <p className="text-xs text-walnut/50 mb-4 leading-relaxed">
                This filters your Settle checklist to tasks relevant to where you are right now.
              </p>
              <div className="space-y-2">
                {STAGES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { _setStage(s.id as Stage); setStageOpen(false) }}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl border transition-all',
                      profile.stage === s.id
                        ? 'border-transparent text-white'
                        : 'bg-ivory border-sand hover:border-walnut/30 text-espresso'
                    )}
                    style={profile.stage === s.id ? { background: '#3D3CAC', borderColor: '#3D3CAC' } : {}}
                  >
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className={cn('text-xs mt-0.5', profile.stage === s.id ? 'text-white/60' : 'text-stone')}>
                      {s.months}
                    </p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStageOpen(false)}
                className="mt-4 w-full py-3 text-sm text-stone hover:text-espresso transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Your city ─────────────────────────────────────────────────────── */}
        <Section label="Your city">
          {/* City + neighborhood as a sentence */}
          <div className="mb-5">
            {city ? (
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                <span className="text-sm text-walnut/50">You&apos;re in</span>
                {profile.neighborhood ? (
                  <>
                    <span className="text-sm font-semibold text-espresso">{profile.neighborhood}</span>
                    <span className="text-sm text-walnut/50">,</span>
                  </>
                ) : null}
                <Link href={`/${city.id}`}
                  className="text-sm font-semibold text-espresso hover:text-walnut transition-colors">
                  {city.name}
                </Link>
                <Link href="/cities?from=profile"
                  className="text-[11px] text-stone hover:text-espresso transition-colors ml-1">
                  change →
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-walnut/50">No city selected yet</p>
                <Link href="/cities?from=profile"
                  className="text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full hover:opacity-80 transition-opacity"
                  style={{ background: '#252450', color: '#fff' }}>
                  Choose →
                </Link>
              </div>
            )}
          </div>

          {/* Neighborhood select with visible chevron */}
          {city && (
            <div className="mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone mb-2">Neighborhood</p>
              <div className="relative w-full max-w-xs">
                <select
                  value={profile.neighborhood ?? ''}
                  onChange={e => _setNeighborhood(e.target.value || undefined)}
                  className="w-full px-4 py-2.5 bg-ivory border border-sand rounded-xl text-sm text-espresso focus:outline-none focus:border-walnut/30 transition-colors appearance-none pr-9"
                >
                  <option value="">Select neighborhood…</option>
                  {(NEIGHBORHOODS[city.id] ?? []).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone"
                  width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          )}

          {/* Arrival date — styled button, hidden native picker */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone mb-2">Arrival date</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => dateRef.current?.showPicker?.() ?? dateRef.current?.click()}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-ivory border border-sand rounded-xl text-sm hover:border-walnut/30 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-stone shrink-0">
                  <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M4.5 1v3M9.5 1v3M1 6h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span className={profile.arrivalDate ? 'text-espresso' : 'text-stone'}>
                  {profile.arrivalDate ? fmtDate(profile.arrivalDate) : 'Set arrival date'}
                </span>
              </button>
              <input
                ref={dateRef}
                type="date"
                value={profile.arrivalDate ?? ''}
                onChange={e => _setArrivalDate(e.target.value)}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
              />
              {days !== null && (
                <span className="text-xs text-stone">
                  {days === 0 ? 'Today' : `${days} day${days !== 1 ? 's' : ''} ago`}
                </span>
              )}
            </div>
          </div>
        </Section>

        {/* ── Your community ────────────────────────────────────────────────── */}
        <Section label="Your community" sub="Personalizes your Settle checklist and connects you with similar people">

          {/* Languages */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone mb-2.5">Languages you speak</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => {
                const active = (profile.languages ?? []).includes(lang.code)
                return (
                  <button
                    key={lang.code}
                    onClick={() => _toggleLanguage(lang.code)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                      active ? 'text-white border-transparent' : 'bg-ivory border-sand text-walnut hover:border-walnut/30'
                    )}
                    style={active ? { background: '#3D3CAC', borderColor: '#3D3CAC' } : {}}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Situation tags */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone mb-2.5">Your situation</p>
            <div className="flex flex-wrap gap-2">
              {SITUATIONS.map(s => {
                const active = (profile.situations ?? []).includes(s.id as SituationTag)
                return (
                  <button
                    key={s.id}
                    onClick={() => _toggleSituation(s.id as SituationTag)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                      active ? 'text-white border-transparent' : 'bg-ivory border-sand text-walnut hover:border-walnut/30'
                    )}
                    style={active ? { background: '#3D3CAC', borderColor: '#3D3CAC' } : {}}
                  >
                    {s.icon} {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Directory visibility */}
          <div className="flex items-center justify-between gap-6 pt-1 border-t border-sand/40">
            <div>
              <p className="text-sm font-medium text-espresso">Visible in settler directory</p>
              <p className="text-xs text-walnut/50 mt-0.5">
                Show your name and neighborhood to other settlers
                {city && (
                  <Link href={`/${city.id}/people`}
                    className="ml-1.5 text-walnut/50 underline underline-offset-2 hover:text-espresso transition-colors">
                    View directory →
                  </Link>
                )}
              </p>
            </div>
            <button
              onClick={() => _setShowInDirectory(profile.showInDirectory !== false ? false : true)}
              className="relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200"
              style={{ background: profile.showInDirectory !== false ? '#3D3CAC' : 'rgba(37,36,80,0.12)' }}
              aria-label="Toggle directory visibility"
            >
              <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                style={{ transform: profile.showInDirectory !== false ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
        </Section>

        {/* ── Quick links ──────────────────────────────────────────────────── */}
        {city && (
          <div className="mt-2 mb-8">
            <div className="grid grid-cols-3 gap-3">
              {[
                { href: `/${city.id}/connect`, label: 'Connect',  sub: "What's On" },
                { href: `/${city.id}/ask`,     label: 'Ask',      sub: 'Any question' },
                { href: `/${city.id}/settle`,  label: 'Settle',   sub: doneCount > 0 ? `${doneCount} done` : `${allTasks.length} tasks` },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-4 px-4 bg-white border border-sand/60 rounded-xl hover:border-walnut/20 transition-colors group text-left shadow-sm"
                >
                  <p className="text-sm font-semibold text-espresso group-hover:text-walnut transition-colors">{link.label}</p>
                  <p className="text-xs text-stone mt-0.5">{link.sub}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Sign out ──────────────────────────────────────────────────────── */}
        <div className="pb-12 flex justify-center">
          <button onClick={handleSignOut}
            className="text-xs text-stone hover:text-espresso transition-colors">
            Sign out
          </button>
        </div>

      </div>
    </div>
  )
}

/* ── Section wrapper ──────────────────────────────────────────────────────── */

function Section({
  label, sub, children,
}: {
  label: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-sand/50 rounded-2xl p-6 mb-4 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone">{label}</p>
        {sub && <p className="text-xs text-walnut/50 mt-0.5 leading-snug">{sub}</p>}
      </div>
      {children}
    </div>
  )
}
