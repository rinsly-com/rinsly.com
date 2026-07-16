/**
 * Locale primitives — the single source of truth for the site's languages and
 * the URL-prefix routing under `src/app/(frontend)/[locale]/`.
 *
 * Both languages are prefixed (there is no unprefixed default): the site lives
 * at `/nl/…` and `/en/…`. The bare `/` redirects to the default locale in dev;
 * in production the edge sends `rinsly.com/ → /en` and `rinsly.nl/* → /nl/*`.
 *
 * Content is localized field-by-field in Payload (see payload.config.ts
 * `localization`), so the same page document carries both languages; the
 * `locale` here is passed straight to Payload's Local API when fetching.
 */
export const LOCALES = ['nl', 'en'] as const

export type Locale = (typeof LOCALES)[number]

/** Fallback locale — Rinsly's primary market is Dutch. */
export const DEFAULT_LOCALE: Locale = 'nl'

/** IETF/OpenGraph language tags per locale. */
export const LOCALE_HTML_LANG: Record<Locale, string> = { nl: 'nl-NL', en: 'en' }
export const LOCALE_OG: Record<Locale, string> = { nl: 'nl_NL', en: 'en_US' }

/** Human label shown in the language switcher. */
export const LOCALE_LABEL: Record<Locale, string> = { nl: 'NL', en: 'EN' }

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * Build a root-relative path for a locale. `slug` is the page slug ('home' maps
 * to the locale root). An optional `#anchor` hash is appended verbatim.
 */
export function localePath(locale: Locale, slug?: string | null, hash = ''): string {
  const clean = slug?.replace(/^\/+/, '') ?? ''
  if (!clean || clean === 'home') return `/${locale}${hash}`
  return `/${locale}/${clean}${hash}`
}
