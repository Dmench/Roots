// Background "thread" of low-opacity geometric shapes — same idiom as the
// landing page (app/page.tsx) at full saturation, the city hub at medium,
// and authenticated section pages at the levels below.
//
// Pass an `accent` colour to replace the dominant top-right circle and bump
// it up — that anchors each section to its own identity colour while keeping
// the supporting shapes the same across pages, so the product still reads as
// one continuous space.

interface Props {
  /** Section accent colour. Replaces the dominant circle and saturates it. */
  accent?: string
  /** "Quiet" matches the original subtle look. "Bold" is for the welcome page. */
  intensity?: 'quiet' | 'standard' | 'bold'
}

export function GeometricThread({ accent, intensity = 'standard' }: Props = {}) {
  // Color via geometry — not via fill. The thread is the primary way Roots
  // carries colour into the auth'd platform: confident, off-page shapes
  // tinting the background without ever being a coloured field.
  // Tuned higher than the original whisper register so colour reads on
  // first look, lower than the landing page's bold register.
  const base   = intensity === 'bold' ? 0.18 : intensity === 'quiet' ? 0.08 : 0.13
  const dom    = intensity === 'bold' ? 0.24 : intensity === 'quiet' ? 0.12 : 0.18
  const domCol = accent ?? '#4744C8'

  return (
    <>
      {/* Dominant — top-right. Picks up the section accent when provided. */}
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: domCol, width: '46vw', height: '46vw', maxWidth: 580, maxHeight: 580, top: '-24%', right: '-15%', opacity: dom }} />

      {/* Pink — bottom-left */}
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: '#FF3EBA', width: '20vw', height: '20vw', maxWidth: 220, maxHeight: 220, bottom: '5%', left: '-5%', opacity: base }} />

      {/* Cyan — mid-left */}
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: '#38C0F0', width: '9vw', height: '9vw', maxWidth: 100, maxHeight: 100, top: '36%', left: '5%', opacity: base + 0.02 }} />

      {/* Amber — bottom-right */}
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: '#FAB400', width: '12vw', height: '12vw', maxWidth: 140, maxHeight: 140, top: '68%', right: '7%', opacity: base + 0.01 }} />

      {/* Navy speck — mid-right, ties to the brand rule */}
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: '#252450', width: '5vw', height: '5vw', maxWidth: 56, maxHeight: 56, top: '15%', left: '32%', opacity: base + 0.04 }} />

      {/* SMALL CONFIDENT SHAPES — fully saturated, sized small enough to read
          as ornaments rather than fills. These add the "design-mag" color
          punctuation the larger circles can't provide at low opacity. */}

      {/* Filled green diamond — mid-left, small and saturated */}
      <div className="fixed pointer-events-none -z-10"
        style={{
          background: '#0E9B6B',
          width: 24,
          height: 24,
          top: '52%',
          left: '8%',
          transform: 'rotate(45deg)',
          opacity: intensity === 'bold' ? 0.85 : 0.6,
        }} />

      {/* Filled amber square — top-left band */}
      <div className="fixed pointer-events-none -z-10"
        style={{
          background: '#FAB400',
          width: 14,
          height: 14,
          top: '22%',
          left: '12%',
          opacity: intensity === 'bold' ? 0.9 : 0.7,
        }} />

      {/* Pink circle — mid-right small */}
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{
          background: '#FF3EBA',
          width: 18,
          height: 18,
          top: '42%',
          right: '10%',
          opacity: intensity === 'bold' ? 0.85 : 0.65,
        }} />
    </>
  )
}
