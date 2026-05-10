import type { MetadataRoute } from 'next'
import { ACTIVE_CITIES } from '@/lib/data/cities'
import { getTasksForCity } from '@/lib/data/tasks'

// Resolves to the configured site URL (Vercel sets VERCEL_URL automatically),
// matching the metadataBase logic in app/layout.tsx.
function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://roots-mu.vercel.app')
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  const now  = new Date()

  // Static, public pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`,         lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/cities`,   lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/about`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${base}/privacy`,  lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${base}/terms`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ]

  // Per-city public guide hubs and individual guides
  const guidePages: MetadataRoute.Sitemap = ACTIVE_CITIES.flatMap(city => {
    const tasks = getTasksForCity(city.id)
    return [
      {
        url: `${base}/${city.id}/guide`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      },
      ...tasks.map(t => ({
        url: `${base}/${city.id}/guide/${t.slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    ]
  })

  return [...staticPages, ...guidePages]
}
