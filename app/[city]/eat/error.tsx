'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function EatError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ city: string }>()
  const cityId = params?.city ?? 'brussels'

  useEffect(() => {
    console.error('[roots] eat error', { city: cityId, message: error.message, digest: error.digest })
  }, [error, cityId])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#FFFFFF' }}>
      <div className="max-w-md text-center">
        <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-4" style={{ color: '#E8612A' }}>
          Eat & Drink
        </p>
        <h1 className="font-display font-black text-3xl md:text-4xl leading-tight mb-6" style={{ color: '#0A0A0A' }}>
          Map or venues<br />didn&apos;t load.
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(10,10,10,0.6)' }}>
          The map or our venue feed had trouble loading. Reload the page, or jump to your city hub.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset}
            className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ background: '#E8612A' }}>
            Reload
          </button>
          <Link href={`/${cityId}`}
            className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: 'rgba(10,10,10,0.5)', border: '1px solid rgba(10,10,10,0.12)' }}>
            Back to {cityId}
          </Link>
        </div>
      </div>
    </div>
  )
}
