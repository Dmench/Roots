'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[roots] global error', { message: error.message, digest: error.digest, stack: error.stack })
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#FFFFFF' }}>
      <div className="max-w-md text-center">
        <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-4" style={{ color: 'rgba(10,10,10,0.3)' }}>
          Something went wrong
        </p>
        <h1 className="font-display font-black text-3xl md:text-4xl leading-tight mb-6" style={{ color: '#0A0A0A' }}>
          We hit a snag.
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(10,10,10,0.6)' }}>
          A part of Roots crashed. We&apos;ve been notified. Try again, or head back home.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset}
            className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ background: '#4744C8' }}>
            Try again
          </button>
          <Link href="/"
            className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: 'rgba(10,10,10,0.5)', border: '1px solid rgba(10,10,10,0.12)' }}>
            Go home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-10 text-[10px] font-mono" style={{ color: 'rgba(10,10,10,0.25)' }}>
            ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
