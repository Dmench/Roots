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
import RedditChannel from '@/components/connect/RedditChannel'
import { GeometricThread } from '@/components/layout/GeometricThread'
import { PageMasthead } from '@/components/layout/PageMasthead'

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
  { id: 'bxl-m1', cityId: 'brussels', name: 'Brussels expat meetups',      type: 'meetup', desc: 'Active in-person groups.',        url: meetupSearch('expats',           'be--Brussels') },
  { id: 'bxl-m2', cityId: 'brussels', name: 'English-speaking groups',     type: 'meetup', desc: 'Social events in English.',       url: meetupSearch('english speaking', 'be--Brussels') },
  { id: 'bxl-m3', cityId: 'brussels', name: 'Brussels tech meetups',       type: 'meetup', desc: 'Engineering, AI, startups.',      url: meetupSearch('tech',             'be--Brussels') },
  // Lisbon — Reddit
  { id: 'lis-r1', cityId: 'lisbon',   name: 'r/lisbon',                    type: 'reddit', desc: 'Local subreddit.',                url: 'https://www.reddit.com/r/lisbon' },
  { id: 'lis-r2', cityId: 'lisbon',   name: 'r/PortugalExpats',            type: 'reddit', desc: 'Visas, NHR, housing.',            url: 'https://www.reddit.com/r/PortugalExpats' },
  // Lisbon — Meetup
  { id: 'lis-m1', cityId: 'lisbon',   name: 'Lisbon expat meetups',        type: 'meetup', desc: 'Most active expat groups.',       url: meetupSearch('expats',           'pt--Lisbon')   },
  { id: 'lis-m2', cityId: 'lisbon',   name: 'English-speaking groups',     type: 'meetup', desc: 'Social events in English.',       url: meetupSearch('english speaking', 'pt--Lisbon')   },
]

const RESOURCE_STYLE: Record<ResourceType, { color: string; label: string }> = {
  reddit: { color: '#FF4500', label: 'r/' },
  meetup: { color: '#E1523D', label: 'mu' },
}

/* ── Curated seed content (clearly labeled, not fake activity) ───────────── */

interface CuratedPin {
  id: string
  text: string
  label: string   // shown as "Roots note" — never attributed to a fake user
}

const PINNED: Record<string, Record<string, CuratedPin[]>> = {
  brussels: {
    tips: [
      { id: 'bxl-tip-1',  label: 'Roots note', text: 'Register at your commune within 8 days of arriving — this unlocks your eID, mutuelle, and everything else. Ixelles and Saint-Gilles tend to have English-speaking staff.' },
      { id: 'bxl-tip-2',  label: 'Roots note', text: 'STIB\'s monthly pass is ~€59 and covers metro, tram, and bus across the whole region. The 12-trip card is better than single tickets if you\'re not yet committed to monthly.' },
      { id: 'bxl-tip-3',  label: 'Roots note', text: 'Mutualité Socialiste and Mutualité Chrétienne are the two dominant mutuelles, but Partenamut is the easiest for English speakers. Sign up within 90 days of arrival or you pay medical costs out of pocket.' },
      { id: 'bxl-tip-4',  label: 'Roots note', text: 'Open a Wise or Revolut account before you arrive. You\'ll need a Belgian address and eID for a full Belgian bank, but you can receive your first salary into Wise no problem.' },
      { id: 'bxl-tip-5',  label: 'Roots note', text: 'Place Flagey market on Saturday morning is the best food market in Brussels — get there before 11. Cheese, wine, bread, Moroccan olives, and a Belga terrace afterwards.' },
      { id: 'bxl-tip-6',  label: 'Roots note', text: 'Villo bike share is €38 a year — cheaper than two STIB monthly passes. Phone-unlock, dock anywhere in the city, half the bikes work most days.' },
      { id: 'bxl-tip-7',  label: 'Roots note', text: 'For an English-speaking GP without a wait, look up Brussels Medical Center (BMC) in Châtelain or House of Doctors near Schuman. Both bill via your mutuelle directly once you\'re registered.' },
      { id: 'bxl-tip-8',  label: 'Roots note', text: 'Get an Itsme account as soon as you have an eID. It\'s the Belgian universal login for tax declarations, mutuelle paperwork, opening accounts — saves hours over time.' },
      { id: 'bxl-tip-9',  label: 'Roots note', text: 'For groceries: Carrefour Express for late nights, Delhaize for produce quality, Lidl for everything else. The Wednesday-evening Châtelain market beats them all for a date-night dinner.' },
      { id: 'bxl-tip-10', label: 'Roots note', text: 'If you arrive in summer, expect half the city to be closed in August. Sign anything important (lease, bank, mutuelle) before the first week of August or after the third week.' },
    ],
    questions: [
      { id: 'bxl-q-1', label: 'Roots note', text: 'Common question: how long does commune registration actually take? Most communes process your dossier in 4–8 weeks, then a local police officer visits your address before the card is issued.' },
      { id: 'bxl-q-2', label: 'Roots note', text: 'People often ask about the 3-6-9 lease. It\'s a standard Belgian residential lease — you can leave after 3, 6, or 9 years with 3 months notice. Earlier exits cost ~3 months\' rent in penalty.' },
      { id: 'bxl-q-3', label: 'Roots note', text: 'Do I need to speak French in Brussels? In Ixelles, Saint-Gilles, the EU Quarter, Châtelain, and Dansaert — no, English is fine. In communes north and west of the canal, basic French saves a lot of friction.' },
      { id: 'bxl-q-4', label: 'Roots note', text: 'How do I find an apartment without an agency? Immoweb is the main listing site, but the best places never make it there — check Reddit r/brussels weekly threads and ask directly in expat WhatsApp groups.' },
      { id: 'bxl-q-5', label: 'Roots note', text: 'Tax residency: Belgium taxes you on worldwide income from the day you register at the commune. If you arrive late in the year, you\'ll only owe on income earned from your registration date — not the full year.' },
      { id: 'bxl-q-6', label: 'Roots note', text: 'Best mobile operators for new arrivals: Mobile Vikings (best for English-speaking customer service), Proximus (best coverage), or BASE (cheapest). All work fine; you can switch in 30 days if you change your mind.' },
      { id: 'bxl-q-7', label: 'Roots note', text: 'Schools for non-Belgian children: International School of Brussels (Watermael-Boitsfort) and BSB (Tervuren) for English curriculums. For a public school in French/Dutch, your commune assigns based on residence.' },
      { id: 'bxl-q-8', label: 'Roots note', text: 'Healthcare while you wait for your mutuelle: keep all receipts. Once your mutuelle membership is backdated, you can submit them and get reimbursed retroactively. Don\'t throw any paperwork away in the first 3 months.' },
    ],
    'heads-up': [
      { id: 'bxl-hu-1', label: 'Roots note', text: 'Rental guarantees in Brussels are capped at 2 months\' rent by law (or 3 months in a bank guarantee). If a landlord asks for more, that\'s illegal — push back or walk away.' },
      { id: 'bxl-hu-2', label: 'Roots note', text: 'Belgian banks often require a Belgian address and eID to open a full current account. In the meantime, Wise or N26 cover salary, rent, and direct debits for most things.' },
      { id: 'bxl-hu-3', label: 'Roots note', text: 'Trash collection in Brussels uses coloured bags — white (general), yellow (paper), blue (PMC: plastic, metal, cartons). Buying the wrong commune\'s bag means it won\'t be picked up. Check your commune\'s schedule, it varies street by street.' },
      { id: 'bxl-hu-4', label: 'Roots note', text: 'The "trêve hivernale" rule that exists in France does NOT exist in Belgium — landlords can evict in winter if you\'re behind on rent. Don\'t let unpaid rent stack up beyond two months.' },
      { id: 'bxl-hu-5', label: 'Roots note', text: 'Sundays in Brussels are properly closed. Most supermarkets shut by 13:00, many restaurants close all day. Brunch spots in Saint-Gilles and Ixelles are the exception. Plan accordingly or you\'ll be hungry.' },
      { id: 'bxl-hu-6', label: 'Roots note', text: 'STIB strikes are common — usually announced 48 hours ahead. Follow @STIBMIVB or the STIB app for live status. On strike days, Villo bikes and Lime scooters get expensive fast; budget extra.' },
      { id: 'bxl-hu-7', label: 'Roots note', text: 'Don\'t pay your mobile/internet contract by direct debit until you\'ve had your first bill. Operators occasionally double-charge or fail to cancel old plans, and reversing direct debits is a fight.' },
      { id: 'bxl-hu-8', label: 'Roots note', text: 'If you sign a lease through an agency, agency fees are illegal in Belgium for the tenant — only the landlord pays. If anyone tries to charge you, refuse politely and they almost always back down.' },
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
const CHANNELS: Channel[] = [
  // Listen
  { id: 'events',    label: 'Events',     sub: 'What\'s happening this week',     color: '#E8612A', group: 'listen'                          },
  { id: 'reddit',    label: 'Reddit',     sub: 'What the city is talking about',  color: '#FF4500', group: 'listen'                          },
  { id: 'news',      label: 'News',       sub: 'Curated local headlines',         color: '#4744C8', group: 'listen'                          },
  // Talk
  { id: 'tips',      label: 'Tips',       sub: 'Locals sharing what works',       color: '#10B981', group: 'talk',   cat: 'recommendation'   },
  { id: 'questions', label: 'Questions',  sub: 'Ask the community anything',      color: '#38C0F0', group: 'talk',   cat: 'question'         },
  { id: 'heads-up',  label: 'Heads-up',   sub: 'Warnings & things to know',       color: '#FAB400', group: 'talk',   cat: 'heads-up'         },
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
  const [redditPosts,  setRedditPosts]  = useState<FeedItem[]>([])
  const [redditFetch,  setRedditFetch]  = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [activeChannel,  setActiveChannel]  = useState<ChannelId>('events')
  const [activeHood,     setActiveHood]     = useState<string | null>(null)
  const [expandedPost,   setExpandedPost]   = useState<string | null>(null)
  const [comments,       setComments]       = useState<Record<string, PostComment[]>>({})
  const [commentCounts,  setCommentCounts]  = useState<Record<string, number>>({})
  const [commentDrafts,  setCommentDrafts]  = useState<Record<string, string>>({})
  const [commentPosting, setCommentPosting] = useState(false)

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
      })
  }, [cityId, city])

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
            author_stage: string | null; neighborhood: string | null
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

  // Reddit fetch via our server-side /api/reddit proxy.
  // Direct browser fetch to reddit.com/hot.json was broken (Reddit started
  // returning 403 to no-UA browser requests). The server route rotates UAs
  // and falls back to old.reddit.com on failure — much more reliable.
  useEffect(() => {
    if (redditFetch !== 'idle') return
    setRedditFetch('loading')
    fetch(`/api/reddit?city=${cityId}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(json => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: FeedItem[] = (json.posts ?? [])
          .slice(0, 8)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((p: any) => ({
            id:          p.id,
            source:      'reddit' as const,
            sourceLabel: p.subreddit ? `r/${p.subreddit}` : 'Reddit',
            category:    'community' as const,
            title:       p.title,
            summary:     (p.text ?? '').slice(0, 220),
            url:         p.permalink,
            published:   p.created,
            subreddit:   p.subreddit,
            flair:       p.flair ?? undefined,
            score:       p.score,
            comments:    p.comments,
            author:      p.author,
          }))
        setRedditPosts(items)
        setRedditFetch(items.length > 0 ? 'done' : 'error')
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
    ? posts
        .filter(p => p.category === channel.cat)
        .filter(p => !activeHood || p.neighborhood === activeHood)
    : []

  // Hoods to surface in the filter row: profile's hood (always first), then
  // city's most-asked-about ones, deduped.
  const popularHoods = POPULAR_HOODS[cityId] ?? []
  const hoodChips    = profile.neighborhood && !popularHoods.includes(profile.neighborhood)
    ? [profile.neighborhood, ...popularHoods]
    : popularHoods

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
        {redditItems.length > 0 && (
          <span className="text-[10px] font-black tracking-[0.18em] uppercase"
            style={{ color: '#FF4500' }}>
            r/{cityId} hot
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
                ch.id === 'events' ? eventItems.length :
                ch.id === 'news'   ? newsItems.length  :
                ch.id === 'reddit' ? redditItems.length :
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
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">

          {/* ── LEFT: Main channel content ───────────────────────────────── */}
          <div className="min-w-0">

            {/* ── Community channels (tips / questions / heads-up) ──────── */}
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
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] mb-4"
                            style={{ color: 'rgba(10,10,10,0.25)' }}>
                            From Roots
                          </p>
                          {pins.map((pin, i) => (
                            <div key={pin.id}
                              className="flex gap-4 py-4"
                              style={{ borderTop: i > 0 ? '1px solid rgba(10,10,10,0.07)' : 'none' }}>
                              <div className="w-0.5 shrink-0 self-stretch" style={{ background: '#4744C8' }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1.5"
                                  style={{ color: '#4744C8' }}>
                                  {pin.label}
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: 'rgba(10,10,10,0.7)' }}>
                                  {pin.text}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(10,10,10,0.1)' }}>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] mb-3"
                              style={{ color: 'rgba(10,10,10,0.25)' }}>
                              Community posts
                            </p>
                            <p className="text-sm font-semibold mb-1.5" style={{ color: '#0A0A0A' }}>
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
                              className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.16em] uppercase hover:opacity-60 transition-opacity"
                              style={{ color: channel.color }}>
                              {channel.id === 'tips' ? 'Share a tip' : channel.id === 'questions' ? 'Ask a question' : 'Post a heads-up'}
                              <span>→</span>
                            </button>
                          </div>
                        </>
                      )}

                      {/* Community posts */}
                      {allContent.map(post => {
                        const m = CAT_META[post.category]
                        return (
                          <div key={post.id}
                            className="flex gap-4 py-4"
                            style={{ borderTop: '1px solid rgba(10,10,10,0.07)' }}>
                            <div className="w-0.5 shrink-0 self-stretch" style={{ background: m.color }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                {post.authorStage && (
                                  <span className="text-[10px] font-black tracking-[0.15em] uppercase"
                                    style={{ color: 'rgba(10,10,10,0.3)' }}>
                                    {STAGE_LABELS[post.authorStage]}
                                  </span>
                                )}
                                <span className="text-[10px] ml-auto" style={{ color: 'rgba(10,10,10,0.2)' }}>
                                  {post.time}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed" style={{ color: 'rgba(10,10,10,0.75)' }}>
                                {post.text}
                              </p>
                              {/* Action row — comments + report */}
                              <div className="mt-2 flex items-center gap-4">
                                <button
                                  onClick={() => toggleComments(post.id)}
                                  className="text-[10px] font-bold hover:opacity-60 transition-opacity"
                                  style={{ color: 'rgba(10,10,10,0.3)' }}>
                                  {expandedPost === post.id
                                    ? 'Hide replies'
                                    : `${commentCounts[post.id] ?? 0} ${(commentCounts[post.id] ?? 0) === 1 ? 'reply' : 'replies'}`}
                                </button>
                                <a
                                  href={`mailto:dmench9@gmail.com?subject=${encodeURIComponent(`Report post ${post.id} (${cityId})`)}&body=${encodeURIComponent(`Reason for reporting:\n\n\nPost ID: ${post.id}\nCategory: ${post.category}\nText: ${post.text.slice(0, 200)}`)}`}
                                  className="text-[10px] hover:opacity-100 transition-opacity"
                                  style={{ color: 'rgba(10,10,10,0.2)' }}
                                  title="Report this post">
                                  Report
                                </a>
                              </div>
                              {/* Inline thread */}
                              {expandedPost === post.id && (
                                <div className="mt-3 pl-3" style={{ borderLeft: `2px solid ${m.color}40` }}>
                                  {(comments[post.id] ?? []).map(c => (
                                    <div key={c.id} className="py-1.5" style={{ borderBottom: '1px solid rgba(10,10,10,0.05)' }}>
                                      <span className="text-[10px] font-black mr-2" style={{ color: m.color }}>
                                        {c.author_name ?? 'Settler'}
                                      </span>
                                      <span className="text-xs" style={{ color: 'rgba(10,10,10,0.65)' }}>{c.text}</span>
                                    </div>
                                  ))}
                                  {(comments[post.id] ?? []).length === 0 && (
                                    <p className="text-[10px] py-1.5" style={{ color: 'rgba(10,10,10,0.3)' }}>No replies yet</p>
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
                          </div>
                        )
                      })}

                      {/* No content (no curated pins available either) */}
                      {showPins && pins.length === 0 && (
                        <div className="py-10 text-center">
                          <p className="text-sm font-semibold mb-1.5" style={{ color: '#0A0A0A' }}>
                            {channel.id === 'tips' ? 'No tips yet — yours could be the first.'
                             : channel.id === 'questions' ? 'No questions yet — ask away.'
                             : 'No heads-ups yet.'}
                          </p>
                          <p className="text-xs" style={{ color: 'rgba(10,10,10,0.45)' }}>
                            Use the box below — we read every post.
                          </p>
                        </div>
                      )}
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

            {/* ── Events channel ───────────────────────────────────────── */}
            {channel.id === 'events' && (
              <>
                {feedState === 'loading' && (
                  <div>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex gap-4 py-4 animate-pulse"
                        style={{ borderBottom: '1px solid rgba(10,10,10,0.07)' }}>
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
                    <p className="text-sm" style={{ color: 'rgba(10,10,10,0.35)' }}>No events found right now</p>
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
                              <Image
                                src={fi.image}
                                alt=""
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                              />
                              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, #0F0E1E 100%)' }} />
                            </div>
                          )}
                          <div className="px-5 pt-3 pb-5">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-black tracking-[0.22em] uppercase"
                                style={{ color: dotColor }}>
                                {fi.sourceLabel}
                              </span>
                              <span className="text-[10px]" style={{ color: 'rgba(245,244,240,0.3)' }}>·</span>
                              <span className="text-[10px] font-semibold" style={{ color: 'rgba(245,244,240,0.4)' }}>{when}</span>
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
                          style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
                          {fi.image ? (
                            <Image src={fi.image} alt="" width={56} height={56} sizes="56px" className="w-14 h-14 object-cover shrink-0" />
                          ) : (
                            <div className="w-14 h-14 shrink-0 flex items-center justify-center"
                              style={{ background: `${dotColor}12` }}>
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black tracking-[0.18em] uppercase"
                                style={{ color: dotColor }}>
                                {fi.sourceLabel}
                              </span>
                              <span className="text-[10px]" style={{ color: 'rgba(10,10,10,0.3)' }}>{when}</span>
                            </div>
                            <p className="text-sm font-semibold leading-snug truncate"
                              style={{ color: '#0A0A0A' }}>
                              {fi.title}
                            </p>
                            {fi.summary && (
                              <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(10,10,10,0.4)' }}>
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

            {/* ── Reddit channel ───────────────────────────────────────── */}
            {channel.id === 'reddit' && (
              <RedditChannel cityId={cityId} items={redditItems} loading={redditFetch === 'loading'} />
            )}

          </div>

          {/* ── RIGHT: Directory + groups ─────────────────────────────────── */}
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

          {/* ── Mobile-only: Settlers + Community groups (under main column) ─ */}
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

        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
