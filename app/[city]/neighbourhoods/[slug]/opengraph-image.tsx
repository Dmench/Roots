import { ImageResponse } from 'next/og'
import { getCity } from '@/lib/data/cities'
import { getNeighbourhood } from '@/lib/data/neighbourhoods/brussels'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Neighbourhood guide on Roots'

export default async function Image(
  { params }: { params: Promise<{ city: string; slug: string }> },
) {
  const { city: cityId, slug } = await params
  const city = getCity(cityId)
  const hood = getNeighbourhood(slug)

  if (!city || !hood) {
    return new ImageResponse(
      (
        <div style={{
          display: 'flex', width: '100%', height: '100%',
          background: '#252450', color: '#F5F4F0',
          alignItems: 'center', justifyContent: 'center', fontSize: 64,
          fontWeight: 900, letterSpacing: '-0.02em',
        }}>Roots</div>
      ),
      size,
    )
  }

  return new ImageResponse(
    (
      <div style={{
        display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
        background: '#FFFFFF', padding: 64,
      }}>
        {/* Top rule */}
        <div style={{ height: 8, background: '#4744C8', marginBottom: 36 }} />

        {/* Eyebrow — flexWrap on so long aka strings don't clip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16,
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: 18, fontWeight: 900, letterSpacing: '0.28em',
            textTransform: 'uppercase', color: '#4744C8',
          }}>
            {city.name} · Neighbourhood
          </span>
          {hood.aka && (
            <span style={{
              fontSize: 18, fontWeight: 900, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'rgba(10,10,10,0.35)',
            }}>
              Also: {hood.aka}
            </span>
          )}
        </div>

        {/* Title — font size scales down for long names so nothing clips */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 28 }}>
          <span style={{
            fontSize: 56, fontWeight: 900, letterSpacing: '-0.02em',
            color: '#0A0A0A', lineHeight: 1, marginBottom: 4,
          }}>
            Living in
          </span>
          <span style={{
            fontSize: hood.name.length > 12 ? 96 : hood.name.length > 9 ? 112 : 128,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: '#4744C8',
            lineHeight: 0.95,
          }}>
            {hood.name}.
          </span>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 28, lineHeight: 1.35, color: 'rgba(10,10,10,0.7)',
          maxWidth: 1000, marginBottom: 0,
        }}>
          {hood.oneLiner}
        </p>

        {/* Bottom row */}
        <div style={{
          display: 'flex', flex: 1, alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: 14, fontWeight: 900, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'rgba(10,10,10,0.4)',
              marginBottom: 6,
            }}>
              Rent ballpark
            </span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A' }}>
              {hood.rentBallpark}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em',
              color: '#0A0A0A',
            }}>
              Roots
            </span>
            <span style={{
              fontSize: 14, fontWeight: 900, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'rgba(10,10,10,0.4)',
            }}>
              · Feel at home
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
