import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent this site from being embedded in iframes (clickjacking)
  { key: 'X-Frame-Options',        value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Only send origin in referrer, not full URL
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  // Opt in to DNS prefetch control
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Permissions policy — deny access to sensitive browser APIs
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // HSTS — enforce HTTPS for 1 year (set after confirming HTTPS works)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 's1.ticketm.net' },
      { protocol: 'https', hostname: '*.ticketmaster.com' },
      { protocol: 'https', hostname: 'resizer.ticketmaster.com' },
      { protocol: 'https', hostname: 'pict.myclubplasma.be' },
      { protocol: 'https', hostname: 'botanique.be' },
      { protocol: 'https', hostname: 'd3i6li5p17fo2k.cloudfront.net' },
      { protocol: 'https', hostname: 'www.halles.be' },
      { protocol: 'https', hostname: 'recyclart.be' },
      { protocol: 'https', hostname: 'www.lamonnaiedemunt.be' },
      { protocol: 'https', hostname: 'www.flagey.be' },
    ],
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
