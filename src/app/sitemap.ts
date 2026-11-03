import type { MetadataRoute } from 'next'
import config from '@payload-config'

import { getRenderablePages } from '@rinsly-com/site-core/lib/pages'
import { absoluteUrl } from '@rinsly-com/site-core/lib/siteUrl'
import { slugsForSitemap } from '@/lib/sitemapSlugs'
import { siteConfig } from '@/site.config'

export const dynamic = 'force-dynamic'

const SITEMAP_LOCALES = ['nl', 'en'] as const

function localeHref(locale: (typeof SITEMAP_LOCALES)[number], slug: string): string {
  const path = slug === 'home' ? `/${locale}` : `/${locale}/${slug}`
  return absoluteUrl(siteConfig, path)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getRenderablePages(config, 'nl')
  // privacy and voorwaarden stay published; they are noindex and not listed here.
  const slugs = slugsForSitemap(pages.map((p) => p.slug))

  const entries: MetadataRoute.Sitemap = []
  for (const slug of slugs) {
    const languages = {
      'nl-NL': localeHref('nl', slug),
      en: localeHref('en', slug),
    }
    for (const locale of SITEMAP_LOCALES) {
      entries.push({
        url: localeHref(locale, slug),
        changeFrequency: slug === 'home' ? 'weekly' : 'monthly',
        priority: slug === 'home' ? 1 : 0.7,
        alternates: { languages },
      })
    }
  }
  return entries
}
