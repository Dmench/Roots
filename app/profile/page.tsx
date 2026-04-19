'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { AuthModal } from '@/components/auth/AuthModal'
import { getCity, STAGES, SITUATIONS } from '@/lib/data/cities'
import { getTasksForCity } from '@/lib/data/tasks'
import { Nav } from '@/components/layout/Nav'
import { cn } from '@/lib/utils'
import type { Stage, SituationTag } from '@/lib/types'

const STAGE_ORDER: Stage[] = ['planning', 'just_arrived', 'settling', 'settled']

function daysInCity(arrivalDate?: string): number | null {
  if (!arrivalDate) return null
  const diff = Date.now() - new Date(arrivalDate).getTime()
  return Math.max(0, Math.floor(diff / 86400000))
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const { profile, hydrated, setStage, setArrivalDate, setDisplayName, toggleSituation } = useProfile()

  const [authOpen,    setAuthOpen]    = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput,   setNameInput]   = useState('')
  const [saved,       setSaved]       = useState(false)

  const city         = profile.cityId ? getCity(profile.cityId) : undefined
  const currentStage = profile.stage  ? STAGES.find(s => s.id === profile.stage) : undefined
  const allTasks     = city ? getTasksForCity(city.id) : []
  const doneCount    = (profile.completedTaskIds ?? []).filter(id => allTasks.some(t => t.id === id)).length
  const pct          = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0
  const days         = daysInCity(profile.arrivalDate ?? undefined)
  const stageIdx     = profile.stage ? STAGE_ORDER.indexOf(profile.stage as Stage) : -1
  const handleSignOut = async () => { await signOut(); router.push('/') }

  const saveName = () => {
    if (!nameInput.trim()) return
    setDisplayName(nameInput.trim())
    setEditingName(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (authLoading || !hydrated) {
    return (
      <div className="min-h-screen bg-cream">
        <Nav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#3D3CAC', borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream">
        <Nav />
        <div className="max-w-md mx-auto px-6 py-28 text-center">
          <div
            className="w-16 h-16 rounded-sm flex items-center justify-center mx-auto mb-8"
            style={{ background: '#CCCBF0' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#3D3CAC" strokeWidth="1.5" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#3D3CAC" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone mb-4">Profile</p>
          <h1 className="font-display font-bold text-espresso text-4xl mb-4 leading-tight">
            Sign in to save<br />your progress
          </h1>
          <p className="text-walnut/60 text-sm mb-10 leading-relaxed">
            Your stage, tasks, and community posts sync across devices. One click, no password.
          </p>
          <button
            onClick={() => setAuthOpen(true)}
            className="px-10 py-4 text-white rounded-sm font-semibold hover:opacity-90 transition-opacity text-sm"
            style={{ background: '#3D3CAC' }}
          >
            Sign in with email →
          </button>
          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Nav />

      <div className="max-w-2xl mx-auto px-6 md:px-10 py-14 md:py-20">

        {/* ── Identity ─────────────────────────────────────────────────── */}
        <div className="flex items-start gap-5 mb-10">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-sm flex items-center justify-center shrink-0 text-2xl font-display font-black"
            style={{ background: 'linear-gradient(135deg, #3D3CAC 0%, #FF3EBA 100%)', color: '#fff' }}
          >
            {(profile.displayName ?? user.email ?? '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                  placeholder="Your name"
                  className="flex-1 px-3 py-1.5 bg-white border border-sand rounded text-sm text-espresso focus:outline-none focus:border-terracotta/40"
                />
                <button onClick={saveName} className="text-xs font-medium text-terracotta hover:opacity-80 transition-opacity">Save</button>
                <button onClick={() => setEditingName(false)} className="text-xs text-stone hover:text-espresso transition-colors">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => { setNameInput(profile.displayName ?? ''); setEditingName(true) }}
                className="group flex items-center gap-2 mb-0.5"
              >
                <h1 className="font-display font-bold text-espresso text-2xl leading-tight">
                  {profile.displayName ?? 'Add your name'}
                </h1>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-0 group-hover:opacity-30 transition-opacity mt-0.5">
                  <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <p className="text-stone text-sm">{user.email}</p>
            {saved && <p className="text-xs text-sage mt-1">Saved ✓</p>}
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-stone hover:text-espresso transition-colors mt-1 shrink-0"
          >
            Sign out
          </button>
        </div>

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-px bg-sand/40 border border-sand/40 mb-10 rounded-sm overflow-hidden">
          {[
            { label: 'Tasks done', value: doneCount > 0 ? `${doneCount}/${allTasks.length}` : city ? `0/${allTasks.length}` : '—' },
            { label: 'Days in city', value: days !== null ? String(days) : '—' },
            { label: 'Stage', value: currentStage?.label ?? '—' },
          ].map(stat => (
            <div key={stat.label} className="bg-white px-5 py-4 text-center">
              <p className="text-xl font-display font-bold text-espresso leading-tight">{stat.value}</p>
              <p className="text-xs text-stone mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Stage journey ────────────────────────────────────────────── */}
        <div className="border border-sand/40 p-6 mb-8 bg-white rounded-sm">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-stone font-medium">Your journey</p>
            {currentStage && (
              <button onClick={() => setStage(undefined)} className="text-xs text-stone hover:text-espresso transition-colors">
                Change
              </button>
            )}
          </div>

          {profile.stage ? (
            <>
              {/* Progress track */}
              <div className="flex items-center gap-0 mb-5">
                {STAGE_ORDER.map((s, i) => {
                  const active   = stageIdx === i
                  const complete = stageIdx > i
                  return (
                    <div key={s} className="flex items-center flex-1">
                      <button
                        onClick={() => setStage(s)}
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0',
                          active   ? 'text-white scale-110' : '',
                          complete ? 'text-white' : !active ? 'text-stone bg-ivory border border-sand' : ''
                        )}
                        style={active ? { background: '#3D3CAC' } : complete ? { background: '#10B981' } : {}}
                        title={STAGES.find(st => st.id === s)?.label}
                      >
                        {complete ? (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </button>
                      {i < STAGE_ORDER.length - 1 && (
                        <div className="flex-1 h-px mx-1" style={{ background: complete ? '#10B981' : '#E2E8F0' }} />
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between">
                {STAGE_ORDER.map((s, i) => (
                  <div key={s} className="flex-1 text-center" style={{ width: 0, minWidth: 0 }}>
                    <p className={cn('text-[10px] leading-tight truncate px-1', stageIdx === i ? 'text-espresso font-medium' : 'text-stone')}>
                      {STAGES.find(st => st.id === s)?.label}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {STAGES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStage(s.id as Stage)}
                  className="text-left px-4 py-3 bg-ivory border border-sand rounded-sm hover:border-terracotta/40 transition-colors group"
                >
                  <p className="text-xs text-stone mb-0.5">{s.months}</p>
                  <p className="text-sm font-medium text-espresso group-hover:text-terracotta transition-colors">{s.label}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── City & progress ──────────────────────────────────────────── */}
        {city && allTasks.length > 0 && (
          <div className="border border-sand/40 p-6 mb-8 bg-white rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Link href={`/${city.id}`} className="font-display font-bold text-espresso text-xl hover:text-terracotta transition-colors">
                  {city.name}
                </Link>
                <span className="text-xs text-stone">{city.country}</span>
              </div>
              <Link href="/cities" className="text-xs text-stone hover:text-espresso transition-colors">Change</Link>
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-stone">{doneCount} of {allTasks.length} tasks complete</p>
              <p className="text-xs text-stone">{pct}%</p>
            </div>
            <div className="h-1.5 bg-ivory rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #3D3CAC, #FF3EBA)' }}
              />
            </div>
          </div>
        )}

        {!city && (
          <div className="border border-sand/40 p-6 mb-8 bg-white rounded-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-stone mb-3">City</p>
            <Link href="/cities" className="text-sm font-medium text-terracotta hover:opacity-80 transition-opacity">
              Choose a city to get started →
            </Link>
          </div>
        )}

        {/* ── Arrival date ─────────────────────────────────────────────── */}
        <div className="border border-sand/40 p-6 mb-8 bg-white rounded-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-stone font-medium mb-4">Arrival date</p>
          <input
            type="date"
            value={profile.arrivalDate ?? ''}
            onChange={e => setArrivalDate(e.target.value)}
            className="px-4 py-2.5 bg-ivory border border-sand rounded-sm text-sm text-espresso focus:outline-none focus:border-terracotta/40 transition-colors w-full max-w-[200px]"
          />
          {days !== null && (
            <p className="text-xs text-stone mt-2">{days === 0 ? 'Today!' : `${days} day${days !== 1 ? 's' : ''} in ${city?.name ?? 'your city'}`}</p>
          )}
        </div>

        {/* ── Situation tags ────────────────────────────────────────────── */}
        <div className="border border-sand/40 p-6 mb-8 bg-white rounded-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-stone font-medium mb-4">Your situation</p>
          <div className="flex flex-wrap gap-2">
            {SITUATIONS.map(s => {
              const active = (profile.situations ?? []).includes(s.id as SituationTag)
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSituation(s.id as SituationTag)}
                  className={cn(
                    'px-3 py-2 rounded-sm text-sm font-medium transition-all duration-150 border',
                    active
                      ? 'text-white border-transparent'
                      : 'bg-ivory border-sand text-walnut hover:border-espresso/30 hover:text-espresso'
                  )}
                  style={active ? { background: '#3D3CAC', borderColor: '#3D3CAC' } : {}}
                >
                  {s.icon} {s.label}
                </button>
              )
            })}
          </div>
          {(profile.situations ?? []).length > 0 && city && (
            <p className="text-xs text-stone mt-3">
              {(profile.situations ?? []).length} situation{(profile.situations ?? []).length !== 1 ? 's' : ''} selected — tasks are filtered to match
            </p>
          )}
        </div>

        {/* ── What's On preview ───────────────────────────────────────── */}
        {city && (
          <div
            className="border p-6 mb-8 rounded-sm"
            style={{ borderColor: 'rgba(99,102,241,0.25)', background: '#F5F3FF' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: '#3D3CAC' }}>
                What&apos;s On in {city.name}
              </p>
              <Link
                href={`/${city.id}/connect`}
                className="text-xs font-medium hover:opacity-80 transition-opacity"
                style={{ color: '#3D3CAC' }}
              >
                See all →
              </Link>
            </div>
            <p className="text-sm text-espresso/70 leading-relaxed mb-4">
              You know the ropes — now stay in the loop. Events, community alerts, and local tips, all in one place.
            </p>
            <Link
              href={`/${city.id}/connect`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#3D3CAC' }}
            >
              Open community →
            </Link>
          </div>
        )}

        {/* ── Quick links ──────────────────────────────────────────────── */}
        {city && (
          <div className="border border-sand/40 p-6 bg-white rounded-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-stone font-medium mb-4">Go to</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { href: `/${city.id}/connect`, label: 'Connect',  sub: "What's On" },
                { href: `/${city.id}/ask`,     label: 'Ask',      sub: 'Any question answered' },
                { href: `/${city.id}/settle`,  label: 'Settle',   sub: doneCount > 0 ? `${doneCount} done` : `${allTasks.length} tasks` },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-4 px-4 bg-ivory border border-sand rounded-sm hover:border-terracotta/30 transition-colors group text-left"
                >
                  <p className="text-sm font-medium text-espresso group-hover:text-terracotta transition-colors">{link.label}</p>
                  <p className="text-xs text-stone mt-0.5">{link.sub}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
