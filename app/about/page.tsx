import Link from 'next/link'
import { Footer } from '@/components/layout/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>

      {/* Minimal nav */}
      <header style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        <div className="max-w-3xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <Link href="/" className="font-display font-black text-lg hover:opacity-50 transition-opacity"
            style={{ color: '#0A0A0A' }}>
            Roots
          </Link>
          <Link href="/brussels"
            className="text-xs font-semibold hover:opacity-60 transition-opacity"
            style={{ color: '#4744C8' }}>
            Open Brussels →
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto px-6 md:px-12 py-16 md:py-24">

        <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-6"
          style={{ color: 'rgba(10,10,10,0.3)' }}>
          About
        </p>

        <h1 className="font-display font-black text-4xl md:text-5xl leading-tight mb-10"
          style={{ color: '#0A0A0A' }}>
          We help people<br />feel at home.
        </h1>

        <div className="space-y-6 text-base leading-relaxed" style={{ color: 'rgba(10,10,10,0.65)' }}>
          <p>
            Moving to a new city is exciting and overwhelming in equal measure. The first few months are
            a blur of admin, unfamiliar neighbourhoods, and the slow realisation that you have no idea
            where anyone actually goes on a Saturday.
          </p>
          <p>
            Roots is for anyone new to a city — whether you moved from another country, another city, or
            another neighbourhood. A structured settle-in checklist so nothing falls through the cracks.
            A community of people at the same stage as you. Local intelligence — events, news,
            neighbourhoods — so you can actually participate in city life, not just observe it.
          </p>
          <p>
            We started with Brussels because it's one of the most layered, multilingual, and least
            navigable cities in Europe — a place where every kind of newcomer is figuring it out at
            once. More cities soon.
          </p>
        </div>

        <div className="mt-14 pt-10 flex flex-col sm:flex-row gap-4"
          style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}>
          <Link href="/brussels"
            className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ background: '#4744C8' }}>
            Start with Brussels →
          </Link>
          <a href="mailto:hello@roots.so"
            className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: 'rgba(10,10,10,0.5)', border: '1px solid rgba(10,10,10,0.12)' }}>
            Say hello
          </a>
        </div>

      </main>

      <Footer />
    </div>
  )
}
