'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { housingNudges, isSafeUrl } from '@/lib/listings/quality'
import type { Post, Stage, CityId } from '@/lib/types'

interface Props {
  cityId:        CityId
  onSubmitted?:  (post: Post) => void
  onNeedsAuth?:  () => void
}

// Brand-safe housing composer: structured fields, photo encouraged,
// editorial framing. Drops a post with category='housing-offer' or
// 'housing-wanted'. Schema migration: supabase/migration_listings_and_events.sql.
//
// Editorial guardrails (per brand strategist council):
//   - Title required (max 100 chars)
//   - Type required (offer | wanted)
//   - Neighbourhood required
//   - Photo URL strongly encouraged (offer only)
//   - 14-day auto-expire is a server-side concern; flagged in copy here
export function HousingComposer({ cityId, onSubmitted, onNeedsAuth }: Props) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [open,     setOpen]     = useState(false)
  const [type,     setType]     = useState<'offer' | 'wanted'>('offer')
  const [title,    setTitle]    = useState('')
  const [hood,     setHood]     = useState(profile.neighborhood ?? '')
  const [price,    setPrice]    = useState('')
  const [dates,    setDates]    = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [body,     setBody]     = useState('')
  const [busy,     setBusy]     = useState(false)
  const [posted,   setPosted]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const titleOk = title.trim().length > 0 && title.trim().length <= 100
  const hoodOk  = hood.trim().length > 0
  const photoOk = !photoUrl.trim() || isSafeUrl(photoUrl)
  const ready   = titleOk && hoodOk && photoOk && !busy
  const nudges  = housingNudges({ type, title, hood, price, dates, photoUrl, body })

  async function submit() {
    if (!ready) return
    if (!user) { onNeedsAuth?.(); return }
    if (!supabase) return
    setBusy(true)
    setError(null)

    // Per-user rate limit (5 posts/min). Mirrors the existing tips/questions
    // submit path. Fail-open if the migration hasn't run.
    const { data: allowed, error: rlErr } = await supabase
      .rpc('check_post_rate_limit', { uid: user.id, max_per_min: 5 })
    if (rlErr && rlErr.code !== '42P01' && rlErr.code !== 'PGRST202') {
      console.warn('[housing:rate-limit]', rlErr.code, rlErr.message)
    } else if (allowed === false) {
      setBusy(false)
      setError('You\'re posting a lot — wait a minute and try again.')
      return
    }

    const category: Post['category'] = type === 'offer' ? 'housing-offer' : 'housing-wanted'
    const optimistic: Post = {
      id: `u${Date.now()}`,
      cityId,
      category,
      stage: profile.stage as Stage | undefined,
      authorStage: profile.stage as Stage | undefined,
      neighborhood: hood.trim(),
      text: body.trim(),
      time: 'just now',
      title: title.trim(),
      price: price.trim() || undefined,
      dates: dates.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
    }
    onSubmitted?.(optimistic)

    const { error: insErr } = await supabase.from('posts').insert({
      city_id: cityId,
      category,
      stage: profile.stage ?? null,
      author_id: user.id,
      author_stage: profile.stage ?? null,
      neighborhood: hood.trim(),
      text: body.trim(),
      title: title.trim(),
      price: price.trim() || null,
      dates: dates.trim() || null,
      photo_url: photoUrl.trim() || null,
    })
    setBusy(false)
    if (insErr) {
      if (insErr.code === '23514' || insErr.code === '42703') {
        setError('Housing posts aren\'t enabled yet — run supabase/migration_listings_and_events.sql.')
        return
      }
      setError(insErr.message)
      return
    }

    setPosted(true)
    setTitle(''); setBody(''); setPrice(''); setDates(''); setPhotoUrl('')
    window.setTimeout(() => { setPosted(false); setOpen(false) }, 2500)
  }

  if (!open) {
    return (
      <button onClick={() => { if (!user) { onNeedsAuth?.(); return } setOpen(true) }}
        className="w-full text-left flex items-center justify-between gap-4 px-5 py-4 group hover:opacity-90 transition-opacity"
        style={{ background: '#FFFFFF', border: '2px solid #FAB400' }}>
        <div className="min-w-0">
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-1"
            style={{ color: '#FAB400' }}>
            Post a listing
          </p>
          <p className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>
            Got a room or looking for one? Settler listings — vetted, 14 days fresh.
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-black tracking-[0.18em] uppercase"
          style={{ color: '#FAB400' }}>
          Compose →
        </span>
      </button>
    )
  }

  return (
    <section style={{ background: '#FFFFFF', border: '2px solid #FAB400' }}>
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <p className="text-[10px] font-black tracking-[0.22em] uppercase"
            style={{ color: '#FAB400' }}>
            New listing
          </p>
          <button onClick={() => setOpen(false)}
            className="text-[10px] font-bold hover:opacity-60 transition-opacity"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            Cancel
          </button>
        </div>

        {/* Type toggle — typographic, not filled chips (brand discipline) */}
        <div className="flex gap-5 mb-3">
          {(['offer', 'wanted'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className="text-[11px] font-black tracking-[0.18em] uppercase py-2 transition-opacity"
              style={{
                color: type === t ? '#FAB400' : 'rgba(10,10,10,0.35)',
                borderBottom: type === t ? '2px solid #FAB400' : '2px solid transparent',
              }}>
              {t === 'offer' ? 'For rent' : 'Wanted'}
            </button>
          ))}
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value.slice(0, 100))}
          placeholder={type === 'offer'
            ? '"Room in 3-flat house, Saint-Gilles, July–"'
            : '"Looking: 1-bed Tram 7 axis, ~€950"'}
          className="w-full text-base font-semibold focus:outline-none mb-2"
          style={{ color: '#0A0A0A', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 4 }} />

        {/* Two-up: Neighbourhood + Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            value={hood}
            onChange={e => setHood(e.target.value.slice(0, 50))}
            placeholder="Neighbourhood · Ixelles / Saint-Gilles…"
            className="text-sm focus:outline-none"
            style={{ color: '#0A0A0A', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 4 }} />
          <input
            type="text"
            value={price}
            onChange={e => setPrice(e.target.value.slice(0, 40))}
            placeholder={type === 'offer' ? 'Price · €950/month' : 'Budget · up to €1,000'}
            className="text-sm focus:outline-none"
            style={{ color: '#0A0A0A', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 4 }} />
        </div>

        {/* Dates */}
        <input
          type="text"
          value={dates}
          onChange={e => setDates(e.target.value.slice(0, 60))}
          placeholder="Dates · July to May, or 1 July 2026 –"
          className="w-full text-sm focus:outline-none mb-2"
          style={{ color: '#0A0A0A', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 4 }} />

        {/* Optional photo URL */}
        {type === 'offer' && (
          <input
            type="url"
            value={photoUrl}
            onChange={e => setPhotoUrl(e.target.value.slice(0, 500))}
            placeholder="Photo URL — strongly recommended"
            className="w-full text-sm focus:outline-none mb-2"
            style={{ color: '#0A0A0A', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 4 }} />
        )}

        {/* Description */}
        <textarea
          value={body}
          onChange={e => setBody(e.target.value.slice(0, 600))}
          placeholder={type === 'offer'
            ? 'A few lines — flatmates, the building, what you\'re looking for in a settler…'
            : 'Tell us what you need — budget, timing, deal-breakers.'}
          rows={3}
          className="w-full text-sm focus:outline-none resize-none leading-relaxed"
          style={{ color: '#0A0A0A' }} />
      </div>

      {/* Inline nudges — pure local logic, no AI cost. Brand: voice-of-Roots. */}
      {nudges.length > 0 && !error && !posted && (
        <div className="px-5 py-2 flex flex-col gap-0.5"
          style={{ borderTop: '1px solid rgba(250,180,0,0.18)', background: 'rgba(250,180,0,0.04)' }}>
          {nudges.map((n, i) => (
            <p key={i} className="text-[11px]" style={{ color: 'rgba(10,10,10,0.55)' }}>
              <span className="font-black tracking-[0.18em] uppercase text-[9px] mr-1.5"
                style={{ color: '#FAB400' }}>Tip</span>
              {n}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-5 py-2.5"
        style={{ borderTop: '1px solid rgba(250,180,0,0.25)', background: 'rgba(250,180,0,0.06)' }}>
        <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.4)' }}>
          {error
            ? <span style={{ color: '#C0392B' }}>{error}</span>
            : !photoOk
              ? <span style={{ color: '#C0392B' }}>Photo URL must start with http:// or https://</span>
              : `${body.length}/600 · auto-expires in 14 days`}
        </span>
        <button onClick={submit} disabled={!ready}
          className="px-4 py-2 text-[10px] font-black tracking-wide uppercase text-white transition-opacity disabled:opacity-25"
          style={{ background: '#FAB400' }}>
          {posted ? '✓ Listed' : busy ? 'Posting…' : 'Post listing'}
        </button>
      </div>
    </section>
  )
}
