import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAnonClient } from '@/lib/supabase/server'
import { getCity, STAGES } from '@/lib/data/cities'
import type { Stage, SituationTag, Spot } from '@/lib/types'
import { SPOT_CATEGORIES } from '@/lib/types'
import { CopyButton } from './CopyButton'
import { Footer } from '@/components/layout/Footer'
import { Flag } from '@/components/ui/Flag'
import { getCountry } from '@/lib/data/countries'

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://roots-mu.vercel.app'

const SITUATION_LABELS: Partial<Record<SituationTag, string>> = {
  new_to_country:      'New country',
  new_to_city:         'New city',
  new_to_neighborhood: 'New neighbourhood',
  local:               'Local',
  student:             'Student',
  employed:            'Employee',
  self_employed:       'Freelancer',
  digital_nomad:       'Digital nomad',
  renting:             'Renting',
  family:              'With family',
}

const STAGE_COLORS: Record<string, string> = {
  planning:     '#6865CC',
  just_arrived: '#B88A00',
  settling:     '#1A8FAD',
  settled:      '#0E9B6B',
}

function fmtMonth(val: string): string {
  const parts = val.split('-')
  const year  = parts[0] ?? ''
  const month = parseInt(parts[1] ?? '1') - 1
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${MONTHS[month] ?? '?'} '${year.slice(2)}`
}

function daysInCity(d: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000))
}

/* ── Metadata ──────────────────────────────────────────────────────────────── */

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const sb = createAnonClient()
  const { data } = await sb
    .from('profiles')
    .select('display_name, city_id')
    .eq('id', id)
    .eq('show_in_directory', true)
    .single()

  if (!data) return { title: 'Settler Card — Roots' }

  const city = getCity(data.city_id as string)
  const name = (data.display_name as string | null) ?? 'A settler'
  const cityName = city?.name ?? (data.city_id as string)

  return {
    title: `${name} in ${cityName} — Roots`,
    description: `See ${name}'s settler card on Roots — city onboarding and belonging.`,
    openGraph: {
      title: `${name} in ${cityName} — Roots`,
      description: `See ${name}'s settler card on Roots.`,
    },
  }
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default async function SettlerCardPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sb = createAnonClient()

  const { data, error } = await sb
    .from('profiles')
    .select('id, display_name, city_id, neighborhood, stage, situations, arrival_date, spots, flags')
    .eq('id', id)
    .eq('show_in_directory', true)
    .single()

  if (error || !data) notFound()

  const displayName  = (data.display_name as string | null) ?? null
  const cityId       = data.city_id as string | null
  const neighborhood = data.neighborhood as string | null
  const stage        = data.stage as Stage | null
  const situations   = (data.situations as SituationTag[]) ?? []
  const arrivalDate  = data.arrival_date as string | null
  const spots        = (data.spots as Spot[]) ?? []
  const flags        = (data.flags as string[] | null) ?? []

  const city         = cityId ? getCity(cityId) : null
  const stageConfig  = stage ? STAGES.find(s => s.id === stage) : null
  const stageColor   = stage ? (STAGE_COLORS[stage] ?? '#4744C8') : '#4744C8'
  const days         = arrivalDate ? daysInCity(arrivalDate) : null
  const primarySit   = situations.find(s => SITUATION_LABELS[s])
  const sitLabel     = primarySit ? SITUATION_LABELS[primarySit] : null
  const initial      = (displayName ?? 'S')[0].toUpperCase()
  const publicUrl    = `${APP_URL}/settlers/${id}`

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-16 pb-24 px-4"
      style={{ background: '#FFFFFF' }}>

      {/* Logo link */}
      <Link href="/"
        className="font-display font-black text-xl mb-10 hover:opacity-50 transition-opacity"
        style={{ color: '#0A0A0A' }}>
        Roots
      </Link>

      {/* ── Settler Card — matches the platform's editorial register ─────── */}
      <div className="w-full max-w-sm" style={{ border: '2px solid #0A0A0A', background: '#FFFFFF' }}>

        {/* 4px brand rule */}
        <div style={{ height: 4, background: '#252450' }} />

        {/* Header colophon */}
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ background: '#F9F8F6', borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
          <span className="text-[8px] font-black tracking-[0.3em] uppercase"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            Settler Card
          </span>
          {city && (
            <span className="text-[8px] font-black tracking-[0.3em] uppercase"
              style={{ color: '#4744C8' }}>
              {city.name.toUpperCase()}
            </span>
          )}
        </div>

        {/* Identity */}
        <div className="px-5 py-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-16 h-16 flex items-center justify-center font-display font-black text-2xl"
              style={{ background: stageColor, color: '#fff' }}>
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-black leading-none mb-3"
                style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: '#0A0A0A' }}>
                {displayName ?? 'Settler'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {neighborhood && (
                  <span className="text-[10px] font-black tracking-[0.1em] uppercase px-2.5 py-1"
                    style={{ background: 'rgba(10,10,10,0.07)', color: '#0A0A0A' }}>
                    {neighborhood}
                  </span>
                )}
                {arrivalDate && (
                  <span className="text-[10px] font-black tracking-[0.1em] uppercase px-2.5 py-1"
                    style={{ background: 'rgba(10,10,10,0.07)', color: '#0A0A0A' }}>
                    Since {fmtMonth(arrivalDate)}
                  </span>
                )}
                {days !== null && (
                  <span className="text-[10px] font-black tracking-[0.1em] uppercase px-2.5 py-1"
                    style={{ background: 'rgba(10,10,10,0.07)', color: '#0A0A0A' }}>
                    Day {days}
                  </span>
                )}
                {stageConfig && (
                  <span className="text-[10px] font-black tracking-[0.1em] uppercase px-2.5 py-1"
                    style={{ background: stageColor + '18', color: stageColor }}>
                    {stageConfig.label}
                  </span>
                )}
                {sitLabel && (
                  <span className="text-[10px] font-black tracking-[0.1em] uppercase px-2.5 py-1"
                    style={{ background: 'rgba(10,10,10,0.07)', color: '#0A0A0A' }}>
                    {sitLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Flags row — "where they've called home" */}
        {flags.length > 0 && (
          <div className="px-5 pb-5 -mt-1">
            <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-2"
              style={{ color: 'rgba(10,10,10,0.4)' }}>
              Lived in
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {flags.map(code => (
                <span key={code} className="flex items-center gap-1.5 px-2 py-0.5"
                  style={{ background: 'rgba(10,10,10,0.04)', border: '1px solid rgba(10,10,10,0.08)' }}>
                  <Flag code={code} size={14} />
                  <span className="text-[9px] font-black tracking-[0.1em] uppercase"
                    style={{ color: '#0A0A0A' }}>
                    {getCountry(code)?.name ?? code}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Spots */}
        {spots.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}>
            <p className="px-5 py-3 text-[10px] font-black tracking-[0.22em] uppercase"
              style={{ color: 'rgba(10,10,10,0.3)' }}>
              My Spots
            </p>
            <div className="px-5 pb-5 flex gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {spots.map(spot => {
                const cat = SPOT_CATEGORIES.find(c => c.id === spot.category)
                return (
                  <div key={spot.id} className="shrink-0">
                    <div className="w-[72px] h-[72px] overflow-hidden relative"
                      style={{ background: (cat?.color ?? '#888') + '12' }}>
                      {spot.photoRef ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/places/photo?ref=${encodeURIComponent(spot.photoRef)}`}
                          alt="" className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-end p-1.5">
                          <span className="text-[7px] font-black uppercase tracking-wide leading-none"
                            style={{ color: cat?.color ?? '#888' }}>
                            {spot.name.split(' ')[0]}
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-[8px] font-semibold mt-1 leading-none"
                      style={{ color: 'rgba(10,10,10,0.5)', width: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {spot.name}
                    </p>
                    {cat && (
                      <p className="text-[7px] font-black tracking-wide uppercase mt-0.5" style={{ color: cat.color }}>
                        {cat.label}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Share row ─────────────────────────────────────────────────────── */}
      <div className="w-full max-w-sm mt-4 flex items-center gap-3">
        <code className="flex-1 px-3 py-2.5 text-[10px] truncate"
          style={{ background: 'rgba(10,10,10,0.04)', color: 'rgba(10,10,10,0.4)', border: '1px solid rgba(10,10,10,0.08)' }}>
          {publicUrl}
        </code>
        <CopyButton url={publicUrl} />
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-sm mt-10 pt-8" style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}>
        <p className="text-[11px] mb-4 text-center" style={{ color: 'rgba(10,10,10,0.4)' }}>
          Settling in {city?.name ?? 'a new city'}? Build your settler card.
        </p>
        <Link
          href={city ? `/${cityId}` : '/cities'}
          className="block text-center py-3 text-[11px] font-black tracking-[0.18em] uppercase text-white hover:opacity-90 transition-opacity"
          style={{ background: '#4744C8' }}>
          Join Roots →
        </Link>
      </div>

      <div className="w-full max-w-5xl mt-16">
        <Footer />
      </div>
    </div>
  )
}
