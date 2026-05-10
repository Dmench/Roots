import Link from 'next/link'

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}>
      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-10 pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

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

        {/* Editorial signoff — magazine-style colophon */}
        <div className="mt-8 pt-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between"
          style={{ borderTop: '1px solid rgba(10,10,10,0.06)' }}>
          <p className="text-[10px] leading-relaxed max-w-md" style={{ color: 'rgba(10,10,10,0.4)' }}>
            Roots is made in Brussels by Daniel and a small council of friends who&apos;ve all moved cities at least once.
            Say hello — <a href="mailto:dmench9@gmail.com" className="footer-link font-semibold">dmench9@gmail.com</a>.
          </p>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase shrink-0"
            style={{ color: 'rgba(10,10,10,0.3)' }}>
            Issue 1 · Brussels
          </p>
        </div>
      </div>
    </footer>
  )
}
