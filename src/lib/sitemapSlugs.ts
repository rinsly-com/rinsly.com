/**
 * Published slugs that stay on the site but are omitted from sitemap.xml.
 *
 * /nl/privacy, /en/privacy, /nl/voorwaarden and /en/voorwaarden are live with
 * noindex,nofollow. The slug is shared across locales, so dropping these two
 * slugs removes exactly those four URLs.
 *
 * Placeholder slugs in PLACEHOLDER_NOINDEX_SLUGS are also omitted until
 * Marketeer's final copy lands. Remove a slug from that set (seed then stops
 * setting meta.noindex too) in the same PR that replaces the placeholders.
 */
export const PLACEHOLDER_NOINDEX_SLUGS = new Set(['website-laten-maken-woerden'])

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
