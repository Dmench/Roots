'use client'
import { useState } from 'react'

interface Props {
  /** Title of the page being shared — used in the email subject + WhatsApp body. */
  title: string
  /** Short editorial summary — used as the email body / WhatsApp text. */
  summary: string
  /** Optional eyebrow ("Share with"). Leave default for the standard label. */
  label?: string
}

// Three share affordances on every public guide page: copy URL, email a friend,
// WhatsApp. Mailto and WhatsApp are plain links (work everywhere); copy is a
// client island. Uses window.location.href at runtime so it adapts whether
// you're on the Vercel preview or a custom domain.
export function ShareButtons({ title, summary, label = 'Send this to a friend' }: Props) {
  const [copied, setCopied] = useState(false)

  function pageUrl(): string {
    if (typeof window === 'undefined') return ''
    return window.location.href.split('#')[0].split('?')[0]
  }

  async function copy() {
    const url = pageUrl()
    try {
      await navigator.clipboard.writeText(url)
    } catch {
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

  function emailHref(): string {
    if (typeof window === 'undefined') return '#'
    const subject = encodeURIComponent(`${title} — Roots`)
    const body    = encodeURIComponent(`${summary}\n\nFull guide: ${pageUrl()}\n\n— sent from Roots, the playbook for moving cities.`)
    return `mailto:?subject=${subject}&body=${body}`
  }

  function whatsappHref(): string {
    if (typeof window === 'undefined') return '#'
    const text = encodeURIComponent(`${title} — ${pageUrl()}`)
    return `https://wa.me/?text=${text}`
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-black tracking-[0.18em] uppercase mr-1"
        style={{ color: 'rgba(10,10,10,0.4)' }}>
        {label}
      </span>

      <button
        onClick={copy}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black tracking-[0.14em] uppercase transition-all"
        style={{
          background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(10,10,10,0.04)',
          color:      copied ? '#0E9B6B' : 'rgba(10,10,10,0.55)',
          border:     `1px solid ${copied ? 'rgba(16,185,129,0.25)' : 'rgba(10,10,10,0.1)'}`,
        }}>
        {copied ? '✓ Copied' : 'Copy link'}
      </button>

      <a
        href={emailHref()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black tracking-[0.14em] uppercase hover:opacity-70 transition-opacity"
        style={{
          background: 'rgba(10,10,10,0.04)',
          color: 'rgba(10,10,10,0.55)',
          border: '1px solid rgba(10,10,10,0.1)',
        }}>
        Email
      </a>

      <a
        href={whatsappHref()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black tracking-[0.14em] uppercase hover:opacity-70 transition-opacity"
        style={{
          background: 'rgba(37,211,102,0.08)',
          color: '#1F8F4A',
          border: '1px solid rgba(37,211,102,0.25)',
        }}>
        WhatsApp
      </a>
    </div>
  )
}
