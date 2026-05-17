import Link from 'next/link'

// Section masthead used across all authenticated section pages.
//
// COLOR-BLOCKED VERSION (per founder direction). Each section page gets
// a full-bleed identity-coloured masthead. The white-on-color treatment is
// the magazine cover move — opening a city app should feel like opening an
// edition, not loading a dashboard.
//
// Pass `bg` (background color) per page. We infer ink contrast from a
// shortlist of known palette entries; default to white if unknown.

interface Props {
  // Eyebrow label above the headline, e.g., "Brussels · Ask"
  eyebrow: string
  // First line of the headline (no emphasis), e.g., "Brussels,"
  headline: string
  // The emphasised word, rendered as the standout on the colored field.
  // Always include trailing punctuation — it's part of the editorial voice.
  emphasis: string
  // (Legacy) section identity colour for the emphasis word. Kept for
  // backwards compatibility — drives the bg if `bg` isn't passed.
  emphasisColor?: string
  // Explicit background colour for the masthead block. Falls back to
  // emphasisColor, then a default amber.
  bg?: string
  // One-sentence subtitle under the headline.
  tagline: string
  // Optional "← Back to hub" link in the top-right.
  backHref?: string
  backLabel?: string
  // Optional live-signal strip rendered under the tagline.
  children?: React.ReactNode
}

// Map of brand colours to whether they're dark-on-white or light-on-color.
// Light-on-color = use white ink. Dark colours like navy, near-black get
// white. Amber + sky are bright enough that black ink reads better.
const LIGHT_INK_ON: Record<string, boolean> = {
  '#E8612A': true,   // terracotta — eat
  '#FF3EBA': true,   // pink — connect
  '#4744C8': true,   // purple — neighbourhoods/people
  '#252450': true,   // navy — brand
  '#0E9B6B': true,   // green — tip
  '#9B4DCA': true,   // violet
  '#0A0A0A': true,   // black
  '#1A8FAD': true,   // teal
  '#A07000': true,   // dark gold
  '#FAB400': false,  // amber — black ink reads better
  '#38C0F0': false,  // sky — black ink reads better
  '#B08800': false,  // gold-medium — black ink
  '#FFFFFF': false,  // white — black ink (debug only)
}

function inkColors(bgHex: string): { fg: string; faint: string; rule: string; emphFg: string } {
  const light = LIGHT_INK_ON[bgHex.toUpperCase()] ?? true
  return light
    ? { fg: '#FFFFFF', faint: 'rgba(255,255,255,0.7)', rule: 'rgba(255,255,255,0.35)', emphFg: '#FAB400' }
    : { fg: '#0A0A0A', faint: 'rgba(10,10,10,0.6)', rule: 'rgba(10,10,10,0.35)', emphFg: '#252450' }
}

export function PageMasthead({
  eyebrow, headline, emphasis, emphasisColor = '#FF3EBA',
  bg, tagline, backHref, backLabel, children,
}: Props) {
  const bgColor = bg ?? emphasisColor ?? '#FF3EBA'
  const ink = inkColors(bgColor)

  return (
    <div style={{ background: bgColor, borderBottom: '4px solid #0A0A0A' }}>
      {/* 4px navy brand rule still anchors the top */}
      <div style={{ height: 4, background: '#252450' }} />

      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-6 md:pt-8 pb-8 md:pb-10">

        {/* Publication slug — Vol. 01 / section / back link */}
        <div className="grid grid-cols-3 items-baseline gap-3 mb-3">
          <p className="text-[9px] font-black tracking-[0.32em] uppercase"
            style={{ color: ink.fg }}>
            Vol. 01 · Brussels
          </p>
          <p className="text-[9px] font-black tracking-[0.32em] uppercase text-center hidden sm:block"
            style={{ color: ink.faint }}>
            {eyebrow}
          </p>
          <p className="text-[9px] font-black tracking-[0.32em] uppercase text-right"
            style={{ color: ink.faint }}>
            {backHref ? (
              <Link href={backHref}
                className="hover:opacity-60 transition-opacity"
                style={{ color: ink.faint }}>
                {backLabel ?? '← Back'}
              </Link>
            ) : (
              <span className="hidden sm:inline">Local, on purpose.</span>
            )}
          </p>
        </div>

        {/* Mobile-only section eyebrow row */}
        <p className="text-[9px] font-black tracking-[0.32em] uppercase mb-3 sm:hidden"
          style={{ color: ink.faint }}>
          {eyebrow}
        </p>

        {/* Double-rule divider in ink color */}
        <div className="mb-5" style={{ borderTop: `1px solid ${ink.rule}` }} />
        <div className="mb-7" style={{ borderTop: `1px solid ${ink.rule}` }} />

        <h1 className="font-display font-black leading-[0.92] mb-4"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 5.25rem)',
            color: ink.fg,
            letterSpacing: '-0.02em',
          }}>
          {headline}<br />
          <em className="not-italic" style={{ color: ink.emphFg }}>{emphasis}</em>
        </h1>

        <p className="text-sm md:text-base max-w-md mb-5 leading-relaxed"
          style={{ color: ink.faint }}>
          {tagline}
        </p>

        {children && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-4"
            style={{ borderTop: `1px solid ${ink.rule}` }}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
