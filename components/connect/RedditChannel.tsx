'use client'
import type { FeedItem } from '@/app/api/feeds/route'

interface Props {
  cityId:  string
  items:   FeedItem[]
  loading: boolean
}

function ago(published: number): string {
  const diff = Math.floor(Date.now() / 1000) - published
  return diff < 3600  ? `${Math.floor(diff / 60)}m`
       : diff < 86400 ? `${Math.floor(diff / 3600)}h`
       :                `${Math.floor(diff / 86400)}d`
}

export default function RedditChannel({ cityId, items, loading }: Props) {
  if (loading) {
    return (
      <div style={{ background: '#1C1A2E' }}>
        {[1, 2, 3, 4].map(i => (
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
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-16">
        <p className="text-sm" style={{ color: 'rgba(10,10,10,0.35)' }}>No Reddit posts right now</p>
      </div>
    )
  }

  const top      = items[0]
  const rest     = items.slice(1)
  const maxScore = Math.max(...items.map(p => p.score ?? 0))

  return (
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
          className="text-[10px] font-black tracking-wider hover:opacity-60 transition-opacity"
          style={{ color: 'rgba(245,236,215,0.25)', letterSpacing: '0.1em' }}>
          OPEN ↗
        </a>
      </div>

      {/* Featured top post */}
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
              <span className="inline-block text-[10px] font-black px-2 py-0.5 mb-2"
                style={{ background: 'rgba(255,69,0,0.2)', color: '#FF4500', letterSpacing: '0.06em' }}>
                {top.flair.toUpperCase()}
              </span>
            )}
            <p className="text-sm font-bold leading-snug" style={{ color: '#F5ECD7' }}>
              {top.title}
            </p>
            <p className="text-[10px] mt-2" style={{ color: 'rgba(245,236,215,0.3)' }}>
              {top.comments ?? 0} comments · {ago(top.published)}
            </p>
          </div>
        </div>
      </a>

      {/* Remaining posts */}
      {rest.map((fi, i) => {
        const barPct = maxScore > 0 ? Math.round(((fi.score ?? 0) / maxScore) * 100) : 0
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
            <p className="flex-1 min-w-0 text-sm font-semibold leading-snug line-clamp-2"
              style={{ color: 'rgba(245,236,215,0.7)' }}>
              {fi.title}
            </p>
            <span className="shrink-0 text-[10px]" style={{ color: 'rgba(245,236,215,0.2)' }}>{ago(fi.published)}</span>
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
        <span className="text-[10px]" style={{ color: 'rgba(245,236,215,0.15)' }}>via Reddit API</span>
      </div>
    </div>
  )
}
