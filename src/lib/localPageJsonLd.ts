/**
 * Structured data for the Woerden/Utrecht local page.
 *
 * Yaron (26 Nov 15:59): Rinsly serves the province of Utrecht REMOTELY from
 * Woerden. There is no in-person service in Utrecht, so the data says so:
 * the service is delivered over a remote channel, the area served is the
 * province, and the provider carries a locality only. It deliberately has no
 * street address and no postal code: a street address on a "local" result
 * invites walk-in visits. (The site-wide LocalBusiness node from site-core is
 * unchanged and still carries the footer address that is already public.)
 */

/** Slug shared by both locales, like every other page of the site. */
export const LOCAL_PAGE_SLUG = 'website-laten-maken-woerden'

type LocalLocale = 'nl' | 'en'

const TEXT = {
  nl: {
    name: 'Websites bouwen en hosten op afstand, vanuit Woerden',
    serviceType: 'Websites bouwen en hosten',
    description:
      'Rinsly werkt vanuit Woerden voor ontwerpstudio’s in de provincie Utrecht. De dienst wordt op afstand geleverd, per telefoon, video en e-mail. Er is geen dienstverlening op locatie.',
    channel: 'Op afstand (telefoon, video, e-mail)',
    country: 'Nederland',
  },
  en: {
    name: 'Website building and hosting, remotely from Woerden',
    serviceType: 'Website building and hosting',
    description:
      'Rinsly works from Woerden for design studios in the province of Utrecht. The service is delivered remotely, by phone, video and email. There is no on-site service.',
    channel: 'Remote (phone, video, email)',
    country: 'the Netherlands',
  },
} as const

export function buildLocalPageJsonLd(siteUrl: string, locale: LocalLocale): Record<string, unknown> {
  const base = siteUrl.replace(/\/+$/, '')
  const pageUrl = `${base}/${locale}/${LOCAL_PAGE_SLUG}`
  const text = TEXT[locale]
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${pageUrl}#service`,
    name: text.name,
    serviceType: text.serviceType,
    description: text.description,
    url: pageUrl,
    inLanguage: locale,
    provider: {
      '@type': 'LocalBusiness',
      '@id': `${base}/#organization`,
      name: 'Rinsly',
      url: base,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Woerden',
        addressRegion: 'Utrecht',
        addressCountry: 'NL',
      },
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Utrecht',
      containedInPlace: { '@type': 'Country', name: text.country },
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      name: text.channel,
      serviceUrl: pageUrl,
      availableLanguage: ['nl', 'en'],
    },
  }
}
