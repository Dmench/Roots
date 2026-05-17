// Hand-drawn-style neighbourhood glyphs — placeholder set.
//
// The brand strategist's call: "the thing that makes a screenshot of Roots
// unmistakable in a Twitter feed" is a custom hand-drawn neighbourhood mark
// set commissioned from an illustrator. Twelve marks, one per Brussels hood.
//
// Until that exists, these geometric SVG placeholders carry the slot —
// each hood gets a single distinct primitive shape drawn with simple
// stroked paths. NOT trying to look hand-drawn AI — clearly geometric,
// clearly placeholder, swappable in one file when real art arrives.
//
// Replace by:
//   1. Commissioning 12 ink/pen-drawn marks (a tram, a market crate, a
//      lambic bottle, an Art Nouveau curl, etc.) at 1:1 aspect, ~120px
//      master, exported as 12 individual SVGs.
//   2. Drop them in /public/glyphs/{slug}.svg
//   3. Swap this component to `<img src={`/glyphs/${slug}.svg`} />`.

import type { CSSProperties } from 'react'

interface Props {
  slug:  string
  size?: number          // px — default 64
  color?: string         // stroke color, default brand purple
  style?: CSSProperties
}

const STROKE_WIDTH = 1.25

// Each shape draws on a 64×64 viewBox. Single stroke, no fill.
// Twelve distinct geometric primitives — abstract enough to read as
// editorial marks, distinct enough that each hood has its own identity.
const SHAPES: Record<string, React.ReactNode> = {
  // Ixelles — interlocking circles (the ponds + the social density)
  'ixelles': (
    <g>
      <circle cx="24" cy="32" r="14" fill="none" />
      <circle cx="40" cy="32" r="14" fill="none" />
    </g>
  ),
  // Saint-Gilles — triangular square (the Parvis is a triangle)
  'saint-gilles': (
    <g>
      <polygon points="32,12 54,52 10,52" fill="none" />
      <circle cx="32" cy="40" r="3" fill="currentColor" stroke="none" />
    </g>
  ),
  // Dansaert — vertical bars (the strip)
  'dansaert': (
    <g>
      <line x1="20" y1="10" x2="20" y2="54" />
      <line x1="32" y1="10" x2="32" y2="54" />
      <line x1="44" y1="10" x2="44" y2="54" />
    </g>
  ),
  // Flagey — a tram line + a square (the square + the 81)
  'flagey': (
    <g>
      <rect x="14" y="20" width="36" height="24" fill="none" />
      <line x1="6" y1="32" x2="14" y2="32" />
      <line x1="50" y1="32" x2="58" y2="32" />
    </g>
  ),
  // Marolles — a flea-market crate (square with X)
  'marolles': (
    <g>
      <rect x="12" y="18" width="40" height="32" fill="none" />
      <line x1="12" y1="18" x2="52" y2="50" />
      <line x1="52" y1="18" x2="12" y2="50" />
    </g>
  ),
  // EU Quarter — the Cinquantenaire arch
  'eu-quarter': (
    <g>
      <path d="M 12 50 L 12 30 Q 32 6, 52 30 L 52 50" fill="none" />
      <line x1="8" y1="50" x2="56" y2="50" />
    </g>
  ),
  // Schaerbeek — three diamonds (Place Colignon's roof gables)
  'schaerbeek': (
    <g>
      <polygon points="16,32 22,22 28,32 22,42" fill="none" />
      <polygon points="28,32 34,22 40,32 34,42" fill="none" />
      <polygon points="40,32 46,22 52,32 46,42" fill="none" />
    </g>
  ),
  // Etterbeek — a leaf (the green of Parc Léopold + Cinquantenaire)
  'etterbeek': (
    <g>
      <path d="M 32 12 Q 14 32, 32 52 Q 50 32, 32 12 Z" fill="none" />
      <line x1="32" y1="12" x2="32" y2="52" />
    </g>
  ),
  // Uccle — concentric circles (the leafy southern sprawl)
  'uccle': (
    <g>
      <circle cx="32" cy="32" r="20" fill="none" />
      <circle cx="32" cy="32" r="12" fill="none" />
      <circle cx="32" cy="32" r="4" fill="none" />
    </g>
  ),
  // Anderlecht — open brackets (still finding itself)
  'anderlecht': (
    <g>
      <path d="M 22 12 L 12 32 L 22 52" fill="none" />
      <path d="M 42 12 L 52 32 L 42 52" fill="none" />
    </g>
  ),
  // Forest — a stylised tree
  'forest': (
    <g>
      <line x1="32" y1="20" x2="32" y2="52" />
      <line x1="32" y1="28" x2="20" y2="22" />
      <line x1="32" y1="34" x2="46" y2="28" />
      <line x1="32" y1="40" x2="22" y2="36" />
      <line x1="32" y1="46" x2="44" y2="42" />
    </g>
  ),
  // Sainte-Catherine — the inner harbour (a long horizontal pool)
  'sainte-catherine': (
    <g>
      <rect x="8" y="26" width="48" height="12" fill="none" />
      <line x1="16" y1="32" x2="48" y2="32" strokeDasharray="2 3" />
    </g>
  ),
  // Châtelain — a wine-glass silhouette (Wednesday-evening market)
  'chatelain': (
    <g>
      <path d="M 22 14 L 42 14 L 38 30 Q 32 36, 26 30 Z" fill="none" />
      <line x1="32" y1="36" x2="32" y2="50" />
      <line x1="22" y1="50" x2="42" y2="50" />
    </g>
  ),
}

export function HoodGlyph({ slug, size = 64, color = '#4744C8', style }: Props) {
  const shape = SHAPES[slug] ?? SHAPES['ixelles']  // soft fallback
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ color, ...style }}
      stroke="currentColor"
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="presentation">
      {shape}
    </svg>
  )
}
