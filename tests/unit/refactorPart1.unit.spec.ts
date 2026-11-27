import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { payloadLocalizationFromI18n, resolveI18n } from '@rinsly-com/site-core'

import { staticRedirectLines } from '../../scripts/staticRedirects.mjs'
import robots from '../../src/app/robots'
import { lastModifiedBySlug } from '../../src/lib/sitemapSlugs'
import { SITE_FLAGS, isSiteFlagOn, parseFlag, siteFlagStates, type SiteFlag } from '../../src/lib/siteFlags'
import {
  buildBreadcrumbJsonLd,
  buildProfessionalServiceJsonLd,
  withXDefault,
} from '../../src/lib/siteJsonLd'
import { siteConfig } from '../../src/site.config'

const read = (rel: string) => readFileSync(new URL(`../../${rel}`, import.meta.url), 'utf8')

describe('T-01 ProfessionalService JSON-LD', () => {
  it('carries only the Lawyer-cleared fields, per locale', () => {
    const nl = buildProfessionalServiceJsonLd('https://rinsly.com/', 'nl')
    expect(nl).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      '@id': 'https://rinsly.com/#organization',
      name: 'Rinsly',
      url: 'https://rinsly.com',
      description: 'Rinsly bouwt en host websites voor zakelijke opdrachtgevers.',
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
    })
    expect(buildProfessionalServiceJsonLd('https://rinsly.com', 'en')['description']).toBe(
      'Rinsly builds and hosts websites for business clients.',
    )
  })

  it('never sets legalName or founder, and never prints the owner name', () => {
    for (const locale of ['nl', 'en'] as const) {
      const json = JSON.stringify(buildProfessionalServiceJsonLd('https://rinsly.com', locale))
      expect(json).not.toMatch(/legalName|founder|Schaeffer|Yaron/)
    }
    expect(read('src/lib/siteJsonLd.ts')).not.toMatch(/legalName:|founder:/)
  })

  it('is rendered by the locale layout and the /check layout', () => {
    expect(read('src/app/(frontend)/[locale]/layout.tsx')).toContain('buildProfessionalServiceJsonLd(')
    expect(read('src/app/(frontend)/check/layout.tsx')).toContain('buildProfessionalServiceJsonLd(')
  })
})

describe('T-02 BreadcrumbList, x-default, lastmod, og:locale', () => {
  it('builds Home → page and skips home or an empty title', () => {
    expect(buildBreadcrumbJsonLd('https://rinsly.com', 'en', 'prijzen', 'Pricing')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rinsly.com/en' },
        { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://rinsly.com/en/prijzen' },
      ],
    })
    expect(buildBreadcrumbJsonLd('https://rinsly.com', 'nl', 'home', 'Home')).toBeNull()
    expect(buildBreadcrumbJsonLd('https://rinsly.com', 'nl', 'over', '  ')).toBeNull()
  })

  it('adds x-default pointing at the Dutch URL and leaves the rest alone', () => {
    const meta = {
      title: 'x',
      alternates: {
        canonical: 'https://rinsly.com/en/over',
        languages: { 'nl-NL': 'https://rinsly.com/nl/over', en: 'https://rinsly.com/en/over' },
      },
    }
    expect(withXDefault(meta)).toEqual({
      title: 'x',
      alternates: {
        canonical: 'https://rinsly.com/en/over',
        languages: {
          'nl-NL': 'https://rinsly.com/nl/over',
          en: 'https://rinsly.com/en/over',
          'x-default': 'https://rinsly.com/nl/over',
        },
      },
    })
    expect(withXDefault({ title: 'no alternates' })).toEqual({ title: 'no alternates' })
  })

  it('wires x-default into the home and slug routes and the sitemap', () => {
    expect(read('src/app/(frontend)/[locale]/page.tsx')).toContain('withXDefault(await home.generateMetadata(props))')
    expect(read('src/app/(frontend)/[locale]/[slug]/page.tsx')).toContain('withXDefault(await route.generateMetadata(props))')
    expect(read('src/app/sitemap.ts')).toContain("'x-default': localeHref('nl', slug)")
  })

  it('takes lastmod from a valid updatedAt only', () => {
    const map = lastModifiedBySlug([
      { slug: 'home', updatedAt: '2026-11-27T12:08:00.000Z' },
      { slug: 'over', updatedAt: 'not a date' },
      { slug: 'prijzen' },
      { slug: null, updatedAt: '2026-11-27T12:08:00.000Z' },
    ])
    expect([...map.entries()]).toEqual([['home', '2026-11-27T12:08:00.000Z']])
  })

  it('sets og:locale en_GB on EN without changing locales, html lang or Payload localization', () => {
    const i18n = resolveI18n(siteConfig)
    expect(i18n.og('en')).toBe('en_GB')
    expect(i18n.og('nl')).toBe('nl_NL')
    expect([...i18n.locales]).toEqual(['nl', 'en'])
    expect(i18n.defaultLocale).toBe('nl')
    expect(i18n.htmlLang('nl')).toBe(resolveI18n(null).htmlLang('nl'))
    expect(i18n.htmlLang('en')).toBe(resolveI18n(null).htmlLang('en'))
    // Same Payload localization as the engine default: no schema change, no migration.
    expect(payloadLocalizationFromI18n(siteConfig)).toEqual(payloadLocalizationFromI18n(null))
  })
})

describe('T-03 redirects', () => {
  it('sends / to /nl and strips a trailing slash with 308', () => {
    const lines = staticRedirectLines('nl', ['nl', 'en'])
    expect(lines[0]).toBe('/    /nl    308')
    expect(lines).toContain('/:a/    /:a    308')
    expect(lines).toContain('/:a/:b/    /:a/:b    308')
    // The specific /check rules come before the generic trailing-slash rules.
    expect(lines.indexOf('/nl/check/*    /check/:splat    301')).toBeLessThan(lines.indexOf('/:a/:b/    /:a/:b    308'))
    expect(lines.join('\n')).not.toMatch(/^\/\s+\/nl\s+302$/m)
    expect(read('scripts/build-static.mjs')).toContain('staticRedirectLines(DEFAULT_LOCALE, LOCALES)')
  })

  it('makes the accp root redirect permanent', () => {
    expect(read('next.config.ts')).toContain("{ source: '/', destination: '/nl', permanent: true }")
  })
})

describe('K-03 robots.txt and /check chrome', () => {
  it('has no Disallow for /check and no Host line', () => {
    const r = robots()
    expect(r.rules).toEqual({ userAgent: '*', allow: '/' })
    expect(r).not.toHaveProperty('host')
    expect(r.sitemap).toBe(`${siteConfig.url}/sitemap.xml`)
  })

  it('keeps /check noindex and uses the site layout with social tags', () => {
    const layout = read('src/app/(frontend)/check/layout.tsx')
    expect(layout).toContain('createLocaleLayout(')
    expect(layout).toContain("locale: 'nl'")
    expect(layout).toContain('robots: { index: false, follow: false }')
    const page = read('src/app/(frontend)/check/page.tsx')
    expect(page).toContain('robots: { index: false, follow: false }')
    expect(page).toContain('openGraph: {')
    expect(page).toContain("twitter: { card: 'summary_large_image'")
    // Live on accp (fresh header/footer), static in the export.
    expect(page).toMatch(/^export const dynamic = 'force-dynamic'$/m)
    expect(read('scripts/build-static.mjs')).toContain("'src/app/(frontend)/check/page.tsx',")
    expect(read('src/app/(frontend)/check/opengraph-image.tsx')).not.toMatch(/\d+\s*(seconden|minuut|s\b)/)
  })
})

describe('refactor flags', () => {
  const flags = Object.keys(SITE_FLAGS) as SiteFlag[]

  it('has the five flags named in the brief', () => {
    expect(flags).toEqual(['x3v3AndF1', 'nichePages', 'woerdenPage', 'footerOwnerName', 'portraitBio'])
  })

  it('is off unless the value is 1, true or yes', () => {
    for (const raw of [undefined, '', '0', 'false', 'no', 'on', 'enabled']) expect(parseFlag(raw)).toBe(false)
    for (const raw of ['1', 'true', 'TRUE', ' yes ']) expect(parseFlag(raw)).toBe(true)
    expect(isSiteFlagOn('x3v3AndF1', 'true')).toBe(true)
  })

  it('is off in this test environment (nothing sets them)', () => {
    expect(Object.values(siteFlagStates()).every((on) => !on)).toBe(true)
  })

  it('is not set by wrangler config, a workflow or the seed', () => {
    const files = [
      'wrangler.jsonc',
      'wrangler.static.jsonc',
      'scripts/seed.ts',
      'scripts/build-static.mjs',
      ...readdirSync(new URL('../../.github/workflows/', import.meta.url)).map((f) => `.github/workflows/${f}`),
    ]
    for (const file of files) {
      const text = read(file)
      for (const name of Object.values(SITE_FLAGS)) expect(text, `${name} in ${file}`).not.toContain(name)
    }
  })
})
