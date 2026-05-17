// Inline section-break ornament — extends the landing page motif
// (circles + half-dome, in the four brand colours) into article body
// copy. Used between major sections on tip detail and neighbourhood
// pages as a magazine-page section divider.
//
// Five elements, all from the motif vocabulary — circles + a half-dome.
// Picks up the section accent for the centerpiece.

interface Props {
  /** Accent colour for the centerpiece circle. */
  accent?: string
  /** Render scale — 'sm' for between-paragraph, 'md' for section break. */
  size?: 'sm' | 'md'
}

export function GeometricOrnament({ accent = '#FF3EBA', size = 'md' }: Props = {}) {
  const dot   = size === 'sm' ? 8  : 12
  const lead  = size === 'sm' ? 14 : 20    // centerpiece, larger
  const dome  = size === 'sm' ? 16 : 24    // half-dome width

  return (
    <div className="flex items-center justify-center gap-3 my-10 select-none"
      aria-hidden="true">
      {/* Purple small circle — brand anchor */}
      <span style={{ width: dot, height: dot, borderRadius: '50%', background: '#4744C8' }} />

      {/* Sky circle — small */}
      <span style={{ width: dot, height: dot, borderRadius: '50%', background: '#38C0F0' }} />

      {/* Accent circle — centerpiece, larger */}
      <span style={{ width: lead, height: lead, borderRadius: '50%', background: accent }} />

      {/* Amber half-dome — the landing page's setting sun, miniaturised */}
      <span style={{
        width: dome,
        height: dome / 2,
        overflow: 'hidden',
        display: 'inline-block',
        position: 'relative',
      }}>
        <span style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: dome,
          height: dome,
          borderRadius: '50%',
          background: '#FAB400',
        }} />
      </span>

      {/* Pink circle — small */}
      <span style={{ width: dot, height: dot, borderRadius: '50%', background: '#FF3EBA' }} />
    </div>
  )
}
