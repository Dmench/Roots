'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'

interface Props {
  cityId:   string
  cityName: string
}

// The 12 taste chips mirror TASTE_CHIPS in app/[city]/eat/page.tsx.
// Kept in sync by hand — if the eat chip list changes, change here too.
const TASTES = [
  { id: 'belgian',      label: 'Belgian',       color: '#FAB400' },
  { id: 'italian',      label: 'Italian',       color: '#E8612A' },
  { id: 'asian',        label: 'Asian',         color: '#FF3EBA' },
  { id: 'brunch',       label: 'Brunch',        color: '#0E9B6B' },
  { id: 'wine',         label: 'Natural wine',  color: '#9B4DCA' },
  { id: 'cocktails',    label: 'Cocktails',     color: '#252450' },
  { id: 'craft-beer',   label: 'Craft beer',    color: '#A07000' },
  { id: 'coffee',       label: 'Coffee',        color: '#5C4033' },
  { id: 'late-night',   label: 'Late night',    color: '#6865CC' },
  { id: 'fine-dining',  label: 'Fine dining',   color: '#4744C8' },
  { id: 'club',         label: 'Club',          color: '#0A0A0A' },
  { id: 'cheap-eats',   label: 'Cheap eats',    color: '#1A8FAD' },
]

// Friction-free signup wedge per growth council. Anonymous SEO arrival lands
// on a tip page → picks tastes → gets a personalised /eat link IMMEDIATELY,
// no email or signup gate. The signup ask only appears AFTER value lands.
export function PersonalisedListCTA({ cityId, cityName }: Props) {
  const { user } = useAuth()
  const [open,     setOpen]     = useState(false)
  const [picked,   setPicked]   = useState<string[]>([])
  const [delivered, setDelivered] = useState(false)

  function toggle(id: string) {
    setPicked(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  function deliver() {
    if (picked.length === 0) return
    setDelivered(true)
  }

  const resultUrl = `/${cityId}/eat?taste=${picked.join(',')}`

  if (delivered) {
    return (
      <section className="mt-12 px-6 py-7"
        style={{ background: 'rgba(14,155,107,0.06)', border: '1px solid #0E9B6B' }}>
        <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
          style={{ color: '#0E9B6B' }}>
          ✓ Your list is ready
        </p>
        <h3 className="font-display font-black text-xl md:text-2xl leading-tight mb-3"
          style={{ color: '#0A0A0A', letterSpacing: '-0.01em' }}>
          {cityName} for {picked.map(id => TASTES.find(t => t.id === id)?.label.toLowerCase()).filter(Boolean).join(' + ')}.
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link href={resultUrl}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: '#0A0A0A', color: '#fff' }}>
            See your venues →
          </Link>
          {!user && (
            <Link href={`/${cityId}/settle`}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: '#4744C8', border: '1px solid #4744C8' }}>
              Save it to a Roots account
            </Link>
          )}
        </div>
        <p className="text-[10px] mt-4 leading-relaxed" style={{ color: 'rgba(10,10,10,0.45)' }}>
          {user
            ? 'Your picks are saved to your account.'
            : 'No signup needed to see the list — the picks persist on this device. Sign in if you want them synced + a weekly note about new spots in your tastes.'}
        </p>
      </section>
    )
  }

  if (!open) {
    return (
      <section className="mt-12 px-6 py-7"
        style={{ background: '#FAFAF7', border: '1px solid rgba(10,10,10,0.1)' }}>
        <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
          style={{ color: 'rgba(10,10,10,0.4)' }}>
          Get a list, not a feed
        </p>
        <h3 className="font-display font-black text-xl md:text-2xl leading-tight mb-2"
          style={{ color: '#0A0A0A', letterSpacing: '-0.01em' }}>
          Your {cityName}, in 30 seconds.
        </h3>
        <p className="text-sm mb-5 max-w-md leading-relaxed" style={{ color: 'rgba(10,10,10,0.6)' }}>
          Tell us what you&apos;re into — pizza, sushi, low-light bars, whatever — and we&apos;ll
          hand back a personalised list of {cityName} spots. No signup needed to see it.
        </p>
        <button onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: '#FF3EBA', color: '#fff' }}>
          Build my list →
        </button>
      </section>
    )
  }

  return (
    <section className="mt-12 px-6 py-7"
      style={{ background: '#FAFAF7', border: '1px solid #FF3EBA' }}>
      <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
        style={{ color: '#FF3EBA' }}>
        Pick what you&apos;re into
      </p>
      <h3 className="font-display font-black text-xl md:text-2xl leading-tight mb-4"
        style={{ color: '#0A0A0A', letterSpacing: '-0.01em' }}>
        Tap as many as fit.
      </h3>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {TASTES.map(t => {
          const active = picked.includes(t.id)
          return (
            <button key={t.id} onClick={() => toggle(t.id)}
              className="text-[10px] font-black tracking-[0.14em] uppercase px-3 py-1.5 transition-all"
              style={{
                color: active ? '#FFFFFF' : t.color,
                background: active ? t.color : 'transparent',
                border: `1px solid ${active ? t.color : `${t.color}40`}`,
              }}>
              {t.label}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={deliver}
          disabled={picked.length === 0}
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-30"
          style={{ background: '#FF3EBA', color: '#fff' }}>
          Get my list →
        </button>
        <button onClick={() => { setOpen(false); setPicked([]) }}
          className="text-[10px] font-bold hover:opacity-60 transition-opacity"
          style={{ color: 'rgba(10,10,10,0.4)' }}>
          Cancel
        </button>
        {picked.length > 0 && (
          <span className="text-[10px] ml-auto" style={{ color: 'rgba(10,10,10,0.4)' }}>
            {picked.length} picked
          </span>
        )}
      </div>
    </section>
  )
}
