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
    <div className="rounded-xl overflow-hidden mb-6"
      style={{ background: '#fff', border: '1px solid rgba(37,36,80,0.08)' }}>
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
  } = useProfile()

  const [authOpen,    setAuthOpen]    = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput,   setNameInput]   = useState('')
  const [saved,       setSaved]       = useState(false)
  const [stageOpen,   setStageOpen]   = useState(false)
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false)
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
      <div className="min-h-screen bg-cream">
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
      <div className="min-h-screen bg-cream">
        <Nav />
        <div className="max-w-sm mx-auto px-6 py-28 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-8"
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
            className="px-8 py-3.5 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
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

  /* ── Signed in ── */
  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <Nav />

      <div className="max-w-md mx-auto px-4 py-8 md:py-12">

        {/* ── Hero card ─────────────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden mb-8"
          style={{ background: 'linear-gradient(145deg, #0F0E1E 0%, #1A1840 55%, #0F0E1E 100%)' }}>

          {/* Ambient blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute rounded-full"
              style={{ width: 280, height: 280, top: -60, right: -40, background: '#4744C8', opacity: 0.13, filter: 'blur(65px)' }} />
            <div className="absolute rounded-full"
              style={{ width: 140, height: 140, bottom: -30, left: -10, background: '#FF3EBA', opacity: 0.09, filter: 'blur(45px)' }} />
          </div>

          <div className="relative px-6 pt-6 pb-5">
            {/* Saved indicator */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-[9px] font-black tracking-[0.28em] uppercase"
                style={{ color: 'rgba(245,244,240,0.2)' }}>
                Roots member
              </p>
              {saved && (
                <span className="text-[9px] font-black tracking-[0.18em] uppercase px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.18)', color: '#10B981' }}>
                  Saved ✓
                </span>
              )}
            </div>

            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-display font-black shrink-0"
                style={{ background: 'linear-gradient(135deg, #4744C8 0%, #FF3EBA 100%)', color: '#fff' }}>
                {displayInitial}
              </div>

              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveName()
                        if (e.key === 'Escape') setEditingName(false)
                      }}
                      placeholder="Your name"
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-sm focus:outline-none"
                      style={{ background: 'rgba(245,244,240,0.1)', border: '1px solid rgba(245,244,240,0.2)', color: '#F5F4F0' }}
                    />
                    <button onClick={saveName}
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg"
                      style={{ background: '#4744C8', color: '#F5F4F0' }}>
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setNameInput(profile.displayName ?? ''); setEditingName(true) }}
                    className="group flex items-center gap-1.5 text-left w-full min-w-0">
                    <span className="font-display font-bold text-xl leading-tight truncate"
                      style={{ color: profile.displayName ? '#F5F4F0' : 'rgba(245,244,240,0.3)' }}>
                      {profile.displayName ?? 'Add your name'}
                    </span>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
                      className="shrink-0 opacity-0 group-hover:opacity-40 transition-opacity mt-0.5">
                      <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="#F5F4F0" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(245,244,240,0.3)' }}>
                  {user.email}
                </p>
              </div>
            </div>

            {/* Days counter */}
            {days !== null && city ? (
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-display font-black text-4xl leading-none" style={{ color: '#F5F4F0' }}>
                  {days}
                </span>
                <span className="text-sm" style={{ color: 'rgba(245,244,240,0.4)' }}>
                  {days === 1 ? 'day' : 'days'} in {city.name}
                </span>
              </div>
            ) : city ? (
              <p className="text-sm mb-4" style={{ color: 'rgba(245,244,240,0.4)' }}>
                {city.name}
              </p>
            ) : null}

            {/* Stage pill */}
            {currentStage ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(71,68,200,0.25)', color: '#A5A3F5' }}>
                  {currentStage.label}
                </span>
                <button onClick={() => setStageOpen(true)}
                  className="text-[11px] underline underline-offset-2"
                  style={{ color: 'rgba(245,244,240,0.3)' }}>
                  change
                </button>
              </div>
            ) : (
              <button onClick={() => setStageOpen(true)}
                className="text-xs px-3 py-1.5 rounded-full border border-dashed"
                style={{ borderColor: 'rgba(245,244,240,0.18)', color: 'rgba(245,244,240,0.35)' }}>
                Set your stage
              </button>
            )}
          </div>

          {/* Settle progress bar */}
          {city && allTasks.length > 0 && (
            <div className="relative px-6 pb-5 pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px]" style={{ color: 'rgba(245,244,240,0.25)' }}>
                  Settle checklist
                </p>
                <p className="text-[9px] font-semibold" style={{ color: 'rgba(245,244,240,0.35)' }}>
                  {doneCount}/{allTasks.length} · {pct}%
                </p>
              </div>
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(245,244,240,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #4744C8, #FF3EBA)' }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Location ──────────────────────────────────────────────────────── */}
        <SectionLabel>Location</SectionLabel>
        <FieldGroup>
          <FieldRow
            label="City"
            value={city?.name}
            placeholder="Not set"
            onClick={() => router.push('/cities?from=profile')}
          />
          {city && (
            <FieldRow
              label="Neighborhood"
              value={profile.neighborhood}
              placeholder="Select…"
              onClick={() => setNeighborhoodOpen(true)}
            />
          )}
          <FieldRow
            label="Arrived"
            value={profile.arrivalDate ? fmtDate(profile.arrivalDate) : undefined}
            placeholder="Set date"
            last
            onClick={() => dateRef.current?.showPicker?.() ?? dateRef.current?.click()}
          />
        </FieldGroup>

        {/* Hidden native date input */}
        <input
          ref={dateRef}
          type="date"
          value={profile.arrivalDate ?? ''}
          onChange={e => { setArrivalDate(e.target.value); flash() }}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />

        {/* ── Community ─────────────────────────────────────────────────────── */}
        <SectionLabel>Community</SectionLabel>
        <FieldGroup>
          {city && (
            <FieldRow
              label="Settler directory"
              last={false}
              right={null}
            />
          )}
          <ToggleRow
            label="Show me in settler directory"
            sub={city ? `Visible to other settlers in ${city.name}` : undefined}
            checked={profile.showInDirectory !== false}
            onChange={v => { setShowInDirectory(v); flash() }}
            last={!city}
          />
          {city && (
            <FieldRow
              label="View directory"
              last
              onClick={() => router.push(`/${city.id}/people`)}
            />
          )}
        </FieldGroup>

        {/* ── Account ───────────────────────────────────────────────────────── */}
        <SectionLabel>Account</SectionLabel>
        <FieldGroup>
          <FieldRow
            label="Email"
            value={user.email ?? undefined}
          />
          <FieldRow
            label="Sign out"
            last
            danger
            onClick={handleSignOut}
          />
        </FieldGroup>

      </div>

      {/* ── Stage picker bottom sheet ──────────────────────────────────────── */}
      {stageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setStageOpen(false)}>
          <div
            className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl"
            style={{ background: '#fff' }}
            onClick={e => e.stopPropagation()}>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-0.5"
              style={{ color: 'rgba(37,36,80,0.4)' }}>
              Your stage
            </p>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: 'rgba(37,36,80,0.5)' }}>
              Filters your Settle checklist to what matters right now.
            </p>
            <div className="space-y-1.5">
              {STAGES.map(s => {
                const active = profile.stage === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => { setStage(s.id as Stage); flash(); setStageOpen(false) }}
                    className="w-full text-left px-4 py-3 rounded-xl border transition-all"
                    style={active
                      ? { background: '#3D3CAC', borderColor: '#3D3CAC' }
                      : { background: '#F5F4F0', borderColor: 'transparent' }}>
                    <p className="text-sm font-semibold" style={{ color: active ? '#fff' : '#0F0E1E' }}>
                      {s.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: active ? 'rgba(255,255,255,0.55)' : 'rgba(37,36,80,0.4)' }}>
                      {s.months}
                    </p>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setStageOpen(false)}
              className="mt-4 w-full py-3 text-sm"
              style={{ color: 'rgba(37,36,80,0.4)' }}>
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
            className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl"
            style={{ background: '#fff', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-4"
              style={{ color: 'rgba(37,36,80,0.4)' }}>
              Neighborhood
            </p>
            <div className="space-y-1">
              {[{ value: '', label: 'Not specified' }, ...neighborhoods.map(n => ({ value: n, label: n }))].map(opt => {
                const active = (profile.neighborhood ?? '') === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setNeighborhood(opt.value || undefined); flash(); setNeighborhoodOpen(false) }}
                    className="w-full text-left px-4 py-2.5 rounded-xl transition-all"
                    style={active
                      ? { background: '#3D3CAC', color: '#fff' }
                      : { color: '#0F0E1E' }}>
                    <p className="text-sm">{opt.label}</p>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setNeighborhoodOpen(false)}
              className="mt-4 w-full py-3 text-sm"
              style={{ color: 'rgba(37,36,80,0.4)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
