import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCity, ACTIVE_CITIES } from '@/lib/data/cities'

/* ── PDF palette ─────────────────────────────────────────────────────────────
   Indigo #4744C8  Sky #38C0F0  Magenta #FF3EBA  Gold #FAB400  Navy #252450
─────────────────────────────────────────────────────────────────────────── */

export function generateStaticParams() {
  return ACTIVE_CITIES.map(c => ({ city: c.id }))
}

interface RedditPreview {
  id: string
  title: string
  subreddit: string
  score: number
  comments: number
  permalink: string
  created: number
}

const CITY_SUBS: Record<string, string> = {
  brussels: 'brussels',
  lisbon:   'portugal',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRedditPulse(cityId: string): Promise<RedditPreview[]> {
  const sub = CITY_SUBS[cityId] ?? 'brussels'
  try {
    const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=8`, {
      headers: { 'User-Agent': 'Roots/1.0 (+https://roots.so; contact: hello@roots.so)' },
      next: { revalidate: 900 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data?.children ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => !c.data.over_18 && !c.data.stickied)
      .slice(0, 3)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => ({
        id:        c.data.id,
        title:     c.data.title,
        subreddit: c.data.subreddit,
        score:     c.data.score,
        comments:  c.data.num_comments,
        permalink: `https://reddit.com${c.data.permalink}`,
        created:   c.data.created_utc,
      }))
  } catch {
    return []
  }
}

// Curated seed tips — real, specific, Brussels-only
const BRUSSELS_TIPS = [
  {
    category: 'recommendation',
    text: 'Partenamut in Ixelles has an English-speaking advisor on Tuesday afternoons. Ask for the international desk — makes the mutuelle process so much easier.',
    stage: 'Just arrived',
    color: '#10B981',
  },
  {
    category: 'heads-up',
    text: 'Molenbeek and Anderlecht commune offices have longer waits than Etterbeek right now. Worth calling ahead before booking your appointment.',
    stage: 'Getting settled',
    color: '#FAB400',
  },
  {
    category: 'question',
    text: 'Anyone found a good English-speaking GP in Ixelles or Saint-Gilles? GP-finder sites are outdated and half of them aren\'t taking new patients.',
    stage: 'Just arrived',
    color: '#38C0F0',
  },
]

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city: cityId } = await params
  const city = getCity(cityId)
  if (!city || !city.active) notFound()

  const redditPosts = await getRedditPulse(cityId)

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-6 md:px-10 pt-14 pb-24 md:pt-16 md:pb-32"
        style={{ background: '#F5ECD7' }}
      >
        {/* Geometric shapes */}
        <div className="absolute rounded-full pointer-events-none"
          style={{ background: '#4744C8', width: '32vw', height: '32vw', maxWidth: 420, maxHeight: 420, top: '-20%', right: '-8%' }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ background: '#38C0F0', width: '14vw', height: '14vw', maxWidth: 180, bottom: '10%', right: '16%' }} />
        <div className="absolute pointer-events-none"
          style={{ background: '#FAB400', width: 80, height: 80, bottom: '8%', left: '8%', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', opacity: 0.6 }} />
        <div className="absolute pointer-events-none overflow-hidden" style={{ width: 90, height: 45, bottom: 0, left: '38%' }}>
          <div className="w-full rounded-full" style={{ background: '#FF3EBA', height: 90, marginTop: -45, opacity: 0.75 }} />
        </div>

        <div className="max-w-4xl mx-auto relative">
          <p className="text-xs uppercase tracking-[0.25em] mb-5 font-semibold" style={{ color: '#252450', opacity: 0.4 }}>Belgium</p>
          <h1
            className="font-display font-black leading-[0.85] mb-6"
            style={{ fontSize: 'clamp(4rem, 10vw, 9rem)', color: '#252450' }}
          >
            {city.name}
          </h1>
          <p className="text-base md:text-lg max-w-sm leading-relaxed mb-8" style={{ color: '#252450', opacity: 0.6 }}>
            Find your people. Get set up. Build a life here — with others doing the same thing.
          </p>

          <div className="flex items-center gap-2 mb-10">
            <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: '#38C0F0' }} />
            <span className="text-sm font-medium" style={{ color: '#252450', opacity: 0.45 }}>
              {city.settlerCount} people finding their feet here right now
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/${cityId}/connect`}
              className="inline-flex items-center justify-center px-8 py-4 text-white rounded-full font-bold hover:opacity-90 transition-opacity text-sm"
              style={{ background: '#4744C8' }}
            >
              Join the community →
            </Link>
            <Link
              href={`/${cityId}/settle`}
              className="inline-flex items-center justify-center px-8 py-4 rounded-full font-medium hover:opacity-80 transition-opacity text-sm"
              style={{ border: '2px solid rgba(37,36,80,0.2)', color: '#252450' }}
            >
              I need to get set up
            </Link>
          </div>
        </div>
      </div>

      {/* ── Community pulse ───────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-14 md:py-20" style={{ background: '#FAFAF8' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-stone mb-3 font-semibold">From the community</p>
              <h2 className="font-display font-bold" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 0.95, color: '#252450' }}>
                What your neighbours<br />are saying.
              </h2>
            </div>
            <Link href={`/${cityId}/connect`}
              className="text-sm font-semibold mb-1 hover:opacity-70 transition-opacity shrink-0"
              style={{ color: '#4744C8' }}>
              All posts →
            </Link>
          </div>

          <div className="space-y-3">
            {BRUSSELS_TIPS.map((tip, i) => (
              <div key={i} className="bg-white rounded-xl border border-sand/50 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                    style={{ background: tip.color + '18', color: tip.color }}
                  >
                    {tip.category}
                  </span>
                  <span className="text-xs text-stone">{tip.stage}</span>
                </div>
                <p className="text-sm text-walnut/80 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link
              href={`/${cityId}/connect`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity text-white"
              style={{ background: '#FF3EBA' }}
            >
              Join the conversation →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Reddit live ───────────────────────────────────────────────── */}
      {redditPosts.length > 0 && (
        <section className="px-6 md:px-10 py-14 md:py-20" style={{ background: '#F5ECD7' }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end justify-between mb-10 gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-stone mb-3 font-semibold">Live from Reddit</p>
                <h2 className="font-display font-bold" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 0.95, color: '#252450' }}>
                  r/brussels<br />right now.
                </h2>
              </div>
              <Link href={`/${cityId}/connect`}
                className="text-sm font-semibold mb-1 hover:opacity-70 transition-opacity shrink-0"
                style={{ color: '#4744C8' }}>
                Full feed →
              </Link>
            </div>

            <div className="space-y-3">
              {redditPosts.map(post => {
                const diff  = Math.floor(Date.now() / 1000) - post.created
                const ago   = diff < 3600 ? `${Math.floor(diff / 60)}m ago`
                            : diff < 86400 ? `${Math.floor(diff / 3600)}h ago`
                            : `${Math.floor(diff / 86400)}d ago`
                return (
                  <a
                    key={post.id}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-4 bg-white rounded-xl border border-sand/50 px-6 py-5 hover:border-sand hover:shadow-md hover:shadow-espresso/4 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-espresso leading-snug mb-2 group-hover:text-terracotta transition-colors">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-stone">
                        <span style={{ color: '#FF4500' }} className="font-bold">r/{post.subreddit}</span>
                        <span>{post.score.toLocaleString()} pts</span>
                        <span>{post.comments} comments</span>
                        <span>{ago}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity mt-1" style={{ color: '#4744C8' }}>
                      Open →
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Tools — settle + ask ──────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-14 md:py-20" style={{ background: '#252450' }}>
        {/* Geometric decorations */}
        <div className="absolute rounded-full pointer-events-none" style={{ background: '#4744C8', width: 200, height: 200, opacity: 0.4, marginTop: -60, marginLeft: '70%' }} />

        <div className="max-w-4xl mx-auto relative">
          <p className="text-xs uppercase tracking-[0.25em] mb-3 font-semibold" style={{ color: 'rgba(245,236,215,0.4)' }}>When you need them</p>
          <h2 className="font-display font-bold text-white mb-10" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 0.95 }}>
            Tools to get<br />set up faster.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Settle */}
            <Link
              href={`/${cityId}/settle`}
              className="group relative rounded-2xl p-7 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              style={{ background: '#FAB400' }}
            >
              <div className="absolute -bottom-6 -right-6 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.2)', width: 120, height: 120 }} />
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(37,36,80,0.5)' }}>Settle</p>
              <h3 className="font-display font-bold text-xl leading-tight mb-2" style={{ color: '#252450' }}>
                Your checklist,<br />your pace.
              </h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(37,36,80,0.6)' }}>
                Commune registration, mutuelle, bank account — filtered to exactly your situation.
              </p>
              <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#252450' }}>Start →</span>
            </Link>

            {/* Ask */}
            <Link
              href={`/${cityId}/ask`}
              className="group relative rounded-2xl p-7 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              style={{ background: '#38C0F0' }}
            >
              <div className="absolute -top-8 -left-8 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.2)', width: 120, height: 120 }} />
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(37,36,80,0.5)' }}>Ask</p>
              <h3 className="font-display font-bold text-xl leading-tight mb-2" style={{ color: '#252450' }}>
                Any question.<br />Live answers.
              </h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(37,36,80,0.65)' }}>
                Specific, cited answers about Brussels — based on your visa, your stage, your situation.
              </p>
              <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#252450' }}>Ask →</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
