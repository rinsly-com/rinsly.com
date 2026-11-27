/**
 * Site-wide structured data that rinsly.com adds on top of site-core.
 *
 * ProfessionalService (refactor plan 003 T-01, Lawyer §17.1): only the fields
 * Lawyer cleared — name Rinsly, address, telephone, vatID, KvK as identifier,
 * areaServed NL and the per-locale description. `legalName` and `founder` are
 * on HOLD (KvK extract) and must not be added here.
 *
 * It uses the same `@id` as site-core's Organization node
 * (`<site>/#organization`), so consumers merge the two into one entity
 * (ProfessionalService is a LocalBusiness subtype). site-core 0.26.10 has no
 * option to replace its node; that is a Core follow-up.
 *
 * BreadcrumbList (T-02): Home → page, on every page except home.
 */

export type JsonLdLocale = 'nl' | 'en'

const DESCRIPTION: Record<JsonLdLocale, string> = {
  nl: 'Rinsly bouwt en host websites voor zakelijke opdrachtgevers.',
  en: 'Rinsly builds and hosts websites for business clients.',
}

const HOME_NAME: Record<JsonLdLocale, string> = { nl: 'Home', en: 'Home' }

function base(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, '')
}

export function buildProfessionalServiceJsonLd(
  siteUrl: string,
  locale: JsonLdLocale,
): Record<string, unknown> {
  const root = base(siteUrl)
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${root}/#organization`,
    name: 'Rinsly',
    url: root,
    description: DESCRIPTION[locale],
    telephone: '+31624118912',
    vatID: 'NL004117041B25',
    identifier: { '@type': 'PropertyValue', propertyID: 'KvK', value: '85578835' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Kazernestraat 6',
      postalCode: '3441 BB',
      addressLocality: 'Woerden',
      addressCountry: 'NL',
    },
    areaServed: 'NL',
  }
}

export function buildBreadcrumbJsonLd(
  siteUrl: string,
  locale: JsonLdLocale,
  slug: string,
  title: string,
): Record<string, unknown> | null {
  const name = title.trim()
  if (!name || slug === 'home') return null
  const root = base(siteUrl)
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: HOME_NAME[locale], item: `${root}/${locale}` },
      { '@type': 'ListItem', position: 2, name, item: `${root}/${locale}/${slug}` },
    ],
  }
}

/**
 * hreflang `x-default` (T-02): points at the Dutch URL, the default locale.
 * Adds it to whatever `alternates.languages` the engine built.
 */
export function withXDefault<M extends object>(metadata: M): M {
  const alternates = (metadata as { alternates?: unknown }).alternates as
    | { languages?: Record<string, string> | null; [key: string]: unknown }
    | null
    | undefined
  const languages = alternates?.languages
  const nl = languages?.['nl-NL'] ?? languages?.['nl']
  if (!alternates || !languages || !nl) return metadata
  return { ...metadata, alternates: { ...alternates, languages: { ...languages, 'x-default': nl } } }
}
