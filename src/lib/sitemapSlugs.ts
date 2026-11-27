/**
 * Published slugs that stay on the site but are omitted from sitemap.xml.
 *
 * /nl/privacy, /en/privacy, /nl/voorwaarden and /en/voorwaarden are live with
 * noindex,nofollow. The slug is shared across locales, so dropping these two
 * slugs removes exactly those four URLs.
 *
 * Placeholder slugs in PLACEHOLDER_NOINDEX_SLUGS stay noindex and omitted
 * from the sitemap until Yaron decides otherwise. The seed only writes
 * meta.noindex for a page row it creates; it never rewrites an existing page.
 * For a page that already exists, set meta.noindex to false through the
 * content endpoint or in the admin, and remove the slug from this set, or
 * the page stays noindex while the sitemap lists it.
 */
export const PLACEHOLDER_NOINDEX_SLUGS = new Set(['cases', 'website-laten-maken-woerden'])

export const SITEMAP_EXCLUDED_SLUGS = new Set([
  'privacy',
  'voorwaarden',
  ...PLACEHOLDER_NOINDEX_SLUGS,
])

export function slugsForSitemap(pageSlugs: readonly (string | null | undefined)[]): string[] {
  return [
    'home',
    ...pageSlugs.filter(
      (slug): slug is string =>
        typeof slug === 'string' &&
        slug !== '' &&
        slug !== 'home' &&
        !SITEMAP_EXCLUDED_SLUGS.has(slug),
    ),
  ]
}

/** Page rows from getRenderablePages (slug plus optional meta.noindex). */
export type SitemapPage = {
  slug?: string | null
  meta?: { noindex?: boolean | null } | null
}

/**
 * Sitemap slugs from CMS page rows: drop the denylist, and also drop any
 * page with meta.noindex set. The denylist is the safety net when a stored
 * row is missing noindex (seed is create-only and will not rewrite it).
 */
export function slugsForSitemapFromPages(pages: readonly SitemapPage[]): string[] {
  return slugsForSitemap(pages.filter((page) => page.meta?.noindex !== true).map((page) => page.slug))
}
