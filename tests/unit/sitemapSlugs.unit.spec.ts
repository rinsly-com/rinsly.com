import { describe, expect, it } from 'vitest'

import { SITEMAP_EXCLUDED_SLUGS, slugsForSitemap, slugsForSitemapFromPages } from '../../src/lib/sitemapSlugs'

/** Locs on https://rinsly.com/sitemap.xml as fetched 12 Oct 2026 (18 URLs). */
const LIVE_SITEMAP_SLUGS = [
  'home',
  'contact',
  'over',
  'website',
  'prijzen',
  'platform',
  'partnerprogramma',
  'voorwaarden',
  'privacy',
]

const localePaths = (slugs: readonly string[]) =>
  slugs.flatMap((slug) =>
    (['nl', 'en'] as const).map((locale) =>
      slug === 'home' ? `/${locale}` : `/${locale}/${slug}`,
    ),
  )

describe('slugsForSitemap', () => {
  it('drops privacy and voorwaarden and keeps every other live sitemap slug', () => {
    const slugs = slugsForSitemap(LIVE_SITEMAP_SLUGS)
    const paths = localePaths(slugs)

    expect(SITEMAP_EXCLUDED_SLUGS).toEqual(new Set(['privacy', 'voorwaarden', 'cases', 'website-laten-maken-woerden']))
    expect(paths).toEqual(
      expect.not.arrayContaining([
        '/nl/voorwaarden',
        '/en/voorwaarden',
        '/nl/privacy',
        '/en/privacy',
      ]),
    )
    expect(paths).toEqual([
      '/nl',
      '/en',
      '/nl/contact',
      '/en/contact',
      '/nl/over',
      '/en/over',
      '/nl/website',
      '/en/website',
      '/nl/prijzen',
      '/en/prijzen',
      '/nl/platform',
      '/en/platform',
      '/nl/partnerprogramma',
      '/en/partnerprogramma',
    ])
    expect(paths).toHaveLength(14)
  })

  it('keeps home first and preserves the order of the remaining pages', () => {
    expect(
      slugsForSitemap(['privacy', 'contact', 'home', 'voorwaarden', 'over', null, '']),
    ).toEqual(['home', 'contact', 'over'])
  })

  it('drops /cases and the Woerden page in both locales, even when those slugs are published', () => {
    const slugs = slugsForSitemap([
      ...LIVE_SITEMAP_SLUGS,
      'cases',
      'website-laten-maken-woerden',
    ])
    const paths = localePaths(slugs)
    expect(paths).toEqual(
      expect.not.arrayContaining([
        '/nl/cases',
        '/en/cases',
        '/nl/website-laten-maken-woerden',
        '/en/website-laten-maken-woerden',
      ]),
    )
    expect(paths).toContain('/nl/over')
    expect(paths).toContain('/en/over')
    expect(paths).toHaveLength(14)
  })
})

describe('slugsForSitemapFromPages', () => {
  it('omits noindex pages even when the slug is not in the denylist, and still drops denylisted slugs', () => {
    const slugs = slugsForSitemapFromPages([
      { slug: 'over', meta: { noindex: false } },
      { slug: 'cases', meta: { noindex: false } },
      { slug: 'website-laten-maken-woerden', meta: { noindex: true } },
      { slug: 'draft-offer', meta: { noindex: true } },
      { slug: 'privacy', meta: { noindex: true } },
    ])
    const paths = localePaths(slugs)
    expect(slugs).toEqual(['home', 'over'])
    expect(paths).toEqual(
      expect.not.arrayContaining([
        '/nl/cases',
        '/en/cases',
        '/nl/website-laten-maken-woerden',
        '/en/website-laten-maken-woerden',
        '/nl/draft-offer',
        '/en/draft-offer',
        '/nl/privacy',
        '/en/privacy',
      ]),
    )
    expect(paths).toEqual(['/nl', '/en', '/nl/over', '/en/over'])
  })
})
