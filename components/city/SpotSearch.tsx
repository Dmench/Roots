'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { SPOT_CATEGORIES } from '@/lib/types'
import type { Spot, SpotCategory } from '@/lib/types'

interface PlaceResult {
  placeId:  string
  name:     string
  address:  string
  rating:   number | null
  photoRef: string | null
  category: SpotCategory
}

interface Props {
  cityId: string
  onAdd:  (spot: Omit<Spot, 'id'>) => void
  onCancel: () => void
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= full ? '#FAB400' : (i === full + 1 && half) ? '#FAB400' : 'rgba(10,10,10,0.15)', fontSize: 9 }}>
          {i <= full ? '★' : (i === full + 1 && half) ? '½' : '★'}
        </span>
      ))}
      <span className="ml-0.5 text-[9px]" style={{ color: 'rgba(10,10,10,0.4)' }}>{rating.toFixed(1)}</span>
    </span>
  )
}

export function SpotSearch({ cityId, onAdd, onCancel }: Props) {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<PlaceResult[]>([])
  const [loading,   setLoading]   = useState(false)
  const [selected,  setSelected]  = useState<PlaceResult | null>(null)
  const [catOverride, setCatOverride] = useState<SpotCategory | null>(null)
  const [manual,    setManual]    = useState(false) // fallback: type name without Places
  const [manualCat, setManualCat] = useState<SpotCategory>('cafe')

  const inputRef   = useRef<HTMLInputElement>(null)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Debounced search
  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (q.length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/places/search?q=${encodeURIComponent(q)}&cityId=${cityId}`)
        const json = await res.json()
        setResults(json.results ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 320)
  }, [cityId])

  function handleInput(q: string) {
    setQuery(q)
    setSelected(null)
    setCatOverride(null)
    search(q)
  }

  function pick(place: PlaceResult) {
    setSelected(place)
    setQuery(place.name)
    setResults([])
  }

  function submit() {
    if (selected) {
      const cat = catOverride ?? selected.category
      onAdd({
        name:     selected.name,
        category: cat,
        placeId:  selected.placeId,
        address:  selected.address,
        photoRef: selected.photoRef ?? undefined,
        rating:   selected.rating ?? undefined,
      })
    } else if (manual && query.trim()) {
      onAdd({ name: query.trim(), category: manualCat })
    }
  }

  const currentCat = catOverride ?? selected?.category ?? manualCat
  const catConfig  = SPOT_CATEGORIES.find(c => c.id === currentCat)

  // Manual mode
  if (manual) {
    return (
      <div className="space-y-3">
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && query.trim()) submit(); if (e.key === 'Escape') onCancel() }}
          placeholder="Place name…"
          className="w-full px-3 py-2.5 text-sm focus:outline-none"
          style={{ border: '1px solid rgba(10,10,10,0.2)', color: '#0A0A0A' }}
        />
        <div className="flex flex-wrap gap-1.5">
          {SPOT_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setManualCat(c.id)}
              className="text-[9px] font-black tracking-[0.12em] uppercase px-2.5 py-1 transition-all"
              style={{ color: manualCat === c.id ? '#fff' : c.color, background: manualCat === c.id ? c.color : 'transparent', border: `1px solid ${c.color}` }}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={submit}
            className="px-5 py-2 text-xs font-bold text-white"
            style={{ background: '#0A0A0A', opacity: query.trim() ? 1 : 0.3 }}
            disabled={!query.trim()}>
            Add
          </button>
          <button onClick={() => setManual(false)} className="text-xs" style={{ color: 'rgba(10,10,10,0.4)' }}>
            ← Search instead
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') { if (selected) { setSelected(null); setQuery('') } else onCancel() } }}
          placeholder="Search for a place — café, bar, bookshop…"
          className="w-full pl-3 pr-8 py-2.5 text-sm focus:outline-none"
          style={{ border: '1px solid rgba(10,10,10,0.2)', color: '#0A0A0A' }}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="block w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin"
              style={{ color: 'rgba(10,10,10,0.25)' }} />
          </span>
        )}
        {!loading && query && (
          <button onClick={() => { setQuery(''); setSelected(null); setResults([]) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs hover:opacity-60"
            style={{ color: 'rgba(10,10,10,0.3)' }}>✕</button>
        )}
      </div>

      {/* Results dropdown */}
      {results.length > 0 && !selected && (
        <div style={{ border: '1px solid rgba(10,10,10,0.1)', background: '#fff' }}>
          {results.map((place, i) => (
            <button
              key={place.placeId}
              onClick={() => pick(place)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50 transition-colors"
              style={{ borderTop: i > 0 ? '1px solid rgba(10,10,10,0.06)' : 'none' }}>
              {/* Photo */}
              <div className="w-10 h-10 shrink-0 overflow-hidden bg-neutral-100 flex items-center justify-center">
                {place.photoRef ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/places/photo?ref=${encodeURIComponent(place.photoRef)}`}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-base" style={{ color: SPOT_CATEGORIES.find(c => c.id === place.category)?.color ?? '#888' }}>
                    {place.category === 'cafe' ? '☕' : place.category === 'bar' ? '🍺' : place.category === 'restaurant' ? '🍽' : place.category === 'bookstore' ? '📚' : place.category === 'record' ? '🎵' : place.category === 'market' ? '🛒' : '🛍'}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#0A0A0A' }}>{place.name}</p>
                <p className="text-[10px] truncate" style={{ color: 'rgba(10,10,10,0.4)' }}>{place.address}</p>
                {place.rating && <Stars rating={place.rating} />}
              </div>

              {/* Category dot */}
              <span className="text-[9px] font-black tracking-wide uppercase shrink-0"
                style={{ color: SPOT_CATEGORIES.find(c => c.id === place.category)?.color ?? '#888' }}>
                {SPOT_CATEGORIES.find(c => c.id === place.category)?.label}
              </span>
            </button>
          ))}

          {/* Manual fallback */}
          <button
            onClick={() => { setManual(true); setResults([]) }}
            className="w-full px-3 py-2.5 text-left text-[10px] hover:bg-neutral-50 transition-colors"
            style={{ borderTop: '1px solid rgba(10,10,10,0.06)', color: 'rgba(10,10,10,0.35)' }}>
            Can&rsquo;t find it? Add &ldquo;{query}&rdquo; manually →
          </button>
        </div>
      )}

      {/* No results */}
      {query.length >= 2 && !loading && results.length === 0 && !selected && (
        <div style={{ border: '1px solid rgba(10,10,10,0.1)' }}>
          <button
            onClick={() => { setManual(true); setResults([]) }}
            className="w-full px-3 py-3 text-left text-sm hover:bg-neutral-50 transition-colors"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            No results for &ldquo;{query}&rdquo; — add manually →
          </button>
        </div>
      )}

      {/* Selected place — confirm + category override */}
      {selected && (
        <div style={{ border: '1px solid rgba(10,10,10,0.1)' }}>
          <div className="flex items-center gap-3 px-3 py-3">
            {/* Thumbnail */}
            {selected.photoRef && (
              <div className="w-12 h-12 shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/places/photo?ref=${encodeURIComponent(selected.photoRef)}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: '#0A0A0A' }}>{selected.name}</p>
              <p className="text-[10px] truncate" style={{ color: 'rgba(10,10,10,0.4)' }}>{selected.address}</p>
              {selected.rating && <Stars rating={selected.rating} />}
            </div>
            <button onClick={() => { setSelected(null); setQuery(''); setResults([]) }}
              className="shrink-0 text-xs hover:opacity-60" style={{ color: 'rgba(10,10,10,0.3)' }}>✕</button>
          </div>

          {/* Category picker */}
          <div className="px-3 pb-3 flex flex-wrap gap-1.5"
            style={{ borderTop: '1px solid rgba(10,10,10,0.06)', paddingTop: 10 }}>
            <span className="text-[9px] font-black tracking-wide uppercase self-center mr-1"
              style={{ color: 'rgba(10,10,10,0.3)' }}>Category</span>
            {SPOT_CATEGORIES.map(c => {
              const active = currentCat === c.id
              return (
                <button key={c.id}
                  onClick={() => setCatOverride(c.id)}
                  className="text-[9px] font-black tracking-[0.12em] uppercase px-2 py-0.5 transition-all"
                  style={{ color: active ? '#fff' : c.color, background: active ? c.color : 'transparent', border: `1px solid ${c.color}` }}>
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          disabled={!selected && !(manual && query.trim())}
          className="px-5 py-2 text-xs font-bold text-white transition-opacity"
          style={{ background: catConfig?.color ?? '#0A0A0A', opacity: selected ? 1 : 0.3 }}>
          Add {selected ? selected.name.split(' ')[0] : ''}
        </button>
        <button onClick={onCancel} className="text-xs" style={{ color: 'rgba(10,10,10,0.4)' }}>
          Cancel
        </button>
        {!manual && query.length > 0 && !selected && (
          <button onClick={() => setManual(true)}
            className="ml-auto text-[10px] hover:opacity-60 transition-opacity"
            style={{ color: 'rgba(10,10,10,0.3)' }}>
            Add without search
          </button>
        )}
      </div>
    </div>
  )
}
