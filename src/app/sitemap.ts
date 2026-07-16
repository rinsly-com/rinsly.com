import type { MetadataRoute } from 'next'

import { getRenderablePages } from '@/lib/pages'
import { absoluteUrl } from '@/lib/siteUrl'
import { DEFAULT_LOCALE, LOCALES, localePath } from '@/lib/locale'

export const dynamic = 'force-dynamic'

/**
 * Sitemap: every published page × every locale, with hreflang alternates. Slugs
 * are shared across locales, so one enumeration (in the default locale) yields
 * the full set of paths.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getRenderablePages(DEFAULT_LOCALE)
  const slugs = ['home', ...pages.map((p) => p.slug).filter((s): s is string => Boolean(s) && s !== 'home')]

  const entries: MetadataRoute.Sitemap = []
  for (const slug of slugs) {
    const languages = Object.fromEntries(
      LOCALES.map((l) => [l === 'nl' ? 'nl-NL' : 'en', absoluteUrl(localePath(l, slug))]),
    )
    for (const locale of LOCALES) {
      entries.push({
        url: absoluteUrl(localePath(locale, slug)),
        changeFrequency: slug === 'home' ? 'weekly' : 'monthly',
        priority: slug === 'home' ? 1 : 0.7,
        alternates: { languages },
      })
    }
  }
  return entries
}
