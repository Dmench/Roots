import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Roots — Put down roots, anywhere'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#252450',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Ambient circles */}
        <div style={{
          position: 'absolute', top: -120, right: -80,
          width: 500, height: 500, borderRadius: '50%',
          background: '#4744C8', opacity: 0.5,
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: 60,
          width: 200, height: 200, borderRadius: '50%',
          background: '#FF3EBA', opacity: 0.4,
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: '#F5ECD7', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>
            Roots
          </span>
        </div>

        {/* Main headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            color: 'rgba(245,236,215,0.35)',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}>
            City intelligence · Starting with Brussels
          </div>
          <div style={{
            color: '#F5ECD7',
            fontSize: 88,
            fontWeight: 900,
            lineHeight: 0.85,
            letterSpacing: '-0.03em',
          }}>
            Know your{'\n'}
            <span style={{ color: '#FF3EBA' }}>city.</span>
          </div>
          <div style={{
            color: 'rgba(245,236,215,0.55)',
            fontSize: 22,
            fontWeight: 400,
            lineHeight: 1.5,
            maxWidth: 540,
            marginTop: 12,
          }}>
            Events, venues, news, community — curated for people who actually live there.
          </div>
        </div>

        {/* Bottom pills */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: "Tonight's events", color: '#FF3EBA' },
            { label: 'AI city guide',    color: '#FAB400' },
            { label: 'Find your people', color: '#4744C8' },
          ].map(p => (
            <div key={p.label} style={{
              padding: '8px 18px',
              borderRadius: 100,
              background: `${p.color}20`,
              border: `1px solid ${p.color}50`,
              color: p.color,
              fontSize: 14,
              fontWeight: 700,
            }}>
              {p.label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
