'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { HousingComposer } from '@/components/connect/HousingComposer'
import { HousingCard } from '@/components/connect/HousingCard'
import { AuthModal } from '@/components/auth/AuthModal'
import type { Post, PostCategory, Stage, CityId } from '@/lib/types'

interface Props {
  cityId:   CityId
  cityName: string
}

function formatRelative(dateStr: string): string {
  const d    = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const HOUSING_CATS: PostCategory[] = ['housing-offer', 'housing-wanted']

// Dedicated Housing page — focused, no community-feed widgets.
// Voted unanimously by the design council (brand / growth / IA) as the
// right home for structured Housing listings: shareable URL, magazine
// register, decoupled from the Connect feed identity.
export function HousingPageClient({ cityId, cityName }: Props) {
  const [posts,      setPosts]      = useState<Post[]>([])
  const [loaded,     setLoaded]     = useState(false)
  const [filter,     setFilter]     = useState<'all' | 'offer' | 'wanted'>('all')
  const [authOpen,   setAuthOpen]   = useState(false)
  const [reported,   setReported]   = useState<Set<string>>(new Set())

  // Load housing posts. Filters server-side by category.
  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    sb.from('posts')
      .select('*')
      .eq('city_id', cityId)
      .in('category', HOUSING_CATS)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        setLoaded(true)
        if (error) {
          // Migration not yet run — category check rejects the values.
          // Render empty state rather than a hard crash.
          if (error.code === '23514' || error.code === '42703' || error.code === '42P01') return
          return
        }
        if (!data) return
        setPosts(data.map(p => ({
          id: p.id,
          cityId: p.city_id,
          stage: p.stage ?? undefined,
          category: p.category as PostCategory,
          text: p.text,
          time: formatRelative(p.created_at),
          authorStage: p.author_stage ?? undefined,
          neighborhood: p.neighborhood ?? undefined,
          title:    p.title     ?? undefined,
          price:    p.price     ?? undefined,
          dates:    p.dates     ?? undefined,
          photoUrl: p.photo_url ?? undefined,
        })))
      })
  }, [cityId])

  // Realtime: new housing posts surface live (no refresh).
  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    const ch = sb
      .channel(`housing-${cityId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `city_id=eq.${cityId}` },
        (payload) => {
          const r = payload.new as {
            id: string; city_id: string; stage: string | null; category: string;
            text: string; created_at: string; author_stage: string | null;
            neighborhood: string | null; title: string | null; price: string | null;
            dates: string | null; photo_url: string | null;
          }
          if (r.category !== 'housing-offer' && r.category !== 'housing-wanted') return
          setPosts(prev => {
            if (prev.some(p => p.id === r.id)) return prev
            const next: Post = {
              id: r.id, cityId: r.city_id as CityId,
              stage: (r.stage as Stage | null) ?? undefined,
              category: r.category as PostCategory,
              text: r.text, time: formatRelative(r.created_at),
              authorStage: (r.author_stage as Stage | null) ?? undefined,
              neighborhood: r.neighborhood ?? undefined,
              title: r.title ?? undefined, price: r.price ?? undefined,
              dates: r.dates ?? undefined, photoUrl: r.photo_url ?? undefined,
            }
            return [next, ...prev]
          })
        })
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [cityId])

  const reportPost = useCallback(async (id: string) => {
    setReported(prev => new Set(prev).add(id))
    if (!supabase) return
    try {
      const sb = supabase
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const { data: { session } } = await sb.auth.getSession()
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      await fetch('/api/posts/report', {
        method: 'POST', headers,
        body: JSON.stringify({ post_id: id, reason: 'spam' }),
      })
    } catch { /* leave optimistic */ }
  }, [])

  const filtered = posts.filter(p =>
    filter === 'all'   ? true
  : filter === 'offer'  ? p.category === 'housing-offer'
  :                       p.category === 'housing-wanted')

  const offerCount  = posts.filter(p => p.category === 'housing-offer').length
  const wantedCount = posts.filter(p => p.category === 'housing-wanted').length

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-8 md:py-12">
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Masthead */}
      <header className="mb-8 pb-6"
        style={{ borderBottom: '2px solid #FAB400' }}>
        <div className="flex items-baseline gap-3 mb-2">
          <span className="inline-block shrink-0"
            style={{ width: 10, height: 10, borderRadius: '50%', background: '#FAB400' }} />
          <span className="text-[10px] font-black tracking-[0.22em] uppercase"
            style={{ color: '#FAB400' }}>
            Vol. 01 · {cityName} · Housing
          </span>
        </div>
        <h1 className="font-display font-black text-3xl md:text-5xl leading-[0.95] mb-3"
          style={{ color: '#0A0A0A', letterSpacing: '-0.02em' }}>
          Settler listings.
          <br />
          <span style={{ color: '#FAB400' }}>Vetted, 14 days fresh.</span>
        </h1>
        <p className="text-sm md:text-base max-w-2xl"
          style={{ color: 'rgba(10,10,10,0.6)' }}>
          Rooms, studios, and wanted ads — posted by settlers, no agency fees,
          no listing scams. DM the lister via their profile.
        </p>
      </header>

      {/* Composer */}
      <div className="mb-8">
        <HousingComposer
          cityId={cityId}
          onNeedsAuth={() => setAuthOpen(true)}
          onSubmitted={(p) => setPosts(prev => [p, ...prev])} />
      </div>

      {/* Filter pills + count */}
      <div className="flex items-center justify-between gap-3 mb-5 pb-3"
        style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        <div className="flex gap-4">
          {([
            { id: 'all',    label: `All · ${posts.length}` },
            { id: 'offer',  label: `For rent · ${offerCount}` },
            { id: 'wanted', label: `Wanted · ${wantedCount}` },
          ] as const).map(opt => (
            <button key={opt.id} onClick={() => setFilter(opt.id)}
              className="text-[11px] font-black tracking-[0.18em] uppercase py-2 transition-opacity"
              style={{
                color: filter === opt.id ? '#FAB400' : 'rgba(10,10,10,0.4)',
                borderBottom: filter === opt.id ? '2px solid #FAB400' : '2px solid transparent',
              }}>
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-black tracking-[0.18em] uppercase"
          style={{ color: 'rgba(10,10,10,0.35)' }}>
          14-day expiry
        </span>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(p => (
            <HousingCard
              key={p.id}
              post={p}
              reported={reported.has(p.id)}
              onReport={() => reportPost(p.id)} />
          ))}
        </div>
      ) : (
        <div className="py-16 px-6 text-center"
          style={{ background: '#FAFAF7', border: '1px solid rgba(10,10,10,0.08)' }}>
          <p className="text-base font-semibold mb-2" style={{ color: '#0A0A0A' }}>
            {!loaded
              ? 'Loading listings…'
              : posts.length === 0
                ? 'No listings yet — yours could be the first.'
                : 'No listings match this filter yet.'}
          </p>
          <p className="text-sm max-w-md mx-auto"
            style={{ color: 'rgba(10,10,10,0.55)' }}>
            Settler-only, vetted, no agency fees. Post a room or a wanted-ad above.
          </p>
        </div>
      )}
    </div>
  )
}
