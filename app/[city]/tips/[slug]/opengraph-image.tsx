import { ImageResponse } from 'next/og'
import { getCity } from '@/lib/data/cities'
import { getCuratedTip } from '@/lib/data/connect/curated-brussels'
import type { CuratedKind } from '@/lib/data/connect/curated-brussels'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Tip on Roots'

const KIND_META: Record<CuratedKind, { label: string; color: string }> = {
  'tip':      { label: 'Tip',      color: '#0E9B6B' },
  'question': { label: 'Question', color: '#1A8FAD' },
  'heads-up': { label: 'Heads-up', color: '#FAB400' },
}

export default async function Image(
  { params }: { params: Promise<{ city: string; slug: string }> },
) {
  const { city: cityId, slug } = await params
  const city = getCity(cityId)
  const note = getCuratedTip(slug)

  if (!city || !note) {
    return new ImageResponse(
      (
        <div style={{
          display: 'flex', width: '100%', height: '100%',
          background: '#252450', color: '#F5F4F0',
          alignItems: 'center', justifyContent: 'center', fontSize: 64,
          fontWeight: 900,
        }}>Roots</div>
      ),
      size,
    )
  }

  const meta = KIND_META[note.kind]
  // Pick a body font size that fits ~3 lines of body text comfortably
  const bodyLen = note.body.length
  const bodyFont = bodyLen > 220 ? 28 : bodyLen > 160 ? 32 : 36

  return new ImageResponse(
    (
      <div style={{
        display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
        background: '#FFFFFF', padding: 64,
      }}>
        {/* Top rule */}
        <div style={{ height: 8, background: meta.color, marginBottom: 32 }} />

        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 18, fontWeight: 900, letterSpacing: '0.28em',
            textTransform: 'uppercase', color: meta.color,
          }}>
            {city.name} · {meta.label}
          </span>
          {note.neighbourhood && (
            <span style={{
              fontSize: 16, fontWeight: 900, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'rgba(10,10,10,0.35)',
            }}>
              {note.neighbourhood.replace(/-/g, ' ')}
            </span>
          )}
        </div>

        {/* Title */}
        <span style={{
          fontSize: note.title.length > 60 ? 48 : 60,
          fontWeight: 900, letterSpacing: '-0.02em',
          color: '#0A0A0A', lineHeight: 1.05,
          marginBottom: 28,
        }}>
          {note.title}
        </span>

        {/* Body */}
        <p style={{
          fontSize: bodyFont, lineHeight: 1.35,
          color: 'rgba(10,10,10,0.65)',
          marginBottom: 0,
        }}>
          {note.body}
        </p>

        {/* Bottom row */}
        <div style={{
          display: 'flex', flex: 1, alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 14, fontWeight: 900, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'rgba(10,10,10,0.4)',
          }}>
            roots.so · feel at home
          </span>
          <span style={{
            fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em',
            color: '#0A0A0A',
          }}>
            Roots
          </span>
        </div>
      </div>
    ),
    size,
  )
}
