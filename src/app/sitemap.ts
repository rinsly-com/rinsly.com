import type { MetadataRoute } from 'next'
import config from '@payload-config'

import { getRenderablePages } from '@rinsly-com/site-core/lib/pages'
import { absoluteUrl } from '@rinsly-com/site-core/lib/siteUrl'
import { DEFAULT_LOCALE, LOCALES, localePath } from '@rinsly-com/site-core/lib/locale'
import { siteConfig } from '@/site.config'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getRenderablePages(config, DEFAULT_LOCALE)
  const slugs = [
    'home',
    ...pages.map((p) => p.slug).filter((s): s is string => Boolean(s) && s !== 'home'),
  ]

  const entries: MetadataRoute.Sitemap = []
  for (const slug of slugs) {
    const languages = Object.fromEntries(
      LOCALES.map((l) => [l === 'nl' ? 'nl-NL' : 'en', absoluteUrl(siteConfig, localePath(l, slug))]),
    )
    for (const locale of LOCALES) {
      entries.push({
        url: absoluteUrl(siteConfig, localePath(locale, slug)),
        changeFrequency: slug === 'home' ? 'weekly' : 'monthly',
        priority: slug === 'home' ? 1 : 0.7,
        alternates: { languages },
      })
    }
  }
  return entries
}
