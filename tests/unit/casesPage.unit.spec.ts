import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { PLACEHOLDER_NOINDEX_SLUGS, SITEMAP_EXCLUDED_SLUGS, slugsForSitemap } from '../../src/lib/sitemapSlugs'

/**
 * Yaron (26 Nov 15:59): a cases page is OK for burojazz.nl and Up2Brand. The
 * copy comes later from Marketeer, after Lawyer. Until then every string is a
 * marked placeholder, and no quote or number is attributed to a client.
 * /nl/cases used to answer 404 because no page with this slug existed.
 */
const seed = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8')

function casesLayoutSource(): string {
  const start = seed.indexOf('const caseBlocks')
  const end = seed.indexOf('\n/* ---', seed.indexOf('const casesLayout'))
  if (start < 0 || end < start) throw new Error('casesLayout slice not found')
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
  /binnen \d+ (uur|minuten|dagen)/i,
  /within \d+ (hours?|minutes?|days?)/i,
  /\b(framer|webflow|wix|squarespace)\b/i,
]

describe('cases page', () => {
  const layout = casesLayoutSource()

  it('is registered at /cases (fixes the /nl/cases 404), noindex, and omitted from the sitemap until final copy', () => {
    expect(seed).toMatch(/cases:\s*'cases'/)
    expect(seed).toMatch(/slug:\s*SLUG\.cases/)
    // Drop 'cases' from PLACEHOLDER_NOINDEX_SLUGS when Marketeer's final copy lands.
    expect(PLACEHOLDER_NOINDEX_SLUGS.has('cases')).toBe(true)
    expect(SITEMAP_EXCLUDED_SLUGS.has('cases')).toBe(true)
    expect(slugsForSitemap(['over', 'cases'])).not.toContain('cases')
    expect(slugsForSitemap(['over', 'cases'])).toContain('over')
    expect(seed).toMatch(/PLACEHOLDER_NOINDEX_SLUGS/)
    expect(seed).toMatch(/noindex:\s*true/)
    // A later seed must write false. Omitting the field leaves the stored true.
    expect(seed).toMatch(/noindex:\s*false/)
  })

  it('has one block per case, for exactly burojazz.nl and Up2Brand, each with an external link', () => {
    expect(layout).toContain("anchor: 'burojazz'")
    expect(layout).toContain("anchor: 'up2brand'")
    expect(layout.match(/anchor: '(burojazz|up2brand)'/g)).toHaveLength(2)
    expect(layout).toContain("'https://burojazz.nl'")
    expect(layout).toContain("'https://up2brand.com'")
    expect(layout).toMatch(/newTab: true/)
  })

  it('has per case a title, client, what we built and an image slot, NL and EN', () => {
    for (const label of [
      ['Klant', 'Client'],
      ['Wat we bouwden', 'What we built'],
      ['Beeld', 'Image'],
    ]) {
      for (const l of label) expect(layout).toContain(`'${l}'`)
    }
    expect(layout).toContain('IMAGE SLOT')
  })

  it('attributes no quote, number or result to a client', () => {
    expect(layout).not.toMatch(/[“”«»"]/)
    expect(layout).not.toMatch(/%|€|\bprocent\b|\bpercent\b|\bconversie|\bconversion/i)
    const withoutName = layout.replace(/Up2Brand/gi, '')
    // digits are fine in code (ids, 'IconX'); none in visible strings
    const strings = [...withoutName.matchAll(/['`]((?:[^'`\\]|\\.)*)['`]/g)].map((m) => m[1])
    const visible = strings.filter((s) => /\s/.test(s) && !/^https?:/.test(s))
    for (const s of visible) expect(s, s).not.toMatch(/\d/)
  })

  it('carries no banned claims in the placeholder copy', () => {
    for (const re of BANNED) expect(layout, String(re)).not.toMatch(re)
  })

  it('marks block headers as placeholders until Marketeer delivers', () => {
    // Remove this test together with the "[Concept]" prefixes when final copy lands.
    const nl = layout.match(/['`]\[Concept\]/g) ?? []
    const en = layout.match(/['`]\[Draft\]/g) ?? []
    expect(nl.length).toBeGreaterThanOrEqual(4)
    expect(en.length).toBe(nl.length)
  })
})
