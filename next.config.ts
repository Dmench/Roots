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
    // We aggregate images from many third-party sources (event scrapers, news RSS,
    // Reddit, Google Places). Whitelisting every CDN is unmaintainable and breaks
    // silently when a source changes its image host. We trust HTTPS image URLs
    // returned by our own server-side fetchers; the optimizer will refuse non-images.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    // Cache optimised images for a day on the CDN.
    minimumCacheTTL: 86400,
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
