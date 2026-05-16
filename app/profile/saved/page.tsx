'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { CURATED_BRUSSELS, getCuratedTip } from '@/lib/data/connect/curated-brussels'
import type { CuratedKind } from '@/lib/data/connect/curated-brussels'

const KIND_META: Record<CuratedKind, { label: string; color: string }> = {
  'tip':      { label: 'Tip',      color: '#0E9B6B' },
  'question': { label: 'Question', color: '#1A8FAD' },
  'heads-up': { label: 'Heads-up', color: '#FAB400' },
}

export default function SavedTipsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { profile, hydrated, toggleSavedTip } = useProfile()

  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  if (loading || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#FFFFFF' }}>
        <span className="text-[10px] font-black tracking-[0.22em] uppercase"
          style={{ color: 'rgba(10,10,10,0.3)' }}>
          Loading…
        </span>
      </div>
    )
  }

  const savedSlugs = profile.savedTipSlugs ?? []
  const saved = savedSlugs
    .map(s => getCuratedTip(s))
    .filter((n): n is NonNullable<typeof n> => n !== undefined)

  const cityId = profile.cityId ?? 'brussels'

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      {/* Minimal header */}
      <header style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        <div className="max-w-3xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <Link href="/profile" className="text-[10px] font-black tracking-[0.22em] uppercase hover:opacity-60 transition-opacity"
            style={{ color: 'rgba(10,10,10,0.5)' }}>
            ← Your profile
          </Link>
          <Link href={`/${cityId}/tips`} className="text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity"
            style={{ color: '#4744C8' }}>
            All tips →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 md:px-12 py-12">
        <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-3"
          style={{ color: 'rgba(10,10,10,0.4)' }}>
          Your saved tips
        </p>
        <h1 className="font-display font-black text-4xl md:text-5xl leading-tight mb-3"
          style={{ color: '#0A0A0A', letterSpacing: '-0.02em' }}>
          {saved.length === 0
            ? 'Nothing saved yet.'
            : `${saved.length} ${saved.length === 1 ? 'tip' : 'tips'} saved.`}
        </h1>
        <p className="text-base mb-10 max-w-xl" style={{ color: 'rgba(10,10,10,0.55)' }}>
          {saved.length === 0
            ? 'Anything you save from the tip pages lands here. Use it as the playbook you keep coming back to.'
            : 'Your private playbook. Save more from the tip pages — they\'re all hand-written.'}
        </p>

        {saved.length === 0 && (
          <Link href={`/${cityId}/tips`}
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: '#0A0A0A', color: '#fff' }}>
            Browse {CURATED_BRUSSELS.length} tips →
          </Link>
        )}

        {saved.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {saved.map(n => {
              const meta = KIND_META[n.kind]
              return (
                <div key={n.slug} className="px-5 py-4 flex items-start gap-4"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(10,10,10,0.1)' }}>
                  <div style={{ width: 4, alignSelf: 'stretch', background: meta.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-black tracking-[0.22em] uppercase"
                        style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                      {n.neighbourhood && (
                        <span className="text-[10px] font-black tracking-[0.18em] uppercase"
                          style={{ color: 'rgba(10,10,10,0.4)' }}>
                          {n.neighbourhood.replace(/-/g, ' ')}
                        </span>
                      )}
                    </div>
                    <Link href={`/${cityId}/tips/${n.slug}`}
                      className="text-base font-bold hover:opacity-70 transition-opacity"
                      style={{ color: '#0A0A0A' }}>
                      {n.title}
                    </Link>
                    <p className="text-xs leading-snug mt-1 line-clamp-2" style={{ color: 'rgba(10,10,10,0.5)' }}>
                      {n.body}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSavedTip(n.slug)}
                    className="shrink-0 text-[10px] font-bold hover:opacity-60 transition-opacity"
                    style={{ color: 'rgba(10,10,10,0.4)' }}
                    title="Remove from saved">
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
