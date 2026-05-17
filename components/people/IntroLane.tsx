'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import type { Stage, SituationTag } from '@/lib/types'

interface Props {
  cityId: string
  onNeedsAuth?: () => void
}

interface IntroPost {
  id:           string
  text:         string
  time:         string
  authorStage?: Stage
  neighborhood?: string
}

const STAGE_COLORS: Record<Stage, string> = {
  planning:     '#6865CC',
  just_arrived: '#B88A00',
  settling:     '#1A8FAD',
  settled:      '#0E9B6B',
}

function formatRelative(dateStr: string): string {
  const d    = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Self-contained intro composer + lane. Was embedded in /connect; moved
// to /people per IA council — intros are IDENTITY, not community
// conversation. The "Say hi" CTA is the first beat of the directory.
export function IntroLane({ cityId, onNeedsAuth }: Props) {
  const { user } = useAuth()
  const { profile } = useProfile()

  const [intros,         setIntros]         = useState<IntroPost[]>([])
  const [text,           setText]           = useState('')
  const [busy,           setBusy]           = useState(false)
  const [posted,         setPosted]         = useState(false)
  const [hasOwnIntro,    setHasOwnIntro]    = useState(false)
  const [dismissed,      setDismissed]      = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  useEffect(() => {
    try { if (localStorage.getItem('roots:intro-dismissed') === '1') setDismissed(true) } catch {}
  }, [])

  // Load intros for this city
  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    sb.from('posts')
      .select('id, text, created_at, author_stage, neighborhood')
      .eq('city_id', cityId)
      .eq('category', 'intro')
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data, error: err }) => {
        if (err) {
          if (err.code === '23514' || err.code === '42703' || err.code === '42P01') return
          return
        }
        if (!data) return
        setIntros(data.map(p => ({
          id: p.id,
          text: p.text,
          time: formatRelative(p.created_at),
          authorStage: (p.author_stage as Stage | null) ?? undefined,
          neighborhood: p.neighborhood ?? undefined,
        })))
      })
  }, [cityId])

  // Check whether the current user has already posted an intro
  useEffect(() => {
    if (!supabase || !user) return
    const sb = supabase
    sb.from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', cityId)
      .eq('category', 'intro')
      .eq('author_id', user.id)
      .then(({ count, error: err }) => {
        if (err) return
        setHasOwnIntro((count ?? 0) > 0)
      })
  }, [cityId, user])

  const submit = useCallback(async () => {
    if (!text.trim() || busy) return
    if (!user) { onNeedsAuth?.(); return }
    if (!supabase) return
    setBusy(true)
    setError(null)
    const optimistic: IntroPost = {
      id: `u${Date.now()}`,
      text: text.trim(),
      time: 'just now',
      authorStage: profile.stage as Stage | undefined,
      neighborhood: profile.neighborhood ?? undefined,
    }
    setIntros(prev => [optimistic, ...prev])
    setPosted(true)
    setHasOwnIntro(true)
    setText('')
    window.setTimeout(() => setPosted(false), 3000)

    const { error: insErr } = await supabase.from('posts').insert({
      city_id:      cityId,
      stage:        profile.stage ?? null,
      category:     'intro',
      text:         optimistic.text,
      author_id:    user.id,
      author_stage: profile.stage ?? null,
      neighborhood: profile.neighborhood ?? null,
    })
    setBusy(false)
    if (insErr) {
      if (insErr.code === '23514') {
        setIntros(prev => prev.filter(p => p.id !== optimistic.id))
        setHasOwnIntro(false)
        setText(optimistic.text)
        setError('Intros aren\'t enabled yet — run supabase/migration_intro_and_filters.sql.')
      } else {
        console.error('[intro:insert]', insErr.code, insErr.message)
      }
    }
  }, [text, busy, user, profile.stage, profile.neighborhood, cityId, onNeedsAuth])

  function dismiss() {
    setDismissed(true)
    try { localStorage.setItem('roots:intro-dismissed', '1') } catch {}
  }

  return (
    <section className="mb-12">
      {/* Composer — collapsible "say hi" prompt */}
      {user && !hasOwnIntro && !dismissed && (
        <div className="mb-8" style={{ border: '2px solid #FF3EBA' }}>
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-baseline justify-between mb-2 gap-3">
              <p className="text-[10px] font-black tracking-[0.22em] uppercase"
                style={{ color: '#FF3EBA' }}>
                ✦ New here? Say hi
              </p>
              <button onClick={dismiss}
                className="text-[10px] font-bold hover:opacity-60 transition-opacity"
                style={{ color: 'rgba(10,10,10,0.4)' }}>
                Later
              </button>
            </div>
            <p className="text-xs mb-2 leading-relaxed" style={{ color: 'rgba(10,10,10,0.6)' }}>
              Where you moved from, one thing you&apos;re figuring out. 2 lines is plenty.
            </p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, 280))}
              placeholder="Just moved from Lisbon, trying to crack the commune system…"
              rows={2}
              className="w-full text-sm focus:outline-none resize-none bg-transparent leading-relaxed"
              style={{ color: '#0A0A0A', fontSize: 14 }} />
          </div>
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ borderTop: '1px solid rgba(255,62,186,0.18)', background: 'rgba(255,62,186,0.04)' }}>
            <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.4)' }}>
              {error ? <span style={{ color: '#C0392B' }}>{error}</span> : `${text.length}/280`}
            </span>
            <button onClick={submit}
              disabled={!text.trim() || busy}
              className="px-4 py-1.5 text-[10px] font-black tracking-wide uppercase text-white transition-opacity disabled:opacity-25"
              style={{ background: '#FF3EBA' }}>
              {posted ? '✓ Posted' : busy ? 'Posting…' : 'Say hi'}
            </button>
          </div>
        </div>
      )}

      {/* Intros lane — recent settlers saying hi */}
      {intros.length > 0 && (
        <>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-3"
            style={{ color: '#FF3EBA' }}>
            ✦ New settlers this week
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {intros.slice(0, 6).map(intro => {
              const stageColor = intro.authorStage ? STAGE_COLORS[intro.authorStage] : 'rgba(10,10,10,0.4)'
              return (
                <article key={intro.id}
                  className="px-4 py-3"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(255,62,186,0.25)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    {intro.authorStage && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-[0.18em] uppercase px-1.5 py-0.5"
                        style={{ background: stageColor, color: '#fff' }}>
                        {intro.authorStage.replace(/_/g, ' ')}
                      </span>
                    )}
                    {intro.neighborhood && (
                      <span className="text-[10px] font-black tracking-[0.18em] uppercase"
                        style={{ color: 'rgba(10,10,10,0.4)' }}>
                        {intro.neighborhood.split(' / ')[0]}
                      </span>
                    )}
                    <span className="text-[10px] ml-auto" style={{ color: 'rgba(10,10,10,0.3)' }}>
                      {intro.time}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#0A0A0A' }}>
                    {intro.text}
                  </p>
                </article>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

// Re-export type for callers that might wire other people-page modules.
export type { SituationTag }
