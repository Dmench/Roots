import { ImageResponse } from 'next/og'
import { createAnonClient } from '@/lib/supabase/server'
import { getCity, STAGES } from '@/lib/data/cities'
import type { Stage, SituationTag, Spot } from '@/lib/types'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Settler card on Roots'

const STAGE_COLORS: Record<string, string> = {
  planning:     '#6865CC',
  just_arrived: '#B88A00',
  settling:     '#1A8FAD',
  settled:      '#0E9B6B',
}

function daysInCity(d: string | null): number | null {
  if (!d) return null
  return Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000))
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = createAnonClient()
  const { data } = await sb
    .from('profiles')
    .select('display_name, city_id, neighborhood, stage, situations, arrival_date, spots, completed_task_ids')
    .eq('id', id)
    .eq('show_in_directory', true)
    .single()

  // Generic fallback when the profile isn't shareable / doesn't exist.
  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            background: '#252450',
            fontFamily: 'system-ui',
          }}
        >
          <p style={{ fontSize: 24, letterSpacing: 8, color: 'rgba(245,236,215,0.45)', margin: 0, textTransform: 'uppercase', fontWeight: 900 }}>
            Roots · Settler Card
          </p>
          <h1 style={{ fontSize: 140, lineHeight: 0.92, color: '#F5F4F0', margin: '24px 0', fontWeight: 900 }}>
            Put down{' '}
            <span style={{ color: '#FF3EBA' }}>roots.</span>
          </h1>
        </div>
      ),
      size
    )
  }

  const name         = (data.display_name as string | null) ?? 'A settler'
  const cityId       = data.city_id as string
  const neighborhood = (data.neighborhood as string | null) ?? null
  const stage        = data.stage as Stage | null
  const arrivalDate  = data.arrival_date as string | null
  const spots        = (data.spots as Spot[] | null) ?? []
  const completed    = (data.completed_task_ids as string[] | null) ?? []
  const situations   = (data.situations as SituationTag[] | null) ?? []

  const city         = cityId ? getCity(cityId) : null
  const cityName     = city?.name ?? cityId
  const stageLabel   = STAGES.find(s => s.id === stage)?.label ?? null
  const stageColor   = stage ? STAGE_COLORS[stage] ?? '#252450' : '#252450'
  const days         = daysInCity(arrivalDate)
  const initial      = name.charAt(0).toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#F9F8F6',
          fontFamily: 'system-ui',
          position: 'relative',
        }}
      >
        {/* Pink geometric anchor — picks up the brand emphasis colour and makes
            the receipt feel like a souvenir, not a stat block. */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: -160,
            right: -160,
            width: 460,
            height: 460,
            borderRadius: '50%',
            background: '#FF3EBA',
            opacity: 0.32,
          }}
        />

        {/* 8px brand rule */}
        <div style={{ display: 'flex', width: '100%', height: 8, background: '#252450' }} />

        {/* Colophon header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 56px',
            borderBottom: '1px solid rgba(10,10,10,0.1)',
            background: '#F9F8F6',
          }}
        >
          <span style={{ fontSize: 18, letterSpacing: 6, color: 'rgba(10,10,10,0.5)', fontWeight: 900, textTransform: 'uppercase' }}>
            Roots · Settler Card
          </span>
          <span style={{ fontSize: 18, letterSpacing: 6, color: '#4744C8', fontWeight: 900, textTransform: 'uppercase' }}>
            {cityName}
          </span>
        </div>

        {/* Body */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '40px 56px',
            flex: 1,
            background: '#FFFFFF',
          }}
        >
          {/* Identity row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {/* Stage-coloured avatar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 140,
                height: 140,
                background: stageColor,
                color: '#FFFFFF',
                fontSize: 80,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {initial}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontSize: 84, lineHeight: 1, margin: 0, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-0.02em' }}>
                {name}
              </p>
              <p style={{ fontSize: 24, marginTop: 12, marginBottom: 0, color: 'rgba(10,10,10,0.55)' }}>
                {[neighborhood, cityName].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          {/* Stat strip */}
          <div
            style={{
              display: 'flex',
              gap: 48,
              marginTop: 48,
              paddingTop: 24,
              borderTop: '1px solid rgba(10,10,10,0.1)',
            }}
          >
            {stageLabel && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, letterSpacing: 4, color: 'rgba(10,10,10,0.4)', textTransform: 'uppercase', fontWeight: 900 }}>
                  Stage
                </span>
                <span style={{ fontSize: 32, color: stageColor, fontWeight: 900, marginTop: 4 }}>
                  {stageLabel}
                </span>
              </div>
            )}
            {days !== null && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, letterSpacing: 4, color: 'rgba(10,10,10,0.4)', textTransform: 'uppercase', fontWeight: 900 }}>
                  Day
                </span>
                <span style={{ fontSize: 32, color: '#0A0A0A', fontWeight: 900, marginTop: 4 }}>
                  {days}
                </span>
              </div>
            )}
            {completed.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, letterSpacing: 4, color: 'rgba(10,10,10,0.4)', textTransform: 'uppercase', fontWeight: 900 }}>
                  Tasks done
                </span>
                <span style={{ fontSize: 32, color: '#0E9B6B', fontWeight: 900, marginTop: 4 }}>
                  {completed.length}
                </span>
              </div>
            )}
            {spots.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, letterSpacing: 4, color: 'rgba(10,10,10,0.4)', textTransform: 'uppercase', fontWeight: 900 }}>
                  Spots
                </span>
                <span style={{ fontSize: 32, color: '#FAB400', fontWeight: 900, marginTop: 4 }}>
                  {spots.length}
                </span>
              </div>
            )}
            {situations.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, letterSpacing: 4, color: 'rgba(10,10,10,0.4)', textTransform: 'uppercase', fontWeight: 900 }}>
                  Situation
                </span>
                <span style={{ fontSize: 32, color: '#0A0A0A', fontWeight: 900, marginTop: 4 }}>
                  {situations.length} {situations.length === 1 ? 'tag' : 'tags'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 56px',
            background: '#252450',
          }}
        >
          <span style={{ fontSize: 22, color: '#F5F4F0', fontWeight: 900 }}>
            Put down{' '}
            <span style={{ color: '#FF3EBA' }}>roots.</span>
          </span>
          <span style={{ fontSize: 16, letterSpacing: 4, color: 'rgba(245,236,215,0.5)', textTransform: 'uppercase', fontWeight: 900 }}>
            roots.so
          </span>
        </div>
      </div>
    ),
    size
  )
}
