import Link from 'next/link'

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}>
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

        {/* Wordmark + tagline */}
        <div className="flex flex-col gap-1">
          <span className="font-display font-black text-lg leading-none" style={{ color: '#0A0A0A' }}>
            Roots
          </span>
          <span className="text-[11px] tracking-wide" style={{ color: 'rgba(10,10,10,0.35)' }}>
            Put down roots, anywhere.
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {[
            { href: '/cities',  label: 'Cities' },
            { href: '/about',   label: 'About' },
            { href: '/privacy', label: 'Privacy' },
            { href: '/terms',   label: 'Terms' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="footer-link text-[11px] font-medium tracking-wide">
              {label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p className="text-[10px] tracking-wide sm:text-right" style={{ color: 'rgba(10,10,10,0.25)' }}>
          © {new Date().getFullYear()} Roots
        </p>
      </div>
    </footer>
  )
}
