import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { LOCAL_PAGE_SLUG, buildLocalPageJsonLd } from '../../src/lib/localPageJsonLd'
import { slugsForSitemap } from '../../src/lib/sitemapSlugs'

/**
 * Yaron (26 Nov 15:59, own card answer in Marketeer's chat): the Woerden/Utrecht
 * local page is REMOTE ONLY from Woerden. No in-person service in Utrecht.
 * Copy is placeholder until Marketeer + Lawyer; these tests pin structure and
 * the claim limits, not the final wording.
 */
const seed = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8')

function localLayoutSource(): string {
  const start = seed.indexOf('const localWoerdenLayout')
  const end = seed.indexOf('\n/* ---', start)
  if (start < 0 || end < start) throw new Error('localWoerdenLayout slice not found')
  return seed.slice(start, end)
}

const BANNED = [
  /\baltijd\b/i,
  /\bnooit\b/i,
  /\bgegarandeerd\b/i,
  /\balways\b/i,
  /\bnever\b/i,
  /\bguarantee/i,
  /gratis bouw/i,
  /free build/i,
  /\buptime\b/i,
  /\bback-?ups?\b/i,
  /\b\d+\s*(klanten|clients|studios)\b/i,
  /binnen \d+ (uur|minuten|dagen)/i,
  /within \d+ (hours?|minutes?|days?)/i,
  /\b(framer|webflow|wix|squarespace)\b/i,
]

describe('local page Woerden/Utrecht: structure', () => {
  const layout = localLayoutSource()

  it('is registered under the shared slug and in the sitemap', () => {
    expect(LOCAL_PAGE_SLUG).toBe('website-laten-maken-woerden')
    expect(seed).toMatch(/LOCAL_PAGE_SLUG/)
    expect(seed).toMatch(/slug:\s*SLUG\.woerden/)
    expect(slugsForSitemap(['over', LOCAL_PAGE_SLUG])).toContain(LOCAL_PAGE_SLUG)
  })

  it('has hero, how-we-work cards, region prose, FAQ and a contact CTA', () => {
    for (const marker of ['pageHero(', "blockType: 'services'", "blockType: 'richText'", "blockType: 'accordion'"]) {
      expect(layout).toContain(marker)
    }
    expect(layout).toMatch(/\bcta\(\s*locale/)
  })

  it('says remote only, in NL and EN, and says no visits in Utrecht', () => {
    expect(layout).toMatch(/op afstand/)
    expect(layout).toMatch(/remotely|remote/)
    expect(layout).toMatch(/Nee\. Wij werken op afstand/)
    expect(layout).toMatch(/No\. We work remotely/)
    expect(layout).not.toMatch(/bij je op kantoor|at your office|aan huis|spreekuur|walk-?in/i)
  })

  it('carries no banned claims in the placeholder copy', () => {
    for (const re of BANNED) expect(layout, String(re)).not.toMatch(re)
  })

  it('marks every block header as a placeholder until Marketeer delivers', () => {
    // Remove this test together with the "[Concept]" prefixes when final copy lands.
    const nl = layout.match(/'\[Concept\]/g) ?? []
    const en = layout.match(/'\[Draft\]/g) ?? []
    // hero, services, richText, accordion, cta eyebrows
    expect(nl.length).toBeGreaterThanOrEqual(5)
    expect(en.length).toBe(nl.length)
  })

  it('has SEO meta for both locales', () => {
    expect(seed).toMatch(/localWoerdenMeta/)
  })
})

describe('local page Woerden/Utrecht: JSON-LD', () => {
  const url = 'https://rinsly.com'

  for (const locale of ['nl', 'en'] as const) {
    it(`${locale}: Service from Woerden, Utrecht province as remote area, no street address`, () => {
      const ld = buildLocalPageJsonLd(url, locale)
      expect(ld['@type']).toBe('Service')
      expect(ld['url']).toBe(`${url}/${locale}/${LOCAL_PAGE_SLUG}`)
      const json = JSON.stringify(ld)
      expect(json).toContain('Woerden')
      expect(json).toContain('"AdministrativeArea"')
      expect(json).toContain('Utrecht')
      expect(json).not.toContain('streetAddress')
      expect(json).not.toContain('Kazernestraat')
      expect(json).not.toContain('postalCode')
      const provider = ld['provider'] as Record<string, unknown>
      expect(provider).toEqual({ '@id': `${url}/#organization` })
      expect(json).not.toContain('PostalAddress')
      const channel = ld['availableChannel'] as Record<string, unknown>
      expect(channel['@type']).toBe('ServiceChannel')
      expect(String(channel['name'])).toMatch(locale === 'nl' ? /op afstand/i : /remote/i)
      expect(String(ld['description'])).toMatch(locale === 'nl' ? /op afstand/i : /remote/i)
      for (const re of BANNED) expect(json, String(re)).not.toMatch(re)
    })
  }
})
