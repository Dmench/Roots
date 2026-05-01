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
import type { Stage, SituationTag } from '@/lib/types'
import { SPOT_CATEGORIES } from '@/lib/types'
import { SpotSearch } from '@/components/city/SpotSearch'

// "2024-09" or "2024-09-14" → "Sep '24"
function fmtMonth(val: string): string {
  const parts  = val.split('-')
  const year   = parts[0] ?? ''
  const month  = parseInt(parts[1] ?? '1') - 1
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${MONTHS[month] ?? '?'} '${year.slice(2)}`
}

const SITUATION_OPTIONS: { id: SituationTag; label: string }[] = [
  { id: 'student',       label: 'Student' },
  { id: 'employed',      label: 'Employee' },
  { id: 'self_employed', label: 'Freelancer' },
  { id: 'digital_nomad', label: 'Digital nomad' },
  { id: 'renting',       label: 'Renting' },
  { id: 'family',        label: 'With family' },
]

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
  label, value, placeholder, onClick, last = false, danger = false, right,
}: {
  label: string; value?: string; placeholder?: string; onClick?: () => void
  last?: boolean; danger?: boolean; right?: React.ReactNode
}) {
  return (
    <div className={onClick ? 'cursor-pointer hover:bg-black/[0.02] transition-colors' : ''}
      onClick={onClick}>
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
}

function ToggleRow({
  label, sub, checked, onChange, last = false,
}: {
  label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void; last?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: '#0F0E1E' }}>{label}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: 'rgba(37,36,80,0.4)' }}>{sub}</p>}
        </div>
        <button onClick={() => onChange(!checked)}
          className="relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200"
          style={{ background: checked ? '#3D3CAC' : 'rgba(37,36,80,0.15)' }}
          aria-label={label}>
          <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
            style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }} />
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
    setNeighborhood, setShowInDirectory, setDigestSubscribed, updateProfile,
    addSpot, removeSpot,
  } = useProfile()

  const [authOpen,          setAuthOpen]          = useState(false)
  const [editingName,       setEditingName]       = useState(false)
  const [nameInput,         setNameInput]         = useState('')
  const [saved,             setSaved]             = useState(false)
  const [stageOpen,         setStageOpen]         = useState(false)
  const [neighborhoodOpen,  setNeighborhoodOpen]  = useState(false)
  const [situationOpen,     setSituationOpen]     = useState(false)
  const [addingSpot,        setAddingSpot]        = useState(false)
  const monthRef = useRef<HTMLInputElement>(null)

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  function saveName() {
    const t = nameInput.trim()
    if (!t) return
    setDisplayName(t); setEditingName(false); flash()
  }

  const city         = profile.cityId ? getCity(profile.cityId) : undefined
  const currentStage = profile.stage  ? STAGES.find(s => s.id === profile.stage) : undefined
  const allTasks     = city ? getTasksForCity(city.id) : []
  const doneCount    = (profile.completedTaskIds ?? []).filter(id => allTasks.some(t => t.id === id)).length
  const pct          = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0

  const handleSignOut = async () => { await signOut(); router.push('/') }

  const STAGE_COLOR: Record<string, string> = {
    planning: '#6865CC', just_arrived: '#B88A00', settling: '#1A8FAD', settled: '#0E9B6B',
  }

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
          <h1 className="font-display font-bold text-3xl mb-3 leading-tight" style={{ color: '#0A0A0A' }}>
            Your profile
          </h1>
          <p className="text-sm mb-10 leading-relaxed" style={{ color: 'rgba(10,10,10,0.45)' }}>
            Sign in to save your progress, sync across devices, and appear in the settler directory.
          </p>
          <button onClick={() => setAuthOpen(true)}
            className="px-8 py-3.5 text-white font-semibold hover:opacity-90 transition-opacity text-sm"
            style={{ background: '#3D3CAC' }}>
            Sign in or create account
          </button>
          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      </div>
    )
  }

  const displayInitial = (profile.displayName ?? user.email ?? '?')[0].toUpperCase()
  const neighborhoods  = city ? (NEIGHBORHOODS[city.id] ?? []) : []
  const primarySit     = (profile.situations ?? []).find(s => SITUATION_OPTIONS.some(o => o.id === s))
  const primarySitLabel = primarySit ? SITUATION_OPTIONS.find(o => o.id === primarySit)?.label : undefined
  const spots          = profile.spots ?? []

  /* ── Signed in ── */
  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      <Nav />

      <div className="max-w-xl mx-auto px-4 md:px-8 pt-6 pb-20">

        {/* ════════════════════════════════════════════════════════════════
            THE CARD — shareable identity block
        ════════════════════════════════════════════════════════════════ */}
        <div style={{ border: '2px solid #0A0A0A' }}>

          {/* ── Header bar ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ background: '#0A0A0A' }}>
            <span className="text-[8px] font-black tracking-[0.3em] uppercase"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              Settler Card
            </span>
            {city ? (
              <span className="text-[8px] font-black tracking-[0.3em] uppercase"
                style={{ color: '#FAB400' }}>
                {city.name.toUpperCase()}
              </span>
            ) : (
              <Link href="/cities?from=profile"
                className="text-[8px] font-black tracking-[0.2em] uppercase hover:opacity-70 transition-opacity"
                style={{ color: 'rgba(255,255,255,0.5)' }}>
                Choose city →
              </Link>
            )}
          </div>

          {/* ── Identity ─────────────────────────────────────────────────── */}
          <div className="px-5 py-6">
            <div className="flex items-start gap-4">
              {/* Square avatar */}
              <div className="shrink-0 w-16 h-16 flex items-center justify-center font-display font-black text-2xl"
                style={{ background: '#0A0A0A', color: '#fff' }}>
                {displayInitial}
              </div>

              <div className="flex-1 min-w-0">
                {/* Name — click to edit */}
                {editingName ? (
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                      placeholder="Your name"
                      className="flex-1 min-w-0 px-3 py-2 focus:outline-none font-display font-bold text-lg"
                      style={{ border: '2px solid #0A0A0A', color: '#0A0A0A' }}
                    />
                    <button onClick={saveName}
                      className="shrink-0 px-4 py-2 text-xs font-bold text-white"
                      style={{ background: '#0A0A0A' }}>
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setNameInput(profile.displayName ?? ''); setEditingName(true) }}
                    className="group flex items-center gap-2 text-left w-full mb-3">
                    <span className="font-display font-black leading-none"
                      style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: profile.displayName ? '#0A0A0A' : 'rgba(10,10,10,0.2)' }}>
                      {profile.displayName ?? 'Add your name'}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
                      className="shrink-0 opacity-0 group-hover:opacity-25 transition-opacity">
                      <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="#0A0A0A" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}

                {/* Identity chips */}
                <div className="flex flex-wrap gap-1.5">

                  {/* Neighborhood chip */}
                  {profile.neighborhood ? (
                    <button onClick={() => setNeighborhoodOpen(true)}
                      className="text-[9px] font-black tracking-[0.1em] uppercase px-2.5 py-1 hover:opacity-70 transition-opacity"
                      style={{ background: 'rgba(10,10,10,0.07)', color: '#0A0A0A' }}>
                      {profile.neighborhood}
                    </button>
                  ) : (
                    <button onClick={() => setNeighborhoodOpen(true)}
                      className="text-[9px] font-black tracking-[0.1em] uppercase px-2.5 py-1 hover:opacity-70 transition-opacity"
                      style={{ color: 'rgba(10,10,10,0.22)', border: '1px dashed rgba(10,10,10,0.18)' }}>
                      + Neighborhood
                    </button>
                  )}

                  {/* Arrival chip */}
                  {profile.arrivalDate ? (
                    <button onClick={() => monthRef.current?.showPicker?.() ?? monthRef.current?.click()}
                      className="text-[9px] font-black tracking-[0.1em] uppercase px-2.5 py-1 hover:opacity-70 transition-opacity"
                      style={{ background: 'rgba(10,10,10,0.07)', color: '#0A0A0A' }}>
                      Since {fmtMonth(profile.arrivalDate)}
                    </button>
                  ) : (
                    <button onClick={() => monthRef.current?.showPicker?.() ?? monthRef.current?.click()}
                      className="text-[9px] font-black tracking-[0.1em] uppercase px-2.5 py-1 hover:opacity-70 transition-opacity"
                      style={{ color: 'rgba(10,10,10,0.22)', border: '1px dashed rgba(10,10,10,0.18)' }}>
                      + Arrival
                    </button>
                  )}

                  {/* Stage chip */}
                  {currentStage ? (
                    <button onClick={() => setStageOpen(true)}
                      className="text-[9px] font-black tracking-[0.1em] uppercase px-2.5 py-1 hover:opacity-70 transition-opacity"
                      style={{ background: (STAGE_COLOR[currentStage.id] ?? '#4744C8') + '18', color: STAGE_COLOR[currentStage.id] ?? '#4744C8' }}>
                      {currentStage.label}
                    </button>
                  ) : (
                    <button onClick={() => setStageOpen(true)}
                      className="text-[9px] font-black tracking-[0.1em] uppercase px-2.5 py-1 hover:opacity-70 transition-opacity"
                      style={{ color: 'rgba(10,10,10,0.22)', border: '1px dashed rgba(10,10,10,0.18)' }}>
                      + Stage
                    </button>
                  )}

                  {/* Situation / profession chip */}
                  {primarySitLabel ? (
                    <button onClick={() => setSituationOpen(true)}
                      className="text-[9px] font-black tracking-[0.1em] uppercase px-2.5 py-1 hover:opacity-70 transition-opacity"
                      style={{ background: 'rgba(10,10,10,0.07)', color: '#0A0A0A' }}>
                      {primarySitLabel}
                    </button>
                  ) : (
                    <button onClick={() => setSituationOpen(true)}
                      className="text-[9px] font-black tracking-[0.1em] uppercase px-2.5 py-1 hover:opacity-70 transition-opacity"
                      style={{ color: 'rgba(10,10,10,0.22)', border: '1px dashed rgba(10,10,10,0.18)' }}>
                      + Profession
                    </button>
                  )}

                </div>
              </div>
            </div>
          </div>

          {/* ── My Spots ─────────────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid rgba(10,10,10,0.09)' }}>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[9px] font-black tracking-[0.22em] uppercase"
                style={{ color: 'rgba(10,10,10,0.3)' }}>
                My Spots
              </span>
              {!addingSpot && (
                <button onClick={() => setAddingSpot(true)}
                  className="text-[9px] font-black tracking-[0.15em] uppercase hover:opacity-60 transition-opacity"
                  style={{ color: '#4744C8' }}>
                  + Add
                </button>
              )}
            </div>

            {/* Empty state — placeholder swatches */}
            {spots.length === 0 && !addingSpot && (
              <button onClick={() => setAddingSpot(true)}
                className="w-full px-5 pb-5 hover:bg-neutral-50 transition-colors text-left">
                <div className="flex gap-2">
                  {(['cafe', 'bar', 'bookstore'] as const).map(catId => {
                    const c = SPOT_CATEGORIES.find(x => x.id === catId)!
                    return (
                      <div key={catId} className="w-[72px] h-[72px] flex flex-col items-center justify-center"
                        style={{ background: c.color + '10', border: `1px dashed ${c.color}35` }}>
                        <span className="text-[7px] font-black uppercase tracking-wide text-center leading-tight"
                          style={{ color: c.color }}>
                          {c.label}
                        </span>
                      </div>
                    )
                  })}
                  <div className="w-[72px] h-[72px] flex items-center justify-center"
                    style={{ border: '1px dashed rgba(10,10,10,0.12)' }}>
                    <span className="text-xl" style={{ color: 'rgba(10,10,10,0.15)' }}>+</span>
                  </div>
                </div>
                <p className="mt-2.5 text-[10px] leading-relaxed" style={{ color: 'rgba(10,10,10,0.3)' }}>
                  Add the cafes, bars, bookshops you love.
                </p>
              </button>
            )}

            {/* Spots photo strip */}
            {spots.length > 0 && !addingSpot && (
              <div className="px-5 pb-5">
                <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {spots.map(spot => {
                    const cat = SPOT_CATEGORIES.find(c => c.id === spot.category)
                    return (
                      <div key={spot.id} className="shrink-0 group">
                        <div className="relative w-[72px] h-[72px] overflow-hidden"
                          style={{ background: (cat?.color ?? '#888') + '12' }}>
                          {spot.photoRef ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/api/places/photo?ref=${encodeURIComponent(spot.photoRef)}`}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="absolute inset-0 flex items-end p-1.5">
                              <span className="text-[7px] font-black uppercase tracking-wide leading-none"
                                style={{ color: cat?.color ?? '#888' }}>
                                {spot.name.split(' ')[0]}
                              </span>
                            </span>
                          )}
                          <button
                            onClick={() => removeSpot(spot.id)}
                            className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}>
                            ✕
                          </button>
                        </div>
                        <p className="text-[8px] font-semibold mt-1.5 leading-none"
                          style={{ color: 'rgba(10,10,10,0.55)', width: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {spot.name}
                        </p>
                        {cat && (
                          <p className="text-[7px] font-black tracking-wide uppercase mt-0.5"
                            style={{ color: cat.color }}>
                            {cat.label}
                          </p>
                        )}
                      </div>
                    )
                  })}
                  {/* Add more button */}
                  <button onClick={() => setAddingSpot(true)}
                    className="shrink-0 w-[72px] h-[72px] flex items-center justify-center hover:bg-neutral-50 transition-colors"
                    style={{ border: '1px dashed rgba(10,10,10,0.15)' }}>
                    <span className="text-xl" style={{ color: 'rgba(10,10,10,0.18)' }}>+</span>
                  </button>
                </div>
              </div>
            )}

            {/* SpotSearch form */}
            {addingSpot && (
              <div className="px-5 pb-5">
                <SpotSearch
                  cityId={profile.cityId ?? 'brussels'}
                  onAdd={spotData => { addSpot(spotData); setAddingSpot(false); flash() }}
                  onCancel={() => setAddingSpot(false)}
                />
              </div>
            )}
          </div>

        </div>
        {/* ─ end card ─ */}

        {saved && (
          <p className="text-[9px] font-black tracking-[0.2em] uppercase mt-3 text-center"
            style={{ color: '#10B981' }}>
            Saved ✓
          </p>
        )}

        {/* ── Settle progress ──────────────────────────────────────────────── */}
        {city && allTasks.length > 0 && (
          <div className="mt-8 py-4"
            style={{ borderTop: '1px solid rgba(10,10,10,0.07)', borderBottom: '1px solid rgba(10,10,10,0.07)' }}>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[9px] font-black tracking-[0.2em] uppercase"
                style={{ color: 'rgba(10,10,10,0.3)' }}>
                Settle checklist
              </p>
              <Link href={`/${city.id}/settle`}
                className="text-[9px] font-black tracking-widest uppercase hover:opacity-60 transition-opacity"
                style={{ color: '#4744C8' }}>
                View →
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-0.5" style={{ background: 'rgba(10,10,10,0.07)' }}>
                <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: '#4744C8' }} />
              </div>
              <span className="text-xs font-semibold shrink-0" style={{ color: 'rgba(10,10,10,0.35)' }}>
                {doneCount}/{allTasks.length}
              </span>
            </div>
          </div>
        )}

        {/* ── Settings ─────────────────────────────────────────────────────── */}
        <div className="mt-8 space-y-0">

          <SectionLabel>Location</SectionLabel>
          <FieldGroup>
            <FieldRow label="City" value={city?.name} placeholder="Not set"
              onClick={() => router.push('/cities?from=profile')} />
            {city && (
              <FieldRow label="Neighborhood" value={profile.neighborhood} placeholder="Select…"
                onClick={() => setNeighborhoodOpen(true)} />
            )}
            <FieldRow label="Arrived" last
              value={profile.arrivalDate ? fmtMonth(profile.arrivalDate) : undefined}
              placeholder="Set month"
              onClick={() => monthRef.current?.showPicker?.() ?? monthRef.current?.click()} />
          </FieldGroup>

          <div className="mb-6" />

          <SectionLabel>Community</SectionLabel>
          <FieldGroup>
            <ToggleRow
              label="Show me in settler directory"
              sub={city ? `Visible to other settlers in ${city.name}` : undefined}
              checked={profile.showInDirectory !== false}
              onChange={v => { setShowInDirectory(v); flash() }}
            />
            <ToggleRow
              label="Weekly digest email"
              sub="What's on, settler tips, and city news"
              checked={profile.digestSubscribed !== false}
              onChange={v => { setDigestSubscribed(v); flash() }}
              last={!city}
            />
            {city && (
              <FieldRow label="View settler directory" last
                onClick={() => router.push(`/${city.id}/people`)} />
            )}
          </FieldGroup>

          <div className="mb-6" />

          <SectionLabel>Account</SectionLabel>
          <FieldGroup>
            <FieldRow label="Email" value={user.email ?? undefined} />
            <FieldRow label="Sign out" last danger onClick={handleSignOut} />
          </FieldGroup>

        </div>
      </div>

      {/* ── Hidden month input ───────────────────────────────────────────────── */}
      <input
        ref={monthRef}
        type="month"
        value={profile.arrivalDate ? profile.arrivalDate.slice(0, 7) : ''}
        onChange={e => { if (e.target.value) { setArrivalDate(e.target.value); flash() } }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />

      {/* ══ Stage picker ═══════════════════════════════════════════════════════ */}
      {stageOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setStageOpen(false)}>
          <div className="w-full sm:max-w-sm shadow-2xl" style={{ background: '#fff' }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid rgba(37,36,80,0.08)' }}>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-0.5"
                style={{ color: 'rgba(37,36,80,0.4)' }}>Your stage</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(37,36,80,0.5)' }}>
                Filters your Settle checklist to what matters right now.
              </p>
            </div>
            {STAGES.map((s, i) => {
              const active = profile.stage === s.id
              return (
                <button key={s.id}
                  onClick={() => { setStage(s.id as Stage); flash(); setStageOpen(false) }}
                  className="w-full text-left px-5 py-4 hover:bg-stone-50 transition-colors"
                  style={{ borderBottom: i < STAGES.length - 1 ? '1px solid rgba(37,36,80,0.06)' : 'none' }}>
                  <p className="text-sm font-semibold" style={{ color: active ? '#3D3CAC' : '#0F0E1E' }}>
                    {s.label}{active && <span className="ml-2 text-[10px] font-black tracking-wider">✓</span>}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(37,36,80,0.4)' }}>{s.months}</p>
                </button>
              )
            })}
            <button onClick={() => setStageOpen(false)} className="w-full py-4 text-sm"
              style={{ color: 'rgba(37,36,80,0.35)', borderTop: '1px solid rgba(37,36,80,0.08)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ══ Neighborhood picker ════════════════════════════════════════════════ */}
      {neighborhoodOpen && city && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setNeighborhoodOpen(false)}>
          <div className="w-full sm:max-w-sm shadow-2xl"
            style={{ background: '#fff', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3 sticky top-0 bg-white"
              style={{ borderBottom: '1px solid rgba(37,36,80,0.08)' }}>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase"
                style={{ color: 'rgba(37,36,80,0.4)' }}>Neighborhood</p>
            </div>
            {[{ value: '', label: 'Not specified' }, ...neighborhoods.map(n => ({ value: n, label: n }))].map((opt, i, arr) => {
              const active = (profile.neighborhood ?? '') === opt.value
              return (
                <button key={opt.value}
                  onClick={() => { setNeighborhood(opt.value || undefined); flash(); setNeighborhoodOpen(false) }}
                  className="w-full text-left px-5 py-3.5 hover:bg-stone-50 transition-colors"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(37,36,80,0.06)' : 'none' }}>
                  <p className="text-sm font-medium" style={{ color: active ? '#3D3CAC' : '#0F0E1E' }}>
                    {opt.label}{active && <span className="ml-2 text-[10px] font-black">✓</span>}
                  </p>
                </button>
              )
            })}
            <button onClick={() => setNeighborhoodOpen(false)} className="w-full py-4 text-sm"
              style={{ color: 'rgba(37,36,80,0.35)', borderTop: '1px solid rgba(37,36,80,0.08)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ══ Situation / profession picker ══════════════════════════════════════ */}
      {situationOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSituationOpen(false)}>
          <div className="w-full sm:max-w-sm shadow-2xl" style={{ background: '#fff' }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid rgba(37,36,80,0.08)' }}>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase"
                style={{ color: 'rgba(37,36,80,0.4)' }}>Your situation</p>
            </div>
            {SITUATION_OPTIONS.map((opt, i) => {
              const active = primarySit === opt.id
              return (
                <button key={opt.id}
                  onClick={() => {
                    const rest = (profile.situations ?? []).filter(s => !SITUATION_OPTIONS.some(o => o.id === s))
                    updateProfile({ situations: active ? rest : [opt.id, ...rest] })
                    flash(); setSituationOpen(false)
                  }}
                  className="w-full text-left px-5 py-4 hover:bg-stone-50 transition-colors"
                  style={{ borderBottom: i < SITUATION_OPTIONS.length - 1 ? '1px solid rgba(37,36,80,0.06)' : 'none' }}>
                  <p className="text-sm font-semibold" style={{ color: active ? '#3D3CAC' : '#0F0E1E' }}>
                    {opt.label}{active && <span className="ml-2 text-[10px] font-black tracking-wider">✓</span>}
                  </p>
                </button>
              )
            })}
            <button onClick={() => setSituationOpen(false)} className="w-full py-4 text-sm"
              style={{ color: 'rgba(37,36,80,0.35)', borderTop: '1px solid rgba(37,36,80,0.08)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
