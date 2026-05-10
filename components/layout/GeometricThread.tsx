// Background "thread" of low-opacity geometric shapes — the same idiom used
// on the landing page (app/page.tsx) at full saturation, the city hub at
// medium, and now every authenticated section page at low. Same colours,
// same positions across pages so the product feels like one continuous space.

export function GeometricThread() {
  return (
    <>
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: '#4744C8', width: '42vw', height: '42vw', maxWidth: 540, maxHeight: 540, top: '-22%', right: '-14%', opacity: 0.04 }} />
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: '#FF3EBA', width: '18vw', height: '18vw', maxWidth: 200, maxHeight: 200, bottom: '6%', left: '-4%', opacity: 0.04 }} />
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: '#38C0F0', width: '8vw', height: '8vw', maxWidth: 90, maxHeight: 90, top: '38%', left: '4%', opacity: 0.05 }} />
      <div className="fixed rounded-full pointer-events-none -z-10"
        style={{ background: '#FAB400', width: '11vw', height: '11vw', maxWidth: 130, maxHeight: 130, top: '70%', right: '6%', opacity: 0.04 }} />
    </>
  )
}
