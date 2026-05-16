'use client'
import { useState } from 'react'

interface Props {
  /** URL relative to the site origin, e.g. "/brussels/tips/foo" */
  url:     string
  /** Short title — used as the share copy hook */
  title:   string
  /** 1–2 sentence summary — appended after the title in some share targets */
  summary: string
}

function siteUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin
  // SSR fallback — server-rendered ShareRow uses relative URL anyway
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://roots-mu.vercel.app'
}

export function ShareRow({ url, title, summary }: Props) {
  const [copied, setCopied] = useState(false)
  const absolute = url.startsWith('http') ? url : `${siteUrl()}${url}`

  // We pre-fill share text on each network using the conventions that look
  // most natural in each. Twitter+LinkedIn want a hook + URL; WhatsApp wants
  // a single readable string; Copy is a no-frills URL.
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(absolute)}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absolute)}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} — ${absolute}`)}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(absolute)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      // Older Safari fallback
      const ta = document.createElement('textarea')
      ta.value = absolute
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); setCopied(true) } catch {}
      document.body.removeChild(ta)
      window.setTimeout(() => setCopied(false), 2200)
    }
  }

  const btn = 'flex items-center gap-2 px-3 py-2 text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-70 transition-opacity'
  const bg  = '#FFFFFF'
  const border = '1px solid rgba(10,10,10,0.12)'

  return (
    <div className="mt-2">
      <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-3"
        style={{ color: 'rgba(10,10,10,0.4)' }}>
        Share this
      </p>
      <div className="flex flex-wrap gap-2">
        <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
          className={btn} style={{ background: bg, border, color: '#0A0A0A' }}>
          <span aria-hidden>↗</span> X · Twitter
        </a>
        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
          className={btn} style={{ background: bg, border, color: '#0A0A0A' }}>
          <span aria-hidden>↗</span> LinkedIn
        </a>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          className={btn} style={{ background: bg, border, color: '#0A0A0A' }}>
          <span aria-hidden>↗</span> WhatsApp
        </a>
        <button onClick={copy}
          className={btn}
          style={{ background: copied ? '#0E9B6B' : bg, border, color: copied ? '#fff' : '#0A0A0A' }}>
          {copied ? '✓ Copied' : 'Copy link'}
        </button>
      </div>
      {/* Honesty subnote */}
      <p className="text-[10px] mt-3 leading-relaxed"
        style={{ color: 'rgba(10,10,10,0.35)' }}>
        Pre-fills the title + URL. No tracking added to the link.
      </p>
    </div>
  )
}
