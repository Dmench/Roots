import type { MetadataRoute } from 'next'

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://roots-mu.vercel.app')
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/privacy', '/terms', '/cities'],
        // Auth-gated routes intentionally not crawled. The /[city]/guide
        // surface is the public, indexable equivalent.
        disallow: ['/api/', '/auth/', '/profile', '/settlers/'],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
