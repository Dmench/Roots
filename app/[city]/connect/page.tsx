'use client'
import { use, useState, useEffect, useRef } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import { AuthModal } from '@/components/auth/AuthModal'
import { getCity } from '@/lib/data/cities'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Post, PostCategory, Stage } from '@/lib/types'
import type { FeedItem } from '@/app/api/feeds/route'

/* ── Static data ─────────────────────────────────────────────────────────── */

interface Resource { id: string; cityId: string; name: string; type: 'facebook' | 'reddit'; desc: string }

const RESOURCES: Resource[] = [
  { id: 'r1', cityId: 'brussels', name: 'Brussels Expats',          type: 'facebook', desc: 'Housing, admin, jobs, social.' },
  { id: 'r2', cityId: 'brussels', name: 'English Speaking Brussels', type: 'facebook', desc: 'Jobs, lifestyle, events — very active.' },
  { id: 'r3', cityId: 'brussels', name: 'r/brussels',               type: 'reddit',   desc: 'Local news, tips, recommendations.' },
  { id: 'r4', cityId: 'brussels', name: 'Moving to Brussels',       type: 'facebook', desc: 'Practical info for new arrivals.' },
  { id: 'r5', cityId: 'brussels', name: 'EU Bubble',                type: 'reddit',   desc: 'EU institutions and expat life.' },
  { id: 'r6', cityId: 'lisbon',   name: 'Lisbon Expat Community',   type: 'facebook', desc: 'Visas, housing, events, advice.' },
  { id: 'r7', cityId: 'lisbon',   name: 'r/portugal',               type: 'reddit',   desc: 'National subreddit — news and discussion.' },
  { id: 'r8', cityId: 'lisbon',   name: 'r/pliving',                type: 'reddit',   desc: 'Portugal living — visas, NHR, housing.' },
]

const PROMPTS = [
  'Share a tip that took you time to figure out…',
  'Ask something you\'re still trying to work out…',
  'Warn others about something you wish you\'d known…',
]

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr), diff = Date.now() - d.getTime(), mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const CAT_META: Record<PostCategory, { color: string; label: string }> = {
  recommendation: { color: '#10B981', label: 'Tip' },
  question:       { color: '#38C0F0', label: 'Question' },
  'heads-up':     { color: '#FAB400', label: 'Heads-up' },
}

const STAGE_LABELS: Record<Stage, string> = {
  planning: 'Planning', just_arrived: 'Just arrived',
  settling: 'Getting settled', settled: 'Settled',
}

const SOURCE_STYLE: Record<string, { color: string; label: string }> = {
  reddit:       { color: '#FF4500', label: 'Reddit' },
  bulletin:     { color: '#4744C8', label: 'Bulletin' },
  politico:     { color: '#EF3340', label: 'Politico' },
  euobserver:   { color: '#252450', label: 'EUobserver' },
  euronews:     { color: '#C8900A', label: 'Euronews' },
  ticketmaster: { color: '#0073E6', label: 'Ticketmaster' },
}

/* ── Stream item types ───────────────────────────────────────────────────── */

type StreamItem =
  | { kind: 'post';  data: Post;     ts: number }
  | { kind: 'feed';  data: FeedItem; ts: number }

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ConnectPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = use(params)
  const city        = getCity(cityId)
  const { profile } = useProfile()
  const { user }    = useAuth()
  const composerRef = useRef<HTMLTextAreaElement>(null)

  const [posts,       setPosts]       = useState<Post[]>([])
  const [newPost,     setNewPost]     = useState({ category: 'recommendation' as PostCategory, text: '' })
  const [submitted,   setSubmitted]   = useState(false)
  const [authOpen,    setAuthOpen]    = useState(false)
  const [feedItems,   setFeedItems]   = useState<FeedItem[]>([])
  const [feedState,   setFeedState]   = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [streamFilter, setStreamFilter] = useState<'all' | 'community' | 'news' | 'events'>('all')

  useEffect(() => {
    if (!city || !supabase) return
    supabase.from('posts').select('*').eq('city_id', cityId)
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPosts(data.map(p => ({
            id: p.id, cityId: p.city_id, stage: p.stage ?? undefined,
            category: p.category as PostCategory, text: p.text,
            time: formatRelative(p.created_at), authorStage: p.author_stage ?? undefined,
          })))
        }
      })
  }, [cityId, city])

  useEffect(() => {
    if (feedState !== 'idle') return
    setFeedState('loading')
    fetch(`/api/feeds?city=${cityId}`)
      .then(r => r.json())
      .then(data => { setFeedItems(data.items ?? []); setFeedState('done') })
      .catch(() => setFeedState('error'))
  }, [cityId, feedState])

  if (!city) return null

  const resources = RESOURCES.filter(r => r.cityId === cityId)
  const events    = feedItems.filter(i => i.category === 'events').slice(0, 8)

  // Build unified stream — posts + non-event feed items interleaved by time
  const postStream: StreamItem[] = posts.map(p => ({ kind: 'post', data: p, ts: Date.now() / 1000 }))
  const feedStream: StreamItem[] = feedItems
    .filter(i => i.category !== 'events')
    .map(i => ({ kind: 'feed', data: i, ts: i.published }))

  const stream: StreamItem[] = [...postStream, ...feedStream]
    .sort((a, b) => b.ts - a.ts)
    .filter(item => {
      if (streamFilter === 'all') return true
      if (streamFilter === 'community') return item.kind === 'post' || (item.kind === 'feed' && item.data.category === 'community')
      if (streamFilter === 'news') return item.kind === 'feed' && item.data.category === 'news'
      if (streamFilter === 'events') return false // events shown in strip above
      return true
    })

  const submit = async () => {
    if (!newPost.text.trim()) return
    if (!user) { setAuthOpen(true); return }
    const optimistic: Post = {
      id: `u${Date.now()}`, cityId: city.id,
      stage: profile.stage as Stage | undefined,
      category: newPost.category, text: newPost.text.trim(),
      time: 'just now', authorStage: profile.stage as Stage | undefined,
    }
    setPosts(prev => [optimistic, ...prev])
    setNewPost(p => ({ ...p, text: '' }))
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    if (supabase) {
      await supabase.from('posts').insert({
        city_id: city.id, stage: profile.stage ?? null,
        category: optimistic.category, text: optimistic.text,
        author_id: user.id, author_stage: profile.stage ?? null,
      })
    }
  }

  return (
    <div style={{ background: '#F8F7F4', minHeight: '100vh' }}>

      {/* ── Cream header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 md:px-12 pt-10 pb-12" style={{ background: '#F5ECD7' }}>
        <div className="absolute rounded-full pointer-events-none opacity-60"
          style={{ background: '#4744C8', width: 220, height: 220, top: -100, right: -60 }} />
        <div className="absolute rounded-full pointer-events-none opacity-50"
          style={{ background: '#FF3EBA', width: 80, height: 80, bottom: -30, right: '28%' }} />

        <div className="max-w-5xl mx-auto relative">
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-5"
            style={{ color: 'rgba(37,36,80,0.3)' }}>
            Connect · {city.name}
          </p>
          <div className="flex items-end gap-6">
            <h1 className="font-display font-black leading-[0.82]"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', color: '#252450' }}>
              Community.
            </h1>
            {feedState === 'done' && events.length > 0 && (
              <p className="pb-2 text-sm font-medium" style={{ color: 'rgba(37,36,80,0.4)' }}>
                {events.length} events this week
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Events strip ─────────────────────────────────────────────────── */}
      {(feedState === 'loading' || events.length > 0) && (
        <div style={{ background: '#252450' }}>
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-6">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-4"
              style={{ color: 'rgba(245,236,215,0.35)' }}>
              This week
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {feedState === 'loading'
                ? [1,2,3,4].map(i => (
                    <div key={i} className="shrink-0 w-44 rounded-xl p-4 animate-pulse"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-2.5 bg-white/10 rounded w-10 mb-3" />
                      <div className="h-4 bg-white/10 rounded w-full mb-1.5" />
                      <div className="h-3 bg-white/8 rounded w-3/4" />
                    </div>
                  ))
                : events.map(ev => {
                    const d   = new Date(ev.published * 1000)
                    const dow = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()
                    const day = d.getDate()
                    const mon = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
                    return (
                      <a
                        key={ev.id}
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 w-44 rounded-xl p-4 group transition-all hover:-translate-y-0.5"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}
                      >
                        <div className="flex items-baseline gap-1.5 mb-3">
                          <span className="text-lg font-black leading-none" style={{ color: '#F5ECD7' }}>{day}</span>
                          <span className="text-[9px] font-black tracking-widest" style={{ color: '#10B981' }}>{dow} {mon}</span>
                        </div>
                        <p className="text-xs font-bold leading-snug line-clamp-2 group-hover:opacity-80 transition-opacity"
                          style={{ color: '#F5ECD7' }}>
                          {ev.title}
                        </p>
                        {ev.summary && (
                          <p className="text-[10px] mt-1.5 line-clamp-1 opacity-40" style={{ color: '#F5ECD7' }}>
                            {ev.summary.split(' · ')[1] ?? ev.summary}
                          </p>
                        )}
                      </a>
                    )
                  })
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10">

          {/* ── LEFT: Composer + unified stream ──────────────────────────── */}
          <div className="min-w-0">

            {/* Composer */}
            <div className="bg-white rounded-2xl p-5 mb-8"
              style={{ border: '1px solid rgba(37,36,80,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div className="flex gap-2 mb-4">
                {(['recommendation', 'question', 'heads-up'] as PostCategory[]).map(cat => {
                  const m = CAT_META[cat]
                  return (
                    <button
                      key={cat}
                      onClick={() => setNewPost(p => ({ ...p, category: cat }))}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                      style={newPost.category === cat
                        ? { background: m.color, color: 'white' }
                        : { background: 'rgba(37,36,80,0.04)', color: 'rgba(37,36,80,0.45)' }
                      }
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>
              <textarea
                ref={composerRef}
                value={newPost.text}
                onChange={e => setNewPost(p => ({ ...p, text: e.target.value.slice(0, 280) }))}
                placeholder={PROMPTS[0]}
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm placeholder:text-stone/40 focus:outline-none resize-none"
                style={{
                  background: '#F5ECD7',
                  border: '1px solid rgba(37,36,80,0.08)',
                  color: '#252450',
                  fontSize: 16,
                }}
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'rgba(37,36,80,0.28)' }}>{newPost.text.length}/280</span>
                  {profile.stage && (
                    <span className="text-xs" style={{ color: 'rgba(37,36,80,0.35)' }}>
                      {STAGE_LABELS[profile.stage as Stage]}
                    </span>
                  )}
                  {!user && (
                    <button onClick={() => setAuthOpen(true)}
                      className="text-xs font-bold hover:opacity-70 transition-opacity"
                      style={{ color: '#4744C8' }}>
                      Sign in to post
                    </button>
                  )}
                </div>
                <button
                  onClick={submit}
                  disabled={!newPost.text.trim()}
                  className="px-5 py-2 text-xs font-bold text-white rounded-lg transition-opacity disabled:opacity-25"
                  style={{ background: '#4744C8' }}
                >
                  {submitted ? 'Posted ✓' : 'Post'}
                </button>
              </div>
            </div>

            {/* Stream header + filter */}
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-[10px] font-black tracking-[0.22em] uppercase shrink-0"
                style={{ color: 'rgba(37,36,80,0.3)' }}>
                Live stream
              </h2>
              <div className="flex-1 h-px" style={{ background: 'rgba(37,36,80,0.08)' }} />
              <div className="flex gap-1">
                {(['all', 'community', 'news'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStreamFilter(f)}
                    className="px-2.5 py-1 text-[10px] font-bold capitalize rounded-lg transition-all"
                    style={streamFilter === f
                      ? { background: '#252450', color: '#F5ECD7' }
                      : { background: 'rgba(37,36,80,0.05)', color: 'rgba(37,36,80,0.38)' }
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Stream */}
            {feedState === 'loading' && stream.length === 0 && (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="bg-white rounded-xl p-5 animate-pulse flex gap-3"
                    style={{ border: '1px solid rgba(37,36,80,0.06)' }}>
                    <div className="w-1 rounded-full shrink-0 bg-sand/50 self-stretch" />
                    <div className="flex-1">
                      <div className="h-3 bg-sand/40 rounded w-1/4 mb-3" />
                      <div className="h-4 bg-sand/40 rounded w-full mb-1.5" />
                      <div className="h-3 bg-sand/30 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {feedState !== 'loading' && stream.length === 0 && (
              <div className="space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-widest mb-5"
                  style={{ color: 'rgba(37,36,80,0.2)' }}>
                  Be the first to post
                </p>
                {PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => composerRef.current?.focus()}
                    className={cn(
                      'w-full text-left px-5 py-4 rounded-xl text-sm transition-all',
                      'hover:bg-white/70'
                    )}
                    style={{ border: '1.5px dashed rgba(37,36,80,0.12)', color: 'rgba(37,36,80,0.38)' }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {stream.length > 0 && (
              <div className="space-y-2">
                {stream.map((item, idx) => {
                  if (item.kind === 'post') {
                    const post = item.data
                    const m    = CAT_META[post.category]
                    return (
                      <div key={post.id}
                        className="bg-white rounded-xl overflow-hidden flex"
                        style={{ border: '1px solid rgba(37,36,80,0.07)' }}
                      >
                        <div className="w-[3px] shrink-0" style={{ background: m.color }} />
                        <div className="flex-1 min-w-0 px-5 py-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider"
                              style={{ color: m.color }}>{m.label}</span>
                            {post.authorStage && (
                              <span className="text-[10px]" style={{ color: 'rgba(37,36,80,0.3)' }}>
                                · {STAGE_LABELS[post.authorStage]}
                              </span>
                            )}
                            <span className="text-[10px] ml-auto" style={{ color: 'rgba(37,36,80,0.25)' }}>
                              {post.time}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: 'rgba(37,36,80,0.72)' }}>
                            {post.text}
                          </p>
                        </div>
                      </div>
                    )
                  }

                  // Feed item (news / community / reddit)
                  const fi = item.data
                  const ss = SOURCE_STYLE[fi.source] ?? { color: '#252450', label: fi.sourceLabel }
                  const diff = Math.floor(Date.now() / 1000) - fi.published
                  const ago  = diff < 3600  ? `${Math.floor(diff / 60)}m`
                             : diff < 86400 ? `${Math.floor(diff / 3600)}h`
                             : `${Math.floor(diff / 86400)}d`

                  // Reddit items get a slightly different treatment
                  if (fi.source === 'reddit') {
                    return (
                      <a key={`${fi.id}-${idx}`}
                        href={fi.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl overflow-hidden flex group transition-all hover:shadow-sm"
                        style={{ border: '1px solid rgba(37,36,80,0.07)' }}
                      >
                        <div className="w-[3px] shrink-0" style={{ background: 'rgba(255,69,0,0.5)' }} />
                        <div className="flex-1 min-w-0 px-5 py-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black" style={{ color: '#FF4500' }}>r/{fi.subreddit ?? cityId}</span>
                            {fi.flair && <span className="text-[10px]" style={{ color: 'rgba(37,36,80,0.3)' }}>· {fi.flair}</span>}
                            <span className="text-[10px] ml-auto" style={{ color: 'rgba(37,36,80,0.25)' }}>{ago}</span>
                          </div>
                          <p className="text-sm font-semibold leading-snug group-hover:opacity-70 transition-opacity"
                            style={{ color: '#252450' }}>
                            {fi.title}
                          </p>
                          {fi.score !== undefined && (
                            <p className="text-[10px] mt-1.5" style={{ color: 'rgba(37,36,80,0.3)' }}>
                              ↑ {fi.score} · {fi.comments} replies
                            </p>
                          )}
                        </div>
                      </a>
                    )
                  }

                  // News items
                  return (
                    <a key={`${fi.id}-${idx}`}
                      href={fi.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 rounded-xl px-5 py-3.5 group transition-all hover:bg-white"
                      style={{ border: '1px solid rgba(37,36,80,0.06)', background: 'rgba(255,255,255,0.5)' }}
                    >
                      <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded"
                        style={{ background: `${ss.color}15`, color: ss.color, letterSpacing: '0.06em' }}>
                        {ss.label.toUpperCase().slice(0, 9)}
                      </span>
                      <p className="flex-1 min-w-0 text-xs font-semibold line-clamp-1 group-hover:opacity-70 transition-opacity"
                        style={{ color: '#252450' }}>
                        {fi.title}
                      </p>
                      <span className="shrink-0 text-[10px]" style={{ color: 'rgba(37,36,80,0.25)' }}>{ago}</span>
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT: communities only ───────────────────────────────────── */}
          <div className="space-y-8">
            <section>
              <h2 className="text-[10px] font-black tracking-[0.22em] uppercase mb-4"
                style={{ color: 'rgba(37,36,80,0.3)' }}>
                Find your people
              </h2>
              <div className="space-y-1.5">
                {resources.map(r => (
                  <div key={r.id}
                    className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl transition-all hover:shadow-sm"
                    style={{ border: '1px solid rgba(37,36,80,0.07)' }}
                  >
                    <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black"
                      style={{
                        background: r.type === 'facebook' ? 'rgba(24,119,242,0.1)' : 'rgba(255,69,0,0.1)',
                        color: r.type === 'facebook' ? '#1877F2' : '#FF4500',
                      }}>
                      {r.type === 'facebook' ? 'f' : 'r/'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: '#252450' }}>{r.name}</p>
                      <p className="text-[10px] truncate" style={{ color: 'rgba(37,36,80,0.38)' }}>{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Utility links */}
            <section>
              <h2 className="text-[10px] font-black tracking-[0.22em] uppercase mb-4"
                style={{ color: 'rgba(37,36,80,0.3)' }}>
                When you need it
              </h2>
              <div className="space-y-2">
                <a href={`/${cityId}/settle`}
                  className="flex items-center justify-between px-4 py-3.5 rounded-xl group transition-all hover:-translate-y-px hover:shadow-sm"
                  style={{ background: '#FAB400' }}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'rgba(37,36,80,0.45)' }}>Settle</p>
                    <p className="text-xs font-bold" style={{ color: '#252450' }}>Registration & admin</p>
                  </div>
                  <span className="font-black opacity-40 group-hover:opacity-70 transition-opacity" style={{ color: '#252450' }}>→</span>
                </a>
                <a href={`/${cityId}/ask`}
                  className="flex items-center justify-between px-4 py-3.5 rounded-xl group transition-all hover:-translate-y-px hover:shadow-sm"
                  style={{ background: '#38C0F0' }}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'rgba(37,36,80,0.45)' }}>Ask</p>
                    <p className="text-xs font-bold" style={{ color: '#252450' }}>Any question, live answer</p>
                  </div>
                  <span className="font-black opacity-40 group-hover:opacity-70 transition-opacity" style={{ color: '#252450' }}>→</span>
                </a>
              </div>
            </section>
          </div>

        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
