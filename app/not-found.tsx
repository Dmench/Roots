import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#FFFFFF' }}>
      <div className="max-w-md text-center">
        <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-4" style={{ color: 'rgba(10,10,10,0.3)' }}>
          404
        </p>
        <h1 className="font-display font-black text-4xl md:text-5xl leading-tight mb-6" style={{ color: '#0A0A0A' }}>
          Lost in the<br />neighbourhood.
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(10,10,10,0.6)' }}>
          That page doesn&apos;t exist. It might have moved, or never been here.
        </p>
        <Link href="/"
          className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          style={{ background: '#4744C8' }}>
          Go home
        </Link>
      </div>
    </div>
  )
}
