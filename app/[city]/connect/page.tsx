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

type ChannelId = 'tips' | 'questions' | 'heads-up' | 'news' | 'reddit'

interface Channel {
  id:       ChannelId
  label:    string
  sub:      string
  color:    string
  cat?:     PostCategory   // maps to post category if community channel
  icon:     string
}

const CHANNELS: Channel[] = [
  { id: 'tips',      label: 'Tips',       sub: 'Locals sharing what works',      color: '#10B981', cat: 'recommendation', icon: '💡' },
  { id: 'questions', label: 'Questions',  sub: 'Ask the community anything',      color: '#38C0F0', cat: 'question',       icon: '❓' },
  { id: 'heads-up',  label: 'Heads-up',  sub: 'Warnings & things to know',      color: '#FAB400', cat: 'heads-up',       icon: '⚠️' },
  { id: 'news',      label: 'News',       sub: 'Curated local headlines',         color: '#4744C8', icon: '📰' },
  { id: 'reddit',    label: 'Reddit',     sub: `What the city is talking about`,  color: '#FF4500', icon: '🔴' },
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
  const { user }    = useAuth()
  const composerRef = useRef<HTMLTextAreaElement>(null)

  const [posts,       setPosts]       = useState<Post[]>([])
  const [newPost,     setNewPost]     = useState({ text: '' })
  const [submitted,   setSubmitted]   = useState(false)
  const [authOpen,    setAuthOpen]    = useState(false)
  const [feedItems,   setFeedItems]   = useState<FeedItem[]>([])
  const [feedState,   setFeedState]   = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [activeChannel, setActiveChannel] = useState<ChannelId>('tips')

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

  if (!city) return null

  const resources = RESOURCES.filter(r => r.cityId === cityId)
  const channel   = CHANNELS.find(c => c.id === activeChannel)!

  // Content per channel
  const newsItems   = feedItems.filter(i => i.category === 'news')
  const redditItems = feedItems.filter(i => i.source === 'reddit').slice(0, 8)

  // Community post counts per channel
  const postCounts: Record<string, number> = {
    tips:       posts.filter(p => p.category === 'recommendation').length,
    questions:  posts.filter(p => p.category === 'question').length,
    'heads-up': posts.filter(p => p.category === 'heads-up').length,
    news:       newsItems.length,
    reddit:     redditItems.length,
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

  return (
    <div style={{ background: '#F8F7F4', minHeight: '100vh' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 md:px-12 pt-10 pb-10" style={{ background: '#F5F4F0' }}>
        <div className="absolute rounded-full pointer-events-none opacity-60"
          style={{ background: '#4744C8', width: 220, height: 220, top: -100, right: -60 }} />
        <div className="absolute rounded-full pointer-events-none opacity-50"
          style={{ background: '#FF3EBA', width: 80, height: 80, bottom: -30, right: '28%' }} />
        <div className="max-w-5xl mx-auto relative">
          <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-4"
            style={{ color: 'rgba(37,36,80,0.3)' }}>
            Connect · {city.name}
          </p>
          <h1 className="font-display font-black leading-[0.82] mb-4"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: '#252450' }}>
            Community.
          </h1>
          <p className="text-sm max-w-sm" style={{ color: 'rgba(37,36,80,0.45)' }}>
            Tips, questions, local news, and what {city.name} is talking about — each in its own space.
          </p>
        </div>
      </div>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">

          {/* ── LEFT: Channel nav ────────────────────────────────────────── */}
          <aside>
            <p className="text-[9px] font-black tracking-[0.2em] uppercase mb-3"
              style={{ color: 'rgba(37,36,80,0.3)' }}>
              Channels
            </p>
            <nav className="space-y-1">
              {CHANNELS.map(ch => {
                const active = ch.id === activeChannel
                const count  = postCounts[ch.id] ?? 0
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={cn(
                      'w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center gap-3 group',
                      active ? 'shadow-sm' : 'hover:bg-white/60'
                    )}
                    style={active
                      ? { background: '#fff', border: `1px solid ${ch.color}30`, boxShadow: `0 0 0 1px ${ch.color}18` }
                      : { border: '1px solid transparent' }
                    }
                  >
                    <span className="text-sm shrink-0 leading-none">{ch.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs font-bold leading-tight truncate', active ? '' : 'group-hover:opacity-80')}
                        style={{ color: active ? ch.color : 'rgba(37,36,80,0.65)' }}>
                        #{ch.label}
                      </p>
                      <p className="text-[9px] leading-tight mt-0.5 truncate"
                        style={{ color: 'rgba(37,36,80,0.35)' }}>
                        {ch.sub}
                      </p>
                    </div>
                    {count > 0 && (
                      <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                        style={{
                          background: active ? `${ch.color}18` : 'rgba(37,36,80,0.06)',
                          color: active ? ch.color : 'rgba(37,36,80,0.3)',
                        }}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Find your people */}
            <div className="mt-8">
              <p className="text-[9px] font-black tracking-[0.2em] uppercase mb-3"
                style={{ color: 'rgba(37,36,80,0.3)' }}>
                Groups
              </p>
              <div className="space-y-1">
                {resources.map(r => (
                  <div key={r.id}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white/60 rounded-xl hover:bg-white transition-all"
                    style={{ border: '1px solid rgba(37,36,80,0.06)' }}>
                    <div className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black"
                      style={{
                        background: r.type === 'facebook' ? 'rgba(24,119,242,0.1)' : 'rgba(255,69,0,0.1)',
                        color: r.type === 'facebook' ? '#1877F2' : '#FF4500',
                      }}>
                      {r.type === 'facebook' ? 'f' : 'r/'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold truncate" style={{ color: '#252450' }}>{r.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ── RIGHT: Channel content ───────────────────────────────────── */}
          <div className="min-w-0">

            {/* Channel header */}
            <div className="flex items-center gap-3 mb-6 pb-5"
              style={{ borderBottom: '2px solid rgba(37,36,80,0.06)' }}>
              <span className="text-xl leading-none">{channel.icon}</span>
              <div>
                <h2 className="text-lg font-black leading-tight" style={{ color: '#252450' }}>
                  #{channel.label}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(37,36,80,0.4)' }}>{channel.sub}</p>
              </div>
              {channel.cat && (
                <div className="ml-auto shrink-0">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: channel.color }} />
                </div>
              )}
            </div>

            {/* ── Community channels (tips / questions / heads-up) ──────── */}
            {channel.cat && (
              <>
                {/* Composer */}
                <div className="bg-white rounded-2xl p-5 mb-6"
                  style={{ border: `1px solid ${channel.color}25`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">{channel.icon}</span>
                    <p className="text-xs font-bold" style={{ color: channel.color }}>
                      Post a {channel.label.toLowerCase().replace(/s$/, '')}
                    </p>
                  </div>
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
                    className="w-full px-4 py-3 rounded-xl text-sm placeholder:text-stone/40 focus:outline-none resize-none"
                    style={{
                      background: '#F8F7F4',
                      border: '1px solid rgba(37,36,80,0.08)',
                      color: '#252450',
                      fontSize: 15,
                    }}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'rgba(37,36,80,0.25)' }}>{newPost.text.length}/280</span>
                      {profile.stage && (
                        <span className="text-xs" style={{ color: 'rgba(37,36,80,0.3)' }}>
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
                      className="px-5 py-2 text-xs font-bold text-white rounded-lg transition-all disabled:opacity-25 hover:opacity-90"
                      style={{ background: channel.color }}
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
                    <div className="space-y-2">
                      {/* Pinned curated content — shown until community posts exist */}
                      {showPins && pins.length > 0 && (
                        <>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-3"
                            style={{ color: 'rgba(37,36,80,0.25)' }}>
                            From Roots
                          </p>
                          {pins.map(pin => (
                            <div key={pin.id}
                              className="rounded-xl overflow-hidden flex"
                              style={{ border: '1px solid rgba(71,68,200,0.12)', background: 'rgba(71,68,200,0.03)' }}>
                              <div className="w-1 shrink-0" style={{ background: '#4744C8' }} />
                              <div className="flex-1 min-w-0 px-5 py-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(71,68,200,0.1)', color: '#4744C8' }}>
                                    {pin.label}
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: 'rgba(37,36,80,0.7)' }}>
                                  {pin.text}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 pb-1">
                            <div className="h-px" style={{ background: 'rgba(37,36,80,0.06)' }} />
                            <p className="text-[9px] font-black uppercase tracking-widest mt-3 mb-1"
                              style={{ color: 'rgba(37,36,80,0.25)' }}>
                              Community posts
                            </p>
                          </div>
                          <div className="py-8 text-center rounded-xl"
                            style={{ border: '1.5px dashed rgba(37,36,80,0.1)' }}>
                            <p className="text-xs font-bold mb-1" style={{ color: '#252450' }}>
                              Be the first to post in #{channel.label}
                            </p>
                            <p className="text-[10px]" style={{ color: 'rgba(37,36,80,0.35)' }}>
                              {channel.id === 'tips'      ? 'Share something that made life in this city easier.' :
                               channel.id === 'questions' ? 'Ask anything — someone in the community will answer.' :
                               'Flag something others should know about.'}
                            </p>
                          </div>
                        </>
                      )}

                      {/* Community posts */}
                      {allContent.map(post => {
                        const m = CAT_META[post.category]
                        return (
                          <div key={post.id}
                            className="bg-white rounded-xl overflow-hidden flex"
                            style={{ border: '1px solid rgba(37,36,80,0.07)' }}>
                            <div className="w-1 shrink-0" style={{ background: m.color }} />
                            <div className="flex-1 min-w-0 px-5 py-4">
                              <div className="flex items-center gap-2 mb-2">
                                {post.authorStage && (
                                  <span className="text-[10px]" style={{ color: 'rgba(37,36,80,0.35)' }}>
                                    {STAGE_LABELS[post.authorStage]}
                                  </span>
                                )}
                                <span className="text-[10px] ml-auto" style={{ color: 'rgba(37,36,80,0.25)' }}>
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

                      {/* No pins, no posts */}
                      {showPins && pins.length === 0 && (
                        <div className="py-16 text-center">
                          <p className="text-3xl mb-3">{channel.icon}</p>
                          <p className="text-xs" style={{ color: 'rgba(37,36,80,0.35)' }}>
                            Be the first to post in #{channel.label}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </>
            )}

            {/* ── News channel ─────────────────────────────────────────── */}
            {channel.id === 'news' && (
              <>
                {feedState === 'loading' && (
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="bg-white rounded-xl p-5 animate-pulse"
                        style={{ border: '1px solid rgba(37,36,80,0.06)' }}>
                        <div className="h-3 bg-sand/40 rounded w-1/4 mb-3" />
                        <div className="h-4 bg-sand/40 rounded w-full mb-1.5" />
                        <div className="h-3 bg-sand/30 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                )}
                {feedState !== 'loading' && newsItems.length === 0 && (
                  <div className="py-16 text-center">
                    <p className="text-3xl mb-3">📰</p>
                    <p className="text-sm" style={{ color: 'rgba(37,36,80,0.35)' }}>No headlines right now</p>
                  </div>
                )}
                {newsItems.length > 0 && (
                  <div className="space-y-3">
                    {newsItems.map((fi, idx) => {
                      const ss   = SOURCE_STYLE[fi.source] ?? { color: '#252450', label: fi.sourceLabel }
                      const diff = Math.floor(Date.now() / 1000) - fi.published
                      const ago  = diff < 3600  ? `${Math.floor(diff / 60)}m`
                                 : diff < 86400 ? `${Math.floor(diff / 3600)}h`
                                 : `${Math.floor(diff / 86400)}d`
                      const isLead = idx === 0
                      return isLead ? (
                        <a key={`${fi.id}-${idx}`} href={fi.url} target="_blank" rel="noopener noreferrer"
                          className="block rounded-2xl overflow-hidden group hover:shadow-md transition-all"
                          style={{ background: ss.color }}>
                          <div className="px-6 pt-5 pb-1">
                            <p className="text-[9px] font-black tracking-[0.18em] uppercase"
                              style={{ color: 'rgba(255,255,255,0.5)' }}>
                              {ss.label} · {ago}
                            </p>
                          </div>
                          <div className="px-6 pb-6 pt-3">
                            <p className="text-xl font-bold leading-snug group-hover:opacity-80 transition-opacity"
                              style={{ color: '#fff' }}>
                              {fi.title}
                            </p>
                            <p className="text-[10px] mt-4 font-medium"
                              style={{ color: 'rgba(255,255,255,0.4)' }}>
                              Read full story ↗
                            </p>
                          </div>
                        </a>
                      ) : (
                        <a key={`${fi.id}-${idx}`} href={fi.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-start gap-0 rounded-xl overflow-hidden group hover:shadow-sm transition-all bg-white"
                          style={{ border: '1px solid rgba(37,36,80,0.07)' }}>
                          <div className="w-1 shrink-0 self-stretch" style={{ background: ss.color }} />
                          <div className="flex-1 min-w-0 px-4 py-4">
                            <div className="flex items-center gap-2 mb-1.5">
                              <p className="text-[9px] font-black tracking-wider uppercase"
                                style={{ color: ss.color }}>
                                {ss.label}
                              </p>
                              <span className="text-[9px]" style={{ color: 'rgba(37,36,80,0.25)' }}>{ago}</span>
                            </div>
                            <p className="text-sm font-semibold leading-snug group-hover:opacity-60 transition-opacity"
                              style={{ color: '#252450' }}>
                              {fi.title}
                            </p>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── Reddit channel ───────────────────────────────────────── */}
            {channel.id === 'reddit' && (
              <>
                {feedState === 'loading' && (
                  <div className="rounded-2xl overflow-hidden" style={{ background: '#1C1A2E' }}>
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
                {feedState !== 'loading' && redditItems.length === 0 && (
                  <div className="py-16 text-center">
                    <p className="text-3xl mb-3">🔴</p>
                    <p className="text-sm" style={{ color: 'rgba(37,36,80,0.35)' }}>No Reddit posts right now</p>
                  </div>
                )}
                {redditItems.length > 0 && (
                  <div className="rounded-2xl overflow-hidden" style={{ background: '#1C1A2E' }}>
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
                                <span className="inline-block text-[9px] font-black px-2 py-0.5 rounded-full mb-2"
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
        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
