'use client'
import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { eventNudges, isSafeUrl } from '@/lib/listings/quality'
import { uploadListingPhoto } from '@/lib/listings/upload'
import type { Post, Stage, CityId } from '@/lib/types'

interface Props {
  cityId:        CityId
  onSubmitted?:  (post: Post) => void
  onNeedsAuth?:  () => void
}

// Event composer — user-submitted events alongside the scraped Hub feed.
// Structured fields: title, date, venue, optional URL, description.
export function EventComposer({ cityId, onSubmitted, onNeedsAuth }: Props) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [open,      setOpen]      = useState(false)
  const [title,     setTitle]     = useState('')
  const [date,      setDate]      = useState('')      // datetime-local string
  const [venue,     setVenue]     = useState('')
  const [hood,      setHood]      = useState(profile.neighborhood ?? '')
  const [url,       setUrl]       = useState('')
  const [photoUrl,  setPhotoUrl]  = useState('')
  const [body,      setBody]      = useState('')
  const [busy,      setBusy]      = useState(false)
  const [posted,    setPosted]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [photoErr,  setPhotoErr]  = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!user) { onNeedsAuth?.(); return }
    setPhotoErr(null)
    setUploading(true)
    try {
      const { url } = await uploadListingPhoto(file, user.id)
      setPhotoUrl(url)
    } catch (err) {
      setPhotoErr(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const titleOk = title.trim().length > 0 && title.trim().length <= 120
  const dateOk  = !!date
  const urlOk   = !url.trim()      || isSafeUrl(url)
  const photoOk = !photoUrl.trim() || isSafeUrl(photoUrl)
  const ready   = titleOk && dateOk && urlOk && photoOk && !busy
  const nudges  = eventNudges({ title, date, venue, hood, url, photoUrl, body })

  async function submit() {
    if (!ready) return
    if (!user) { onNeedsAuth?.(); return }
    if (!supabase) return
    setBusy(true)
    setError(null)

    // Per-user rate limit (5 posts/min). Same RPC as tips/questions submit path.
    const { data: allowed, error: rlErr } = await supabase
      .rpc('check_post_rate_limit', { uid: user.id, max_per_min: 5 })
    if (rlErr && rlErr.code !== '42P01' && rlErr.code !== 'PGRST202') {
      console.warn('[event:rate-limit]', rlErr.code, rlErr.message)
    } else if (allowed === false) {
      setBusy(false)
      setError('You\'re posting a lot — wait a minute and try again.')
      return
    }

    const eventDateIso = new Date(date).toISOString()
    const optimistic: Post = {
      id: `u${Date.now()}`,
      cityId,
      category: 'event',
      stage: profile.stage as Stage | undefined,
      authorStage: profile.stage as Stage | undefined,
      neighborhood: hood.trim() || undefined,
      text: body.trim(),
      time: 'just now',
      title: title.trim(),
      photoUrl: photoUrl.trim() || undefined,
      eventDate: eventDateIso,
      eventVenue: venue.trim() || undefined,
      eventUrl: url.trim() || undefined,
    }
    onSubmitted?.(optimistic)

    const { error: insErr } = await supabase.from('posts').insert({
      city_id: cityId,
      category: 'event',
      stage: profile.stage ?? null,
      author_id: user.id,
      author_stage: profile.stage ?? null,
      neighborhood: hood.trim() || null,
      text: body.trim(),
      title: title.trim(),
      photo_url: photoUrl.trim() || null,
      event_date: eventDateIso,
      event_venue: venue.trim() || null,
      event_url: url.trim() || null,
    })
    setBusy(false)
    if (insErr) {
      if (insErr.code === '23514' || insErr.code === '42703') {
        setError('Events aren\'t enabled yet — run supabase/migration_listings_and_events.sql.')
        return
      }
      setError(insErr.message)
      return
    }

    setPosted(true)
    setTitle(''); setDate(''); setVenue(''); setUrl(''); setPhotoUrl(''); setBody('')
    window.setTimeout(() => { setPosted(false); setOpen(false) }, 2500)
  }

  if (!open) {
    return (
      <button onClick={() => { if (!user) { onNeedsAuth?.(); return } setOpen(true) }}
        className="w-full text-left flex items-center justify-between gap-4 px-5 py-4 group transition-all"
        style={{ background: '#FFFFFF', border: '2px solid #E8612A' }}>
        <div className="min-w-0">
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-1"
            style={{ color: '#E8612A' }}>
            Post an event
          </p>
          <p className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>
            Hosting a gig, a class, a kitchen-table dinner? Tell settlers what&apos;s on.
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-black tracking-[0.18em] uppercase inline-flex items-center gap-1"
          style={{ color: '#E8612A' }}>
          Compose
          <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </span>
      </button>
    )
  }

  return (
    <section style={{ background: '#FFFFFF', border: '2px solid #E8612A' }}>
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <p className="text-[10px] font-black tracking-[0.22em] uppercase"
            style={{ color: '#E8612A' }}>
            New event
          </p>
          <button onClick={() => setOpen(false)}
            className="text-[10px] font-bold hover:opacity-60 transition-opacity"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            Cancel
          </button>
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value.slice(0, 120))}
          placeholder='"Reggae Night at Resist · Fri 4 July"'
          className="w-full text-base font-semibold focus:outline-none mb-2"
          style={{ color: '#0A0A0A', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 4 }} />

        {/* Date + Venue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <input
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="text-sm focus:outline-none"
            style={{ color: '#0A0A0A', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 4 }} />
          <input
            type="text"
            value={venue}
            onChange={e => setVenue(e.target.value.slice(0, 100))}
            placeholder="Venue · Magasin 4, BBP, Flagey…"
            className="text-sm focus:outline-none"
            style={{ color: '#0A0A0A', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 4 }} />
        </div>

        {/* Neighbourhood (optional) + URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            value={hood}
            onChange={e => setHood(e.target.value.slice(0, 50))}
            placeholder="Neighbourhood · Dansaert / Flagey…"
            className="text-sm focus:outline-none"
            style={{ color: '#0A0A0A', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 4 }} />
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value.slice(0, 500))}
            placeholder="Tickets / RSVP link"
            className="text-sm focus:outline-none"
            style={{ color: '#0A0A0A', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 4 }} />
        </div>

        {/* Optional poster image — file picker + preview */}
        <div className="mb-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPickPhoto}
            className="hidden" />
          {photoUrl ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="Poster preview"
                className="w-32 h-32 object-cover"
                style={{ border: '1px solid rgba(232,97,42,0.4)' }} />
              <button
                type="button"
                onClick={() => setPhotoUrl('')}
                className="absolute -top-2 -right-2 w-6 h-6 text-[12px] font-black flex items-center justify-center"
                style={{ background: '#FFFFFF', border: '1px solid rgba(10,10,10,0.2)', color: '#0A0A0A' }}
                title="Remove photo">
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-[10px] font-black tracking-[0.18em] uppercase px-3 py-2 transition-opacity disabled:opacity-40"
              style={{ background: 'rgba(232,97,42,0.08)', border: '1px dashed #E8612A', color: '#E8612A' }}>
              {uploading ? 'Uploading…' : '+ Add a poster (optional)'}
            </button>
          )}
          {photoErr && (
            <p className="text-[11px] mt-1" style={{ color: '#C0392B' }}>{photoErr}</p>
          )}
        </div>

        {/* Description */}
        <textarea
          value={body}
          onChange={e => setBody(e.target.value.slice(0, 600))}
          placeholder="What's the gist? Who's playing, what's the door, what's the dress code…"
          rows={3}
          className="w-full text-sm focus:outline-none resize-none leading-relaxed"
          style={{ color: '#0A0A0A' }} />
      </div>

      {/* Inline nudges — zero-cost voice-of-Roots hints */}
      {nudges.length > 0 && !error && !posted && (
        <div className="px-5 py-2 flex flex-col gap-0.5"
          style={{ borderTop: '1px solid rgba(232,97,42,0.18)', background: 'rgba(232,97,42,0.04)' }}>
          {nudges.map((n, i) => (
            <p key={i} className="text-[11px]" style={{ color: 'rgba(10,10,10,0.55)' }}>
              <span className="font-black tracking-[0.18em] uppercase text-[9px] mr-1.5"
                style={{ color: '#E8612A' }}>Tip</span>
              {n}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-5 py-2.5"
        style={{ borderTop: '1px solid rgba(232,97,42,0.25)', background: 'rgba(232,97,42,0.06)' }}>
        <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.4)' }}>
          {error
            ? <span style={{ color: '#C0392B' }}>{error}</span>
            : !urlOk
              ? <span style={{ color: '#C0392B' }}>Tickets link must start with http:// or https://</span>
              : !photoOk
                ? <span style={{ color: '#C0392B' }}>Poster URL must start with http:// or https://</span>
                : `${body.length}/600`}
        </span>
        <button onClick={submit} disabled={!ready}
          className="px-4 py-2 text-[10px] font-black tracking-wide uppercase text-white transition-opacity disabled:opacity-25"
          style={{ background: '#E8612A' }}>
          {posted ? '✓ Posted' : busy ? 'Posting…' : 'Post event'}
        </button>
      </div>
    </section>
  )
}
