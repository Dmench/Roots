// Background "thread" of colored shapes — same motif as the pre-auth
// landing page (app/page.tsx). The brand's visual signature is FOUR
// circles + ONE half-dome, all in the brand palette:
//
//   • Purple #4744C8 — dominant, top-right
//   • Pink   #FF3EBA — bottom-left
//   • Amber  #FAB400 — half-dome at the bottom-right (a sun setting)
//   • Sky    #38C0F0 — mid-left, smaller
//
// On the navy landing field these read at 0.4–0.7 opacity. On the white
// auth'd field they translate to pastel-saturated circles at similar
// opacity. The dominant top-right circle picks up each section's accent
// color when passed — that's how section identity threads through the
// product without ever filling a field.
//
// DO NOT add diamonds, squares, triangles, or other shapes here. The
// motif is circles and a half-dome. Keep it disciplined.

interface Props {
  /** Section accent colour. Replaces the dominant top-right circle. */
  accent?: string
  /** "Quiet" matches the original subtle look. "Bold" matches the welcome page. */
  intensity?: 'quiet' | 'standard' | 'bold'
}

export function GeometricThread({ accent, intensity = 'standard' }: Props = {}) {
  // Landing-page register: dominant ~0.7, supporting 0.4–0.6.
  // Standard auth'd register: a touch lower so it doesn't fight content.
  const dom   = intensity === 'bold' ? 0.65 : intensity === 'quiet' ? 0.30 : 0.48
  const pink  = intensity === 'bold' ? 0.50 : intensity === 'quiet' ? 0.22 : 0.36
  const amber = intensity === 'bold' ? 0.60 : intensity === 'quiet' ? 0.28 : 0.42
  const sky   = intensity === 'bold' ? 0.40 : intensity === 'quiet' ? 0.18 : 0.30

  const domCol = accent ?? '#4744C8'

  return (
    <>
      {/* Dominant — top-right. Picks up the section accent when provided. */}
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{
          background: domCol,
          width: '46vw',
          height: '46vw',
          maxWidth: 580,
          maxHeight: 580,
          top: '-22%',
          right: '-14%',
          opacity: dom,
        }} />

      {/* Pink — bottom-left circle */}
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{
          background: '#FF3EBA',
          width: '18vw',
          height: '18vw',
          maxWidth: 200,
          maxHeight: 200,
          bottom: '8%',
          left: '-3%',
          opacity: pink,
        }} />

      {/* Amber — half-dome at the bottom-right (matches landing's setting sun) */}
      <div className="fixed pointer-events-none overflow-hidden -z-10"
        style={{
          width: '12vw',
          height: '6vw',
          maxWidth: 140,
          maxHeight: 70,
          bottom: 0,
          right: '24%',
        }}>
        <div className="w-full rounded-full"
          style={{
            background: '#FAB400',
            height: '12vw',
            maxHeight: 140,
            marginTop: '-6vw',
            opacity: amber,
          }} />
      </div>

      {/* Sky — mid-left smaller circle */}
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{
          background: '#38C0F0',
          width: '8vw',
          height: '8vw',
          maxWidth: 90,
          maxHeight: 90,
          top: '40%',
          left: '4%',
          opacity: sky,
        }} />
    </>
  )
}
