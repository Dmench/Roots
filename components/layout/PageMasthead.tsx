import Link from 'next/link'

// Section masthead used across all authenticated section pages.
// Pattern: 4px navy brand rule → cream block with 2px black bottom border →
// eyebrow label → big editorial headline (with a pink emphasis word echoing
// the landing page's "Put down roots.") → tagline → optional live-signal slot.
//
// Sizing matches the city hub's nameplate so the section pages feel like a
// continuation of the same magazine, not a different product.

interface Props {
  // Eyebrow label above the headline, e.g., "Brussels · Ask"
  eyebrow: string
  // First line of the headline (no emphasis), e.g., "Brussels,"
  headline: string
  // The emphasised word, rendered in pink. Always include the punctuation.
  emphasis: string
  // One-sentence subtitle under the headline.
  tagline: string
  // Optional "← Back to hub" link in the top-right.
  backHref?: string
  backLabel?: string
  // Optional live-signal strip rendered under the tagline. Pass small-caps
  // tracked-out spans (or whatever) — wrapper handles spacing + top border.
  children?: React.ReactNode
}

export function PageMasthead({
  eyebrow, headline, emphasis, tagline, backHref, backLabel, children,
}: Props) {
  return (
    <div style={{ background: '#F9F8F6', borderBottom: '2px solid #0A0A0A' }}>
      {/* 4px brand rule */}
      <div style={{ height: 4, background: '#252450' }} />

      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-8 md:pt-10 pb-7 md:pb-9">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <p className="text-[10px] font-black tracking-[0.28em] uppercase"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            {eyebrow}
          </p>
          {backHref && (
            <Link href={backHref}
              className="text-[10px] font-black tracking-[0.18em] uppercase hover:opacity-60 transition-opacity hidden sm:block"
              style={{ color: 'rgba(10,10,10,0.3)' }}>
              {backLabel ?? '← Back'}
            </Link>
          )}
        </div>

        <h1 className="font-display font-black leading-[0.92] mb-4"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 5.25rem)',
            color: '#0A0A0A',
            letterSpacing: '-0.02em',
          }}>
          {headline}<br />
          <em className="not-italic" style={{ color: '#FF3EBA' }}>{emphasis}</em>
        </h1>

        <p className="text-sm md:text-base max-w-md mb-5 leading-relaxed"
          style={{ color: 'rgba(10,10,10,0.55)' }}>
          {tagline}
        </p>

        {children && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-4"
            style={{ borderTop: '1px solid rgba(10,10,10,0.1)' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
