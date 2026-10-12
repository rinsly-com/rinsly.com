/**
 * Published slugs that stay on the site but are omitted from sitemap.xml.
 *
 * /nl/privacy, /en/privacy, /nl/voorwaarden and /en/voorwaarden are live with
 * noindex,nofollow. The slug is shared across locales, so dropping these two
 * slugs removes exactly those four URLs.
 */
export const SITEMAP_EXCLUDED_SLUGS = new Set(['privacy', 'voorwaarden'])

export function slugsForSitemap(pageSlugs: readonly (string | null | undefined)[]): string[] {
  return [
    'home',
    ...pageSlugs.filter(
      (slug): slug is string =>
        Boolean(slug) && slug !== 'home' && !SITEMAP_EXCLUDED_SLUGS.has(slug),
    ),
  ]
}
