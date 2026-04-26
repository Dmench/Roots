'use client'
import { use, useState, useEffect, useRef } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import { AuthModal } from '@/components/auth/AuthModal'
import AuthGate from '@/components/auth/AuthGate'
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

/* ── Curated seed content (clearly labeled, not fake activity) ───────────── */

interface CuratedPin {
  id: string
  text: string
  label: string   // shown as "Roots note" — never attributed to a fake user
}

const PINNED: Record<string, Record<string, CuratedPin[]>> = {
  brussels: {
    tips: [
      { id: 'bxl-tip-1', label: 'Roots note', text: 'Register at your commune within 8 days of arriving — this unlocks your eID, mutuelle, and everything else. Ixelles and Saint-Gilles tend to have English-speaking staff.' },
      { id: 'bxl-tip-2', label: 'Roots note', text: 'STIB\'s 12-trip card is better value than single tickets. The monthly pass is ~€59 and covers metro, tram, and bus across the whole region.' },
      { id: 'bxl-tip-3', label: 'Roots note', text: 'Mutualité Socialiste and Mutualité Chrétienne are the two dominant mutuelles. Either works — sign up within 90 days of arrival or you pay medical costs out of pocket.' },
    ],
    questions: [
      { id: 'bxl-q-1', label: 'Roots note', text: 'Common question: how long does commune registration actually take? Most communes process your dossier in 4–8 weeks, then a local police officer visits your address before the card is issued.' },
      { id: 'bxl-q-2', label: 'Roots note', text: 'People often ask about the 3-6-9 lease. It\'s a standard Belgian commercial-style residential lease — you can leave after 3, 6, or 9 years with 3 months notice. Use Ask to get the full breakdown.' },
    ],
    'heads-up': [
      { id: 'bxl-hu-1', label: 'Roots note', text: 'Rental guarantees in Brussels are capped at 2 months\' rent by law (or 3 months in a bank guarantee). If a landlord asks for more, that\'s illegal.' },
      { id: 'bxl-hu-2', label: 'Roots note', text: 'Belgian banks often require a Belgian address and eID to open a full current account. In the meantime, Wise or N26 cover you for most daily needs.' },
    ],
  },
  lisbon: {
    tips: [
      { id: 'lis-tip-1', label: 'Roots note', text: 'Get your NIF (tax number) before anything else — you need it to open a bank account, sign a lease, and access most services. It can be done at a Finanças office or via a fiscal representative.' },
      { id: 'lis-tip-2', label: 'Roots note', text: 'Viva Viagem cards work across metro, bus, tram, and some suburban trains. Zapping (pay-as-you-go) is usually better value than daily passes for casual use.' },
    ],
    questions: [
      { id: 'lis-q-1', label: 'Roots note', text: 'NHR (Non-Habitual Resident) tax regime gives a flat 20% tax rate on Portuguese-source income for 10 years. You must apply in the year you first become a tax resident.' },
    ],
    'heads-up': [
      { id: 'lis-hu-1', label: 'Roots note', text: 'AIMA (formerly SEF) appointment wait times are long — 3 to 6 months is common. Book as early as possible; some services can be handled via the online portal.' },
    ],
  },
}

/* ── Channel definitions ─────────────────────────────────────────────────── */

type ChannelId = 'tips' | 'questions' | 'heads-up' | 'events' | 'news' | 'reddit'

interface Channel {
  id:    ChannelId
  label: string
  sub:   string
  color: string
  cat?:  PostCategory
}

const CHANNELS: Channel[] = [
  { id: 'tips',      label: 'Tips',       sub: 'Locals sharing what works',      color: '#10B981', cat: 'recommendation' },
  { id: 'questions', label: 'Questions',  sub: 'Ask the community anything',      color: '#38C0F0', cat: 'question'       },
  { id: 'heads-up',  label: 'Heads-up',  sub: 'Warnings & things to know',      color: '#FAB400', cat: 'heads-up'       },
  { id: 'events',    label: 'Events',     sub: 'What\'s happening this week',     color: '#E8612A'                        },
  { id: 'news',      label: 'News',       sub: 'Curated local headlines',         color: '#4744C8'                        },
  { id: 'reddit',    label: 'Reddit',     sub: 'What the city is talking about',  color: '#FF4500'                        },
]

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
  bulletin:   { color: '#4744C8', label: 'The Bulletin' },
  politico:   { color: '#EF3340', label: 'Politico EU' },
  euobserver: { color: '#252450', label: 'EUobserver' },
  euronews:   { color: '#C8900A', label: 'Euronews' },
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr), diff = Date.now() - d.getTime(), mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ConnectPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = use(params)
  const city        = getCity(cityId)
  const { profile } = useProfile()
  const { user, loading: authLoading } = useAuth()
  const composerRef = useRef<HTMLTextAreaElement>(null)

  const [posts,       setPosts]       = useState<Post[]>([])
  const [newPost,     setNewPost]     = useState({ text: '' })
  const [submitted,   setSubmitted]   = useState(false)
  const [authOpen,    setAuthOpen]    = useState(false)
  const [feedItems,    setFeedItems]    = useState<FeedItem[]>([])
  const [feedState,    setFeedState]    = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [redditPosts,  setRedditPosts]  = useState<FeedItem[]>([])
  const [redditFetch,  setRedditFetch]  = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [activeChannel, setActiveChannel] = useState<ChannelId>('events')

  useEffect(() => {
    if (!city || !supabase) return
    supabase.from('posts').select('*').eq('city_id', cityId)
      .order('created_at', { ascending: false }).limit(100)
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

  // Fetch Reddit directly from the browser — Vercel IPs are blocked by Reddit,
  // but user IPs never are, and Reddit supports CORS on .json endpoints.
  useEffect(() => {
    if (redditFetch !== 'idle') return
    const SUB_MAP: Record<string, string> = {
      brussels: 'brussels', lisbon: 'portugal', berlin: 'berlin',
      barcelona: 'barcelona', amsterdam: 'amsterdam', prague: 'prague',
    }
    const sub = SUB_MAP[cityId] ?? cityId
    setRedditFetch('loading')
    fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=20&raw_json=1`, {
      headers: { 'Accept': 'application/json' },
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(json => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: FeedItem[] = (json.data?.children ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((c: any) => !c.data.over_18 && !c.data.stickied)
          .slice(0, 8)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((c: any) => ({
            id:          c.data.id,
            source:      'reddit' as const,
            sourceLabel: `r/${sub}`,
            category:    'community' as const,
            title:       c.data.title,
            summary:     (c.data.selftext ?? '').slice(0, 220),
            url:         `https://reddit.com${c.data.permalink}`,
            published:   c.data.created_utc,
            subreddit:   c.data.subreddit,
            flair:       c.data.link_flair_text ?? undefined,
            score:       c.data.score,
            comments:    c.data.num_comments,
            author:      c.data.author,
          }))
        setRedditPosts(items)
        setRedditFetch('done')
      })
      .catch(() => setRedditFetch('error'))
  }, [cityId, redditFetch])

  if (!city) return null
  if (authLoading) return <div className="min-h-screen bg-cream" />
  if (!user) return <AuthGate cityName={city.name} cityId={cityId}>{null}</AuthGate>

  const resources = RESOURCES.filter(r => r.cityId === cityId)
  const channel   = CHANNELS.find(c => c.id === activeChannel)!

  // Content per channel
  const newsItems   = feedItems.filter(i => i.category === 'news')
  const redditItems = redditPosts

  const eventItems = feedItems.filter(i => i.category === 'events')
    .sort((a, b) => a.published - b.published)

  // Community post counts per channel
  const postCounts: Record<string, number> = {
    tips:       posts.filter(p => p.category === 'recommendation').length,
    questions:  posts.filter(p => p.category === 'question').length,
    'heads-up': posts.filter(p => p.category === 'heads-up').length,
    events:     eventItems.length,
    news:       newsItems.length,
    reddit:     redditPosts.length,
  }

  const activePosts = channel.cat
    ? posts.filter(p => p.category === channel.cat)
    : []

  const submit = async () => {
    if (!newPost.text.trim() || !channel.cat) return
    if (!user) { setAuthOpen(true); return }
    const optimistic: Post = {
      id: `u${Date.now()}`, cityId: city.id,
      stage: profile.stage as Stage | undefined,
      category: channel.cat, text: newPost.text.trim(),
      time: 'just now', authorStage: profile.stage as Stage | undefined,
    }
    setPosts(prev => [optimistic, ...prev])
    setNewPost({ text: '' })
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    if (supabase) {
      await supabase.from('posts').insert({
        city_id: city.id, stage: profile.stage ?? null,
        category: channel.cat, text: optimistic.text,
        author_id: user.id, author_stage: profile.stage ?? null,
      })
    }
  }

  const SOURCE_COLOR: Record<string, string> = {
    visitbrussels: '#FF3EBA', magasin4: '#C62828', botanique: '#2E7D32',
    flagey: '#4744C8', halles: '#E8612A', recyclart: '#7B1FA2',
    lamonnaie: '#B8860B', meetup: '#E1523D', eventbrite: '#F05537',
    ticketmaster: '#026CDF', feu: '#FF6B00',
  }

  return (
    <div style={{ background: '#F8F7F4', minHeight: '100vh' }}>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div style={{ background: '#F5F4F0', borderBottom: '1px solid rgba(37,36,80,0.08)' }}>
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {CHANNELS.map(ch => {
              const active = ch.id === activeChannel
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className="flex-none flex items-center gap-2 px-4 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap"
                  style={{
                    color: active ? ch.color : 'rgba(37,36,80,0.4)',
                    borderBottomColor: active ? ch.color : 'transparent',
                  }}
                >
                  {ch.label}
                  {(postCounts[ch.id] ?? 0) > 0 && ch.id !== 'events' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: active ? `${ch.color}15` : 'rgba(37,36,80,0.06)', color: active ? ch.color : 'rgba(37,36,80,0.3)' }}>
                      {postCounts[ch.id]}
                    </span>
                  )}
                  {ch.id === 'events' && eventItems.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: active ? `${ch.color}15` : 'rgba(37,36,80,0.06)', color: active ? ch.color : 'rgba(37,36,80,0.3)' }}>
                      {eventItems.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">

          {/* ── LEFT: Main channel content ───────────────────────────────── */}
          <div className="min-w-0">

            {/* ── Community channels (tips / questions / heads-up) ──────── */}
            {channel.cat && (
              <>
                {/* Composer */}
                <div className="mb-6 pb-6" style={{ borderBottom: '1px solid rgba(37,36,80,0.1)' }}>
                  <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-3"
                    style={{ color: channel.color }}>
                    Post a {channel.label.toLowerCase().replace(/s$/, '')}
                  </p>
                  <textarea
                    ref={composerRef}
                    value={newPost.text}
                    onChange={e => setNewPost({ text: e.target.value.slice(0, 280) })}
                    placeholder={
                      channel.id === 'tips'      ? 'Share something that made life easier here…' :
                      channel.id === 'questions' ? 'What are you trying to figure out?' :
                      'Something others should know about…'
                    }
                    rows={3}
                    className="w-full py-2 text-sm placeholder:text-stone/30 focus:outline-none resize-none bg-transparent"
                    style={{
                      borderBottom: `1px solid rgba(37,36,80,0.12)`,
                      color: '#252450',
                      fontSize: 14,
                    }}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px]" style={{ color: 'rgba(37,36,80,0.25)' }}>{newPost.text.length}/280</span>
                      {!user && (
                        <button onClick={() => setAuthOpen(true)}
                          className="text-[10px] font-bold hover:opacity-60 transition-opacity"
                          style={{ color: '#4744C8' }}>
                          Sign in to post
                        </button>
                      )}
                    </div>
                    <button
                      onClick={submit}
                      disabled={!newPost.text.trim()}
                      className="text-xs font-bold hover:opacity-60 transition-opacity disabled:opacity-25"
                      style={{ color: channel.color }}
                    >
                      {submitted ? 'Posted ✓' : 'Post →'}
                    </button>
                  </div>
                </div>

                {/* Posts */}
                {(() => {
                  const pins = (PINNED[cityId]?.[channel.id] ?? [])
                  const allContent = [...activePosts]
                  const showPins   = allContent.length === 0

                  return (
                    <div>
                      {/* Pinned curated content */}
                      {showPins && pins.length > 0 && (
                        <>
                          <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-4"
                            style={{ color: 'rgba(37,36,80,0.25)' }}>
                            From Roots
                          </p>
                          {pins.map((pin, i) => (
                            <div key={pin.id}
                              className="flex gap-4 py-4"
                              style={{ borderTop: i > 0 ? '1px solid rgba(37,36,80,0.07)' : 'none' }}>
                              <div className="w-0.5 shrink-0 self-stretch" style={{ background: '#4744C8' }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black tracking-[0.2em] uppercase mb-1.5"
                                  style={{ color: '#4744C8' }}>
                                  {pin.label}
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: 'rgba(37,36,80,0.7)' }}>
                                  {pin.text}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(37,36,80,0.1)' }}>
                            <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-4"
                              style={{ color: 'rgba(37,36,80,0.25)' }}>
                              Community posts
                            </p>
                            <p className="text-xs py-6" style={{ color: 'rgba(37,36,80,0.3)' }}>
                              {channel.id === 'tips'      ? 'Be the first to share a tip.' :
                               channel.id === 'questions' ? 'Be the first to ask a question.' :
                               'Be the first to post a heads-up.'}
                            </p>
                          </div>
                        </>
                      )}

                      {/* Community posts */}
                      {allContent.map(post => {
                        const m = CAT_META[post.category]
                        return (
                          <div key={post.id}
                            className="flex gap-4 py-4"
                            style={{ borderTop: '1px solid rgba(37,36,80,0.07)' }}>
                            <div className="w-0.5 shrink-0 self-stretch" style={{ background: m.color }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                {post.authorStage && (
                                  <span className="text-[9px] font-black tracking-[0.15em] uppercase"
                                    style={{ color: 'rgba(37,36,80,0.3)' }}>
                                    {STAGE_LABELS[post.authorStage]}
                                  </span>
                                )}
                                <span className="text-[9px] ml-auto" style={{ color: 'rgba(37,36,80,0.2)' }}>
                                  {post.time}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed" style={{ color: 'rgba(37,36,80,0.75)' }}>
                                {post.text}
                              </p>
                            </div>
                          </div>
                        )
                      })}

                      {/* No content */}
                      {showPins && pins.length === 0 && (
                        <p className="text-xs py-8" style={{ color: 'rgba(37,36,80,0.3)' }}>
                          Be the first to post.
                        </p>
                      )}
                    </div>
                  )
                })()}
              </>
            )}

            {/* ── Events channel ───────────────────────────────────────── */}
            {channel.id === 'events' && (
              <>
                {feedState === 'loading' && (
                  <div>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex gap-4 py-4 animate-pulse"
                        style={{ borderBottom: '1px solid rgba(37,36,80,0.07)' }}>
                        <div className="w-12 h-12 bg-sand/40 shrink-0" />
                        <div className="flex-1 pt-1">
                          <div className="h-2.5 bg-sand/40 rounded w-1/4 mb-2" />
                          <div className="h-3.5 bg-sand/40 rounded w-full mb-1.5" />
                          <div className="h-2.5 bg-sand/30 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {feedState !== 'loading' && eventItems.length === 0 && (
                  <div className="py-16">
                    <p className="text-sm" style={{ color: 'rgba(37,36,80,0.35)' }}>No events found right now</p>
                  </div>
                )}
                {eventItems.length > 0 && (
                  <div>
                    {eventItems.map((fi, idx) => {
                      const diff = fi.published - Date.now() / 1000
                      const when = diff < 86400  ? 'Today'
                               : diff < 172800  ? 'Tomorrow'
                               : new Date(fi.published * 1000).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                      const dotColor = SOURCE_COLOR[fi.source] ?? '#E8612A'
                      const isLead   = idx === 0

                      return isLead ? (
                        /* Lead — full-bleed dark cinematic card, no border-radius on image */
                        <a key={fi.id} href={fi.url} target="_blank" rel="noopener noreferrer"
                          className="block mb-2 group"
                          style={{ background: '#0F0E1E', borderBottom: '2px solid rgba(255,255,255,0.04)' }}>
                          {fi.image && (
                            <div className="relative h-48 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={fi.image} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity" />
                              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, #0F0E1E 100%)' }} />
                            </div>
                          )}
                          <div className="px-5 pt-3 pb-5">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[9px] font-black tracking-[0.22em] uppercase"
                                style={{ color: dotColor }}>
                                {fi.sourceLabel}
                              </span>
                              <span className="text-[9px]" style={{ color: 'rgba(245,244,240,0.3)' }}>·</span>
                              <span className="text-[9px] font-semibold" style={{ color: 'rgba(245,244,240,0.4)' }}>{when}</span>
                            </div>
                            <p className="text-base font-bold leading-snug group-hover:opacity-70 transition-opacity"
                              style={{ color: '#F5F4F0' }}>
                              {fi.title}
                            </p>
                            {fi.summary && (
                              <p className="text-xs mt-1 line-clamp-1" style={{ color: 'rgba(245,244,240,0.35)' }}>
                                {fi.summary}
                              </p>
                            )}
                          </div>
                        </a>
                      ) : (
                        /* Secondary — editorial row with image thumb, divider */
                        <a key={fi.id} href={fi.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-start gap-4 py-3.5 group hover:opacity-70 transition-opacity"
                          style={{ borderBottom: '1px solid rgba(37,36,80,0.08)' }}>
                          {fi.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={fi.image} alt="" className="w-14 h-14 object-cover shrink-0" />
                          ) : (
                            <div className="w-14 h-14 shrink-0 flex items-center justify-center"
                              style={{ background: `${dotColor}12` }}>
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-black tracking-[0.18em] uppercase"
                                style={{ color: dotColor }}>
                                {fi.sourceLabel}
                              </span>
                              <span className="text-[9px]" style={{ color: 'rgba(37,36,80,0.3)' }}>{when}</span>
                            </div>
                            <p className="text-sm font-semibold leading-snug truncate"
                              style={{ color: '#252450' }}>
                              {fi.title}
                            </p>
                            {fi.summary && (
                              <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(37,36,80,0.4)' }}>
                                {fi.summary}
                              </p>
                            )}
                          </div>
                        </a>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── News channel ─────────────────────────────────────────── */}
            {channel.id === 'news' && (
              <>
                {feedState === 'loading' && (
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex gap-4 py-4 animate-pulse"
                        style={{ borderBottom: '1px solid rgba(37,36,80,0.07)' }}>
                        <div className="w-0.5 h-12 bg-sand/40 shrink-0" />
                        <div className="flex-1 pt-0.5">
                          <div className="h-2.5 bg-sand/40 rounded w-1/4 mb-2" />
                          <div className="h-3.5 bg-sand/40 rounded w-full mb-1.5" />
                          <div className="h-2.5 bg-sand/30 rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {feedState !== 'loading' && newsItems.length === 0 && (
                  <div className="py-16">
                    <p className="text-sm" style={{ color: 'rgba(37,36,80,0.35)' }}>No headlines right now</p>
                  </div>
                )}
                {newsItems.length > 0 && (() => {
                  const lead = newsItems[0]
                  const tier2 = newsItems.slice(1, 3)
                  const rest  = newsItems.slice(3)
                  function ago(published: number) {
                    const d = Math.floor(Date.now() / 1000) - published
                    return d < 3600 ? `${Math.floor(d / 60)}m` : d < 86400 ? `${Math.floor(d / 3600)}h` : `${Math.floor(d / 86400)}d`
                  }
                  return (
                    <div>
                      {/* Lead — full width, headline-first */}
                      {(() => {
                        const ss = SOURCE_STYLE[lead.source] ?? { color: '#252450', label: lead.sourceLabel }
                        return (
                          <a href={lead.url} target="_blank" rel="noopener noreferrer"
                            className="group block pb-6 mb-0 hover:opacity-70 transition-opacity"
                            style={{ borderBottom: '2px solid #252450' }}>
                            <p className="text-[8px] font-black tracking-[0.28em] uppercase mb-3" style={{ color: ss.color }}>
                              {ss.label}
                            </p>
                            <h3 className="font-display font-bold leading-[1.1] mb-2"
                              style={{ fontSize: 'clamp(1.3rem,3vw,1.6rem)', color: '#0F0E1E', letterSpacing: '-0.01em' }}>
                              {lead.title}
                            </h3>
                            <p className="text-[9px] font-medium" style={{ color: 'rgba(37,36,80,0.3)' }}>
                              {ago(lead.published)}
                            </p>
                          </a>
                        )
                      })()}

                      {/* Tier 2 — side by side when 2 stories */}
                      {tier2.length > 0 && (
                        <div className={`grid gap-0 ${tier2.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} mb-0`}>
                          {tier2.map((fi, i) => {
                            const ss = SOURCE_STYLE[fi.source] ?? { color: '#252450', label: fi.sourceLabel }
                            return (
                              <a key={fi.id} href={fi.url} target="_blank" rel="noopener noreferrer"
                                className="group block py-5 hover:opacity-70 transition-opacity"
                                style={{
                                  borderBottom: '1px solid rgba(37,36,80,0.12)',
                                  borderLeft: i === 1 ? '1px solid rgba(37,36,80,0.12)' : 'none',
                                  paddingLeft: i === 1 ? 16 : 0,
                                  paddingRight: i === 0 && tier2.length === 2 ? 16 : 0,
                                }}>
                                <p className="text-[8px] font-black tracking-[0.24em] uppercase mb-2" style={{ color: ss.color }}>
                                  {ss.label}
                                </p>
                                <p className="text-sm font-bold leading-snug mb-2" style={{ color: '#0F0E1E' }}>
                                  {fi.title}
                                </p>
                                <p className="text-[9px]" style={{ color: 'rgba(37,36,80,0.3)' }}>{ago(fi.published)}</p>
                              </a>
                            )
                          })}
                        </div>
                      )}

                      {/* Compact digest — remaining stories */}
                      {rest.length > 0 && (
                        <div>
                          {rest.map((fi) => {
                            const ss = SOURCE_STYLE[fi.source] ?? { color: '#252450', label: fi.sourceLabel }
                            return (
                              <a key={fi.id} href={fi.url} target="_blank" rel="noopener noreferrer"
                                className="group flex items-baseline gap-3 py-3 hover:opacity-60 transition-opacity"
                                style={{ borderBottom: '1px solid rgba(37,36,80,0.07)' }}>
                                <span className="shrink-0 text-[8px] font-black tracking-wider uppercase w-16 leading-relaxed" style={{ color: ss.color }}>
                                  {ss.label}
                                </span>
                                <span className="flex-1 text-xs font-semibold leading-snug" style={{ color: '#252450' }}>
                                  {fi.title}
                                </span>
                                <span className="shrink-0 text-[9px]" style={{ color: 'rgba(37,36,80,0.2)' }}>{ago(fi.published)}</span>
                              </a>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </>
            )}

            {/* ── Reddit channel ───────────────────────────────────────── */}
            {channel.id === 'reddit' && (
              <>
                {redditFetch === 'loading' && (
                  <div style={{ background: '#1C1A2E' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} className="px-5 py-4 animate-pulse flex gap-3"
                        style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div className="w-8 bg-white/10 rounded shrink-0" />
                        <div className="flex-1">
                          <div className="h-3 bg-white/10 rounded w-full mb-1.5" />
                          <div className="h-2.5 bg-white/8 rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {redditFetch !== 'loading' && redditItems.length === 0 && (
                  <div className="py-16">
                    <p className="text-sm" style={{ color: 'rgba(37,36,80,0.35)' }}>No Reddit posts right now</p>
                  </div>
                )}
                {redditItems.length > 0 && (
                  <div style={{ background: '#1C1A2E' }}>
                    <div className="flex items-center justify-between px-5 py-4"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black" style={{ color: '#FF4500' }}>r/{cityId}</span>
                        <span className="flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#10B981' }} />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#10B981' }} />
                          </span>
                          <span className="text-[10px]" style={{ color: 'rgba(245,236,215,0.3)' }}>live</span>
                        </span>
                      </div>
                      <a href={`https://reddit.com/r/${cityId}`} target="_blank" rel="noopener noreferrer"
                        className="text-[9px] font-black tracking-wider hover:opacity-60 transition-opacity"
                        style={{ color: 'rgba(245,236,215,0.25)', letterSpacing: '0.1em' }}>
                        OPEN ↗
                      </a>
                    </div>

                    {/* Featured top post */}
                    {(() => {
                      const top  = redditItems[0]
                      const diff = Math.floor(Date.now() / 1000) - top.published
                      const ago  = diff < 3600 ? `${Math.floor(diff / 60)}m` : diff < 86400 ? `${Math.floor(diff / 3600)}h` : `${Math.floor(diff / 86400)}d`
                      return (
                        <a href={top.url} target="_blank" rel="noopener noreferrer"
                          className="block px-5 py-5 group hover:opacity-80 transition-opacity"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="flex items-start gap-4">
                            <div className="shrink-0 text-center" style={{ minWidth: 36 }}>
                              <p className="text-2xl font-black leading-none" style={{ color: '#FF4500' }}>↑</p>
                              <p className="text-xs font-black mt-0.5" style={{ color: '#FF4500' }}>
                                {(top.score ?? 0) >= 1000 ? `${((top.score ?? 0) / 1000).toFixed(1)}k` : top.score ?? 0}
                              </p>
                            </div>
                            <div className="flex-1 min-w-0">
                              {top.flair && (
                                <span className="inline-block text-[9px] font-black px-2 py-0.5 mb-2"
                                  style={{ background: 'rgba(255,69,0,0.2)', color: '#FF4500', letterSpacing: '0.06em' }}>
                                  {top.flair.toUpperCase()}
                                </span>
                              )}
                              <p className="text-sm font-bold leading-snug" style={{ color: '#F5ECD7' }}>
                                {top.title}
                              </p>
                              <p className="text-[10px] mt-2" style={{ color: 'rgba(245,236,215,0.3)' }}>
                                {top.comments ?? 0} comments · {ago}
                              </p>
                            </div>
                          </div>
                        </a>
                      )
                    })()}

                    {redditItems.slice(1).map((fi, i) => {
                      const diff = Math.floor(Date.now() / 1000) - fi.published
                      const ago  = diff < 3600 ? `${Math.floor(diff / 60)}m` : diff < 86400 ? `${Math.floor(diff / 3600)}h` : `${Math.floor(diff / 86400)}d`
                      const maxScore = Math.max(...redditItems.map(p => p.score ?? 0))
                      const barPct   = maxScore > 0 ? Math.round(((fi.score ?? 0) / maxScore) * 100) : 0
                      return (
                        <a key={`${fi.id}-${i}`} href={fi.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 px-5 py-3.5 group hover:opacity-70 transition-opacity"
                          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="shrink-0 flex flex-col items-center gap-0.5" style={{ width: 28 }}>
                            <p className="text-[10px] font-black leading-none" style={{ color: 'rgba(255,69,0,0.7)' }}>
                              {(fi.score ?? 0) >= 1000 ? `${((fi.score ?? 0) / 1000).toFixed(1)}k` : fi.score ?? 0}
                            </p>
                            <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                              <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: '#FF4500' }} />
                            </div>
                          </div>
                          <p className="flex-1 min-w-0 text-xs font-semibold leading-snug line-clamp-2"
                            style={{ color: 'rgba(245,236,215,0.7)' }}>
                            {fi.title}
                          </p>
                          <span className="shrink-0 text-[9px]" style={{ color: 'rgba(245,236,215,0.2)' }}>{ago}</span>
                        </a>
                      )
                    })}

                    <div className="px-5 py-4 flex items-center justify-between"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <a href={`https://reddit.com/r/${cityId}`} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] font-black tracking-wider hover:opacity-60 transition-opacity"
                        style={{ color: 'rgba(245,236,215,0.3)', letterSpacing: '0.1em' }}>
                        OPEN r/{cityId} ↗
                      </a>
                      <span className="text-[9px]" style={{ color: 'rgba(245,236,215,0.15)' }}>via Reddit API</span>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

          {/* ── RIGHT: Directory + groups ─────────────────────────────────── */}
          <aside className="hidden lg:block space-y-8">

            {/* Settlers */}
            <div>
              <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-3"
                style={{ color: 'rgba(37,36,80,0.3)', borderBottom: '1px solid rgba(37,36,80,0.1)', paddingBottom: 8 }}>
                Settlers
              </p>
              <a href={`/${cityId}/people`}
                className="flex items-center justify-between py-2 group hover:opacity-60 transition-opacity">
                <p className="text-sm font-semibold" style={{ color: '#252450' }}>
                  Settler directory
                </p>
                <span className="text-xs" style={{ color: 'rgba(37,36,80,0.3)' }}>→</span>
              </a>
              <p className="text-xs" style={{ color: 'rgba(37,36,80,0.4)' }}>
                Who else is settling in {city.name}
              </p>
            </div>

            {/* Community groups */}
            {resources.length > 0 && (
              <div>
                <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-3"
                  style={{ color: 'rgba(37,36,80,0.3)', borderBottom: '1px solid rgba(37,36,80,0.1)', paddingBottom: 8 }}>
                  Community groups
                </p>
                <div>
                  {resources.map((r, i) => (
                    <div key={r.id}
                      className="flex items-center gap-2.5 py-2.5 hover:opacity-60 transition-opacity"
                      style={{ borderBottom: i < resources.length - 1 ? '1px solid rgba(37,36,80,0.06)' : 'none' }}>
                      <span className="text-[9px] font-black shrink-0 w-4"
                        style={{ color: r.type === 'facebook' ? '#1877F2' : '#FF4500' }}>
                        {r.type === 'facebook' ? 'fb' : 'r/'}
                      </span>
                      <p className="text-xs truncate" style={{ color: '#252450' }}>{r.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
