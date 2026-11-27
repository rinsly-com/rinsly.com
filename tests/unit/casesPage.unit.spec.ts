import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { PLACEHOLDER_NOINDEX_SLUGS, SITEMAP_EXCLUDED_SLUGS, slugsForSitemap } from '../../src/lib/sitemapSlugs'

/**
 * Yaron (26 Nov 15:59): a cases page is OK for burojazz.nl and Up2Brand. The
 * copy comes later from Marketeer, after Lawyer. Until then every string is a
 * marked placeholder, and no quote or number is attributed to a client.
 * The seed and page data stay so the page can be re-enabled. The public
 * route 404s until written client consent exists (Yaron 27 Nov 00:53,
 * Lawyer §13 P2-01) — see casesPageFlag.unit.spec.ts.
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

  it('keeps the /cases seed row, noindex, and omits it from the sitemap until it may be public again', () => {
    expect(seed).toMatch(/cases:\s*'cases'/)
    expect(seed).toMatch(/slug:\s*SLUG\.cases/)
    // Stay out of the sitemap until the page may be public (client consent).
    expect(PLACEHOLDER_NOINDEX_SLUGS.has('cases')).toBe(true)
    expect(SITEMAP_EXCLUDED_SLUGS.has('cases')).toBe(true)
    expect(slugsForSitemap(['over', 'cases'])).not.toContain('cases')
    expect(slugsForSitemap(['over', 'cases'])).toContain('over')
    expect(seed).toMatch(/PLACEHOLDER_NOINDEX_SLUGS/)
    expect(seed).toMatch(/noindex:\s*true/)
    // The helper writes false for indexable slugs, but only when the seed creates the page row.
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
