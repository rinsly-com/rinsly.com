import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Yaron (26 Nov 15:59, own card answer in Marketeer's chat): remove the
 * "Leads voor partners" box from the partner page. The rest of the page stays.
 */
const seed = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8')

function partnerLayoutSource(): string {
  const start = seed.indexOf('const partnerLayout')
  const end = seed.indexOf('\n/* ---', start)
  if (start < 0 || end < start) throw new Error('partnerLayout slice not found')
  return seed.slice(start, end)
}

describe('partner page without the Leads box', () => {
  const layout = partnerLayoutSource()

  it('has no leads block (anchor, heading or card copy)', () => {
    expect(layout).not.toContain("anchor: 'leads'")
    expect(layout).not.toContain('Leads voor partners')
    expect(layout).not.toContain('Leads for partners')
    expect(layout).not.toContain('Elke maand inbegrepen')
    expect(layout).not.toContain('Included every month')
  })

  it('keeps the neighbouring blocks: check CTA before the FAQ, ladder, how it works', () => {
    const cta = layout.indexOf('partnerCheckCta(locale)')
    const faq = layout.indexOf("anchor: 'faq'")
    expect(cta).toBeGreaterThan(-1)
    expect(faq).toBeGreaterThan(cta)
    expect(layout).toContain("anchor: 'ladder'")
    expect(layout).toContain("anchor: 'hoe'")
    expect(layout).toContain("anchor: 'facturatie'")
  })

  it('nothing links to the removed #leads anchor', () => {
    expect(seed).not.toMatch(/anchor:\s*'leads'/)
    expect(seed).not.toMatch(/partner#leads|#leads/)
  })
})
