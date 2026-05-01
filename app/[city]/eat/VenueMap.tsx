'use client'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Venue } from '@/lib/data/venues'

const TYPE_COLOR: Record<string, string> = {
  restaurant: '#E8612A',
  bar:        '#4744C8',
  cafe:       '#B08800',
  other:      '#0A0A0A',
}

interface Props {
  venues:      Venue[]
  venuePhotos: Record<string, string | null>
  selected:    string | null
  onSelect:    (id: string | null) => void
}

export default function VenueMap({ venues, venuePhotos, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef     = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Record<string, any>>({})

  const withCoords = venues.filter(v => v.lat != null && v.lng != null)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    import('leaflet').then(async L => {
      if (cancelled || !containerRef.current) return

      if (mapRef.current) return // already initialised

      const map = L.map(containerRef.current, {
        center: [50.846, 4.352],
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      withCoords.forEach(v => {
        const color = TYPE_COLOR[v.broadType] ?? '#0A0A0A'
        const icon  = L.divIcon({
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer;transition:transform 0.15s"></div>`,
          className:  '',
          iconSize:   [14, 14],
          iconAnchor: [7, 7],
        })

        const marker = L.marker([v.lat!, v.lng!], { icon }).addTo(map)
        marker.on('click', () => onSelect(v.id))
        markersRef.current[v.id] = marker
      })

      mapRef.current = map
    })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current = {}
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pulse the selected marker
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const color = TYPE_COLOR[venues.find(v => v.id === id)?.broadType ?? 'other'] ?? '#0A0A0A'
      const scale = id === selected ? 'scale(1.8)' : 'scale(1)'
      const el = marker.getElement?.() as HTMLElement | undefined
      if (el) {
        const dot = el.querySelector('div') as HTMLElement | null
        if (dot) dot.style.transform = scale
        if (id === selected) {
          dot!.style.boxShadow = `0 0 0 4px ${color}40`
        } else {
          dot!.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)'
        }
      }
    })

    // Pan to selected
    if (selected && mapRef.current) {
      const v = venues.find(x => x.id === selected)
      if (v?.lat && v?.lng) {
        mapRef.current.panTo([v.lat, v.lng], { animate: true, duration: 0.4 })
      }
    }
  }, [selected, venues])

  const selectedVenue = selected ? venues.find(v => v.id === selected) : null
  const photoRef = selected ? venuePhotos[selected] : null

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Selected venue panel */}
      {selectedVenue && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 shadow-xl z-[1000]"
          style={{ background: '#fff', border: '1px solid rgba(10,10,10,0.1)' }}>
          {/* Photo or color block */}
          <div className="relative overflow-hidden" style={{ height: 140 }}>
            {photoRef ? (
              <img
                src={`/api/places/photo?ref=${encodeURIComponent(photoRef)}`}
                alt={selectedVenue.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: TYPE_COLOR[selectedVenue.broadType] ?? '#0A0A0A' }}>
                <span className="font-display font-black select-none"
                  style={{ fontSize: '4rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>
                  {selectedVenue.name.charAt(0)}
                </span>
              </div>
            )}
            <button
              onClick={() => onSelect(null)}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-xs font-black"
              style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}>
              ✕
            </button>
          </div>
          {/* Info */}
          <div className="px-4 pt-3 pb-4">
            <div className="flex items-baseline justify-between gap-2 mb-0.5">
              <span className="text-[9px] font-black tracking-widest uppercase"
                style={{ color: TYPE_COLOR[selectedVenue.broadType] ?? '#0A0A0A' }}>
                {selectedVenue.neighborhood}
              </span>
              <span className="text-xs font-bold" style={{ color: TYPE_COLOR[selectedVenue.broadType] ?? '#0A0A0A' }}>
                {selectedVenue.price}
              </span>
            </div>
            {selectedVenue.website ? (
              <a href={selectedVenue.website} target="_blank" rel="noopener noreferrer"
                className="font-bold text-sm leading-snug hover:opacity-50 transition-opacity block mb-0.5"
                style={{ color: '#0A0A0A' }}>
                {selectedVenue.name} ↗
              </a>
            ) : (
              <p className="font-bold text-sm leading-snug mb-0.5" style={{ color: '#0A0A0A' }}>{selectedVenue.name}</p>
            )}
            <p className="text-[10px] mb-1.5" style={{ color: 'rgba(10,10,10,0.4)' }}>{selectedVenue.category}</p>
            <p className="text-[11px] italic leading-snug" style={{ color: 'rgba(10,10,10,0.55)' }}>{selectedVenue.vibe}</p>
          </div>
        </div>
      )}
    </div>
  )
}
