'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  score: number
  comments: number
  permalink: string
  created: number
  flair: string | null
}

interface Props {
  cityId: string
  sub: string   // subreddit name e.g. "brussels"
}

const SUB_MAP: Record<string, string> = {
  brussels:  'brussels',
  lisbon:    'portugal',
  berlin:    'berlin',
  barcelona: 'barcelona',
  amsterdam: 'amsterdam',
  prague:    'prague',
}

export default function RedditFeed({ cityId }: { cityId: string }) {
  const sub = SUB_MAP[cityId] ?? cityId
  const [posts,   setPosts]   = useState<Post[]>([])
  const [status,  setStatus]  = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    // Fetch directly from reddit.com in the browser — user IPs are never blocked.
    // Reddit supports CORS on .json endpoints so this works cross-origin.
    fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=15&raw_json=1`, {
      headers: { 'Accept': 'application/json' },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(json => {
        const items: Post[] = (json.data?.children ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((c: any) => !c.data.over_18 && !c.data.stickied)
          .slice(0, 5)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((c: any) => ({
            id:        c.data.id,
            title:     c.data.title,
            score:     c.data.score,
            comments:  c.data.num_comments,
            permalink: `https://reddit.com${c.data.permalink}`,
            created:   c.data.created_utc,
            flair:     c.data.link_flair_text ?? null,
          }))
        setPosts(items)
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }, [sub])

  if (status === 'loading') {
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between pb-3 mb-1"
          style={{ borderBottom: '1px solid rgba(37,36,80,0.15)' }}>
          <span className="text-[10px] font-black tracking-[0.22em] uppercase"
            style={{ color: 'rgba(37,36,80,0.5)' }}>
            City pulse
          </span>
        </div>
        <div className="space-y-3 pt-2">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-3 py-2 animate-pulse">
              <div className="w-6 h-3 rounded shrink-0 mt-1" style={{ background: 'rgba(37,36,80,0.07)' }} />
              <div className="flex-1 h-3 rounded" style={{ background: 'rgba(37,36,80,0.07)' }} />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (status === 'error' || posts.length === 0) return null

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between">
        {/* Section label */}
        <div className="flex items-center justify-between pb-3 mb-1 flex-1"
          style={{ borderBottom: '1px solid rgba(37,36,80,0.15)' }}>
          <span className="text-[10px] font-black tracking-[0.22em] uppercase"
            style={{ color: 'rgba(37,36,80,0.5)' }}>
            City pulse
          </span>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ background: '#10B981' }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5"
                style={{ background: '#10B981' }} />
            </span>
            <a href={`https://reddit.com/r/${sub}`} target="_blank" rel="noopener noreferrer"
              className="text-[9px] font-bold hover:opacity-50 transition-opacity"
              style={{ color: 'rgba(37,36,80,0.35)' }}>
              r/{sub} ↗
            </a>
          </div>
        </div>
      </div>

      {posts.map(post => {
        const diff = Math.floor(Date.now() / 1000) - post.created
        const ago  = diff < 3600 ? `${Math.floor(diff / 60)}m`
                   : diff < 86400 ? `${Math.floor(diff / 3600)}h`
                   : `${Math.floor(diff / 86400)}d`
        return (
          <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
            className="group flex gap-3 py-3.5 hover:opacity-55 transition-opacity"
            style={{ borderTop: '1px solid rgba(37,36,80,0.07)' }}>
            <span className="shrink-0 text-[10px] font-black w-7 text-right leading-tight pt-0.5"
              style={{ color: '#FF4500' }}>
              {post.score >= 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
            </span>
            <div className="flex-1 min-w-0">
              {post.flair && (
                <span className="text-[7px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded-sm mr-1.5 inline-block mb-1"
                  style={{ background: 'rgba(255,69,0,0.1)', color: '#FF4500' }}>
                  {post.flair}
                </span>
              )}
              <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: '#0F0E1E' }}>
                {post.title}
              </p>
              <p className="text-[9px] mt-1" style={{ color: 'rgba(37,36,80,0.3)' }}>
                {post.comments} comments · {ago}
              </p>
            </div>
          </a>
        )
      })}

      <Link href={`/${cityId}/connect`}
        className="block mt-4 pt-4 text-[9px] font-black tracking-widest uppercase hover:opacity-50 transition-opacity"
        style={{ borderTop: '1px solid rgba(37,36,80,0.07)', color: '#FF3EBA' }}>
        Join the community →
      </Link>
    </section>
  )
}
