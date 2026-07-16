/**
 * Canonical public site origin — the single source of truth for metadataBase,
 * canonical URLs, absolute OG image URLs, the sitemap and robots.
 *
 * Production is served at rinsly.com. rinsly.nl serves the Dutch site and is
 * handled at the edge (rinsly.nl/* → rinsly.com/nl/*). Override per environment
 * with NEXT_PUBLIC_SITE_URL — it is inlined at build time.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rinsly.com').replace(
  /\/+$/,
  '',
)

export const SITE_NAME = 'Rinsly'

/** Build an absolute URL on the canonical origin from a root-relative path. */
export function absoluteUrl(pathname = '/'): string {
  return new URL(pathname, `${SITE_URL}/`).toString()
}
