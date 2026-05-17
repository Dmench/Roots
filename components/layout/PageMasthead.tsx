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
  // The emphasised word, rendered in the section's identity colour.
  // Always include trailing punctuation — it's part of the editorial voice.
  emphasis: string
  // Section identity colour for the emphasis word. Defaults to brand pink.
  emphasisColor?: string
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
  eyebrow, headline, emphasis, emphasisColor = '#FF3EBA',
  tagline, backHref, backLabel, children,
}: Props) {
  return (
    <div style={{ background: '#F9F8F6', borderBottom: '2px solid #0A0A0A' }}>
      {/* 4px brand rule */}
      <div style={{ height: 4, background: '#252450' }} />

      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-6 md:pt-8 pb-7 md:pb-9">

        {/* Publication slug — turns every section page into "an edition".
            Left = brand + volume. Center = section eyebrow. Right = back link
            on mobile, issue date on desktop. */}
        <div className="grid grid-cols-3 items-baseline gap-3 mb-3">
          <p className="text-[9px] font-black tracking-[0.32em] uppercase"
            style={{ color: '#252450' }}>
            Vol. 01 · Brussels
          </p>
          <p className="text-[9px] font-black tracking-[0.32em] uppercase text-center hidden sm:block"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            {eyebrow}
          </p>
          <p className="text-[9px] font-black tracking-[0.32em] uppercase text-right"
            style={{ color: 'rgba(10,10,10,0.4)' }}>
            {backHref ? (
              <Link href={backHref}
                className="hover:opacity-60 transition-opacity"
                style={{ color: 'rgba(10,10,10,0.4)' }}>
                {backLabel ?? '← Back'}
              </Link>
            ) : (
              <span className="hidden sm:inline">Local, on purpose.</span>
            )}
          </p>
        </div>

        {/* Mobile-only section eyebrow row (since the slug grid hides the centre on small) */}
        <p className="text-[9px] font-black tracking-[0.32em] uppercase mb-3 sm:hidden"
          style={{ color: 'rgba(10,10,10,0.4)' }}>
          {eyebrow}
        </p>

        {/* Double-rule divider — navy hairline + amber hairline, 3px apart.
            The publication-nameplate move; readable as "this is a printed thing". */}
        <div className="mb-5" style={{ borderTop: '1px solid #252450' }} />
        <div className="mb-7" style={{ borderTop: '1px solid #FAB400' }} />

        <h1 className="font-display font-black leading-[0.92] mb-4"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 5.25rem)',
            color: '#0A0A0A',
            letterSpacing: '-0.02em',
          }}>
          {headline}<br />
          <em className="not-italic" style={{ color: emphasisColor }}>{emphasis}</em>
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
