'use client'
import { use, useState, useEffect } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import { AuthModal } from '@/components/auth/AuthModal'
import { getCity, STAGES } from '@/lib/data/cities'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Post, PostCategory, Stage } from '@/lib/types'
import type { FeedItem, FeedCategory } from '@/app/api/feeds/route'

const SEED_POSTS: Post[] = [
  { id: 's1', cityId: 'brussels', stage: 'just_arrived', category: 'recommendation',
    text: 'Partenamut in Ixelles has an English-speaking advisor on Tuesday afternoons. Ask specifically for the international desk — makes the mutuelle process so much easier.',
    time: '2 days ago', authorStage: 'just_arrived' },
  { id: 's2', cityId: 'brussels', stage: 'settling', category: 'heads-up',
    text: 'Molenbeek and Anderlecht registration offices have longer waits than Etterbeek right now. Worth calling ahead before booking your appointment.',
    time: '1 day ago', authorStage: 'settling' },
  { id: 's3', cityId: 'brussels', stage: 'just_arrived', category: 'question',
    text: 'Does anyone know which commune is fastest right now for registration? Heard Etterbeek and Woluwe-Saint-Lambert have shorter waits than Ixelles.',
    time: '1 day ago', authorStage: 'just_arrived' },
  { id: 's4', cityId: 'lisbon', stage: 'just_arrived', category: 'recommendation',
    text: 'Go to the Finanças office in Areeiro for your NIF — shorter queues than downtown. Bring your passport, a utility bill, and arrive before 9am.',
    time: '3 days ago', authorStage: 'just_arrived' },
  { id: 's5', cityId: 'lisbon', stage: 'settling', category: 'question',
    text: 'Has anyone applied for NHR recently? I\'ve seen conflicting info on whether the new IFICI regime affects remote workers or just highly qualified professions.',
    time: '2 days ago', authorStage: 'settling' },
  { id: 's6', cityId: 'lisbon', stage: 'settled', category: 'recommendation',
    text: 'For house-hunting in Lisbon: Idealista is best but set alerts and visit within hours. Good apartments in Príncipe Real and Mouraria go the same day.',
    time: '1 week ago', authorStage: 'settled' },
]

interface Resource { id: string; cityId: string; name: string; type: 'facebook' | 'reddit'; desc: string }

const RESOURCES: Resource[] = [
  { id: 'r1', cityId: 'brussels', name: 'Brussels Expats', type: 'facebook', desc: 'The main community hub — housing, admin, jobs, social.' },
  { id: 'r2', cityId: 'brussels', name: 'English Speaking Brussels', type: 'facebook', desc: 'Jobs, housing, lifestyle, events — very active.' },
  { id: 'r3', cityId: 'brussels', name: 'r/brussels', type: 'reddit', desc: 'Local news, tips, restaurant recommendations, events.' },
  { id: 'r4', cityId: 'brussels', name: 'Moving to Brussels', type: 'facebook', desc: 'Practical info specifically for new arrivals.' },
  { id: 'r5', cityId: 'brussels', name: 'Brussels Housing & Rentals', type: 'facebook', desc: 'Apartment listings and flatmate search.' },
  { id: 'r6', cityId: 'brussels', name: 'EU Bubble', type: 'reddit', desc: 'EU institutions, expat life, career in Brussels.' },
  { id: 'r7', cityId: 'lisbon', name: 'Lisbon Expat Community', type: 'facebook', desc: 'The main hub — visas, housing, events, advice.' },
  { id: 'r8', cityId: 'lisbon', name: 'r/portugal', type: 'reddit', desc: 'National subreddit — good for news and general expat discussion.' },
  { id: 'r9', cityId: 'lisbon', name: 'r/pliving', type: 'reddit', desc: 'Portugal living — visas, NHR, housing, daily life.' },
  { id: 'r10', cityId: 'lisbon', name: 'Lisbon Digital Nomads', type: 'facebook', desc: 'Remote workers in Lisbon — coworking, events, admin tips.' },
  { id: 'r11', cityId: 'lisbon', name: 'Lisbon Housing & Renting', type: 'facebook', desc: 'Apartments, rooms, flatmate search in Lisbon.' },
  { id: 'r12', cityId: 'lisbon', name: 'NHR Portugal Community', type: 'facebook', desc: 'Tax regime questions, official updates, accountant recommendations.' },
]

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr), diff = Date.now() - d.getTime(), mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function timeAgo(unixSec: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSec
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

const CAT_COLORS: Record<PostCategory, string> = {
  recommendation: '#10B981',
  question:       '#38C0F0',
  'heads-up':     '#FAB400',
}

const STAGE_LABELS: Record<Stage, string> = {
  planning: 'Planning', just_arrived: 'Just arrived', settling: 'Getting settled', settled: 'Settled',
}

const SOURCE_STYLE: Record<string, { bg: string; color: string }> = {
  reddit:       { bg: 'rgba(255,69,0,0.1)',    color: '#FF4500' },
  bulletin:     { bg: 'rgba(71,68,200,0.1)',   color: '#4744C8' },
  expatica:     { bg: 'rgba(16,185,129,0.1)',  color: '#10B981' },
  btimes:       { bg: 'rgba(37,36,80,0.1)',    color: '#252450' },
  politico:     { bg: 'rgba(239,51,64,0.1)',   color: '#EF3340' },
  eventbrite:   { bg: 'rgba(250,110,40,0.1)',  color: '#F05537' },
  euobserver:   { bg: 'rgba(37,36,80,0.1)',    color: '#252450' },
  euronews:     { bg: 'rgba(250,180,0,0.12)',  color: '#C8900A' },
  meetup:       { bg: 'rgba(237,26,59,0.1)',   color: '#ED1A3B' },
  ticketmaster: { bg: 'rgba(0,115,230,0.1)',   color: '#0073E6' },
}

type Tab = 'feed' | 'whats-on' | 'resources'

export default function ConnectPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = use(params)
  const city    = getCity(cityId)
  const { profile } = useProfile()
  const { user }    = useAuth()

  const [activeTab,    setActiveTab]    = useState<Tab>('feed')
  const [stageFilter,  setStageFilter]  = useState<Stage | 'all'>('all')
  const [catFilter,    setCatFilter]    = useState<PostCategory | 'all'>('all')
  const [posts,        setPosts]        = useState<Post[]>([])
  const [newPost,      setNewPost]      = useState({ category: 'recommendation' as PostCategory, text: '' })
  const [submitted,    setSubmitted]    = useState(false)
  const [authOpen,     setAuthOpen]     = useState(false)
  const [feedItems,    setFeedItems]    = useState<FeedItem[]>([])
  const [feedCounts,   setFeedCounts]   = useState<Record<string, number>>({})
  const [feedState,    setFeedState]    = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [feedCat,      setFeedCat]      = useState<FeedCategory | 'all'>('all')

  useEffect(() => {
    if (!city) return
    if (!supabase) { setPosts(SEED_POSTS.filter(p => p.cityId === cityId)); return }
    supabase.from('posts').select('*').eq('city_id', cityId).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPosts(data.map(p => ({
            id: p.id, cityId: p.city_id, stage: p.stage ?? undefined,
            category: p.category as PostCategory, text: p.text,
            time: formatRelative(p.created_at), authorStage: p.author_stage ?? undefined,
          })))
        } else {
          setPosts(SEED_POSTS.filter(p => p.cityId === cityId))
        }
      })
  }, [cityId, city])

  useEffect(() => {
    if (activeTab !== 'whats-on' || feedState !== 'idle') return
    setFeedState('loading')
    fetch(`/api/feeds?city=${cityId}`)
      .then(r => r.json())
      .then(data => { setFeedItems(data.items ?? []); setFeedCounts(data.counts ?? {}); setFeedState('done') })
      .catch(() => setFeedState('error'))
  }, [activeTab, cityId, feedState])

  if (!city) return null

  const filtered = posts.filter(p => {
    if (stageFilter !== 'all' && p.stage !== stageFilter) return false
    if (catFilter   !== 'all' && p.category !== catFilter) return false
    return true
  })

  const resources = RESOURCES.filter(r => r.cityId === cityId)

  const submit = async () => {
    if (!newPost.text.trim()) return
    if (!user) { setAuthOpen(true); return }
    const optimistic: Post = {
      id: `u${Date.now()}`, cityId: city.id, stage: profile.stage as Stage | undefined,
      category: newPost.category, text: newPost.text.trim(), time: 'just now',
      authorStage: profile.stage as Stage | undefined,
    }
    setPosts(prev => [optimistic, ...prev])
    setNewPost({ category: 'recommendation', text: '' })
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
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-14 md:py-20">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone mb-4 font-medium">Connect · {city.name}</p>
          <h1 className="font-display font-bold text-espresso leading-tight" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)' }}>
            {city.name}<br />community.
          </h1>
        </div>
        {/* Live stats — only when feed loaded */}
        {feedState === 'done' && (
          <div className="shrink-0 hidden sm:flex flex-col gap-2 pt-1 items-end">
            {(feedCounts.events ?? 0) > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-sand/50">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
                <span className="text-xs font-semibold text-espresso">{feedCounts.events} events</span>
              </div>
            )}
            {(feedCounts.community ?? 0) > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-sand/50">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF3EBA' }} />
                <span className="text-xs font-semibold text-espresso">{feedCounts.community} posts</span>
              </div>
            )}
            {(feedCounts.news ?? 0) > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-sand/50">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4744C8' }} />
                <span className="text-xs font-semibold text-espresso">{feedCounts.news} news</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="flex gap-0 mb-10 border-b border-sand/50">
        {([
          { id: 'feed',      label: 'Feed' },
          { id: 'whats-on',  label: "What's On" },
          { id: 'resources', label: 'Communities' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn('px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px')}
            style={activeTab === tab.id
              ? { borderBottomColor: '#FF3EBA', color: '#FF3EBA' }
              : { borderBottomColor: 'transparent', color: 'rgba(74,63,50,0.5)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Feed ─────────────────────────────────────────────────────── */}
      {activeTab === 'feed' && (
        <div>
          {/* Composer */}
          <div className="bg-white rounded-2xl border border-sand/50 p-5 mb-8 shadow-sm">
            <div className="flex gap-2 mb-4">
              {(['recommendation', 'question', 'heads-up'] as PostCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setNewPost(p => ({ ...p, category: cat }))}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold capitalize transition-all rounded-lg',
                    newPost.category === cat ? 'text-white' : 'bg-ivory border border-sand/60 text-walnut/60 hover:border-walnut/30 hover:text-espresso'
                  )}
                  style={newPost.category === cat ? { background: CAT_COLORS[cat] } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
            <textarea
              value={newPost.text}
              onChange={e => setNewPost(p => ({ ...p, text: e.target.value.slice(0, 280) }))}
              placeholder="A tip, a question, or something others should know…"
              rows={3}
              className="w-full px-4 py-3 border border-sand/50 rounded-xl text-sm text-espresso placeholder:text-stone/50 focus:outline-none focus:border-terracotta/30 resize-none transition-colors bg-cream"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-stone">{newPost.text.length}/280</span>
                {profile.stage && <span className="text-xs text-stone">As: {STAGE_LABELS[profile.stage as Stage]}</span>}
                {!user && (
                  <button onClick={() => setAuthOpen(true)} className="text-xs font-semibold hover:opacity-80 transition-opacity" style={{ color: '#3D3CAC' }}>
                    Sign in to post
                  </button>
                )}
              </div>
              <button
                onClick={submit}
                disabled={!newPost.text.trim()}
                className="px-5 py-2 text-xs font-semibold transition-opacity disabled:opacity-30 text-white rounded-lg"
                style={{ background: '#3D3CAC' }}
              >
                {submitted ? 'Posted ✓' : 'Post'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(['all', ...STAGES.map(s => s.id)] as const).map(id => (
              <button
                key={id}
                onClick={() => setStageFilter(id as Stage | 'all')}
                className="px-3 py-1.5 text-xs font-medium transition-all rounded-lg"
                style={stageFilter === id
                  ? { background: '#FAB400', color: '#0D0C0A' }
                  : { background: 'white', border: '1px solid rgba(216,202,187,0.7)', color: 'rgba(74,63,50,0.6)' }
                }
              >
                {id === 'all' ? 'All stages' : STAGES.find(s => s.id === id)?.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-8">
            {(['all', 'recommendation', 'question', 'heads-up'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className="px-3 py-1.5 text-xs font-medium capitalize transition-all rounded-lg"
                style={catFilter === cat
                  ? { background: cat === 'all' ? '#FAB400' : CAT_COLORS[cat as PostCategory], color: cat === 'all' ? '#0D0C0A' : 'white' }
                  : { background: 'white', border: '1px solid rgba(216,202,187,0.7)', color: 'rgba(74,63,50,0.6)' }
                }
              >
                {cat === 'all' ? 'All types' : cat}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-walnut/50 text-sm py-10 text-center">No posts match this filter.</p>
            ) : (
              filtered.map(post => (
                <div key={post.id} className="bg-white rounded-xl border border-sand/50 p-5 flex gap-4">
                  {/* Left accent bar */}
                  <div className="w-[3px] rounded-full shrink-0 self-stretch" style={{ background: CAT_COLORS[post.category] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-xs font-semibold capitalize" style={{ color: CAT_COLORS[post.category] }}>
                        {post.category}
                      </span>
                      {post.authorStage && (
                        <span className="text-xs text-stone">· {STAGE_LABELS[post.authorStage]}</span>
                      )}
                      <span className="text-xs text-stone/50 ml-auto">{post.time}</span>
                    </div>
                    <p className="text-sm text-walnut/80 leading-relaxed">{post.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── What's On ────────────────────────────────────────────────── */}
      {activeTab === 'whats-on' && (
        <div>
          {/* Segment control */}
          {feedState === 'done' && feedItems.length > 0 && (() => {
            const segs = (
              [
                { id: 'all'       as const, label: 'All' },
                { id: 'events'    as const, label: 'Events' },
                { id: 'news'      as const, label: 'News' },
                { id: 'community' as const, label: 'Community' },
              ] as const
            ).filter(s => s.id === 'all' || (feedCounts[s.id] ?? 0) > 0)
            return (
              <div className="flex gap-1 p-1 bg-ivory rounded-xl mb-8 border border-sand/40">
                {segs.map(seg => (
                  <button
                    key={seg.id}
                    onClick={() => setFeedCat(seg.id)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5"
                    style={feedCat === seg.id
                      ? { background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#1A1209' }
                      : { color: 'rgba(74,63,50,0.5)' }
                    }
                  >
                    {seg.label}
                    {seg.id !== 'all' && (feedCounts[seg.id] ?? 0) > 0 && (
                      <span className="opacity-50">{feedCounts[seg.id]}</span>
                    )}
                  </button>
                ))}
              </div>
            )
          })()}

          {/* Loading */}
          {feedState === 'loading' && (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="bg-white rounded-xl border border-sand/50 p-5 animate-pulse flex gap-4">
                  <div className="w-10 shrink-0">
                    <div className="h-3 bg-sand/60 rounded w-8 mb-2" />
                    <div className="h-6 bg-sand/50 rounded w-8" />
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-sand/40 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-sand/30 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {feedState === 'error' && (
            <div className="bg-white rounded-xl border border-sand/50 p-8 text-center">
              <p className="text-walnut/60 text-sm mb-2">Couldn&apos;t load the feed right now.</p>
              <button onClick={() => setFeedState('idle')} className="text-xs font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity" style={{ color: '#4744C8' }}>
                Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {feedState === 'done' && feedItems.length === 0 && (
            <p className="text-walnut/50 text-sm py-10 text-center">Nothing found right now — check back soon.</p>
          )}

          {/* Content */}
          {feedState === 'done' && feedItems.length > 0 && (() => {
            const visible   = feedCat === 'all' ? feedItems : feedItems.filter(i => i.category === feedCat)
            const events    = visible.filter(i => i.category === 'events')
            const nonEvents = visible.filter(i => i.category !== 'events')

            return (
              <div className="space-y-10">

                {/* Events — date-column cards */}
                {events.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-stone">Upcoming Events</h2>
                      <div className="flex-1 h-px bg-sand/50" />
                      <span className="text-xs text-stone/40">{events.length}</span>
                    </div>
                    <div className="space-y-2">
                      {events.map(item => {
                        const d     = new Date(item.published * 1000)
                        const mon   = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
                        const day   = d.getDate()
                        const ss    = SOURCE_STYLE[item.source] ?? SOURCE_STYLE.ticketmaster
                        return (
                          <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 bg-white rounded-xl border border-sand/50 px-5 py-4 hover:border-sand hover:shadow-md hover:shadow-espresso/5 transition-all group"
                          >
                            {/* Date */}
                            <div className="shrink-0 w-9 text-center">
                              <div className="text-[9px] font-black tracking-widest" style={{ color: '#10B981' }}>{mon}</div>
                              <div className="text-xl font-black text-espresso leading-none mt-0.5">{day}</div>
                            </div>
                            <div className="w-px h-8 bg-sand/60 shrink-0" />
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-espresso leading-snug truncate group-hover:text-terracotta transition-colors">
                                {item.title}
                              </p>
                              {item.summary && (
                                <p className="text-xs text-walnut/50 mt-0.5 truncate">{item.summary}</p>
                              )}
                            </div>
                            {/* Source */}
                            <span className="shrink-0 text-xs px-2.5 py-1 rounded-full font-bold hidden sm:inline-block" style={{ background: ss.bg, color: ss.color }}>
                              {item.sourceLabel}
                            </span>
                          </a>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* News & Community — compact grouped rows */}
                {nonEvents.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-stone">
                        {feedCat === 'community' ? 'Community' : feedCat === 'news' ? 'News' : 'News & Community'}
                      </h2>
                      <div className="flex-1 h-px bg-sand/50" />
                      <span className="text-xs text-stone/40">{nonEvents.length}</span>
                    </div>
                    <div className="rounded-xl border border-sand/50 overflow-hidden divide-y divide-sand/40">
                      {nonEvents.map(item => {
                        const ss = SOURCE_STYLE[item.source] ?? SOURCE_STYLE.reddit
                        return (
                          <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-white px-5 py-3.5 hover:bg-parchment/30 transition-colors group"
                          >
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: ss.bg, color: ss.color }}>
                              {item.sourceLabel}
                            </span>
                            <p className="flex-1 min-w-0 text-sm text-espresso font-medium leading-snug line-clamp-1 group-hover:text-terracotta transition-colors">
                              {item.title}
                            </p>
                            {item.source === 'reddit' && item.score !== undefined && (
                              <span className="shrink-0 text-xs text-stone/40 hidden sm:inline">↑{item.score}</span>
                            )}
                            <span className="shrink-0 text-xs text-stone/40">{timeAgo(item.published)}</span>
                          </a>
                        )
                      })}
                    </div>
                  </section>
                )}

              </div>
            )
          })()}
        </div>
      )}

      {/* ── Communities ──────────────────────────────────────────────── */}
      {activeTab === 'resources' && (
        <div>
          <p className="text-walnut/60 text-sm mb-8 leading-relaxed max-w-md">
            Every active {city.name} community — the groups expats actually use — in one place.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resources.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-sand/50 p-5 hover:border-sand hover:shadow-md hover:shadow-espresso/4 transition-all">
                <div className="flex items-start gap-3">
                  <div
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      background: r.type === 'facebook' ? 'rgba(24,119,242,0.12)' : 'rgba(255,69,0,0.12)',
                      color: r.type === 'facebook' ? '#1877F2' : '#FF4500',
                    }}
                  >
                    {r.type === 'facebook' ? 'f' : 'r/'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-espresso mb-1">{r.name}</p>
                    <p className="text-xs text-walnut/60 leading-snug">{r.desc}</p>
                    <span
                      className="inline-block mt-3 text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                      style={{
                        background: r.type === 'facebook' ? 'rgba(24,119,242,0.1)' : 'rgba(255,69,0,0.1)',
                        color: r.type === 'facebook' ? '#1877F2' : '#FF4500',
                      }}
                    >
                      {r.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 bg-ivory rounded-xl border border-sand/40 p-5">
            <p className="text-xs text-stone">
              Know a community we&apos;re missing? Post it in the{' '}
              <button onClick={() => setActiveTab('feed')} className="underline hover:text-walnut transition-colors">Feed</button>.
            </p>
          </div>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
