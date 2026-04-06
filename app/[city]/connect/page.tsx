'use client'
import { use, useState } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'
import { getCity, STAGES } from '@/lib/data/cities'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { Post, PostCategory, Stage } from '@/lib/types'

const SEED_POSTS: Post[] = [
  {
    id: 's1', cityId: 'brussels', stage: 'just_arrived', category: 'recommendation',
    text: 'Partenamut in Ixelles has an English-speaking advisor on Tuesday afternoons. Ask specifically for the international desk — makes the mutuelle process so much easier.',
    time: '2 days ago', authorStage: 'just_arrived',
  },
  {
    id: 's2', cityId: 'brussels', stage: 'settling', category: 'heads-up',
    text: 'STIB strike confirmed for Thursday 10 April. Check the app before leaving — usually 4 lines run at reduced frequency but Tram 81 and Metro 1/5 are often suspended entirely.',
    time: '5 hours ago', authorStage: 'settling',
  },
  {
    id: 's3', cityId: 'brussels', stage: 'just_arrived', category: 'question',
    text: 'Does anyone know which commune is fastest right now for registration? I\'ve heard Etterbeek and Woluwe-Saint-Lambert have shorter waits than Ixelles at the moment.',
    time: '1 day ago', authorStage: 'just_arrived',
  },
  {
    id: 's4', cityId: 'lisbon', stage: 'just_arrived', category: 'recommendation',
    text: 'Go to the Finanças office in Areeiro for your NIF — shorter queues than downtown. Bring your passport, a utility bill from home country (or a signed declaration), and arrive before 9am.',
    time: '3 days ago', authorStage: 'just_arrived',
  },
  {
    id: 's5', cityId: 'lisbon', stage: 'settling', category: 'question',
    text: 'Has anyone applied for NHR recently? I\'ve seen conflicting information about whether the new regime (IFICI) affects remote workers or just highly qualified professions.',
    time: '2 days ago', authorStage: 'settling',
  },
  {
    id: 's6', cityId: 'lisbon', stage: 'settled', category: 'recommendation',
    text: 'For anyone house-hunting in Lisbon: Idealista is the best platform but set alerts immediately and visit within hours. Good apartments in Príncipe Real, Mouraria, and Intendente go the same day.',
    time: '1 week ago', authorStage: 'settled',
  },
]

const CATEGORY_VARIANTS: Record<PostCategory, 'terracotta' | 'sage' | 'sky'> = {
  'heads-up':     'terracotta',
  recommendation: 'sage',
  question:       'sky',
}

const STAGE_LABELS: Record<Stage, string> = {
  planning:     'Planning',
  just_arrived: 'Just arrived',
  settling:     'Getting settled',
  settled:      'Settled',
}

export default function ConnectPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityId } = use(params)
  const city = getCity(cityId)
  const { profile } = useProfile()

  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all')
  const [catFilter, setCatFilter] = useState<PostCategory | 'all'>('all')
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS)
  const [newPost, setNewPost] = useState({ category: 'recommendation' as PostCategory, text: '' })
  const [submitted, setSubmitted] = useState(false)

  if (!city) return null

  const cityPosts = posts.filter(p => p.cityId === cityId)
  const filtered = cityPosts.filter(p => {
    if (stageFilter !== 'all' && p.stage !== stageFilter) return false
    if (catFilter !== 'all' && p.category !== catFilter) return false
    return true
  })

  const submit = () => {
    if (!newPost.text.trim()) return
    const post: Post = {
      id: `u${Date.now()}`,
      cityId: city.id,
      stage: profile.stage as Stage | undefined,
      category: newPost.category,
      text: newPost.text.trim(),
      time: 'just now',
      authorStage: profile.stage as Stage | undefined,
    }
    setPosts(prev => [post, ...prev])
    setNewPost({ category: 'recommendation', text: '' })
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-12 md:py-16">

      {/* Header */}
      <p className="text-xs uppercase tracking-[0.2em] text-walnut/50 mb-4">Connect · {city.name}</p>
      <h1 className="font-display font-bold text-espresso mb-3"
        style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 0.92 }}>
        People at<br />your stage.
      </h1>
      <p className="text-walnut text-sm max-w-md mb-10 leading-relaxed">
        Tips, questions, and heads-up from people settling in {city.name} — filtered to where you are in the journey.
      </p>

      {/* Post form */}
      <div className="bg-ivory border border-sand rounded-3xl p-6 mb-8">
        <p className="text-sm font-medium text-espresso mb-4">Share something</p>
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(['recommendation', 'question', 'heads-up'] as PostCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setNewPost(p => ({ ...p, category: cat }))}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-colors',
                  newPost.category === cat
                    ? cat === 'recommendation' ? 'bg-sage text-cream'
                      : cat === 'question' ? 'bg-sky text-cream'
                      : 'bg-terracotta text-cream'
                    : 'bg-white border border-sand text-walnut hover:border-espresso/30'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div>
            <textarea
              value={newPost.text}
              onChange={e => setNewPost(p => ({ ...p, text: e.target.value.slice(0, 280) }))}
              placeholder="A tip, a question, or something others should know…"
              rows={3}
              className="w-full px-4 py-3 bg-white border border-sand rounded-xl text-sm text-espresso placeholder:text-walnut/40 focus:outline-none focus:border-terracotta/50 resize-none"
            />
            <p className="text-xs text-walnut/40 text-right mt-1">{newPost.text.length}/280</p>
          </div>
          {profile.stage && (
            <p className="text-xs text-walnut/40">
              Posting as: {STAGE_LABELS[profile.stage as Stage]} in {city.name}
            </p>
          )}
          <button
            onClick={submit}
            disabled={!newPost.text.trim()}
            className="px-6 py-2.5 bg-terracotta text-cream rounded-full text-sm font-medium hover:bg-terracotta-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitted ? 'Posted ✓' : 'Post'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setStageFilter('all')}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            stageFilter === 'all' ? 'bg-espresso text-cream' : 'bg-ivory border border-sand text-walnut hover:text-espresso'
          )}
        >
          All stages
        </button>
        {STAGES.map(s => (
          <button
            key={s.id}
            onClick={() => setStageFilter(s.id)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              stageFilter === s.id ? 'bg-espresso text-cream' : 'bg-ivory border border-sand text-walnut hover:text-espresso'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {(['all', 'recommendation', 'question', 'heads-up'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors',
              catFilter === cat ? 'bg-terracotta text-cream' : 'bg-ivory border border-sand text-walnut hover:text-espresso'
            )}
          >
            {cat === 'all' ? 'All types' : cat}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-walnut text-sm py-8 text-center">No posts match this filter.</p>
        ) : (
          filtered.map(post => (
            <div key={post.id} className="bg-ivory border border-sand rounded-2xl px-6 py-5">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant={CATEGORY_VARIANTS[post.category]}>{post.category}</Badge>
                {post.authorStage && (
                  <span className="text-xs text-walnut/50 bg-sand/50 px-2.5 py-0.5 rounded-full">
                    {STAGE_LABELS[post.authorStage]}
                  </span>
                )}
                <span className="text-xs text-walnut/40 ml-auto">{post.time}</span>
              </div>
              <p className="text-sm text-espresso leading-relaxed">{post.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
