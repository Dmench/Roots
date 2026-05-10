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
  const base   = intensity === 'bold' ? 0.085 : intensity === 'quiet' ? 0.045 : 0.065
  const dom    = intensity === 'bold' ? 0.13  : intensity === 'quiet' ? 0.07  : 0.10
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
        style={{ background: '#38C0F0', width: '9vw', height: '9vw', maxWidth: 100, maxHeight: 100, top: '36%', left: '5%', opacity: base + 0.01 }} />

      {/* Amber — bottom-right */}
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: '#FAB400', width: '12vw', height: '12vw', maxWidth: 140, maxHeight: 140, top: '68%', right: '7%', opacity: base }} />

      {/* Navy speck — mid-right, ties to the brand rule */}
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: '#252450', width: '5vw', height: '5vw', maxWidth: 56, maxHeight: 56, top: '15%', left: '32%', opacity: base + 0.02 }} />
    </>
  )
}
