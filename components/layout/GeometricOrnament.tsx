// Geometric ornament — a small inline run of coloured shapes used as a
// section break or article-spread divider. Picks up the section accent
// for the centerpiece, with brand-anchor pieces on either side.
//
// Adds confident color without ever filling a field. Magazine printers
// have done this since the 1920s.

interface Props {
  /** Accent colour for the centerpiece shape. */
  accent?: string
  /** Alignment of the ornament row. */
  align?: 'left' | 'center'
  /** Render scale — 'sm' for between-paragraph, 'md' for section break. */
  size?: 'sm' | 'md'
}

export function GeometricOrnament({ accent = '#FF3EBA', align = 'center', size = 'md' }: Props = {}) {
  const dim = size === 'sm' ? 10 : 14
  const gap = size === 'sm' ? 'gap-2'  : 'gap-3'
  const just = align === 'center' ? 'justify-center' : 'justify-start'

  return (
    <div className={`flex items-center ${just} ${gap} my-8 select-none`}
      aria-hidden="true">
      {/* Navy circle */}
      <span style={{ width: dim, height: dim, borderRadius: '50%', background: '#252450' }} />
      {/* Amber diamond */}
      <span style={{ width: dim, height: dim, background: '#FAB400', transform: 'rotate(45deg)' }} />
      {/* Accent square — centerpiece, larger */}
      <span style={{ width: dim + 4, height: dim + 4, background: accent }} />
      {/* Pink circle */}
      <span style={{ width: dim, height: dim, borderRadius: '50%', background: '#FF3EBA' }} />
      {/* Sky triangle */}
      <span style={{
        width: 0,
        height: 0,
        borderLeft:   `${dim / 2}px solid transparent`,
        borderRight:  `${dim / 2}px solid transparent`,
        borderBottom: `${dim}px solid #38C0F0`,
      }} />
    </div>
  )
}
