'use client'
import { useState } from 'react'

export function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // fallback: select + execCommand
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black tracking-[0.18em] uppercase transition-all"
      style={{
        background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(10,10,10,0.05)',
        color:      copied ? '#0E9B6B' : 'rgba(10,10,10,0.5)',
        border:     copied ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(10,10,10,0.12)',
      }}
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4 4V3a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Copy link
        </>
      )}
    </button>
  )
}
