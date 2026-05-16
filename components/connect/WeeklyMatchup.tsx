'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { venuePhotoUrl } from '@/lib/photos'

interface Matchup {
  id:                 string
  week_start:         string
  option_a_label:     string
  option_b_label:     string
  option_a_venue_id:  string | null
  option_b_venue_id:  string | null
  context:            string | null
  counts:             { a: number; b: number }
  userVote:           'a' | 'b' | null
}

interface Props {
  cityId: string
}

// Pinned weekly matchup card. Sits above the tips channel feed on /connect.
//
// Mechanic: two large tappable tiles. Before vote, both glow equally —
// labels + photos visible. After vote, reveal the % split as a bar between
// the tiles (loss-aversion: you HAVE to commit to see how Brussels feels).
// Revoting flips your choice; counts re-fetch optimistically.
//
// Renders nothing when there's no active matchup for the city, so the page
// degrades cleanly during the gap between weeks.
export default function WeeklyMatchup({ cityId }: Props) {
  const [matchup, setMatchup] = useState<Matchup | null>(null)
  const [status,  setStatus]  = useState<'loading' | 'ready' | 'none' | 'error'>('loading')
  const [voting,  setVoting]  = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const sb = supabase
        const headers: Record<string, string> = {}
        if (sb) {
          const { data: { session } } = await sb.auth.getSession()
          if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
        }
        const res = await fetch(`/api/matchup?city=${cityId}`, {
          headers,
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) {
          if (!cancelled) setStatus('error')
          return
        }
        const json = await res.json() as { matchup: Matchup | null }
        if (cancelled) return
        if (!json.matchup) { setStatus('none'); return }
        setMatchup(json.matchup)
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }
    load()
    return () => { cancelled = true }
  }, [cityId])

  async function castVote(choice: 'a' | 'b') {
    if (!matchup || voting) return
    setVoting(true)

    // Optimistic update: bump the count immediately, undo the previous
    // vote if any.
    setMatchup(m => {
      if (!m) return m
      const next = { ...m, counts: { ...m.counts }, userVote: choice }
      if (m.userVote && m.userVote !== choice) next.counts[m.userVote] = Math.max(0, m.counts[m.userVote] - 1)
      if (m.userVote !== choice) next.counts[choice] = m.counts[choice] + 1
      return next
    })

    try {
      const sb = supabase
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (sb) {
        const { data: { session } } = await sb.auth.getSession()
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const res = await fetch('/api/matchup/vote', {
        method: 'POST',
        headers,
        body: JSON.stringify({ matchup_id: matchup.id, choice }),
      })
      if (res.ok) {
        const json = await res.json() as { counts: { a: number; b: number }; userVote: 'a' | 'b' }
        setMatchup(m => m && ({ ...m, counts: json.counts, userVote: json.userVote }))
      }
    } catch { /* leave optimistic state */ }
    finally { setVoting(false) }
  }

  if (status === 'loading' || status === 'none' || status === 'error' || !matchup) return null

  const total      = matchup.counts.a + matchup.counts.b
  const aPct       = total === 0 ? 50 : Math.round((matchup.counts.a / total) * 100)
  const bPct       = total === 0 ? 50 : 100 - aPct
  const hasVoted   = matchup.userVote !== null
  const aSelected  = matchup.userVote === 'a'
  const bSelected  = matchup.userVote === 'b'

  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between pb-3 mb-5"
        style={{ borderBottom: '2px solid #0A0A0A' }}>
        <p className="text-[10px] font-black tracking-[0.25em] uppercase"
          style={{ color: '#FF3EBA' }}>
          Vrijdag / Vendredi · This week
        </p>
        {hasVoted && (
          <p className="text-[10px] font-black tracking-[0.18em] uppercase"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            {total} {total === 1 ? 'vote' : 'votes'}
          </p>
        )}
      </div>

      {matchup.context && (
        <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(10,10,10,0.7)', maxWidth: '54ch' }}>
          {matchup.context}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <MatchupTile
          label={matchup.option_a_label}
          venueId={matchup.option_a_venue_id}
          cityId={cityId}
          accent="#E8612A"
          selected={aSelected}
          dimmed={hasVoted && !aSelected}
          pct={hasVoted ? aPct : null}
          count={matchup.counts.a}
          disabled={voting}
          onTap={() => castVote('a')}
        />
        <MatchupTile
          label={matchup.option_b_label}
          venueId={matchup.option_b_venue_id}
          cityId={cityId}
          accent="#4744C8"
          selected={bSelected}
          dimmed={hasVoted && !bSelected}
          pct={hasVoted ? bPct : null}
          count={matchup.counts.b}
          disabled={voting}
          onTap={() => castVote('b')}
        />
      </div>

      {!hasVoted && (
        <p className="text-[10px] font-black tracking-[0.22em] uppercase mt-4 text-center"
          style={{ color: 'rgba(10,10,10,0.35)' }}>
          Tap to vote — results revealed after
        </p>
      )}
    </section>
  )
}

function MatchupTile({
  label, venueId, cityId, accent, selected, dimmed, pct, count, disabled, onTap,
}: {
  label:    string
  venueId:  string | null
  cityId:   string
  accent:   string
  selected: boolean
  dimmed:   boolean
  pct:      number | null   // null before vote, percentage 0–100 after
  count:    number
  disabled: boolean
  onTap:    () => void
}) {
  const photoUrl = venueId ? venuePhotoUrl(cityId, venueId) : null

  return (
    <button
      onClick={onTap}
      disabled={disabled}
      className="relative overflow-hidden text-left group transition-all"
      style={{
        aspectRatio: '4 / 5',
        border:      selected ? `3px solid ${accent}` : '1.5px solid rgba(10,10,10,0.12)',
        opacity:     dimmed ? 0.55 : 1,
        background:  '#0A0A0A',
      }}>
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={label}
          loading="eager"
          decoding="async"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
        />
      )}

      {/* Dim gradient + accent strip */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.78) 100%)' }} />
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: accent }} />

      {/* Label + pct */}
      <div className="absolute left-0 right-0 bottom-0 p-4 text-white">
        <p className="font-display font-black leading-[1.05]"
          style={{ fontSize: 'clamp(1.1rem, 2.6vw, 1.5rem)', letterSpacing: '-0.015em' }}>
          {label}
        </p>
        {pct !== null && (
          <div className="mt-3">
            <p className="text-[10px] font-black tracking-[0.18em] uppercase opacity-90">
              {pct}% · {count} {count === 1 ? 'vote' : 'votes'}
            </p>
            <div className="mt-1.5 h-1.5 w-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="h-full transition-all duration-500"
                style={{ width: `${pct}%`, background: accent }} />
            </div>
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-white"
          style={{ background: accent, boxShadow: '0 0 0 3px rgba(255,255,255,0.25)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5l2.5 2.5L10 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  )
}
