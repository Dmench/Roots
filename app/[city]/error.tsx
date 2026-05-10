'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function CityError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ city: string }>()
  const cityId = params?.city ?? 'brussels'

  useEffect(() => {
    console.error('[roots] city error', { city: cityId, message: error.message, digest: error.digest })
  }, [error, cityId])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#FFFFFF' }}>
      <div className="max-w-md text-center">
        <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-4" style={{ color: 'rgba(10,10,10,0.3)' }}>
          City data unavailable
        </p>
        <h1 className="font-display font-black text-3xl md:text-4xl leading-tight mb-6" style={{ color: '#0A0A0A' }}>
          One of our city feeds<br />is having a moment.
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(10,10,10,0.6)' }}>
          We pull from a lot of sources — events, transport, weather, news. One of them just failed.
          Try again in a moment, or use a different section.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset}
            className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ background: '#4744C8' }}>
            Try again
          </button>
          <Link href={`/${cityId}/settle`}
            className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: 'rgba(10,10,10,0.5)', border: '1px solid rgba(10,10,10,0.12)' }}>
            Open Settle
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
