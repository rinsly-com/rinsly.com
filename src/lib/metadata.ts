import type { Metadata } from 'next'

import type { Page } from '@/payload-types'
import { absoluteUrl, SITE_NAME } from './siteUrl'
import { localePath, LOCALE_OG, type Locale } from './locale'

const DEFAULT_DESCRIPTION: Record<Locale, string> = {
  nl: 'Rinsly — webontwikkeling & hosting. Onbezorgd online, up-to-date en veilig.',
  en: 'Rinsly — web development & hosting. Online without worries, up to date and secure.',
}

// The SEO plugin's `meta` group. Typed loosely so this helper compiles before
// `generate:types` picks up the plugin fields.
type PageMeta = {
  title?: string | null
  description?: string | null
  image?: unknown
  noindex?: boolean | null
}

type PageWithMeta = Pick<Page, 'title'> & { meta?: PageMeta | null }

/**
 * Per-page metadata: title, description, canonical URL, per-locale hreflang
 * alternates and Open Graph / Twitter tags. Editor-set `meta.title` /
 * `meta.description` (SEO plugin) win over the page-title fallback. The
 * OG/Twitter image is owned by the colocated `opengraph-image` route.
 */
export function buildPageMetadata(
  page: PageWithMeta,
  {
    slug,
    locale,
    homepage = false,
  }: { slug: string; locale: Locale; homepage?: boolean },
): Metadata {
  const canonical = absoluteUrl(localePath(locale, slug))
  const languages: Record<string, string> = {
    'nl-NL': absoluteUrl(localePath('nl', slug)),
    en: absoluteUrl(localePath('en', slug)),
  }
  const metaTitle = page.meta?.title?.trim() || undefined
  const description = page.meta?.description?.trim() || DEFAULT_DESCRIPTION[locale]

  const title: Metadata['title'] | undefined = metaTitle
    ? { absolute: metaTitle }
    : homepage
      ? undefined
      : page.title
  const socialTitle = metaTitle || (homepage ? undefined : `${page.title} — ${SITE_NAME}`)

  return {
    ...(title !== undefined ? { title } : {}),
    description,
    alternates: { canonical, languages },
    ...(page.meta?.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: LOCALE_OG[locale],
      url: canonical,
      ...(socialTitle ? { title: socialTitle } : {}),
      description,
    },
    twitter: {
      card: 'summary_large_image',
      ...(socialTitle ? { title: socialTitle } : {}),
      description,
    },
  }
}
