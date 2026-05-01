'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { AuthModal } from '@/components/auth/AuthModal'
import { getCity, STAGES, NEIGHBORHOODS } from '@/lib/data/cities'
import { getTasksForCity } from '@/lib/data/tasks'
import { Nav } from '@/components/layout/Nav'
import type { Stage } from '@/lib/types'
import { SPOT_CATEGORIES } from '@/lib/types'
import { SpotSearch } from '@/components/city/SpotSearch'

function daysInCity(arrivalDate?: string): number | null {
  if (!arrivalDate) return null
  return Math.max(0, Math.floor((Date.now() - new Date(arrivalDate).getTime()) / 86400000))
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ── Row primitives ──────────────────────────────────────────────────────── */

function RowDivider() {
  return <div style={{ height: 1, background: 'rgba(37,36,80,0.06)', marginLeft: 16 }} />
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pb-2 text-[9px] font-black tracking-[0.22em] uppercase"
      style={{ color: 'rgba(37,36,80,0.35)' }}>
      {children}
    </p>
  )
}

function FieldRow({
  label,
  value,
  placeholder,
  onClick,
  last = false,
  danger = false,
  right,
}: {
  label: string
  value?: string
  placeholder?: string
  onClick?: () => void
  last?: boolean
  danger?: boolean
  right?: React.ReactNode
}) {
  const content = (
    <div
      className={onClick ? 'cursor-pointer hover:bg-black/[0.02] transition-colors' : ''}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <span className="text-sm font-medium" style={{ color: danger ? '#C8152A' : '#0F0E1E' }}>
          {label}
        </span>
        {right ?? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm truncate max-w-[180px]"
              style={{ color: value ? 'rgba(37,36,80,0.45)' : 'rgba(37,36,80,0.25)' }}>
              {value ?? placeholder}
            </span>
            {onClick && !right && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                <path d="M4.5 2.5l3 3.5-3 3.5" stroke="rgba(37,36,80,0.25)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}
      </div>
      {!last && <RowDivider />}
    </div>
  )
  return content
}

function ToggleRow({
  label,
  sub,
  checked,
  onChange,
  last = false,
}: {
  label: string
  sub?: string
  checked: boolean
  onChange: (v: boolean) => void
  last?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: '#0F0E1E' }}>{label}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: 'rgba(37,36,80,0.4)' }}>{sub}</p>}
        </div>
        <button
          onClick={() => onChange(!checked)}
          className="relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200"
          style={{ background: checked ? '#3D3CAC' : 'rgba(37,36,80,0.15)' }}
          aria-label={label}
        >
          <span
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
            style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
          />
        </button>
      </div>
      {!last && <RowDivider />}
    </div>
  )
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6"
      style={{ borderTop: '1px solid rgba(37,36,80,0.1)', borderBottom: '1px solid rgba(37,36,80,0.1)', background: '#fff' }}>
      {children}
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const router  = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const {
    profile, hydrated,
    setStage, setArrivalDate, setDisplayName,
    setNeighborhood, setShowInDirectory,
    addSpot, removeSpot,
  } = useProfile()

  const [authOpen,    setAuthOpen]    = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput,   setNameInput]   = useState('')
  const [saved,       setSaved]       = useState(false)
  const [stageOpen,   setStageOpen]   = useState(false)
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false)
  const [addingSpot,  setAddingSpot]  = useState(false)
  const dateRef = useRef<HTMLInputElement>(null)

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  function saveName() {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setDisplayName(trimmed)
    setEditingName(false)
    flash()
  }

  const city         = profile.cityId ? getCity(profile.cityId) : undefined
  const currentStage = profile.stage  ? STAGES.find(s => s.id === profile.stage) : undefined
  const allTasks     = city ? getTasksForCity(city.id) : []
  const doneCount    = (profile.completedTaskIds ?? []).filter(id => allTasks.some(t => t.id === id)).length
  const pct          = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0
  const days         = daysInCity(profile.arrivalDate)

  const handleSignOut = async () => { await signOut(); router.push('/') }

  /* ── Loading ── */
  if (authLoading || !hydrated) {
    return (
      <div className="min-h-screen bg-white">
        <Nav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: '#3D3CAC', borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  /* ── Signed out ── */
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Nav />
        <div className="max-w-sm mx-auto px-6 py-28 text-center">
          <div className="w-14 h-14 flex items-center justify-center mx-auto mb-8"
            style={{ background: 'linear-gradient(135deg, #3D3CAC 0%, #FF3EBA 100%)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.5" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-espresso text-3xl mb-3 leading-tight">
            Your profile
          </h1>
          <p className="text-walnut/55 text-sm mb-10 leading-relaxed">
            Sign in to save your progress, sync across devices, and appear in the settler directory.
          </p>
          <button
            onClick={() => setAuthOpen(true)}
            className="px-8 py-3.5 text-white font-semibold hover:opacity-90 transition-opacity text-sm"
            style={{ background: '#3D3CAC' }}
          >
            Sign in or create account
          </button>
          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      </div>
    )
  }

  const displayInitial = (profile.displayName ?? user.email ?? '?')[0].toUpperCase()
  const neighborhoods  = city ? (NEIGHBORHOODS[city.id] ?? []) : []

  const STAGE_COLOR: Record<string, string> = {
    planning:     '#6865CC',
    just_arrived: '#B88A00',
    settling:     '#1A8FAD',
    settled:      '#0E9B6B',
  }

  /* ── Signed in ── */
  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      <Nav />

      {/* ── Identity ── open, no card, typography-first ───────────────────── */}
      <div style={{ borderBottom: '2px solid #0A0A0A' }}>
        <div className="max-w-xl mx-auto px-6 md:px-8 pt-8 pb-7">
          <div className="flex items-start gap-5">
            {/* Square avatar */}
            <div className="w-16 h-16 flex items-center justify-center font-display font-black text-2xl shrink-0"
              style={{ background: '#0A0A0A', color: '#FFFFFF' }}>
              {displayInitial}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              {/* Name — click to edit */}
              {editingName ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveName()
                      if (e.key === 'Escape') setEditingName(false)
                    }}
                    placeholder="Your name"
                    className="flex-1 min-w-0 px-3 py-2 focus:outline-none font-display font-bold text-lg"
                    style={{ border: '2px solid #0A0A0A', color: '#0A0A0A' }}
                  />
                  <button onClick={saveName}
                    className="shrink-0 text-xs font-bold px-4 py-2"
                    style={{ background: '#0A0A0A', color: '#FFFFFF' }}>
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setNameInput(profile.displayName ?? ''); setEditingName(true) }}
                  className="group flex items-center gap-2 text-left w-full min-w-0 mb-1.5">
                  <span className="font-display font-black leading-none"
                    style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: profile.displayName ? '#0A0A0A' : 'rgba(10,10,10,0.2)' }}>
                    {profile.displayName ?? 'Add your name'}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className="shrink-0 opacity-0 group-hover:opacity-30 transition-opacity mt-1">
                    <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="#0A0A0A" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                </button>
              )}

              {/* City · neighborhood · days · stage */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {city && (
                  <span className="text-sm font-medium" style={{ color: 'rgba(10,10,10,0.55)' }}>
                    {city.name}
                  </span>
                )}
                {profile.neighborhood && (
                  <span className="text-sm" style={{ color: 'rgba(10,10,10,0.3)' }}>
                    · {profile.neighborhood}
                  </span>
                )}
                {days !== null && (
                  <span className="text-sm" style={{ color: 'rgba(10,10,10,0.3)' }}>
                    · {days} day{days !== 1 ? 's' : ''}
                  </span>
                )}
                {currentStage ? (
                  <button onClick={() => setStageOpen(true)}
                    className="text-sm font-semibold ml-1 hover:opacity-60 transition-opacity"
                    style={{ color: STAGE_COLOR[currentStage.id] ?? '#4744C8' }}>
                    · {currentStage.label}
                  </button>
                ) : (
                  <button onClick={() => setStageOpen(true)}
                    className="text-xs underline underline-offset-2 ml-1 hover:opacity-60 transition-opacity"
                    style={{ color: 'rgba(10,10,10,0.35)' }}>
                    Set stage
                  </button>
                )}
              </div>

              {saved && (
                <p className="text-[9px] font-black tracking-[0.2em] uppercase mt-2" style={{ color: '#10B981' }}>
                  Saved ✓
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 md:px-8">

        {/* ── My Spots ── social hero, right after identity ─────────────────── */}
        <div className="py-8" style={{ borderBottom: '1px solid rgba(10,10,10,0.1)' }}>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display font-black text-2xl" style={{ color: '#0A0A0A', letterSpacing: '-0.02em' }}>
              My Spots
            </h2>
            <button
              onClick={() => setAddingSpot(true)}
              className="text-[10px] font-black tracking-[0.15em] uppercase hover:opacity-60 transition-opacity"
              style={{ color: '#4744C8' }}>
              + Add spot
            </button>
          </div>

          {(profile.spots ?? []).length === 0 && !addingSpot && (
            <button
              onClick={() => setAddingSpot(true)}
              className="w-full py-6 text-sm text-left leading-relaxed hover:bg-neutral-50 transition-colors px-1"
              style={{ color: 'rgba(10,10,10,0.3)', borderTop: '1px solid rgba(10,10,10,0.08)' }}>
              Add the cafes, bars, bookshops, and record shops you love —
              other settlers can discover them through your profile.
            </button>
          )}

          {(profile.spots ?? []).length > 0 && (
            <div>
              {(profile.spots ?? []).map((spot, idx) => {
                const cat = SPOT_CATEGORIES.find(c => c.id === spot.category)
                return (
                  <div key={spot.id}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: idx === 0 ? '1px solid rgba(10,10,10,0.08)' : '1px solid rgba(10,10,10,0.05)' }}>
                    {/* Photo thumbnail or colored dot */}
                    {spot.photoRef ? (
                      <div className="w-9 h-9 shrink-0 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/places/photo?ref=${encodeURIComponent(spot.photoRef)}`}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <span className="shrink-0 w-2 h-2 rounded-full ml-1" style={{ background: cat?.color ?? '#888' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#0A0A0A' }}>{spot.name}</p>
                      {spot.address && (
                        <p className="text-[10px] truncate" style={{ color: 'rgba(10,10,10,0.35)' }}>{spot.address}</p>
                      )}
                    </div>
                    {spot.rating && (
                      <span className="text-[10px] font-semibold shrink-0" style={{ color: '#FAB400' }}>
                        ★ {spot.rating.toFixed(1)}
                      </span>
                    )}
                    <span className="text-[9px] font-black tracking-wide uppercase shrink-0" style={{ color: cat?.color ?? '#888' }}>
                      {cat?.label}
                    </span>
                    <button
                      onClick={() => removeSpot(spot.id)}
                      className="shrink-0 w-5 h-5 flex items-center justify-center text-[11px] hover:opacity-60 transition-opacity"
                      style={{ color: 'rgba(10,10,10,0.2)' }}>
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {addingSpot && (
            <div className="pt-3" style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}>
              <SpotSearch
                cityId={profile.cityId ?? 'brussels'}
                onAdd={spotData => {
                  addSpot(spotData)
                  setAddingSpot(false)
                  flash()
                }}
                onCancel={() => setAddingSpot(false)}
              />
            </div>
          )}
        </div>

        {/* ── Settle progress ── compact ────────────────────────────────────── */}
        {city && allTasks.length > 0 && (
          <div className="py-6" style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: 'rgba(10,10,10,0.35)' }}>
                Settle checklist
              </p>
              <Link href={`/${city.id}/settle`}
                className="text-[10px] font-black tracking-widest uppercase hover:opacity-60 transition-opacity"
                style={{ color: '#4744C8' }}>
                View →
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-0.5 overflow-hidden" style={{ background: 'rgba(10,10,10,0.08)' }}>
                <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: '#4744C8' }} />
              </div>
              <span className="text-xs font-semibold shrink-0" style={{ color: 'rgba(10,10,10,0.4)' }}>
                {doneCount}/{allTasks.length} · {pct}%
              </span>
            </div>
          </div>
        )}

        {/* ── Settings ── de-emphasized ─────────────────────────────────────── */}
        <div className="py-8 space-y-0">

          <SectionLabel>Location</SectionLabel>
          <FieldGroup>
            <FieldRow label="City" value={city?.name} placeholder="Not set" onClick={() => router.push('/cities?from=profile')} />
            {city && <FieldRow label="Neighborhood" value={profile.neighborhood} placeholder="Select…" onClick={() => setNeighborhoodOpen(true)} />}
            <FieldRow label="Arrived" value={profile.arrivalDate ? fmtDate(profile.arrivalDate) : undefined} placeholder="Set date" last
              onClick={() => dateRef.current?.showPicker?.() ?? dateRef.current?.click()} />
          </FieldGroup>

          <div className="mb-6" />

          <SectionLabel>Community</SectionLabel>
          <FieldGroup>
            <ToggleRow
              label="Show me in settler directory"
              sub={city ? `Visible to other settlers in ${city.name}` : undefined}
              checked={profile.showInDirectory !== false}
              onChange={v => { setShowInDirectory(v); flash() }}
              last={!city}
            />
            {city && <FieldRow label="View settler directory" last onClick={() => router.push(`/${city.id}/people`)} />}
          </FieldGroup>

          <div className="mb-6" />

          <SectionLabel>Account</SectionLabel>
          <FieldGroup>
            <FieldRow label="Email" value={user.email ?? undefined} />
            <FieldRow label="Sign out" last danger onClick={handleSignOut} />
          </FieldGroup>

        </div>
      </div>

      {/* Hidden date input */}
      <input
        ref={dateRef}
        type="date"
        value={profile.arrivalDate ?? ''}
        onChange={e => { setArrivalDate(e.target.value); flash() }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />

      {/* ── Stage picker bottom sheet ──────────────────────────────────────── */}
      {stageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setStageOpen(false)}>
          <div
            className="w-full sm:max-w-sm shadow-2xl"
            style={{ background: '#fff' }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid rgba(37,36,80,0.08)' }}>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-0.5"
                style={{ color: 'rgba(37,36,80,0.4)' }}>
                Your stage
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(37,36,80,0.5)' }}>
                Filters your Settle checklist to what matters right now.
              </p>
            </div>
            {STAGES.map((s, i) => {
              const active = profile.stage === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => { setStage(s.id as Stage); flash(); setStageOpen(false) }}
                  className="w-full text-left px-5 py-4 hover:bg-stone-50 transition-colors"
                  style={{ borderBottom: i < STAGES.length - 1 ? '1px solid rgba(37,36,80,0.06)' : 'none' }}>
                  <p className="text-sm font-semibold" style={{ color: active ? '#3D3CAC' : '#0F0E1E' }}>
                    {s.label}
                    {active && <span className="ml-2 text-[10px] font-black tracking-wider">✓</span>}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(37,36,80,0.4)' }}>{s.months}</p>
                </button>
              )
            })}
            <button onClick={() => setStageOpen(false)}
              className="w-full py-4 text-sm"
              style={{ color: 'rgba(37,36,80,0.35)', borderTop: '1px solid rgba(37,36,80,0.08)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Neighborhood picker bottom sheet ──────────────────────────────── */}
      {neighborhoodOpen && city && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setNeighborhoodOpen(false)}>
          <div
            className="w-full sm:max-w-sm shadow-2xl"
            style={{ background: '#fff', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3 sticky top-0 bg-white" style={{ borderBottom: '1px solid rgba(37,36,80,0.08)' }}>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase"
                style={{ color: 'rgba(37,36,80,0.4)' }}>
                Neighborhood
              </p>
            </div>
            {[{ value: '', label: 'Not specified' }, ...neighborhoods.map(n => ({ value: n, label: n }))].map((opt, i, arr) => {
              const active = (profile.neighborhood ?? '') === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => { setNeighborhood(opt.value || undefined); flash(); setNeighborhoodOpen(false) }}
                  className="w-full text-left px-5 py-3.5 hover:bg-stone-50 transition-colors"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(37,36,80,0.06)' : 'none' }}>
                  <p className="text-sm font-medium" style={{ color: active ? '#3D3CAC' : '#0F0E1E' }}>
                    {opt.label}
                    {active && <span className="ml-2 text-[10px] font-black">✓</span>}
                  </p>
                </button>
              )
            })}
            <button onClick={() => setNeighborhoodOpen(false)}
              className="w-full py-4 text-sm"
              style={{ color: 'rgba(37,36,80,0.35)', borderTop: '1px solid rgba(37,36,80,0.08)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
