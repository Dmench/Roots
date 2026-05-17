'use client'
import { use, useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/hooks/use-auth'
import { AuthModal } from '@/components/auth/AuthModal'
import AuthGate from '@/components/auth/AuthGate'
import { getCity } from '@/lib/data/cities'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Post, PostCategory, Stage, PostComment, CityId } from '@/lib/types'
import type { FeedItem } from '@/app/api/feeds/route'
import { GeometricThread } from '@/components/layout/GeometricThread'
import { PageMasthead } from '@/components/layout/PageMasthead'
import WeeklyMatchup from '@/components/connect/WeeklyMatchup'
// Re-enabled 2026-05-17 with vote-all-week / reveal-Friday mechanic.
// The previous "vote-then-immediately-see-results" loss-aversion design
// needed scale; the Friday reveal design works at any scale because the
// suspense is the engagement, not the count.
import { WeeklyNote } from '@/components/connect/WeeklyNote'
import { ShareRow } from '@/components/connect/ShareRow'
import { SettlersNearbyRail } from '@/components/connect/SettlersNearbyRail'
import {
  legacyPinsForChannel,
  type CuratedKind,
  type LegacyPin,
} from '@/lib/data/connect/curated-brussels'

// Map Connect channel ids ('tips' / 'questions' / 'heads-up') to the
// curated module's kind type. Used to load pinned content per channel.
const CHANNEL_TO_KIND: Record<string, CuratedKind> = {
  'tips':      'tip',
  'questions': 'question',
  'heads-up':  'heads-up',
}

/* ── Static data ─────────────────────────────────────────────────────────── */

type ResourceType = 'reddit' | 'meetup'
interface Resource { id: string; cityId: string; name: string; type: ResourceType; desc: string; url: string }

// Direct group URLs are fragile — Meetup admins rebrand or delete groups
// constantly, so what works today 404s next month. We use Meetup's location-
// scoped search URLs instead: those always resolve to current, real groups
// for the keyword, regardless of which specific groups exist that day.
// Reddit URLs are deterministic — only listed subs that actually exist (verified).
function meetupSearch(keywords: string, locationCode: string) {
  return `https://www.meetup.com/find/?keywords=${encodeURIComponent(keywords)}&source=GROUPS&location=${locationCode}`
}

const RESOURCES: Resource[] = [
  // Brussels — Reddit
  { id: 'bxl-r1', cityId: 'brussels', name: 'r/brussels',                  type: 'reddit', desc: 'Local news, tips, recs.',         url: 'https://www.reddit.com/r/brussels' },
  { id: 'bxl-r2', cityId: 'brussels', name: 'r/belgium',                   type: 'reddit', desc: 'National subreddit.',             url: 'https://www.reddit.com/r/belgium' },
  // Brussels — Meetup (search URLs land on filtered, current results)
  { id: 'bxl-m1', cityId: 'brussels', name: 'Brussels newcomer meetups',   type: 'meetup', desc: 'Active in-person groups.',        url: meetupSearch('newcomers',        'be--Brussels') },
  { id: 'bxl-m2', cityId: 'brussels', name: 'English-speaking groups',     type: 'meetup', desc: 'Social events in English.',       url: meetupSearch('english speaking', 'be--Brussels') },
  { id: 'bxl-m3', cityId: 'brussels', name: 'Brussels tech meetups',       type: 'meetup', desc: 'Engineering, AI, startups.',      url: meetupSearch('tech',             'be--Brussels') },
  // Lisbon resources removed pre-launch — Lisbon is a stub city, not yet
  // active, and shipping these confused cold visitors. Restore when
  // Lisbon flips active in lib/data/cities.ts.
]

const RESOURCE_STYLE: Record<ResourceType, { color: string; label: string }> = {
  reddit: { color: '#FF4500', label: 'r/' },
  meetup: { color: '#E1523D', label: 'mu' },
}

/* ── Curated content lives in lib/data/connect/curated-brussels.ts ──────── */
/* ── Channel definitions ─────────────────────────────────────────────────── */

type ChannelGroup = 'listen' | 'talk'

interface Channel {
  id:    ChannelId
  label: string
  sub:   string
  color: string
  group: ChannelGroup
  cat?:  PostCategory
}

// Channels are split into two groups:
//   Listen — aggregated city signal (read-only, always populated)
//   Talk   — settler-generated posts (you write here)
// Order within each group reflects current Brussels signal density.
type ChannelId =
  | 'tips' | 'questions' | 'heads-up'
  | 'news'

// Housing AND Events both moved to their own routes (Growth + IA council).
// Connect now is conversation: Tips, Questions, Heads-up, plus the scraped
// news rail. Structured user-supply (housing, events) lives on dedicated
// routes with Hub-card promotion + Connect cross-links.
const CHANNELS: Channel[] = [
  { id: 'tips',      label: 'Tips',       sub: 'Locals sharing what works',       color: '#10B981', group: 'talk',   cat: 'recommendation'   },
  { id: 'questions', label: 'Questions',  sub: 'Ask the community anything',      color: '#38C0F0', group: 'talk',   cat: 'question'         },
]

const CAT_META: Record<PostCategory, { color: string; label: string }> = {
  recommendation:  { color: '#10B981', label: 'Tip' },
  question:        { color: '#38C0F0', label: 'Question' },
  'heads-up':      { color: '#FAB400', label: 'Heads-up' },
  intro:           { color: '#FF3EBA', label: 'Intro' },
  'housing-offer': { color: '#FAB400', label: 'For rent' },
  'housing-wanted':{ color: '#FAB400', label: 'Wanted' },
  event:           { color: '#E8612A', label: 'Event' },
}

const STAGE_COLORS_INLINE: Record<Stage, string> = {
  planning:     '#6865CC',
  just_arrived: '#B88A00',
  settling:     '#1A8FAD',
  settled:      '#0E9B6B',
}

const STAGE_LABELS: Record<Stage, string> = {
  planning: 'Planning', just_arrived: 'Just arrived',
  settling: 'Getting settled', settled: 'Settled',
}

// Quick-filter neighbourhoods per city. Full list is in lib/data/cities.ts —
// these are the most-asked-about hoods for new arrivals. Showing too many here
// turns the filter into another decision instead of a one-tap convenience.
const POPULAR_HOODS: Record<string, string[]> = {
  brussels: [
    'Ixelles / Elsene',
    'Saint-Gilles / Sint-Gillis',
    'Etterbeek',
    'Schaerbeek / Schaarbeek',
    'European Quarter',
    'City centre / Pentagone',
  ],
  lisbon: [
    'Príncipe Real',
    'Bairro Alto',
    'Alfama',
    'Arroios',
    'Estrela',
    'Belém',
  ],
}

const SOURCE_STYLE: Record<string, { color: string; label: string }> = {
  bulletin:   { color: '#4744C8', label: 'The Bulletin' },
  politico:   { color: '#EF3340', label: 'Politico EU' },
  euobserver: { color: '#0A0A0A', label: 'EUobserver' },
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
  const [activeChannel,  setActiveChannel]  = useState<ChannelId>('tips')
  const [activeHood,     setActiveHood]     = useState<string | null>(null)
  const [expandedPost,   setExpandedPost]   = useState<string | null>(null)
  const [comments,       setComments]       = useState<Record<string, PostComment[]>>({})
  const [commentCounts,  setCommentCounts]  = useState<Record<string, number>>({})
  const [commentDrafts,  setCommentDrafts]  = useState<Record<string, string>>({})
  const [commentPosting, setCommentPosting] = useState(false)
  const [reportedPosts,  setReportedPosts]  = useState<Set<string>>(new Set())
  const [helpfulCounts,  setHelpfulCounts]  = useState<Record<string, number>>({})
  const [myHelpful,      setMyHelpful]      = useState<Set<string>>(new Set())
  const [likeCounts,     setLikeCounts]     = useState<Record<string, number>>({})
  const [myLikes,        setMyLikes]        = useState<Set<string>>(new Set())
  const [introText,      setIntroText]      = useState('')
  const [introSubmitted, setIntroSubmitted] = useState(false)
  const [hasOwnIntro,    setHasOwnIntro]    = useState(false)
  const [introDismissed, setIntroDismissed] = useState(false)
  const [welcomeDismissed, setWelcomeDismissed] = useState(false)

  // Restore client-side dismissal state for the intro prompt and welcome
  // ribbon. We persist these in localStorage so they stay dismissed across
  // sessions on the same device.
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (localStorage.getItem('roots:intro-dismissed') === '1') setIntroDismissed(true)
        if (localStorage.getItem('roots:welcome-dismissed') === '1') setWelcomeDismissed(true)
      }
    } catch { /* private mode */ }
  }, [])

  // Toggle "This helped" on a tip. Optimistic + server confirms.
  // The server is also a toggle (idempotent — adds if missing, removes
  // if present), so the client doesn't need to know prior state.
  async function toggleHelpful(postId: string) {
    const wasHelpful = myHelpful.has(postId)
    // Optimistic state
    setMyHelpful(prev => {
      const next = new Set(prev)
      wasHelpful ? next.delete(postId) : next.add(postId)
      return next
    })
    setHelpfulCounts(prev => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] ?? 0) + (wasHelpful ? -1 : 1)),
    }))

    try {
      const sb = supabase
      if (!sb) return
      const { data: { session } } = await sb.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch('/api/posts/helpful', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ post_id: postId }),
      })
      if (res.ok) {
        const json = await res.json() as { helpful: boolean; count: number }
        // Sync with server truth in case of optimistic drift
        setHelpfulCounts(prev => ({ ...prev, [postId]: json.count }))
        setMyHelpful(prev => {
          const next = new Set(prev)
          json.helpful ? next.add(postId) : next.delete(postId)
          return next
        })
      }
    } catch { /* leave optimistic state */ }
  }

  // Toggle like on a comment. Same pattern.
  async function toggleCommentLike(commentId: string) {
    const wasLiked = myLikes.has(commentId)
    setMyLikes(prev => {
      const next = new Set(prev)
      wasLiked ? next.delete(commentId) : next.add(commentId)
      return next
    })
    setLikeCounts(prev => ({
      ...prev,
      [commentId]: Math.max(0, (prev[commentId] ?? 0) + (wasLiked ? -1 : 1)),
    }))

    try {
      const sb = supabase
      if (!sb) return
      const { data: { session } } = await sb.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch('/api/comments/like', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ comment_id: commentId }),
      })
      if (res.ok) {
        const json = await res.json() as { liked: boolean; count: number }
        setLikeCounts(prev => ({ ...prev, [commentId]: json.count }))
        setMyLikes(prev => {
          const next = new Set(prev)
          json.liked ? next.add(commentId) : next.delete(commentId)
          return next
        })
      }
    } catch { /* leave optimistic state */ }
  }

  // Post a report. Quiet UX: optimistic flip to "Thanks — we'll review."
  // The server silently dedupes via UNIQUE (post_id, reporter_id), so
  // re-clicking is harmless and the same green state shows either way.
  async function reportPost(postId: string) {
    if (reportedPosts.has(postId)) return
    setReportedPosts(prev => new Set(prev).add(postId))
    try {
      const sb = supabase
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (sb) {
        const { data: { session } } = await sb.auth.getSession()
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      }
      await fetch('/api/posts/report', {
        method: 'POST',
        headers,
        body: JSON.stringify({ post_id: postId, reason: 'spam' }),
      })
    } catch { /* leave optimistic state; UX intentionally doesn't surface errors */ }
  }

  useEffect(() => {
    if (!city || !supabase) return
    const sb = supabase
    sb.from('posts').select('*').eq('city_id', cityId)
      .order('created_at', { ascending: false }).limit(100)
      .then(async ({ data }) => {
        if (!data || data.length === 0) return
        const mapped = data.map(p => ({
          id: p.id, cityId: p.city_id, stage: p.stage ?? undefined,
          category: p.category as PostCategory, text: p.text,
          time: formatRelative(p.created_at), authorStage: p.author_stage ?? undefined,
          neighborhood: p.neighborhood ?? undefined,
          // Structured fields for housing/event posts
          title:      p.title       ?? undefined,
          price:      p.price       ?? undefined,
          dates:      p.dates       ?? undefined,
          photoUrl:   p.photo_url   ?? undefined,
          eventDate:  p.event_date  ?? undefined,
          eventVenue: p.event_venue ?? undefined,
          eventUrl:   p.event_url   ?? undefined,
        }))
        setPosts(mapped)

        // Fetch comment counts for all posts in one query
        const ids = mapped.map(p => p.id)
        const { data: counts } = await sb
          .from('post_comments')
          .select('post_id')
          .in('post_id', ids)
        if (counts) {
          const tally: Record<string, number> = {}
          for (const row of counts) {
            tally[row.post_id] = (tally[row.post_id] ?? 0) + 1
          }
          setCommentCounts(tally)
        }

        // Helpful counts + the current user's own helpful state, one
        // query each. Cheap aggregations — the table is just (post_id,
        // user_id) so a SELECT pulls only what we need.
        const { data: hRows } = await sb
          .from('post_helpful')
          .select('post_id, user_id')
          .in('post_id', ids)
        if (hRows) {
          const tally: Record<string, number> = {}
          const mine: Set<string> = new Set()
          const uid = (await sb.auth.getSession()).data.session?.user.id
          for (const row of hRows) {
            tally[row.post_id] = (tally[row.post_id] ?? 0) + 1
            if (uid && row.user_id === uid) mine.add(row.post_id)
          }
          setHelpfulCounts(tally)
          setMyHelpful(mine)
        }
      })
  }, [cityId, city])

  // Check whether the current user has already posted an intro for this
  // city — drives whether we show the sticky "say hi" prompt.
  useEffect(() => {
    if (!supabase || !user || !city) return
    const sb = supabase
    sb.from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', cityId)
      .eq('category', 'intro')
      .eq('author_id', user.id)
      .then(({ count, error }) => {
        if (error) {
          // category check constraint not yet updated — silently skip.
          if (error.code === '23514' || error.code === '42703') return
          return
        }
        setHasOwnIntro((count ?? 0) > 0)
      })
  }, [cityId, city, user])

  // Submit an intro post. Inserts with category='intro'; falls back
  // gracefully if the schema migration hasn't been run.
  async function submitIntro() {
    if (!introText.trim()) return
    if (!user) { setAuthOpen(true); return }
    if (!supabase || !city) return
    const optimistic: Post = {
      id: `u${Date.now()}`, cityId: city.id,
      stage: profile.stage as Stage | undefined,
      category: 'intro', text: introText.trim(),
      time: 'just now', authorStage: profile.stage as Stage | undefined,
      neighborhood: profile.neighborhood ?? undefined,
    }
    setPosts(prev => [optimistic, ...prev])
    setIntroSubmitted(true)
    setHasOwnIntro(true)
    setIntroText('')
    window.setTimeout(() => setIntroSubmitted(false), 3000)

    const { error: insErr } = await supabase.from('posts').insert({
      city_id: city.id, stage: profile.stage ?? null,
      category: 'intro', text: optimistic.text,
      author_id: user.id, author_stage: profile.stage ?? null,
      neighborhood: profile.neighborhood ?? null,
    })
    if (insErr) {
      // Migration not run — the category check still rejects 'intro'.
      // Roll back gracefully and surface a soft message.
      if (insErr.code === '23514') {
        setPosts(prev => prev.filter(p => p.id !== optimistic.id))
        setHasOwnIntro(false)
        setIntroText(optimistic.text)
        alert('Intros aren\'t enabled yet — run supabase/migration_intro_and_filters.sql.')
        return
      }
      console.error('[intro:insert]', insErr.code, insErr.message)
    }
  }

  function dismissIntro() {
    setIntroDismissed(true)
    try { localStorage.setItem('roots:intro-dismissed', '1') } catch {}
  }
  function dismissWelcome() {
    setWelcomeDismissed(true)
    try { localStorage.setItem('roots:welcome-dismissed', '1') } catch {}
  }

  // Realtime subscription — appends posts + comments as they're written by
  // other settlers. Requires the `posts` and `post_comments` tables to have
  // realtime enabled in the Supabase dashboard. Falls silent on any error.
  useEffect(() => {
    if (!supabase || !city || !user) return
    const sb = supabase
    const myId = user.id
    const channel = sb.channel(`connect:${cityId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `city_id=eq.${cityId}` },
        (payload) => {
          const p = payload.new as {
            id: string; city_id: string; stage: string | null; category: string;
            text: string; created_at: string; author_id: string;
            author_stage: string | null; neighborhood: string | null;
            title: string | null; price: string | null; dates: string | null;
            photo_url: string | null; event_date: string | null;
            event_venue: string | null; event_url: string | null;
          }
          // Skip my own inserts — already in state via optimistic update
          if (p.author_id === myId) return
          const incoming: Post = {
            id: p.id, cityId: p.city_id as CityId,
            stage: (p.stage ?? undefined) as Stage | undefined,
            category: p.category as PostCategory,
            text: p.text, time: 'just now',
            authorStage: (p.author_stage ?? undefined) as Stage | undefined,
            neighborhood: p.neighborhood ?? undefined,
            title:      p.title       ?? undefined,
            price:      p.price       ?? undefined,
            dates:      p.dates       ?? undefined,
            photoUrl:   p.photo_url   ?? undefined,
            eventDate:  p.event_date  ?? undefined,
            eventVenue: p.event_venue ?? undefined,
            eventUrl:   p.event_url   ?? undefined,
          }
          setPosts(prev => prev.some(x => x.id === incoming.id) ? prev : [incoming, ...prev])
        })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_comments' },
        (payload) => {
          const c = payload.new as {
            id: string; post_id: string; author_id: string; text: string; created_at: string
          }
          if (c.author_id === myId) return  // own comments are already optimistic
          setCommentCounts(prev => ({ ...prev, [c.post_id]: (prev[c.post_id] ?? 0) + 1 }))
          setComments(prev => prev[c.post_id]
            ? { ...prev, [c.post_id]: [...prev[c.post_id], {
                id: c.id, post_id: c.post_id, author_id: c.author_id,
                text: c.text, created_at: c.created_at, author_name: 'Settler',
              }] }
            : prev)
        })
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [cityId, city, user])

  useEffect(() => {
    if (feedState !== 'idle') return
    setFeedState('loading')
    fetch(`/api/feeds?city=${cityId}`)
      .then(r => r.json())
      .then(data => { setFeedItems(data.items ?? []); setFeedState('done') })
      .catch(() => setFeedState('error'))
  }, [cityId, feedState])

  if (!city) return null
  if (authLoading) return <div className="min-h-screen bg-cream" />
  if (!user) return <AuthGate cityName={city.name} cityId={cityId}>{null}</AuthGate>

  const resources = RESOURCES.filter(r => r.cityId === cityId)
  const channel   = CHANNELS.find(c => c.id === activeChannel)!

  // Content per channel
  const newsItems   = feedItems.filter(i => i.category === 'news')

  const eventItems = feedItems.filter(i => i.category === 'events')
    .sort((a, b) => a.published - b.published)

  // Community post counts per channel
  const postCounts: Record<string, number> = {
    tips:       posts.filter(p => p.category === 'recommendation').length,
    questions:  posts.filter(p => p.category === 'question').length,
    'heads-up': posts.filter(p => p.category === 'heads-up').length,
    events:     posts.filter(p => p.category === 'event').length + eventItems.length,
    news:       newsItems.length,
  }

  // Housing-offer / housing-wanted counts feed the cross-link card at the
  // foot of Connect — Housing itself lives on /[city]/housing now.
  const housingCount = posts.filter(p =>
    p.category === 'housing-offer' || p.category === 'housing-wanted').length

  const activePosts = channel.cat
    ? posts
        .filter(p => p.category === channel.cat)
        .filter(p => !activeHood || p.neighborhood === activeHood)
    : []

  // Hoods to surface in the filter row: profile's hood (always first when
  // set), then city's most-asked-about ones, deduped. We also augment with
  // hoods that have at least one post (so user-contributed neighbourhoods
  // become filterable without a manual update).
  const popularHoods = POPULAR_HOODS[cityId] ?? []
  const hoodsWithPosts = Array.from(new Set(
    posts.map(p => p.neighborhood).filter((n): n is string => !!n)
  ))
  const baseHoods = Array.from(new Set([...popularHoods, ...hoodsWithPosts]))
  const hoodChips = profile.neighborhood && !baseHoods.includes(profile.neighborhood)
    ? [profile.neighborhood, ...baseHoods]
    : baseHoods

  // Social signal: last post time for current community channel
  const lastPost = activePosts[0]
  const lastPostSignal = lastPost
    ? `Last post ${lastPost.time} · ${postCounts[activeChannel] ?? 0} posts`
    : null

  const submit = async () => {
    if (!newPost.text.trim() || !channel.cat) return
    if (!user) { setAuthOpen(true); return }
    const optimistic: Post = {
      id: `u${Date.now()}`, cityId: city.id,
      stage: profile.stage as Stage | undefined,
      category: channel.cat, text: newPost.text.trim(),
      time: 'just now', authorStage: profile.stage as Stage | undefined,
      neighborhood: profile.neighborhood ?? undefined,
    }
    setPosts(prev => [optimistic, ...prev])
    setNewPost({ text: '' })
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    if (supabase) {
      // Server-side rate limit (5 posts/min/user) + insert. If the migration
      // for check_post_rate_limit hasn't run yet, the function is missing and
      // we fall through to the insert (fail-open for beta).
      const { data: allowed, error: rlErr } = await supabase.rpc('check_post_rate_limit', { uid: user.id, max_per_min: 5 })
      if (rlErr) {
        if (rlErr.code !== '42P01' && rlErr.code !== 'PGRST202') {
          console.warn('[posts:rate-limit]', rlErr.code, rlErr.message)
        }
      } else if (allowed === false) {
        // Roll back the optimistic post and surface a soft warning.
        setPosts(prev => prev.filter(p => p.id !== optimistic.id))
        setNewPost({ text: optimistic.text })
        alert('You\'re posting a lot — please wait a minute and try again.')
        return
      }

      const insertPayload: Record<string, unknown> = {
        city_id: city.id, stage: profile.stage ?? null,
        category: channel.cat, text: optimistic.text,
        author_id: user.id, author_stage: profile.stage ?? null,
        neighborhood: profile.neighborhood ?? null,
      }
      const { error: insErr } = await supabase.from('posts').insert(insertPayload)
      if (insErr) {
        // Column missing (migration not run) — retry without neighborhood.
        if (insErr.code === '42703') {
          delete insertPayload.neighborhood
          await supabase.from('posts').insert(insertPayload)
        } else {
          // Roll back optimistic and let user retry.
          console.error('[posts:insert]', insErr.code, insErr.message)
          setPosts(prev => prev.filter(p => p.id !== optimistic.id))
          setNewPost({ text: optimistic.text })
        }
      }
    }
  }

  async function toggleComments(postId: string) {
    if (expandedPost === postId) { setExpandedPost(null); return }
    setExpandedPost(postId)
    if (comments[postId]) return   // already loaded
    if (!supabase) return
    const { data } = await supabase
      .from('post_comments')
      .select('id, post_id, author_id, text, created_at, profiles(display_name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (data) {
      setComments(prev => ({
        ...prev,
        [postId]: data.map((r: Record<string, unknown>) => ({
          id:          r.id as string,
          post_id:     r.post_id as string,
          author_id:   r.author_id as string,
          text:        r.text as string,
          created_at:  r.created_at as string,
          author_name: (r.profiles as { display_name?: string } | null)?.display_name ?? 'Settler',
        })),
      }))
      setCommentCounts(prev => ({ ...prev, [postId]: data.length }))

      // Pull like counts + own-state for these comments. One query each.
      const commentIds = data.map(r => r.id as string)
      if (commentIds.length > 0) {
        const { data: likeRows } = await supabase
          .from('comment_likes')
          .select('comment_id, user_id')
          .in('comment_id', commentIds)
        if (likeRows) {
          const tally: Record<string, number> = {}
          const mine: Set<string> = new Set()
          const uid = (await supabase.auth.getSession()).data.session?.user.id
          for (const row of likeRows) {
            tally[row.comment_id] = (tally[row.comment_id] ?? 0) + 1
            if (uid && row.user_id === uid) mine.add(row.comment_id)
          }
          setLikeCounts(prev => ({ ...prev, ...tally }))
          setMyLikes(prev => {
            const next = new Set(prev)
            for (const id of mine) next.add(id)
            return next
          })
        }
      }
    }
  }

  async function submitComment(postId: string) {
    const draft = (commentDrafts[postId] ?? '').trim()
    if (!draft || !user || !supabase || commentPosting) return
    setCommentPosting(true)
    const optimistic: PostComment = {
      id: `c${Date.now()}`, post_id: postId, author_id: user.id,
      text: draft, created_at: new Date().toISOString(),
      author_name: profile.displayName ?? 'You',
    }
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), optimistic] }))
    setCommentCounts(prev => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }))
    setCommentDrafts(prev => ({ ...prev, [postId]: '' }))
    await supabase.from('post_comments').insert({
      post_id: postId, author_id: user.id, text: draft,
    })
    setCommentPosting(false)
  }

  const SOURCE_COLOR: Record<string, string> = {
    visitbrussels: '#FF3EBA', magasin4: '#C62828', botanique: '#2E7D32',
    flagey: '#4744C8', halles: '#E8612A', recyclart: '#7B1FA2',
    lamonnaie: '#B8860B', meetup: '#E1523D', eventbrite: '#F05537',
    ticketmaster: '#026CDF', feu: '#FF6B00',
  }

  // Live signal — counts for the masthead "X settlers · Y posts this week"
  const postsThisWeek = posts.filter(p => {
    const ts = Date.parse(p.time)
    if (isNaN(ts)) return true   // optimistic posts have "just now"
    return Date.now() - ts < 7 * 86400 * 1000
  }).length

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }} className="relative overflow-hidden">

      <GeometricThread accent="#FF3EBA" />

      <PageMasthead
        eyebrow={`${city.name} · Community`}
        headline={`${city.name},`}
        emphasis="talking."
        emphasisColor="#FF3EBA"
        tagline={`What's on, what to ask, who's settling. The ${city.name} conversation, in one place.`}
        backHref={`/${cityId}`}
        backLabel="← Back to hub"
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ background: '#10B981' }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ background: '#10B981' }} />
          </span>
          <span className="text-[10px] font-black tracking-[0.15em] uppercase"
            style={{ color: 'rgba(10,10,10,0.55)' }}>
            Live
          </span>
        </div>
        {postsThisWeek > 0 && (
          <span className="text-[10px] font-black tracking-[0.18em] uppercase"
            style={{ color: '#10B981' }}>
            {postsThisWeek} {postsThisWeek === 1 ? 'post' : 'posts'} this week
          </span>
        )}
        {eventItems.length > 0 && (
          <span className="text-[10px] font-black tracking-[0.18em] uppercase"
            style={{ color: '#E8612A' }}>
            {eventItems.length} {eventItems.length === 1 ? 'event' : 'events'} ahead
          </span>
        )}
      </PageMasthead>

      {/* ── Tab bar — Listen | Talk ──────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          {/* Section labels above the tabs — collapsed on mobile, shown on sm+ */}
          <div className="hidden sm:grid grid-cols-[auto_1px_auto_1fr] gap-x-4 pt-4 pb-1 items-center">
            <span className="text-[10px] font-black tracking-[0.28em] uppercase"
              style={{ color: '#252450' }}>
              Listen
            </span>
            <span style={{ width: 1, height: 10, background: 'rgba(10,10,10,0.15)' }} />
            <span className="text-[10px] font-black tracking-[0.28em] uppercase"
              style={{ color: '#FF3EBA' }}>
              Talk
            </span>
            <span />
          </div>

          <div className="flex items-stretch overflow-x-auto scrollbar-none">
            {CHANNELS.map((ch, i) => {
              const active = ch.id === activeChannel
              const prev   = i > 0 ? CHANNELS[i - 1] : null
              const groupBoundary = prev && prev.group !== ch.group

              const count =
                ch.id === 'news' ? newsItems.length :
                postCounts[ch.id] ?? 0

              return (
                <div key={ch.id} className="flex items-stretch">
                  {/* Group divider */}
                  {groupBoundary && (
                    <div className="self-stretch mx-2 my-3 hidden sm:block"
                      style={{ width: 1, background: 'rgba(10,10,10,0.12)' }} />
                  )}
                  <button
                    onClick={() => setActiveChannel(ch.id)}
                    className="flex-none flex items-center gap-2 px-4 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap"
                    style={{
                      color: active ? ch.color : 'rgba(10,10,10,0.4)',
                      borderBottomColor: active ? ch.color : 'transparent',
                    }}
                  >
                    {ch.label}
                    {count > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: active ? `${ch.color}15` : 'rgba(10,10,10,0.06)', color: active ? ch.color : 'rgba(10,10,10,0.3)' }}>
                        {count}
                      </span>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Channel signal bar ───────────────────────────────────────────── */}
      {channel.cat && lastPostSignal && (
        <div style={{ background: 'rgba(10,10,10,0.02)', borderBottom: '1px solid rgba(10,10,10,0.06)' }}>
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-2">
            <p className="text-[10px]" style={{ color: 'rgba(10,10,10,0.35)' }}>{lastPostSignal}</p>
          </div>
        </div>
      )}

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-10 md:py-14">
        {/* Talk channels go full-width — the tip grid needs the room.
            Listen channels (events/news) keep the 280px sidebar. */}
        <div className={channel.cat
          ? 'grid grid-cols-1 gap-10'
          : 'grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10'}>

          {/* ── LEFT: Main channel content ───────────────────────────────── */}
          <div className="min-w-0">

            {/* ── First-time joiner welcome ribbon ──────────────────────── */}
            {user && !welcomeDismissed && profile.stage && (
              <div className="mb-6 flex items-center gap-3 px-4 py-3"
                style={{ background: 'rgba(255,62,186,0.05)', border: '1px solid rgba(255,62,186,0.25)' }}>
                <span className="text-[10px] font-black tracking-[0.22em] uppercase shrink-0"
                  style={{ color: '#FF3EBA' }}>
                  ✦ You're in
                </span>
                <p className="text-sm flex-1 min-w-0" style={{ color: '#0A0A0A' }}>
                  Welcome to {city?.name ?? 'Roots'}. Post your first thing below or read what helped others.
                </p>
                <button
                  onClick={dismissWelcome}
                  className="shrink-0 text-[10px] font-bold hover:opacity-60 transition-opacity"
                  style={{ color: 'rgba(10,10,10,0.4)' }}
                  title="Dismiss">
                  Dismiss
                </button>
              </div>
            )}

            {/* ── Settlers Nearby rail ──────────────────────────────────── */}
            {city && (
              <SettlersNearbyRail
                cityId={cityId}
                cityName={city.name}
                viewerHood={profile.neighborhood ?? undefined}
                viewerStage={profile.stage as Stage | undefined}
              />
            )}

            {/* ── Intro composer (collapsible "say hi" prompt) ──────────── */}
            {user && !hasOwnIntro && !introDismissed && channel.cat && (
              <section className="mb-8" style={{ border: '2px solid #FF3EBA' }}>
                <div className="px-4 pt-3 pb-1">
                  <div className="flex items-baseline justify-between mb-2 gap-3">
                    <p className="text-[10px] font-black tracking-[0.22em] uppercase"
                      style={{ color: '#FF3EBA' }}>
                      ✦ New here? Say hi
                    </p>
                    <button
                      onClick={dismissIntro}
                      className="text-[10px] font-bold hover:opacity-60 transition-opacity"
                      style={{ color: 'rgba(10,10,10,0.4)' }}
                      title="Dismiss">
                      Later
                    </button>
                  </div>
                  <p className="text-xs mb-2 leading-relaxed" style={{ color: 'rgba(10,10,10,0.6)' }}>
                    Where you moved from, one thing you're figuring out. 2 lines is plenty.
                  </p>
                  <textarea
                    value={introText}
                    onChange={e => setIntroText(e.target.value.slice(0, 280))}
                    placeholder="Just moved from Lisbon, trying to crack the commune system…"
                    rows={2}
                    className="w-full text-sm focus:outline-none resize-none bg-transparent leading-relaxed"
                    style={{ color: '#0A0A0A', fontSize: 14 }}
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderTop: '1px solid rgba(255,62,186,0.18)', background: 'rgba(255,62,186,0.04)' }}>
                  <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.4)' }}>
                    {introText.length}/280
                  </span>
                  <button
                    onClick={submitIntro}
                    disabled={!introText.trim()}
                    className="px-4 py-1.5 text-[10px] font-black tracking-wide uppercase text-white transition-opacity disabled:opacity-25"
                    style={{ background: '#FF3EBA' }}>
                    {introSubmitted ? '✓ Posted' : 'Say hi'}
                  </button>
                </div>
              </section>
            )}

            {/* ── New settlers this week — intro posts lane ────────────── */}
            {(() => {
              const intros = posts.filter(p => p.category === 'intro').slice(0, 6)
              if (intros.length === 0) return null
              return (
                <section className="mb-8">
                  <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-3"
                    style={{ color: '#FF3EBA' }}>
                    ✦ New settlers this week
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {intros.map(intro => {
                      const stageColor = intro.authorStage ? STAGE_COLORS_INLINE[intro.authorStage] : 'rgba(10,10,10,0.4)'
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
                </section>
              )
            })()}

            {/* ── This week in Brussels — editorial note ─────────────────── */}
            <WeeklyNote cityId={cityId} />

            {/* ── Vrijdag matchup — vote all week, results reveal Friday ── */}
            {channel.id === 'tips' && <WeeklyMatchup cityId={cityId} />}

            {/* ── Housing cross-link (Housing lives on /[city]/housing now) ── */}
            {channel.id === 'tips' && (
              <a href={`/${cityId}/housing`}
                className="block mb-6 group hover:opacity-90 transition-opacity"
                style={{ background: '#FFFFFF', border: '2px solid #FAB400' }}>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-1"
                      style={{ color: '#FAB400' }}>
                      Looking for a flat?
                    </p>
                    <p className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>
                      {housingCount > 0
                        ? `${housingCount} settler listing${housingCount === 1 ? '' : 's'} live — no agencies, no scrapers.`
                        : 'Settler-posted listings — no agencies. Yours could be the first.'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-black tracking-[0.18em] uppercase"
                    style={{ color: '#FAB400' }}>
                    Housing →
                  </span>
                </div>
              </a>
            )}

            {/* ── Events cross-link (Events lives on /[city]/events now) ── */}
            {channel.id === 'tips' && (
              <a href={`/${cityId}/events`}
                className="block mb-6 group hover:opacity-90 transition-opacity"
                style={{ background: '#FFFFFF', border: '2px solid #E8612A' }}>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-1"
                      style={{ color: '#E8612A' }}>
                      Hosting something?
                    </p>
                    <p className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>
                      Settler-posted events — gigs, dinners, classes. Post yours.
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-black tracking-[0.18em] uppercase"
                    style={{ color: '#E8612A' }}>
                    Events →
                  </span>
                </div>
              </a>
            )}

            {/* ── Community channels (tips / questions / heads-up) ───────── */}
            {channel.cat && (
              <>
                {/* Neighbourhood filter — only when there are posts to filter */}
                {hoodChips.length > 0 && posts.some(p => p.category === channel.cat) && (
                  <div className="mb-6 flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
                    <button
                      onClick={() => setActiveHood(null)}
                      className="shrink-0 text-[10px] font-black tracking-[0.14em] uppercase px-2.5 py-1 transition-all"
                      style={{
                        color: activeHood === null ? '#FFFFFF' : 'rgba(10,10,10,0.45)',
                        background: activeHood === null ? '#0A0A0A' : 'transparent',
                        border: '1px solid rgba(10,10,10,0.15)',
                      }}>
                      All
                    </button>
                    {hoodChips.map(h => {
                      const isActive = activeHood === h
                      return (
                        <button
                          key={h}
                          onClick={() => setActiveHood(isActive ? null : h)}
                          className="shrink-0 text-[10px] font-black tracking-[0.14em] uppercase px-2.5 py-1 transition-all"
                          style={{
                            color: isActive ? '#FFFFFF' : 'rgba(10,10,10,0.5)',
                            background: isActive ? channel.color : 'transparent',
                            border: `1px solid ${isActive ? channel.color : 'rgba(10,10,10,0.12)'}`,
                          }}>
                          {h.split(' / ')[0]}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Posts — user posts lead, Roots notes follow as a curated section */}
                {(() => {
                  const kind  = CHANNEL_TO_KIND[channel.id]
                  const pins: LegacyPin[] = kind ? legacyPinsForChannel(kind) : []
                  // Rank user posts: most-helpful first, then newest
                  const userPosts = [...activePosts].sort((a, b) => {
                    const ha = helpfulCounts[a.id] ?? 0
                    const hb = helpfulCounts[b.id] ?? 0
                    if (ha !== hb) return hb - ha
                    return 0
                  })

                  if (userPosts.length === 0 && pins.length === 0) {
                    return (
                      <div className="py-12 px-6" style={{ background: '#FAFAF7', border: '1px solid rgba(10,10,10,0.08)' }}>
                        <p className="text-base font-semibold mb-2" style={{ color: '#0A0A0A' }}>
                          {channel.id === 'tips'      ? 'No tips yet — yours could be the first.'
                           : channel.id === 'questions' ? 'No questions yet — ask away.'
                           : 'No heads-ups yet.'}
                        </p>
                        <p className="text-sm" style={{ color: 'rgba(10,10,10,0.55)' }}>
                          Use the composer below. Yours could be the first.
                        </p>
                      </div>
                    )
                  }

                  // Stage chip colors — make user authorship visible
                  const STAGE_COLORS: Record<Stage, string> = {
                    planning:     '#6865CC',
                    just_arrived: '#B88A00',
                    settling:     '#1A8FAD',
                    settled:      '#0E9B6B',
                  }

                  // ── User Post card — bold, personal, color-rich ─────────────
                  function PostCard({ post, hero = false }: { post: typeof userPosts[number]; hero?: boolean }) {
                    const m  = CAT_META[post.category]
                    const helpfulN = helpfulCounts[post.id] ?? 0
                    const iHelped  = myHelpful.has(post.id)
                    const cN       = commentCounts[post.id] ?? 0
                    const expanded = expandedPost === post.id
                    const stageColor = post.authorStage ? STAGE_COLORS[post.authorStage] : 'rgba(10,10,10,0.4)'
                    return (
                      <article
                        className="flex flex-col h-full"
                        style={{ background: '#FFFFFF', border: `2px solid ${m.color}` }}>
                        <div className={hero ? 'px-6 pt-5 pb-5' : 'px-5 pt-4 pb-4'}>
                          {/* Author chip — the dominant signal */}
                          <div className="flex items-center gap-2 mb-3">
                            {post.authorStage && (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.18em] uppercase px-2 py-1"
                                style={{
                                  background: stageColor,
                                  color: '#fff',
                                }}>
                                <span className="w-1 h-1 rounded-full" style={{ background: '#fff' }} />
                                {STAGE_LABELS[post.authorStage]}
                              </span>
                            )}
                            <span className="text-[10px] font-black tracking-[0.18em] uppercase"
                              style={{ color: m.color }}>
                              {m.label}
                            </span>
                            <span className="text-[10px] ml-auto" style={{ color: 'rgba(10,10,10,0.3)' }}>
                              {post.time}
                            </span>
                          </div>
                          <p className={hero
                              ? 'font-display text-xl md:text-2xl leading-snug mb-4'
                              : 'text-[15px] leading-relaxed mb-3'}
                            style={{
                              color: '#0A0A0A',
                              fontWeight: hero ? 700 : 500,
                              letterSpacing: hero ? '-0.01em' : 'normal',
                            }}>
                            {post.text}
                          </p>
                          {/* Action row */}
                          <div className="mt-2 flex items-center gap-3 flex-wrap">
                            <button
                              onClick={() => toggleHelpful(post.id)}
                              className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.18em] uppercase px-2.5 py-1.5 transition-all"
                              style={{
                                color: iHelped ? '#fff' : m.color,
                                background: iHelped ? m.color : 'transparent',
                                border: `1.5px solid ${m.color}`,
                              }}>
                              {iHelped ? '✓' : '+'} Helped {helpfulN > 0 && helpfulN}
                            </button>
                            <button
                              onClick={() => toggleComments(post.id)}
                              className="text-[10px] font-bold hover:opacity-60 transition-opacity"
                              style={{ color: 'rgba(10,10,10,0.4)' }}>
                              {expanded ? 'Hide replies' : `${cN} ${cN === 1 ? 'reply' : 'replies'}`}
                            </button>
                            <button
                              onClick={() => {
                                const absolute = typeof window !== 'undefined'
                                  ? `${window.location.origin}/${cityId}/connect` : ''
                                const text = `${post.text}\n— via Roots ${city?.name ?? ''}\n${absolute}`
                                if (typeof navigator !== 'undefined' && navigator.share) {
                                  void navigator.share({ text })
                                } else {
                                  void navigator.clipboard?.writeText(text)
                                }
                              }}
                              className="text-[10px] font-bold hover:opacity-60 transition-opacity"
                              style={{ color: 'rgba(10,10,10,0.4)' }}>
                              ↗ Share
                            </button>
                            <button
                              onClick={() => reportPost(post.id)}
                              disabled={reportedPosts.has(post.id)}
                              className="ml-auto text-[10px] hover:opacity-100 transition-opacity disabled:opacity-100"
                              style={{ color: reportedPosts.has(post.id) ? '#0E9B6B' : 'rgba(10,10,10,0.2)' }}
                              title="Report this post">
                              {reportedPosts.has(post.id) ? '✓ Thanks' : 'Report'}
                            </button>
                          </div>
                          {/* Inline thread */}
                          {expanded && (
                            <div className="mt-3 pl-3" style={{ borderLeft: `2px solid ${m.color}40` }}>
                              {(comments[post.id] ?? []).map(c => (
                                <div key={c.id} className="py-1.5"
                                  style={{ borderBottom: '1px solid rgba(10,10,10,0.05)' }}>
                                  <span className="text-[10px] font-black mr-2" style={{ color: m.color }}>
                                    {c.author_name ?? 'Settler'}
                                  </span>
                                  <span className="text-xs" style={{ color: 'rgba(10,10,10,0.65)' }}>{c.text}</span>
                                </div>
                              ))}
                              {(comments[post.id] ?? []).length === 0 && (
                                <p className="text-[10px] py-1.5" style={{ color: 'rgba(10,10,10,0.3)' }}>
                                  No replies yet
                                </p>
                              )}
                              <div className="flex gap-2 mt-2">
                                <input
                                  type="text"
                                  value={commentDrafts[post.id] ?? ''}
                                  onChange={e => setCommentDrafts(prev => ({ ...prev, [post.id]: e.target.value.slice(0, 140) }))}
                                  onKeyDown={e => { if (e.key === 'Enter') submitComment(post.id) }}
                                  placeholder="Reply…"
                                  className="flex-1 text-xs focus:outline-none bg-transparent"
                                  style={{ borderBottom: '1px solid rgba(10,10,10,0.15)', paddingBottom: 2, color: '#0A0A0A' }}
                                />
                                <button
                                  onClick={() => submitComment(post.id)}
                                  disabled={!(commentDrafts[post.id] ?? '').trim() || commentPosting}
                                  className="text-[10px] font-black text-white px-2.5 py-1 transition-opacity disabled:opacity-25"
                                  style={{ background: m.color }}>
                                  ↑
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  }

                  // ── Pin card — editorial, varies by index for visual rhythm ──
                  // Variant cycles every 4 cards so a long pin grid doesn't read flat.
                  function PinCard({ pin, index = 0, hero = false }: { pin: LegacyPin; index?: number; hero?: boolean }) {
                    const detailHref = `/${cityId}/tips/${pin.slug}`
                    // 4-way visual variation:
                    //   0 — clean white card, standard body
                    //   1 — cream tinted background
                    //   2 — pull-quote (italic, serif-feel, larger)
                    //   3 — soft purple tinted background
                    const variant = index % 4
                    const isPullQuote = variant === 2 || (pin.text.length < 110 && !hero)
                    // Tints are slightly stronger than ideal-on-desktop so the
                    // variation is still visible on mobile, where you only see
                    // one card at a time.
                    const bg =
                      variant === 1 ? '#F7F0DF' :
                      variant === 3 ? 'rgba(71,68,200,0.07)' :
                      '#FFFFFF'
                    return (
                      <article
                        className="flex flex-col h-full"
                        style={{ background: bg, border: '1px solid rgba(10,10,10,0.1)' }}>
                        <div style={{ height: hero ? 4 : 3, background: '#4744C8', opacity: 0.7 }} />
                        <div className={hero ? 'px-6 pt-5 pb-5' : 'px-5 pt-4 pb-4'}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[9px] font-black tracking-[0.24em] uppercase"
                              style={{ color: '#4744C8' }}>
                              ✦ Roots note
                            </span>
                            {pin.neighbourhood && (
                              <span className="text-[9px] font-black tracking-[0.18em] uppercase px-1.5 py-0.5"
                                style={{ color: '#4744C8', background: 'rgba(71,68,200,0.1)' }}>
                                {pin.neighbourhood.replace(/-/g, ' ')}
                              </span>
                            )}
                          </div>
                          {isPullQuote ? (
                            <p className={hero
                                ? 'font-display text-xl md:text-2xl leading-snug mb-3'
                                : 'font-display text-base md:text-lg leading-snug mb-3'}
                              style={{
                                color: 'rgba(10,10,10,0.85)',
                                fontStyle: 'italic',
                                fontWeight: 600,
                                letterSpacing: '-0.005em',
                              }}>
                              &ldquo;{pin.text}&rdquo;
                            </p>
                          ) : (
                            <p className={hero
                                ? 'text-[1.05rem] md:text-base leading-relaxed mb-3'
                                : 'text-sm leading-relaxed mb-3'}
                              style={{ color: 'rgba(10,10,10,0.72)' }}>
                              {pin.text}
                            </p>
                          )}
                          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                            <a href={detailHref}
                              className="text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
                              style={{ color: '#4744C8' }}>
                              Read full tip →
                            </a>
                            <button
                              onClick={() => {
                                const absolute = typeof window !== 'undefined'
                                  ? `${window.location.origin}${detailHref}` : detailHref
                                if (typeof navigator !== 'undefined' && navigator.share) {
                                  void navigator.share({ url: absolute, text: pin.text.slice(0, 200) })
                                } else {
                                  void navigator.clipboard?.writeText(absolute)
                                }
                              }}
                              className="text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
                              style={{ color: 'rgba(10,10,10,0.4)' }}
                              title="Share this tip">
                              ↗ Share
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  }

                  return (
                    <div>
                      {/* ── User posts section (priority) ───────────────── */}
                      {userPosts.length > 0 && (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] mb-3"
                            style={{ color: channel.color }}>
                            From settlers
                          </p>
                          {/* Hero — first user post */}
                          <div className="mb-3">
                            <PostCard post={userPosts[0]} hero />
                          </div>
                          {userPosts.length > 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {userPosts.slice(1).map(p => <PostCard key={p.id} post={p} />)}
                            </div>
                          )}
                        </>
                      )}

                      {/* ── Roots notes section — labeled, secondary ─────── */}
                      {pins.length > 0 && (
                        <div className={userPosts.length > 0 ? 'mt-10 pt-8' : ''}
                          style={userPosts.length > 0 ? { borderTop: '1px solid rgba(10,10,10,0.1)' } : undefined}>
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em]"
                              style={{ color: '#4744C8' }}>
                              ✦ From Roots · curated
                            </p>
                            <a href={`/${cityId}/tips`}
                              className="text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
                              style={{ color: '#4744C8' }}>
                              See all {pins.length} →
                            </a>
                          </div>
                          {/* Hero pin only when there are no user posts.
                              Otherwise pins stay uniformly in the grid below settlers. */}
                          {userPosts.length === 0 ? (
                            <>
                              <div className="mb-3">
                                <PinCard pin={pins[0]} hero />
                              </div>
                              {pins.length > 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {pins.slice(1).map((p, i) => <PinCard key={p.id} pin={p} index={i + 1} />)}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {pins.map((p, i) => <PinCard key={p.id} pin={p} index={i} />)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Coaching nudge below everything */}
                      <div className="mt-10 px-4 py-4"
                        style={{ background: 'rgba(10,10,10,0.02)', border: '1px solid rgba(10,10,10,0.06)' }}>
                        <p className="text-sm font-semibold mb-1" style={{ color: '#0A0A0A' }}>
                          {channel.id === 'tips'      ? 'A great tip is specific.' :
                           channel.id === 'questions' ? 'Ask the question you wish someone had answered for you.' :
                           'A heads-up saves someone a wasted afternoon.'}
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: 'rgba(10,10,10,0.5)' }}>
                          {channel.id === 'tips'      ? 'Mention the place, the price, the catch. "The mutuelle on Rue Vanderkindere processed mine in two days" beats "good mutuelle".' :
                           channel.id === 'questions' ? 'Other settlers are figuring out the same thing right now. Ask in plain language — no need to caveat.' :
                           'Recent admin gotcha? Closed office? Strike? Post it. The shorter, the better.'}
                        </p>
                        <button
                          onClick={() => composerRef.current?.focus()}
                          className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.16em] uppercase hover:opacity-60 transition-opacity"
                          style={{ color: channel.color }}>
                          {channel.id === 'tips' ? 'Share a tip' : channel.id === 'questions' ? 'Ask a question' : 'Post a heads-up'}
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  )
                })()}

                {/* Composer */}
                <div className="mt-8" style={{ border: `1.5px solid ${channel.color}25` }}>
                  <div className="px-4 pt-3 pb-1">
                    <div className="flex items-baseline justify-between mb-2.5 gap-3">
                      <p className="text-[10px] font-black tracking-[0.22em] uppercase"
                        style={{ color: channel.color }}>
                        {channel.id === 'tips'      ? 'Share a tip' :
                         channel.id === 'questions' ? 'Ask the community' :
                         'Post a heads-up'}
                      </p>
                      {profile.neighborhood && (
                        <p className="text-[10px]" style={{ color: 'rgba(10,10,10,0.35)' }}>
                          Posting from <span className="font-bold" style={{ color: channel.color }}>{profile.neighborhood.split(' / ')[0]}</span>
                        </p>
                      )}
                    </div>
                    <textarea
                      ref={composerRef}
                      value={newPost.text}
                      onChange={e => setNewPost({ text: e.target.value.slice(0, 280) })}
                      placeholder={
                        channel.id === 'tips'      ? 'Share something that made settling easier…' :
                        channel.id === 'questions' ? 'What are you trying to figure out?' :
                        'Something other settlers should know…'
                      }
                      rows={3}
                      className="w-full text-sm focus:outline-none resize-none bg-transparent leading-relaxed"
                      style={{ color: '#0A0A0A', fontSize: 14 }}
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5"
                    style={{ borderTop: `1px solid ${channel.color}18`, background: `${channel.color}06` }}>
                    <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.25)' }}>
                      {newPost.text.length}/280
                      {!user && <button onClick={() => setAuthOpen(true)}
                        className="ml-3 font-bold hover:opacity-60 transition-opacity"
                        style={{ color: '#4744C8' }}>· Sign in to post</button>}
                    </span>
                    <button
                      onClick={submit}
                      disabled={!newPost.text.trim()}
                      className="px-4 py-1.5 text-[10px] font-black tracking-wide uppercase text-white transition-opacity disabled:opacity-25"
                      style={{ background: channel.color }}>
                      {submitted ? '✓ Posted' : 'Post'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── News channel ─────────────────────────────────────────── */}
            {channel.id === 'news' && (
              <>
                {feedState === 'loading' && (
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex gap-4 py-4 animate-pulse"
                        style={{ borderBottom: '1px solid rgba(10,10,10,0.07)' }}>
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
                    <p className="text-sm" style={{ color: 'rgba(10,10,10,0.35)' }}>No headlines right now</p>
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
                        const ss = SOURCE_STYLE[lead.source] ?? { color: '#0A0A0A', label: lead.sourceLabel }
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
                            <p className="text-[10px] font-medium" style={{ color: 'rgba(10,10,10,0.3)' }}>
                              {ago(lead.published)}
                            </p>
                          </a>
                        )
                      })()}

                      {/* Tier 2 — side by side when 2 stories */}
                      {tier2.length > 0 && (
                        <div className={`grid gap-0 ${tier2.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} mb-0`}>
                          {tier2.map((fi, i) => {
                            const ss = SOURCE_STYLE[fi.source] ?? { color: '#0A0A0A', label: fi.sourceLabel }
                            return (
                              <a key={fi.id} href={fi.url} target="_blank" rel="noopener noreferrer"
                                className="group block py-5 hover:opacity-70 transition-opacity"
                                style={{
                                  borderBottom: '1px solid rgba(10,10,10,0.12)',
                                  borderLeft: i === 1 ? '1px solid rgba(10,10,10,0.12)' : 'none',
                                  paddingLeft: i === 1 ? 16 : 0,
                                  paddingRight: i === 0 && tier2.length === 2 ? 16 : 0,
                                }}>
                                <p className="text-[8px] font-black tracking-[0.24em] uppercase mb-2" style={{ color: ss.color }}>
                                  {ss.label}
                                </p>
                                <p className="text-sm font-bold leading-snug mb-2" style={{ color: '#0F0E1E' }}>
                                  {fi.title}
                                </p>
                                <p className="text-[10px]" style={{ color: 'rgba(10,10,10,0.3)' }}>{ago(fi.published)}</p>
                              </a>
                            )
                          })}
                        </div>
                      )}

                      {/* Compact digest — remaining stories */}
                      {rest.length > 0 && (
                        <div>
                          {rest.map((fi) => {
                            const ss = SOURCE_STYLE[fi.source] ?? { color: '#0A0A0A', label: fi.sourceLabel }
                            return (
                              <a key={fi.id} href={fi.url} target="_blank" rel="noopener noreferrer"
                                className="group flex items-baseline gap-3 py-3 hover:opacity-60 transition-opacity"
                                style={{ borderBottom: '1px solid rgba(10,10,10,0.07)' }}>
                                <span className="shrink-0 text-[8px] font-black tracking-wider uppercase w-16 leading-relaxed" style={{ color: ss.color }}>
                                  {ss.label}
                                </span>
                                <span className="flex-1 text-sm font-semibold leading-snug" style={{ color: '#0A0A0A' }}>
                                  {fi.title}
                                </span>
                                <span className="shrink-0 text-[10px]" style={{ color: 'rgba(10,10,10,0.2)' }}>{ago(fi.published)}</span>
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

          </div>

          {/* ── RIGHT: Directory + groups (only on listen channels) ──────── */}
          {!channel.cat && (
          <aside className="hidden lg:block space-y-8">

            {/* Settlers */}
            <div>
              <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-3"
                style={{ color: 'rgba(10,10,10,0.3)', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 8 }}>
                Settlers
              </p>
              <a href={`/${cityId}/people`}
                className="flex items-center justify-between py-2 group hover:opacity-60 transition-opacity">
                <p className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>
                  Settler directory
                </p>
                <span className="text-xs" style={{ color: 'rgba(10,10,10,0.3)' }}>→</span>
              </a>
              <p className="text-xs" style={{ color: 'rgba(10,10,10,0.4)' }}>
                Who else is settling in {city.name}
              </p>
            </div>

            {/* Community groups */}
            {resources.length > 0 && (
              <div>
                <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-3"
                  style={{ color: 'rgba(10,10,10,0.3)', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 8 }}>
                  Community groups
                </p>
                <div>
                  {resources.map((r, i) => (
                    <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-2.5 py-2.5 hover:opacity-60 transition-opacity"
                      style={{ borderBottom: i < resources.length - 1 ? '1px solid rgba(10,10,10,0.06)' : 'none' }}>
                      <span className="text-[10px] font-black shrink-0 w-5"
                        style={{ color: RESOURCE_STYLE[r.type].color }}>
                        {RESOURCE_STYLE[r.type].label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" style={{ color: '#0A0A0A' }}>{r.name}</p>
                        <p className="text-[10px] truncate" style={{ color: 'rgba(10,10,10,0.4)' }}>{r.desc}</p>
                      </div>
                      <span className="text-[10px] opacity-30 group-hover:opacity-60 transition-opacity"
                        style={{ color: '#0A0A0A' }}>↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </aside>
          )}

          {/* ── Mobile-only: Settlers + Community groups (under main column) ─ */}
          {!channel.cat && (
          <div className="lg:hidden mt-12 pt-10 space-y-8" style={{ borderTop: '1px solid rgba(10,10,10,0.1)' }}>
            <div>
              <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-3"
                style={{ color: 'rgba(10,10,10,0.3)', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 8 }}>
                Settlers
              </p>
              <a href={`/${cityId}/people`}
                className="flex items-center justify-between py-2 group hover:opacity-60 transition-opacity">
                <p className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>Settler directory</p>
                <span className="text-xs" style={{ color: 'rgba(10,10,10,0.3)' }}>→</span>
              </a>
              <p className="text-xs" style={{ color: 'rgba(10,10,10,0.4)' }}>
                Who else is settling in {city.name}
              </p>
            </div>

            {resources.length > 0 && (
              <div>
                <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-3"
                  style={{ color: 'rgba(10,10,10,0.3)', borderBottom: '1px solid rgba(10,10,10,0.1)', paddingBottom: 8 }}>
                  Community groups
                </p>
                <div>
                  {resources.map((r, i) => (
                    <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-2.5 py-2.5 hover:opacity-60 transition-opacity"
                      style={{ borderBottom: i < resources.length - 1 ? '1px solid rgba(10,10,10,0.06)' : 'none' }}>
                      <span className="text-[10px] font-black shrink-0 w-5"
                        style={{ color: RESOURCE_STYLE[r.type].color }}>
                        {RESOURCE_STYLE[r.type].label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" style={{ color: '#0A0A0A' }}>{r.name}</p>
                        <p className="text-[10px] truncate" style={{ color: 'rgba(10,10,10,0.4)' }}>{r.desc}</p>
                      </div>
                      <span className="text-[10px] opacity-30 group-hover:opacity-60 transition-opacity"
                        style={{ color: '#0A0A0A' }}>↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
