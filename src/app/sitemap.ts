import type { MetadataRoute } from 'next'
import config from '@payload-config'

import { getRenderablePages } from '@rinsly-com/site-core/lib/pages'
import { absoluteUrl } from '@rinsly-com/site-core/lib/siteUrl'
import { lastModifiedBySlug, slugsForSitemapFromPages } from '@/lib/sitemapSlugs'
import { siteConfig } from '@/site.config'

export const dynamic = 'force-dynamic'

const SITEMAP_LOCALES = ['nl', 'en'] as const

function localeHref(locale: (typeof SITEMAP_LOCALES)[number], slug: string): string {
  const path = slug === 'home' ? `/${locale}` : `/${locale}/${slug}`
  return absoluteUrl(siteConfig, path)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getRenderablePages(config, 'nl')
  // privacy, voorwaarden, /cases and Woerden stay published but are omitted
  // (slug denylist, and any page with meta.noindex).
  const slugs = slugsForSitemapFromPages(pages)
  // <lastmod> from the page's updatedAt (plan 003 T-02); omitted when unknown.
  const lastModified = lastModifiedBySlug(pages)

  const entries: MetadataRoute.Sitemap = []
  for (const slug of slugs) {
    const languages = {
      'nl-NL': localeHref('nl', slug),
      en: localeHref('en', slug),
      // hreflang x-default → the Dutch URL (plan 003 T-02).
      'x-default': localeHref('nl', slug),
    }
    for (const locale of SITEMAP_LOCALES) {
      entries.push({
        url: localeHref(locale, slug),
        ...(lastModified.has(slug) ? { lastModified: lastModified.get(slug) } : {}),
        changeFrequency: slug === 'home' ? 'weekly' : 'monthly',
        priority: slug === 'home' ? 1 : 0.7,
        alternates: { languages },
      })
    }
  }
  return entries
}
