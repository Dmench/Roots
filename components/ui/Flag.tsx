import { flagSvgUrl, getCountry } from '@/lib/data/countries'

interface Props {
  /** ISO 3166-1 alpha-2 code, e.g. "BE". */
  code: string
  /** Render size in pixels. Defaults to 20. */
  size?: number
  /** Optional class for layout. */
  className?: string
  /** Optional title — defaults to country name (for hover + a11y). */
  title?: string
}

// Twemoji SVG flag — consistent rendering across Mac, iOS, Android, Windows.
// Native flag emoji on Windows render as country code text, which looks
// terrible in the editorial register. Twemoji SVG is the universal fallback.
// CDN: jsDelivr, cached aggressively, no rate concerns at our scale.
export function Flag({ code, size = 20, className = '', title }: Props) {
  const country = getCountry(code)
  const label = title ?? country?.name ?? code
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagSvgUrl(code)}
      alt={label}
      title={label}
      width={size}
      height={Math.round(size * 0.75)}
      loading="lazy"
      decoding="async"
      className={`inline-block shrink-0 ${className}`}
      style={{ display: 'inline-block', verticalAlign: '-0.15em' }}
    />
  )
}
